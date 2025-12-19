const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const activityGenerationSchema = {
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
          // multiple_choice fields
          question: { type: ["string", "null"] },
          answers: { type: ["array", "null"], items: { type: "string" } },
          correctAnswerIndices: {
            type: ["array", "null"],
            items: { type: "integer", minimum: 0 },
          },
          // free_text fields
          referenceAnswer: { type: ["string", "null"] },
          keyPoints: { type: ["array", "null"], items: { type: "string" } },
          // flashcard fields
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

function validateStructuredActivityOutput(out, expectedType, expectedCount) {
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

  // status === "ok"
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
}

function getActivityInstructions(lessonTitle, activityType, itemCount) {
  return `
You generate educational study activities for the lesson: "${lessonTitle}".

Return ONLY JSON matching the schema exactly.

Envelope rules:
- If unclear/underspecified: {"status":"error","error":{"message":"...","clarification_questions":[...]},"activityType":null,"items":null}
- Otherwise: {"status":"ok","error":null,"activityType":"${activityType}","items":[...]}

Hard requirements:
- If status="ok", items MUST have exactly ${itemCount} items.
- No extra keys. No markdown. No text outside JSON.
`.trim();
}

async function generateActivityData({
  lessonTitle,
  activityType, // multiple_choice | free_text | flashcard
  questionCount,
  title,
  description,
  historyAsInput = [],
}) {
  const prompt = `Generate an activity:\n- activityType: ${activityType}\n- itemCount: ${questionCount}\n- title: ${
    title || "(none)"
  }\n- description: ${(description || "").trim() || "(none)"}`;

  const response = await client.responses.create({
    model: "gpt-5-mini",
    instructions: getActivityInstructions(
      lessonTitle,
      activityType,
      questionCount,
    ),
    input: [...historyAsInput, { role: "user", content: prompt }],
    text: {
      format: {
        type: "json_schema",
        name: "activity_generation",
        strict: true,
        schema: activityGenerationSchema,
      },
    },
    max_output_tokens: 2048,
    reasoning: { effort: "low" },
  });

  try {
    const out = JSON.parse(response.output_text);
    return validateStructuredActivityOutput(out, activityType, questionCount);
  } catch {
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
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY in environment (.env)");
    process.exit(1);
  }

  const lessonTitle = "Introduction to Photosynthesis";
  const tests = [
    {
      activityType: "multiple_choice",
      questionCount: 5,
      title: "Photosynthesis Quiz",
      description:
        "Make beginner-friendly questions focusing on key terms and process steps.",
    },
    {
      activityType: "free_text",
      questionCount: 3,
      title: "Explain Photosynthesis",
      description:
        "Generate open questions that require short written answers, include reference answers and key points.",
    },
    {
      activityType: "flashcard",
      questionCount: 5,
      title: "Photosynthesis Flashcards",
      description: "Front should be a term, back should be a short definition.",
    },
  ];

  for (const t of tests) {
    console.log("\n---");
    console.log(`Generating: ${t.activityType} (${t.questionCount})`);
    const result = await generateActivityData({
      lessonTitle,
      activityType: t.activityType,
      questionCount: t.questionCount,
      title: t.title,
      description: t.description,
      historyAsInput: [],
    });
    console.dir(result, { depth: null });
  }
}

main().catch((err) => {
  console.error("test.js failed:", err);
  process.exit(1);
});
