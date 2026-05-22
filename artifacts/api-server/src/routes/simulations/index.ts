import { Router, type IRouter } from "express";
import { db, simulationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListSimulationsResponse,
  CreateSimulationBody,
  GetSimulationParams,
  GetSimulationResponse,
  RunSimulationParams,
  RunSimulationResponse,
  GetSimulationSummaryResponse,
} from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai";

const router: IRouter = Router();

router.get("/simulations", async (req, res): Promise<void> => {
  const rows = await db.select().from(simulationsTable).orderBy(simulationsTable.createdAt);
  res.json(ListSimulationsResponse.parse(rows));
});

router.post("/simulations", async (req, res): Promise<void> => {
  const parsed = CreateSimulationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [sim] = await db.insert(simulationsTable).values({ ...parsed.data, status: "pending" }).returning();
  res.status(201).json(GetSimulationResponse.parse(sim));
});

router.get("/simulations/summary", async (req, res): Promise<void> => {
  const rows = await db.select().from(simulationsTable);
  const total = rows.length;
  const avgGain = total > 0 ? rows.reduce((acc, r) => acc + r.startingAmount, 0) / total : 0;
  const styleCounts: Record<string, number> = {};
  rows.forEach(r => { styleCounts[r.investmentStyle] = (styleCounts[r.investmentStyle] || 0) + 1; });
  const mostPopular = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "moderate";
  const avgRisk = total > 0 ? rows.reduce((acc, r) => acc + r.riskLevel, 0) / total : 5;
  res.json(GetSimulationSummaryResponse.parse({ totalSimulations: total, avgProjectedGain: avgGain, mostPopularStyle: mostPopular, avgRiskLevel: avgRisk }));
});

router.get("/simulations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetSimulationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [sim] = await db.select().from(simulationsTable).where(eq(simulationsTable.id, params.data.id));
  if (!sim) { res.status(404).json({ error: "Simulation not found" }); return; }
  res.json(GetSimulationResponse.parse(sim));
});

router.post("/simulations/:id/run", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RunSimulationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [sim] = await db.select().from(simulationsTable).where(eq(simulationsTable.id, params.data.id));
  if (!sim) { res.status(404).json({ error: "Simulation not found" }); return; }

  await db.update(simulationsTable).set({ status: "running" }).where(eq(simulationsTable.id, sim.id));

  // Compute projections
  const yearlyProjections: Array<{ year: number; value: number; percentageGain: number }> = [];
  const rateMap: Record<string, number> = { conservative: 0.07, moderate: 0.10, aggressive: 0.14, yolo: 0.20 };
  const annualRate = rateMap[sim.investmentStyle] ?? 0.10;
  let value = sim.startingAmount;
  const base = sim.startingAmount;
  for (let y = 1; y <= sim.timeHorizonYears; y++) {
    value = value * (1 + annualRate) + sim.monthlyAmount * 12;
    yearlyProjections.push({ year: y, value: Math.round(value), percentageGain: Math.round(((value - base) / base) * 100) });
  }
  const projected = yearlyProjections[yearlyProjections.length - 1]?.value ?? base;
  const crashRisk = Math.min(90, sim.riskLevel * 9 + (100 - sim.diversification) * 0.2);
  const emotionalStressScore = Math.min(100, sim.riskLevel * 8);

  // AI insight
  let aiInsight = "Stay disciplined and invest consistently.";
  let alternativeStrategy = "Consider diversifying across sectors.";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [{ text: `Investment profile: style=${sim.investmentStyle}, risk=${sim.riskLevel}/10, diversification=${sim.diversification}%, monthly=${sim.monthlyAmount}, years=${sim.timeHorizonYears}. In 2 sentences each: 1) Give a specific insight about this investor's emotional journey. 2) Suggest one alternative strategy. Format: INSIGHT: ... ALTERNATIVE: ...` }]
      }],
      config: { maxOutputTokens: 256 }
    });
    const text = response.text ?? "";
    const insightMatch = text.match(/INSIGHT:\s*(.+?)(?=ALTERNATIVE:|$)/s);
    const altMatch = text.match(/ALTERNATIVE:\s*(.+)/s);
    if (insightMatch) aiInsight = insightMatch[1].trim();
    if (altMatch) alternativeStrategy = altMatch[1].trim();
  } catch (_) { /* fallback to defaults */ }

  await db.update(simulationsTable).set({ status: "complete" }).where(eq(simulationsTable.id, sim.id));

  res.json(RunSimulationResponse.parse({
    simulationId: sim.id,
    projectedValue: projected,
    bestCase: Math.round(projected * 1.3),
    worstCase: Math.round(projected * 0.6),
    crashRisk,
    emotionalStressScore,
    yearlyProjections,
    aiInsight,
    alternativeStrategy,
  }));
});

export default router;
