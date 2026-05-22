import { Router, type IRouter } from "express";
import { db, challengesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListChallengesResponse,
  SubmitChallengeAttemptParams,
  SubmitChallengeAttemptBody,
  SubmitChallengeAttemptResponse,
} from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai";

const router: IRouter = Router();

router.get("/challenges", async (req, res): Promise<void> => {
  const rows = await db.select().from(challengesTable).orderBy(challengesTable.id);
  res.json(ListChallengesResponse.parse(rows));
});

router.post("/challenges/:id/attempt", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SubmitChallengeAttemptParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = SubmitChallengeAttemptBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const [challenge] = await db.select().from(challengesTable).where(eq(challengesTable.id, params.data.id));
  if (!challenge) { res.status(404).json({ error: "Challenge not found" }); return; }

  const correct = body.data.selectedOptionId === challenge.correctOptionId;
  const pointsEarned = correct ? challenge.pointsReward : Math.floor(challenge.pointsReward * 0.1);

  let aiFeedback = correct
    ? "Excellent decision! Your analytical thinking is sharp."
    : "Not quite — but every mistake is a learning moment in the market.";

  try {
    const selectedOption = (challenge.options as Array<{id:string;text:string}>).find(o => o.id === body.data.selectedOptionId);
    const correctOption = (challenge.options as Array<{id:string;text:string}>).find(o => o.id === challenge.correctOptionId);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [{ text: `Challenge: "${challenge.scenario}". The investor chose: "${selectedOption?.text}". Correct answer was: "${challenge.correctOptionId === body.data.selectedOptionId ? "this choice" : correctOption?.text}". In one warm, mentor-like sentence, give feedback on this decision from a behavioral finance perspective.` }]
      }],
      config: { maxOutputTokens: 128 }
    });
    aiFeedback = response.text?.trim() ?? aiFeedback;
  } catch (_) { /* fallback */ }

  res.json(SubmitChallengeAttemptResponse.parse({
    correct,
    pointsEarned,
    aiFeedback,
    explanation: challenge.explanation,
    emotionalInsight: challenge.emotionalInsight ?? null,
  }));
});

export default router;
