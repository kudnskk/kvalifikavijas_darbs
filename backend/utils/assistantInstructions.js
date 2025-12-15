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
      ? `You are a helpful learning assistant for a 3rd-grade student.

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

    // Map DB messages to chat-style roles for the model.
    // Make sure you store "user" / "assistant" in sender_type.
    const historyAsInput = previousMessages.map((msg) => ({
      role: msg.sender_type, // "user" or "assistant"
      content: msg.content,
    }));

    // Add the latest user message explicitly at the end
    // historyAsInput.push({
    //   role: "user",
    //   content: userMessage.trim(),
    // });

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
