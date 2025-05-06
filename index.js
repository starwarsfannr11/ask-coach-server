const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

// Load OpenAI client with your API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

// POST route to talk to the coach
app.post("/api/ask-coach", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Invalid input format" });
  }

  try {
    // 1. Create a thread
    const thread = await openai.beta.threads.create();

    // 2. Add user message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    // 3. Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });

    // 4. Poll until it's done
    let runStatus;
    do {
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      if (runStatus.status !== "completed") {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } while (runStatus.status !== "completed");

    // 5. Get the response messages
    const messages = await openai.beta.threads.messages.list(thread.id);
    const reply = messages.data.find(m => m.role === "assistant");

    console.log("🧠 Assistant ID:", ASSISTANT_ID);
    console.log("💬 User:", message);
    console.log("🤖 Reply:", reply?.content?.[0]?.text?.value);

    res.json({ content: reply?.content?.[0]?.text?.value || "No response." });

  } catch (error) {
    console.error("❌ OpenAI error:", error);
    if (error.response) {
      console.error("📥 Error response:", error.response.status, error.response.data);
    }
    res.status(500).json({ error: error.message || "Failed to generate response" });
  }  
});

module.exports = app;
