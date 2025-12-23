const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const multipleChoiseGenerationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["ok", "error"] },
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
        },
        required: ["question", "answers", "correctAnswerIndices"],
      },
    },
  },
  required: ["status", "items"],
};

async function generateActivityData({
  lessonTitle,
  activityType, // multiple_choice | free_text | flashcard
  questionCount,
  title,
  description,
  historyAsInput = [],
}) {
  const response = await client.responses.create({
    model: "gpt-5-mini",
    //instructions: getInstructions(title, questionCount, description),
    input: [
      ...historyAsInput,
      {
        role: "user",
        content: getInstructions(title, questionCount, description),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "activity_generation",
        strict: true,
        schema: multipleChoiseGenerationSchema,
      },
    },
    max_output_tokens: 2048,
    reasoning: { effort: "low" },
  });

  try {
    const out = JSON.parse(response.output_text);
    return out;
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
  const lessonTitle = "Introduction to Photosynthesis";
  const tests = [
    {
      activityType: "multiple_choice",
      questionCount: 5,
      title: "Photosynthesis Quiz",
      description:
        "Make beginner-friendly questions focusing on key terms and process steps.",
    },
    // {
    //   activityType: "free_text",
    //   questionCount: 3,
    //   title: "Explain Photosynthesis",
    //   description:
    //     "Generate open questions that require short written answers, include reference answers and key points.",
    // },
    // {
    //   activityType: "flashcard",
    //   questionCount: 5,
    //   title: "Photosynthesis Flashcards",
    //   description: "Front should be a term, back should be a short definition.",
    // },
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
    // Print full nested objects/arrays (avoid Node's `[Array]` truncation)
    console.log(JSON.stringify(result, null, 2));
  }
}

main().catch((err) => {
  console.error("test.js failed:", err);
  process.exit(1);
});
