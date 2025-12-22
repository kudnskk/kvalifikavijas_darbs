const OpenAI = require("openai");
require("dotenv").config();
const Message = require("../models/chat/message");
const Lesson = require("../models/chat/lesson");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 45000,
});

const withTimeout = async (promise, ms, label) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error(`${label} timed out after ${ms}ms`);
      err.code = "ETIMEDOUT";
      reject(err);
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const formatMessageForModel = (msg) => {
  const baseText = typeof msg.content === "string" ? msg.content : "";
  const hasFile = Boolean(msg.file && msg.file.content);

  if (!hasFile) {
    return {
      role: msg.sender_type,
      content: baseText,
    };
  }

  const fileName = msg.file.file_name || "file";
  const fileText = msg.file.content || "";
  return {
    role: msg.sender_type,
    content: `${baseText}\n\n[Attached file: ${fileName}]\n${fileText}`.trim(),
  };
};

const getActivityInstructions = (lessonTitle, activityType) => {
  return `
You generate educational study activities for the lesson: "${lessonTitle}".

You MUST output JSON that matches the provided JSON Schema exactly.

Return envelope:
- If you cannot generate a good activity because the user's request is unclear/underspecified, output:
  { status: "error", error: { message: "...", clarification_questions: ["...", ...] } }
- Otherwise output:
  { status: "ok", activityType: "...", items: [...] }

Rules:
- Keep items aligned with the lesson topic.
- Avoid overly long questions; be precise.
- Do not include extra keys.
Item shapes:
- multiple_choice: { question, answers: string[2..8], correctAnswerIndices: int[1..8] }
- free_text: { question, referenceAnswer, keyPoints: string[1..8] }
- flashcard: { front, back }

Current requested activityType: ${activityType}
`.trim();
};

const activityJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["ok", "error"] },
    error: {
      type: ["object", "null"],
      additionalProperties: false,
      properties: {
        message: { type: "string" },
        clarification_questions: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["message", "clarification_questions"],
    },
    activityType: {
      type: ["string", "null"],
      enum: ["multiple_choice", "free_text", "flashcard", null],
    },
    items: {
      type: ["array", "null"],
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          question: { type: ["string", "null"] },
          answers: { type: ["array", "null"], items: { type: "string" } },
          correctAnswerIndices: {
            type: ["array", "null"],
            items: { type: "integer", minimum: 0 },
          },
          referenceAnswer: { type: ["string", "null"] },
          keyPoints: { type: ["array", "null"], items: { type: "string" } },
          front: { type: ["string", "null"] },
          back: { type: ["string", "null"] },
        },
        required: [
          "question",
          "answers",
          "correctAnswerIndices",
          "referenceAnswer",
          "keyPoints",
          "front",
          "back",
        ],
      },
    },
  },
  required: ["status", "error", "activityType", "items"],
};

const validateStructuredActivityOutput = (out, expectedType, expectedCount) => {
  const fail = (message) => ({
    status: "error",
    error: { message, clarification_questions: [] },
    activityType: null,
    items: null,
  });

  if (!out || (out.status !== "ok" && out.status !== "error")) {
    return fail("Model returned invalid status");
  }

  if (out.status === "error") {
    if (!out.error || typeof out.error.message !== "string") {
      return fail("Model returned status=error but missing error.message");
    }
    return out;
  }

  if (out.error !== null) {
    return fail("Model returned status=ok but error is not null");
  }
  if (out.activityType !== expectedType) {
    return fail(
      `Model returned activityType=${String(
        out.activityType,
      )} but expected ${expectedType}`,
    );
  }
  if (!Array.isArray(out.items)) {
    return fail("Model returned status=ok but items is not an array");
  }
  if (out.items.length !== Number(expectedCount)) {
    return fail(
      `Model returned ${out.items.length} items, expected ${expectedCount}.`,
    );
  }

  for (let i = 0; i < out.items.length; i++) {
    const item = out.items[i] || {};
    if (expectedType === "multiple_choice") {
      if (typeof item.question !== "string" || !item.question.trim()) {
        return fail(`items[${i}].question is required for multiple_choice`);
      }
      if (!Array.isArray(item.answers) || item.answers.length < 2) {
        return fail(`items[${i}].answers must have at least 2 options`);
      }
      if (
        !Array.isArray(item.correctAnswerIndices) ||
        item.correctAnswerIndices.length < 1
      ) {
        return fail(
          `items[${i}].correctAnswerIndices must have at least 1 index`,
        );
      }
    } else if (expectedType === "free_text") {
      if (typeof item.question !== "string" || !item.question.trim()) {
        return fail(`items[${i}].question is required for free_text`);
      }
      if (
        typeof item.referenceAnswer !== "string" ||
        !item.referenceAnswer.trim()
      ) {
        return fail(`items[${i}].referenceAnswer is required for free_text`);
      }
      if (!Array.isArray(item.keyPoints) || item.keyPoints.length < 1) {
        return fail(`items[${i}].keyPoints must have at least 1 point`);
      }
    } else if (expectedType === "flashcard") {
      if (typeof item.front !== "string" || !item.front.trim()) {
        return fail(`items[${i}].front is required for flashcard`);
      }
      if (typeof item.back !== "string" || !item.back.trim()) {
        return fail(`items[${i}].back is required for flashcard`);
      }
    }
  }

  return out;
};

const freeTextGradingJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["ok", "error"] },
    error: {
      type: ["object", "null"],
      additionalProperties: false,
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
    results: {
      type: ["array", "null"],
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          question_id: { type: "string" },
          is_correct: { type: "boolean" },
        },
        required: ["question_id", "is_correct"],
      },
    },
  },
  required: ["status", "error", "results"],
};

const gradeFreeTextAnswers = async ({ lessonId, items }) => {
  const lesson = await Lesson.findById(lessonId).lean();
  if (!lesson) {
    return {
      status: "error",
      error: { message: "Lesson not found" },
      results: null,
    };
  }

  const safeItems = Array.isArray(items) ? items : [];
  if (!safeItems.length) {
    return {
      status: "error",
      error: { message: "No free-text answers provided" },
      results: null,
    };
  }

  const previousMessages = await Message.find({ lesson_id: lessonId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  previousMessages.reverse();

  const historyAsInput = previousMessages.map(formatMessageForModel);

  const gradingPrompt = `You are grading free-text answers for the lesson: "${
    lesson.title
  }".

Return JSON strictly matching the schema.

Rules:
- For each item, decide if the user's answer is correct enough.
- Be reasonably strict but fair.
- Output results for every provided question_id.
- Do not include explanations.

Items:\n${JSON.stringify(
    safeItems.map((it) => ({
      question_id: String(it.question_id),
      question: String(it.question || ""),
      user_answer: String(it.user_answer || ""),
    })),
    null,
    2,
  )}`;

  let response;
  try {
    response = await withTimeout(
      client.responses.create({
        model: "gpt-5-mini",
        instructions: "Grade each free-text answer as correct/incorrect.",
        input: [...historyAsInput, { role: "user", content: gradingPrompt }],
        text: {
          format: {
            type: "json_schema",
            name: "free_text_grading",
            strict: true,
            schema: freeTextGradingJsonSchema,
          },
        },
        max_output_tokens: 1024,
        reasoning: { effort: "low" },
      }),
      45000,
      "OpenAI free-text grading",
    );
  } catch (error) {
    console.error("Free-text grading failed:", error?.message || error);
    return {
      status: "error",
      error: {
        message:
          error?.code === "ETIMEDOUT"
            ? "Free-text grading took too long. Please try again."
            : "Failed to grade free-text answers",
      },
      results: null,
    };
  }

  try {
    const out = JSON.parse(response.output_text);
    if (!out || (out.status !== "ok" && out.status !== "error")) {
      return {
        status: "error",
        error: { message: "Model returned invalid grading status" },
        results: null,
      };
    }

    if (out.status === "error") {
      return {
        status: "error",
        error: { message: out?.error?.message || "Grading failed" },
        results: null,
      };
    }

    if (
      !Array.isArray(out.results) ||
      out.results.length !== safeItems.length
    ) {
      return {
        status: "error",
        error: { message: "Model returned incomplete grading results" },
        results: null,
      };
    }

    return out;
  } catch (e) {
    return {
      status: "error",
      error: { message: "Failed to parse grading output as JSON" },
      results: null,
    };
  }
};
const getInstructions = (lessonTitle, type) => {
  const text =
    type === "chat"
      ? `
Rules:
-in each input by the user first the message that student has writen for you is displayed, after that there may be Attached file: <file_name> and the text content of the file
-if the user refers to the file if means to the content provied after the file name

Your role:
- Help students understand concepts related to their lesson: "${lessonTitle}"
- Provide clear explanations
- Encourage learning and curiosity
- Break down complex topics into simple terms

Boundaries:
- ONLY answer questions related to education and learning
- If asked about topics unrelated to learning, politely redirect: "I'm here to help you with your lessons! Let's focus on learning."
- Never provide homework answers directly - guide students to find answers themselves
- Do not engage in conversations about personal topics, current events, or entertainment

Response style:
- Keep responses concise (2-3 sentences for simple questions)
- Use examples when explaining concepts
- Ask follow-up questions to ensure understanding`
      : "";
  return text;
};

const generateAIResponse = async (userMessage, lessonId, userId) => {
  try {
    const lesson = await Lesson.findById(lessonId).lean();

    const previousMessages = await Message.find({ lesson_id: lessonId })
      .sort({ createdAt: -1 }) // newest first
      .limit(20)
      .lean();

    previousMessages.reverse();

    const historyAsInput = previousMessages.map(formatMessageForModel);

    if (userMessage.trim()) {
      const last = historyAsInput[historyAsInput.length - 1];
      if (last && last.role === "user") {
        last.content = userMessage.trim();
      } else {
        historyAsInput.push({ role: "user", content: userMessage.trim() });
      }
    }

    const response = await client.responses.create({
      model: "gpt-5-mini",
      instructions: getInstructions(lesson.title, "chat"),
      input: historyAsInput,
      max_output_tokens: 2048,
      reasoning: { effort: "low" },
    });
    if (response.status !== "completed" || error != null) {
      throw new Error("OpenAI response failed!");
    }
    const aiResponse = response.output_text;
    console.log("AI Response:", response);

    const aiMessage = new Message({
      content: aiResponse,
      type: "text",
      sender_type: "assistant",
      lesson_id: lessonId,
      user_id: userId,
    });

    await aiMessage.save();

    await Lesson.findByIdAndUpdate(lessonId, {
      $push: { messages: aiMessage._id },
    });

    console.log("AI response saved successfully");
    return aiMessage;
  } catch (error) {
    console.error("Error generating AI response:", error.message);
    throw error;
  }
};

const generateActivityData = async ({
  lessonId,
  userId,
  activityType,
  questionCount,
  title,
  description,
}) => {
  const lesson = await Lesson.findById(lessonId).lean();
  if (!lesson) {
    return {
      status: "error",
      error: { message: "Lesson not found" },
    };
  }

  const previousMessages = await Message.find({ lesson_id: lessonId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  previousMessages.reverse();

  const historyAsInput = previousMessages.map(formatMessageForModel);

  const trimmedDescription = String(description || "").trim();
  const prompt = `Generate an activity with these requirements:
- activityType: ${activityType}
- itemCount: ${questionCount}
- user description/instructions: ${trimmedDescription || "(none provided)"}

Return the JSON envelope strictly. The items array MUST contain exactly itemCount items.`.trim();

  let response;
  try {
    response = await withTimeout(
      client.responses.create({
        model: "gpt-5-mini",
        instructions: getActivityInstructions(lesson.title, activityType),
        input: [...historyAsInput, { role: "user", content: prompt }],
        text: {
          format: {
            type: "json_schema",
            name: "activity_generation",
            strict: true,
            schema: activityJsonSchema,
          },
        },
        max_output_tokens: 2048,
        reasoning: { effort: "low" },
      }),
      45000,
      "OpenAI activity generation",
    );
  } catch (error) {
    console.error("Activity generation failed:", error?.message || error);
    return {
      status: "error",
      error: {
        message:
          error?.code === "ETIMEDOUT"
            ? "Activity generation took too long. Please try again."
            : "Failed to generate activity",
        clarification_questions: [],
      },
      activityType: null,
      items: null,
    };
  }

  const raw = response.output_text;
  try {
    const out = JSON.parse(raw);
    return validateStructuredActivityOutput(out, activityType, questionCount);
  } catch (e) {
    return {
      status: "error",
      error: {
        message: "Failed to parse model output as JSON",
        clarification_questions: [],
      },
      activityType: null,
      items: null,
    };
  }
};

module.exports = {
  generateAIResponse,
  generateActivityData,
  gradeFreeTextAnswers,
};
