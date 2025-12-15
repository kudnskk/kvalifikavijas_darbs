const OpenAI = require("openai");
require("dotenv").config();
const Message = require("../models/chat/message");
const Lesson = require("../models/chat/lesson");
// Initialize OpenAI client once
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
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
    console.log("Generating AI response for:", userMessage);

    const lesson = await Lesson.findById(lessonId).lean();
    if (!lesson) {
      console.warn("Lesson not found for AI response", { lessonId });
      return;
    }

    // Get last 20 messages for this lesson (newest -> oldest, then reverse)
    const previousMessages = await Message.find({ lesson_id: lessonId })
      .sort({ createdAt: -1 }) // newest first
      .limit(20)
      .lean();

    previousMessages.reverse(); // oldest -> newest for the model

    const formatMessageForModel = (msg) => {
      const baseText = typeof msg.content === "string" ? msg.content : "";
      const hasFile = Boolean(msg.file && msg.file.content);

      if (!hasFile) {
        return {
          role: msg.sender_type, // "user" or "assistant"
          content: baseText,
        };
      }

      const fileName = msg.file.file_name || "file";
      const fileText = msg.file.content || "";
      return {
        role: msg.sender_type,
        content:
          `${baseText}\n\n[Attached file: ${fileName}]\n${fileText}`.trim(),
      };
    };

    // Map DB messages to chat-style roles for the model.
    // Make sure you store "user" / "assistant" in sender_type.
    const historyAsInput = previousMessages.map(formatMessageForModel);

    // Ensure the latest user message (including file text) is present.
    // In most cases it is already in DB, but we overwrite/push for correctness.
    const latestUserText =
      typeof userMessage === "string" ? userMessage.trim() : "";
    if (latestUserText) {
      const last = historyAsInput[historyAsInput.length - 1];
      if (last && last.role === "user") {
        last.content = latestUserText;
      } else {
        historyAsInput.push({ role: "user", content: latestUserText });
      }
    }

    // Call the newer Responses API
    const response = await client.responses.create({
      model: "gpt-5-mini",
      instructions: getInstructions(lesson.title, "chat"),
      input: historyAsInput, // chat-style messages
      max_output_tokens: 2048,
      reasoning: { effort: "low" },
    });

    // Convenient shortcut: combined text from the response
    const aiResponse = response.output_text;
    console.log("AI Response:", aiResponse);

    // Save AI response as a message
    const aiMessage = new Message({
      content: aiResponse,
      type: "text",
      sender_type: "assistant", // important to match roles we send
      lesson_id: lessonId,
      user_id: userId,
    });

    await aiMessage.save();

    // Link it to the lesson
    await Lesson.findByIdAndUpdate(lessonId, {
      $push: { messages: aiMessage._id },
    });

    console.log("AI response saved successfully");
    return aiMessage; // handy for sockets later
  } catch (error) {
    console.error("Error generating AI response:", error.message);
    throw error;
  }
};

module.exports = { generateAIResponse };
