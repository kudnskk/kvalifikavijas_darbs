const OpenAI = require("openai");
require("dotenv").config();
const Message = require("../models/chat/message");
const Lesson = require("../models/chat/lesson");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 45000,
});

const getInstructions = (lessonTitle) => {
  const text = `
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
- Ask follow-up questions to ensure understanding

If user asks what he can do in this app or what are your capabilities, answer:
- Create new lessons and categories to group them
- Create messages for learning assistant who will answer them in a lesson
- Send files for their text content to be analysed for .pdf,.txt,.doc files
- Create interactive activities of type multiple-choice, free-text and flashcards. To do that user needs to press right top menu in a created lesson and choose "Create Activity"
- User can review their history of activity completions and request mistakes made in this completion to be analyzed and explained by the learning assistant by pressing "Explain Mistakes"
`;

  return text;
};

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
//function to format message for the model input
const formatMessageForModel = (msg) => {
  const hasFile = Boolean(msg.file && msg.file.content);

  if (!hasFile) {
    //no file content attached
    return {
      role: msg.sender_type,
      content: msg.content,
    };
  }

  const fileName = msg.file.file_name || "file";
  const fileText = msg.file.content || "";
  return {
    role: msg.sender_type,
    content:
      `${msg.content}\n\n[Attached file: ${fileName}]\n${fileText}`.trim(),
  }; // if file is included, append its content
};
//instructions for activity generation
const getInstructionsForGeneratingActivity = (
  lessonTitle,
  questionCount,
  description,
  type,
  existingQuestions = null,
) => {
  const regenerationNote =
    existingQuestions && existingQuestions.length > 0
      ? `\n\nIMPORTANT: This is a regeneration request. The user wants completely NEW and DIFFERENT questions from the previous ones. Here are the previous questions that you MUST NOT reuse or create similar versions of:\n${existingQuestions
          .map((q, i) => `${i + 1}. ${q}`)
          .join(
            "\n",
          )}\n\nGenerate entirely different questions on the same topic.`
      : "";

  if (type === "multiple-choice") {
    return `Your task is to generate an educational multiple choice quiz. Only ask questions about the topic.
  -title: ${lessonTitle}
- itemCount: ${questionCount}
- user description/instructions: ${description || "(none provided)"}

VALIDATION RULES - You MUST check these BEFORE generating:
- If the title and description are too vague or unclear to understand what topic to create questions about, return status: "error" with message explaining what information is missing
2. If the request asks for anything unethical or not educational return status: "error" with message "Cannot create activities for unethical or inappropriate content"
4. Only return status: "ok" if the request is clear, ethical, and educational

-Avoid asking long or complex questions.
  You MUST return JSON strictly matching the provided schema.
  In items array there are objects with question, answers array and correctAnswerIndices array.
  One question can have up to 3 correct answers. Answers array always has 4 options.
  correctAnswerIndices always is array of numbers from 0 to 3 including.${regenerationNote}`;
  } else if (type === "text") {
    return `Your task is to generate educational free-text questions. Only ask questions about the topic.
    -title: ${lessonTitle}
  - itemCount: ${questionCount}
  - user description/instructions: ${description || "(none provided)"}
  
VALIDATION RULES - You MUST check these BEFORE generating:
1. If the title and description are too vague or unclear to understand what topic to create questions about, return status: "error" with message explaining what information is missing
2. If the request asks for anything unethical, inappropriate, harmful, or not educational (e.g., cheating, hacking, illegal activities, violence, hate speech), return status: "error" with message "Cannot create activities for unethical or inappropriate content"
4. Only return status: "ok" if the request is clear, ethical, and educational
-Avoid asking long or complex questions.
   
    You MUST return JSON strictly matching the provided schema.
    In items array there are objects with question string and referenceAnswer string. 
    referenceAnswer is a sample answer to the question.${regenerationNote}`;
  } else if (type === "flashcards") {
    return `Your task is to generate educational flashcards. Only ask questions about the topic.
    -title: ${lessonTitle}
  - itemCount: ${questionCount}
  - user description/instructions: ${description || "(none provided)"}
-Avoid asking long or complex questions.
  
VALIDATION RULES - You MUST check these BEFORE generating:
1. If the title and description are too vague or unclear to understand what topic to create questions about, return status: "error" with message explaining what information is missing
2. If the request asks for anything unethical, inappropriate, harmful, or not educational (e.g., cheating, hacking, illegal activities, violence, hate speech), return status: "error" with message "Cannot create activities for unethical or inappropriate content"
4. Only return status: "ok" if the request is clear, ethical, and educational
    You MUST return JSON strictly matching the provided schema.
    In items array there are objects wit front and back strings. 
    Front is a term or a question on the front of the flashcard, back is a short definition or an answer on the back of the flashcard.${regenerationNote}`;
  }

  return `Generate activity items for the lesson.
You MUST return JSON strictly matching the provided schema.${regenerationNote}`;
};
//schemas for activity generation
//multiple choice: question, answers array, correctAnswerIndices array
const multipleChoiceGenerationSchema = {
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
    items: {
      type: ["array", "null"],
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          question: { type: "string" },
          answers: { type: "array", items: { type: "string" } },
          correctAnswerIndices: {
            type: "array",
            items: { type: "integer", minimum: 0 },
          },
        },
        required: ["question", "answers", "correctAnswerIndices"],
      },
    },
  },
  required: ["status", "error", "items"],
};
//text: question, referenceAnswer
const textGenerationSchema = {
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
    items: {
      type: ["array", "null"],
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          question: { type: "string" },
          referenceAnswer: { type: "string" },
        },
        required: ["question", "referenceAnswer"],
      },
    },
  },
  required: ["status", "error", "items"],
};
//flashcard: front, back
const flashcardGenerationSchema = {
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
    items: {
      type: ["array", "null"],
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          front: { type: "string" },
          back: { type: "string" },
        },
        required: ["front", "back"],
      },
    },
  },
  required: ["status", "error", "items"],
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

const mistakeExplanationJsonSchema = {
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
    explanations: {
      type: ["array", "null"],
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          question_id: { type: "string" },
          explanation: { type: "string" },
          correct_answer: { type: "string" },
        },
        required: ["question_id", "explanation", "correct_answer"],
      },
    },
  },
  required: ["status", "error", "explanations"],
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
      error: { message: "No answers provided" },
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

const explainActivityMistakes = async ({ lessonId, items }) => {
  const lesson = await Lesson.findById(lessonId).lean();
  if (!lesson) {
    return {
      status: "error",
      error: { message: "Lesson not found" },
      explanations: null,
    };
  }

  const safeItems = Array.isArray(items) ? items : [];
  if (!safeItems.length) {
    return {
      status: "error",
      error: { message: "No mistakes to explain" },
      explanations: null,
    };
  }

  const previousMessages = await Message.find({ lesson_id: lessonId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  previousMessages.reverse();

  const historyAsInput = previousMessages.map(formatMessageForModel);

  const prompt = `Lesson: "${
    lesson.title
  }"\n\nExplain why each user's answer is wrong and what a correct answer should be.\nReturn JSON strictly matching the schema.\n\nItems:\n${JSON.stringify(
    safeItems.map((it) => ({
      question_id: String(it.question_id || ""),
      question: String(it.question || ""),
      user_answer: it.user_answer ?? "",
      user_selected_answers: Array.isArray(it.user_selected_answers)
        ? it.user_selected_answers
        : undefined,
      correct_answers: Array.isArray(it.correct_answers)
        ? it.correct_answers
        : undefined,
    })),
    null,
    2,
  )}`;

  let response;
  try {
    response = await withTimeout(
      client.responses.create({
        model: "gpt-5-mini",
        instructions:
          "Explain mistakes briefly and provide the correct answer.",
        input: [...historyAsInput, { role: "user", content: prompt }],
        text: {
          format: {
            type: "json_schema",
            name: "mistake_explanations",
            strict: true,
            schema: mistakeExplanationJsonSchema,
          },
        },
        max_output_tokens: 2048,
        reasoning: { effort: "low" },
      }),
      45000,
      "OpenAI mistake explanations",
    );
  } catch (error) {
    console.error("Mistake explanations failed:", error?.message || error);
    return {
      status: "error",
      error: {
        message: error,
      },
      explanations: null,
    };
  }

  try {
    const out = JSON.parse(response.output_text);
    if (!out || (out.status !== "ok" && out.status !== "error")) {
      return {
        status: "error",
        error: { message: "Model returned invalid status" },
        explanations: null,
      };
    }

    if (out.status === "error") {
      return {
        status: "error",
        error: { message: out?.error?.message || "Explanation failed" },
        explanations: null,
      };
    }

    if (!Array.isArray(out.explanations) || out.explanations.length === 0) {
      return {
        status: "error",
        error: { message: "Model returned no explanations" },
        explanations: null,
      };
    }

    return out;
  } catch (e) {
    return {
      status: "error",
      error: { message: "Failed to parse explanation output as JSON" },
      explanations: null,
    };
  }
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
      instructions: getInstructions(lesson.title),
      input: historyAsInput,
      max_output_tokens: 2048,
      reasoning: { effort: "low" },
    });
    if (response.status !== "completed" || response.error != null) {
      throw new Error("OpenAI response failed!");
    }
    const aiResponse = response.output_text;

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
  existingQuestions = null,
}) => {
  //get lesson data
  const lesson = await Lesson.findById(lessonId).lean();
  //get previous messages made in this lesson for the context
  const previousMessages = await Message.find({ lesson_id: lessonId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  previousMessages.reverse();
  //format the messages: separate them into user and assistant messages for the request input
  const historyAsInput = previousMessages.map(formatMessageForModel);

  const trimmedDescription = String(description).trim();
  //get correct schema for the activity type
  //for multiple choice get the one quesiton, multiple answers schema
  //for text get question schema
  //for flashcard get front and back schema
  const schemaByType = {
    "multiple-choice": multipleChoiceGenerationSchema,
    text: textGenerationSchema,
    flashcards: flashcardGenerationSchema,
  };

  const schema = schemaByType[String(activityType || "")];

  //make a promise request with correct context from the messages
  //generated instruction based on the activity type
  //correct schema for the activity type
  let response;
  try {
    response = await withTimeout(
      client.responses.create({
        model: "gpt-5-mini",
        input: [
          ...historyAsInput,
          {
            role: "user",
            content: getInstructionsForGeneratingActivity(
              lesson.title,
              questionCount,
              trimmedDescription,
              activityType,
              existingQuestions,
            ),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "activity_generation",
            strict: true,
            schema,
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
      error: error.message || "Failed to generate activity data",
    };
  }
  //get raw response
  const raw = response.output_text;
  //validate response
  if (response.status !== "completed")
    throw new Error("OpenAI response failed!");
  try {
    const out = JSON.parse(raw);
    //check if the activity passed the validation rules, if not return an error

    if (out.status === "error") {
      return {
        status: "error",
        error: out?.error?.message || "OpenAI response failed!",
      };
    }
    const items = Array.isArray(out?.items) ? out.items : null;
    //make sure questions were generated and their number is correct
    if (!items)
      return {
        status: "error",
        error: "OpenAI response failed!",
      };
    if (items.length !== Number(questionCount)) {
      return {
        status: "error",
        error: "OpenAI response failed!",
      };
    }
    //return the generated questions
    return {
      status: "ok",
      error: null,
      activityType: String(activityType),
      items,
    };
  } catch (e) {
    return {
      status: "error",
      error: "Failed validate the response",
    };
  }
};

module.exports = {
  generateAIResponse,
  generateActivityData,
  gradeFreeTextAnswers,
  explainActivityMistakes,
};
