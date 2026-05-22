import { Router, type IRouter } from "express";
import { db, psychologyEventsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import {
  RecordPsychologyEventBody,
  GetPsychologyProfileResponse,
} from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai";

const router: IRouter = Router();

router.post("/psychology/events", async (req, res): Promise<void> => {
  const parsed = RecordPsychologyEventBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [event] = await db.insert(psychologyEventsTable).values(parsed.data).returning();
  res.status(201).json(event);
});

router.get("/psychology/profile", async (req, res): Promise<void> => {
  const events = await db.select().from(psychologyEventsTable).orderBy(desc(psychologyEventsTable.createdAt));

  const total = events.length;
  const counts: Record<string, number> = {};
  let panicScore = 30;
  let greedScore = 30;
  let disciplineScore = 60;

  events.forEach(e => {
    counts[e.eventType] = (counts[e.eventType] || 0) + 1;
    if (["panic_click", "panic_sell"].includes(e.eventType)) panicScore += e.severity * 4;
    if (["fomo", "hype_chase", "impulsive_buy"].includes(e.eventType)) greedScore += e.severity * 4;
    if (["risky_decision"].includes(e.eventType)) disciplineScore -= e.severity * 3;
    if (e.eventType === "hesitation") disciplineScore += e.severity * 2;
  });

  panicScore = Math.min(100, Math.max(0, panicScore));
  greedScore = Math.min(100, Math.max(0, greedScore));
  disciplineScore = Math.min(100, Math.max(0, disciplineScore));

  const topPatterns = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

  let dominantBias = "Balanced Investor";
  if (panicScore > 70) dominantBias = "Panic Seller";
  else if (greedScore > 70) dominantBias = "FOMO Investor";
  else if (disciplineScore > 70) dominantBias = "Disciplined Investor";
  else if (counts["hype_chase"] > 2) dominantBias = "Hype Chaser";
  else if (counts["hesitation"] > 3) dominantBias = "Hesitant Investor";

  let aiAdaptation = "Keep learning — your patterns reveal a growing investor mindset.";
  if (total > 0) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [{ text: `An investor shows these behavioral patterns: ${JSON.stringify(counts)}. Their bias is "${dominantBias}". In one warm, empathetic sentence, give them a personalized learning tip that addresses their specific pattern. Be specific and encouraging, not generic.` }]
        }],
        config: { maxOutputTokens: 128 }
      });
      aiAdaptation = response.text?.trim() ?? aiAdaptation;
    } catch (_) { /* fallback */ }
  }

  res.json(GetPsychologyProfileResponse.parse({
    dominantBias,
    panicScore,
    greedScore,
    disciplineScore,
    totalEvents: total,
    topPatterns,
    aiAdaptation,
  }));
});

export default router;
