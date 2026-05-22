import { Router, type IRouter } from "express";
import { db, scenariosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetScenarioParams, GetScenarioReplayResponse } from "@workspace/api-zod";

const router: IRouter = Router();

type TimelineEvent = {
  month: string;
  event: string;
  marketMove: number;
  emotion: string;
};

const EMOTION_MAP: Record<string, string> = {
  "Excitement": "euphoria",
  "Greed": "greed",
  "Euphoria": "euphoria",
  "Fear": "fear",
  "Panic": "panic",
  "Uncertainty": "uncertainty",
  "Despair": "panic",
  "Hope": "recovery",
  "Recovery": "recovery",
  "Relief": "recovery",
  "Optimism": "recovery",
  "Shock": "fear",
  "Disbelief": "uncertainty",
};

function mapEmotion(emotion: string): string {
  for (const [key, val] of Object.entries(EMOTION_MAP)) {
    if (emotion.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return "uncertainty";
}

function generateNarration(event: TimelineEvent, move: number): string {
  const absMove = Math.abs(move);
  if (move <= -20) return `🔴 CRASH: ${event.event} The markets are in freefall. Fear fills every trading floor. Phones ring non-stop with sell orders.`;
  if (move <= -10) return `📉 SHARP DROP: ${event.event} Investors stare at screens in disbelief as portfolios bleed red. This is what panic feels like.`;
  if (move <= -5) return `⬇️ CORRECTION: ${event.event} The rally stalls. Bears take control. Every TV channel asks "Is this the crash?"`;
  if (move <= -2) return `↘️ PULLBACK: ${event.event} Selling pressure builds. Smart money watches and waits. Weak hands fold.`;
  if (move < 2) return `➡️ CONSOLIDATION: ${event.event} Markets pause. Bulls and bears battle for control. Volume dries up as traders wait.`;
  if (move < 5) return `↗️ RECOVERY: ${event.event} Green candles return. Brave investors who held are breathing easier.`;
  if (move < 10) return `📈 RALLY: ${event.event} Momentum builds. Those who bought the dip are being rewarded. FOMO starts creeping back.`;
  return `🚀 SURGE: ${event.event} The market explodes higher. Euphoria returns. Everyone wishes they had bought more. ${absMove.toFixed(1)}% gain.`;
}

function isDecisionMoment(event: TimelineEvent, index: number): boolean {
  const isBottom = event.marketMove <= -15;
  const isRecovery = event.marketMove >= 10;
  const isMajorMove = Math.abs(event.marketMove) >= 20;
  return isBottom || isRecovery || isMajorMove || index === 0;
}

function getDecisionPrompt(event: TimelineEvent): string | null {
  if (event.marketMove <= -20) return "Markets are down 20%+. Your portfolio is bleeding. What do you do? BUY MORE / HOLD / SELL EVERYTHING";
  if (event.marketMove <= -10) return "Sharp correction underway. Experts disagree on what comes next. Your move? BUY THE DIP / HOLD / CUT LOSSES";
  if (event.marketMove >= 15) return "Markets surging! Everyone around you is making money. Do you chase? BUY NOW / WAIT / TAKE PROFITS";
  if (event.marketMove <= -5 && event.emotion?.toLowerCase().includes("panic")) return "Panic is spreading. News is all doom. What does your gut say? STAY CALM & HOLD / SELL A LITTLE / SELL ALL";
  if (event.marketMove >= 8) return "Recovery is real. Do you re-enter or wait for another dip? BUY NOW / WAIT MORE / TAKE PROFITS";
  return null;
}

router.get("/scenarios/:id/replay", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetScenarioParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [scenario] = await db.select().from(scenariosTable).where(eq(scenariosTable.id, params.data.id));
  if (!scenario) { res.status(404).json({ error: "Scenario not found" }); return; }

  const timeline = (scenario.timeline as TimelineEvent[]) || [];

  let cumulativeValue = 10000;
  const steps = timeline.map((event, index) => {
    const move = event.marketMove ?? 0;
    const prevClose = cumulativeValue;
    cumulativeValue = cumulativeValue * (1 + move / 100);

    const open = prevClose;
    const close = cumulativeValue;
    const volatility = Math.abs(move) * 0.5;
    const high = Math.max(open, close) * (1 + volatility / 100);
    const low = Math.min(open, close) * (1 - volatility / 100);
    const volume = Math.floor(500000 + Math.random() * 2000000 * (1 + Math.abs(move) / 10));

    const decisionMoment = isDecisionMoment(event, index);
    const decisionPrompt = decisionMoment ? getDecisionPrompt(event) : null;

    return {
      stepIndex: index,
      candle: {
        time: `${event.month}-01`,
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume,
      },
      narration: generateNarration(event, move),
      emotion: mapEmotion(event.emotion || "uncertainty"),
      decisionMoment,
      decisionPrompt,
    };
  });

  res.json(GetScenarioReplayResponse.parse({
    scenarioId: scenario.id,
    title: scenario.title,
    totalSteps: steps.length,
    steps,
    finalLesson: (scenario as Record<string, unknown>).smartInvestorLesson as string
      ?? "The greatest investors don't predict the market — they survive it.",
  }));
});

export default router;
