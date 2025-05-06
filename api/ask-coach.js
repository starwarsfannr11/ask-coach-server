export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message must be a string" });
    }

    return res.status(200).json({
      message: `You said: ${message}`,
    });
  } catch (error) {
    console.error("Error handling request:", error);
    return res.status(400).json({ error: "Invalid input format" });
  }
}
