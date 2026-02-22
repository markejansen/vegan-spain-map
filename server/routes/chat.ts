import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post("/", async (req: Request, res: Response) => {
  const { messages, restaurants } = req.body as {
    messages: { role: "user" | "assistant"; content: string }[];
    restaurants: object[];
  };

  if (!messages?.length) {
    res.status(400).json({ error: "messages required" });
    return;
  }

  const systemPrompt = `You are a friendly vegan food guide for Spain. Your job is to help users discover great places to eat — whether they're looking for 100% vegan restaurants or spots with excellent vegan options.

Here are the restaurants currently shown on the map:
${JSON.stringify(restaurants, null, 2)}

Guidelines:
- Reference specific restaurants by name when making recommendations
- Mention ratings when relevant (e.g. "rated 4.7/5")
- Note whether a place is fully vegan or vegan-friendly (has vegan options)
- Be warm, enthusiastic, and concise
- If the user asks about something outside the current list, suggest they try a different city filter`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      system: systemPrompt,
      messages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error(err);
    res.write(`data: ${JSON.stringify({ error: "AI error" })}\n\n`);
    res.end();
  }
});

export default router;
