import { Router, type IRouter } from "express";
import { db, conversations, messages } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListGeminiConversationsResponse,
  CreateGeminiConversationBody,
  GetGeminiConversationParams,
  GetGeminiConversationResponse,
  DeleteGeminiConversationParams,
  ListGeminiMessagesParams,
  ListGeminiMessagesResponse,
  SendGeminiMessageParams,
  SendGeminiMessageBody,
  AnalyzeInvestmentDecisionBody,
  AnalyzeInvestmentDecisionResponse,
} from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai";

const SYSTEM_PROMPT = `You are Aria, the AI investment mentor inside MarketVerse — a cinematic stock market learning platform. You are warm, empathetic, brilliant, and speak like a trusted financial coach, not a textbook. You:
- Explain investing concepts using vivid analogies and storytelling
- Focus on the PSYCHOLOGY of investing — emotions, biases, behavior
- Gently call out emotional investing patterns
- Adapt to beginners — no jargon without explanation
- Give specific, actionable insights
- Reference real historical events when relevant (2008 crash, COVID crash, etc.)
- Always remind users this is for educational purposes only

Topics you excel at: stocks, SIP, mutual funds, diversification, compounding, market crashes, FOMO, panic selling, risk management, portfolio allocation, candlestick patterns, market psychology.`;

const router: IRouter = Router();

router.get("/gemini/conversations", async (req, res): Promise<void> => {
  const rows = await db.select().from(conversations).orderBy(conversations.createdAt);
  res.json(ListGeminiConversationsResponse.parse(rows));
});

router.post("/gemini/conversations", async (req, res): Promise<void> => {
  const parsed = CreateGeminiConversationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [conv] = await db.insert(conversations).values({ title: parsed.data.title }).returning();
  res.status(201).json(conv);
});

router.get("/gemini/conversations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetGeminiConversationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, params.data.id));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, conv.id)).orderBy(messages.createdAt);
  res.json(GetGeminiConversationResponse.parse({ ...conv, messages: msgs }));
});

router.delete("/gemini/conversations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteGeminiConversationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [deleted] = await db.delete(conversations).where(eq(conversations.id, params.data.id)).returning();
  if (!deleted) { res.status(404).json({ error: "Conversation not found" }); return; }
  res.sendStatus(204);
});

router.get("/gemini/conversations/:id/messages", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListGeminiMessagesParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, params.data.id)).orderBy(messages.createdAt);
  res.json(ListGeminiMessagesResponse.parse(msgs));
});

router.post("/gemini/conversations/:id/messages", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SendGeminiMessageParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = SendGeminiMessageBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, params.data.id));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  // Save user message
  await db.insert(messages).values({ conversationId: conv.id, role: "user", content: body.data.content });

  // Load chat history
  const history = await db.select().from(messages).where(eq(messages.conversationId, conv.id)).orderBy(messages.createdAt);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const chatMessages = [
      { role: "user" as const, parts: [{ text: SYSTEM_PROMPT + "\n\nNow begin the conversation." }] },
      { role: "model" as const, parts: [{ text: "I'm Aria, your AI investment mentor. How can I help you understand the world of investing today?" }] },
      ...history.map(m => ({
        role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
        parts: [{ text: m.content }],
      })),
    ];

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: chatMessages,
      config: { maxOutputTokens: 8192 },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }
  } catch (err) {
    const errMsg = "Sorry, I encountered an issue. Please try again.";
    res.write(`data: ${JSON.stringify({ content: errMsg })}\n\n`);
    fullResponse = errMsg;
  }

  // Save assistant response
  if (fullResponse) {
    await db.insert(messages).values({ conversationId: conv.id, role: "assistant", content: fullResponse });
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

router.post("/gemini/analyze-decision", async (req, res): Promise<void> => {
  const parsed = AnalyzeInvestmentDecisionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { decision, context, emotion } = parsed.data;

  let result = {
    biasDetected: "Confirmation Bias",
    explanation: "You may be favoring information that confirms your existing beliefs.",
    historicalParallel: null as string | null,
    alternativeApproach: "Consider seeking out contrarian viewpoints before deciding.",
    emotionalRating: "emotional" as string,
    lessonLearned: "Great investors question their own assumptions regularly.",
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [{ text: `Analyze this investment decision from a behavioral finance perspective:
Decision: "${decision}"
Market Context: "${context}"
Self-reported emotion: "${emotion ?? "not specified"}"

Respond in JSON format with these exact keys:
{
  "biasDetected": "name of the cognitive bias or emotional pattern detected",
  "explanation": "2-sentence explanation of the bias in plain language",
  "historicalParallel": "1 sentence referencing a real historical market event that shows this pattern, or null",
  "alternativeApproach": "1 sentence suggesting what a rational, long-term investor would do instead",
  "emotionalRating": "rational" or "emotional" or "highly emotional",
  "lessonLearned": "1 powerful takeaway lesson in plain language"
}` }]
      }],
      config: { maxOutputTokens: 512, responseMimeType: "application/json" },
    });

    const text = response.text ?? "";
    const parsed = JSON.parse(text);
    result = { ...result, ...parsed };
  } catch (_) { /* fallback to defaults */ }

  res.json(AnalyzeInvestmentDecisionResponse.parse(result));
});

export default router;
