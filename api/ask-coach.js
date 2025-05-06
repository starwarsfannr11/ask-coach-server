import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message must be a string" });
  }

  try {
    // Step 1: Create a thread
    const thread = await openai.beta.threads.create();

    // Step 2: Add user message to thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message
    });

    // Step 3: Run assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID
    });

    // Step 4: Poll for completion
    let completedRun;
    while (true) {
      const statusCheck = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      if (statusCheck.status === "completed") {
        completedRun = statusCheck;
        break;
      }
      if (statusCheck.status === "failed") {
        throw new Error("Assistant run failed");
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Step 5: Get messages from thread
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find(msg => msg.role === "assistant");

    res.status(200).json({ response: assistantMessage?.content[0]?.text?.value || "No response found." });
  } catch (error) {
    console.error("Error in assistant handler:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
