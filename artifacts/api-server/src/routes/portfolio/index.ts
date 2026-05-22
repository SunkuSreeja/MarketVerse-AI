import { Router, type IRouter } from "express";
import { db, portfolioTable } from "@workspace/db";
import {
  GetPortfolioResponse,
  GetInvestorScoresResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function ensurePortfolio() {
  const rows = await db.select().from(portfolioTable);
  if (rows.length === 0) {
    const [p] = await db.insert(portfolioTable).values({
      totalInvested: 25000,
      holdings: [
        { symbol: "NIFTY50", name: "Nifty 50 Index Fund", allocation: 40, currentValue: 12400, gainLoss: 1400 },
        { symbol: "TECHF", name: "Tech Growth Fund", allocation: 30, currentValue: 8900, gainLoss: 1400 },
        { symbol: "GOLDETF", name: "Gold ETF", allocation: 15, currentValue: 4200, gainLoss: 450 },
        { symbol: "LIQUIDF", name: "Liquid Fund", allocation: 15, currentValue: 3750, gainLoss: 250 },
      ],
      investorIQ: 62,
      disciplineScore: 71,
      riskBalance: 68,
      emotionalStability: 55,
      overallRank: "Apprentice",
      badges: ["First Simulation", "Psychology Explorer"],
    }).returning();
    return p;
  }
  return rows[0]!;
}

router.get("/portfolio", async (req, res): Promise<void> => {
  const p = await ensurePortfolio();
  const totalValue = (p.holdings as Array<{symbol:string;name:string;allocation:number;currentValue:number;gainLoss:number}>).reduce((acc, h) => acc + h.currentValue, 0);
  const gainLoss = totalValue - p.totalInvested;
  res.json(GetPortfolioResponse.parse({
    totalValue,
    totalInvested: p.totalInvested,
    gainLoss,
    gainLossPercent: Math.round((gainLoss / p.totalInvested) * 1000) / 10,
    holdings: p.holdings,
    investorScores: {
      investorIQ: p.investorIQ,
      disciplineScore: p.disciplineScore,
      riskBalance: p.riskBalance,
      emotionalStability: p.emotionalStability,
      overallRank: p.overallRank,
      badges: p.badges,
    },
  }));
});

router.get("/portfolio/scores", async (req, res): Promise<void> => {
  const p = await ensurePortfolio();
  res.json(GetInvestorScoresResponse.parse({
    investorIQ: p.investorIQ,
    disciplineScore: p.disciplineScore,
    riskBalance: p.riskBalance,
    emotionalStability: p.emotionalStability,
    overallRank: p.overallRank,
    badges: p.badges,
  }));
});

export default router;
