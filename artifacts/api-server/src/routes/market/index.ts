import { Router, type IRouter } from "express";
import _YF from "yahoo-finance2";
// yahoo-finance2 v3 exports a class as default; must instantiate before calling methods
const yahooFinance = new (_YF as unknown as new () => typeof _YF)();
import { ai } from "@workspace/integrations-gemini-ai";
import {
  GetMarketQuoteResponse,
  GetMarketCandlesResponse,
  ExplainCandleBody,
  ExplainCandleResponse,
  GetWatchlistResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const WATCHLIST = [
  "^NSEI",
  "^BSESN",
  "^GSPC",
  "^IXIC",
  "GC=F",
  "RELIANCE.NS",
  "INFY.NS",
  "TCS.NS",
];

function buildQuotePayload(symbol: string, q: Record<string, unknown>) {
  return {
    symbol,
    shortName: (q.shortName as string) || (q.longName as string) || symbol,
    price: (q.regularMarketPrice as number) ?? 0,
    change: (q.regularMarketChange as number) ?? 0,
    changePercent: (q.regularMarketChangePercent as number) ?? 0,
    volume: (q.regularMarketVolume as number) ?? 0,
    marketCap: (q.marketCap as number | null) ?? null,
    high52w: (q.fiftyTwoWeekHigh as number | null) ?? null,
    low52w: (q.fiftyTwoWeekLow as number | null) ?? null,
    currency: (q.currency as string) || "USD",
    exchange: (q.fullExchangeName as string) || (q.exchange as string) || "",
    marketState: (q.marketState as string) || "CLOSED",
  };
}

router.get("/market/watchlist", async (req, res): Promise<void> => {
  try {
    const quotes = await Promise.all(
      WATCHLIST.map(async (symbol) => {
        try {
          const q = await yahooFinance.quote(symbol);
          return buildQuotePayload(symbol, q as Record<string, unknown>);
        } catch {
          return null;
        }
      })
    );
    res.json(GetWatchlistResponse.parse(quotes.filter(Boolean)));
  } catch (err) {
    req.log.error(err, "watchlist fetch failed");
    res.status(500).json({ error: "Failed to fetch watchlist" });
  }
});

router.get("/market/quote/:symbol", async (req, res): Promise<void> => {
  const symbol = decodeURIComponent(req.params.symbol as string);
  try {
    const q = await yahooFinance.quote(symbol);
    if (!q) { res.status(404).json({ error: "Symbol not found" }); return; }
    res.json(GetMarketQuoteResponse.parse(buildQuotePayload(symbol, q as Record<string, unknown>)));
  } catch (err) {
    req.log.error(err, "quote fetch failed");
    res.status(404).json({ error: "Symbol not found or unavailable" });
  }
});

router.get("/market/candles/:symbol", async (req, res): Promise<void> => {
  const symbol = decodeURIComponent(req.params.symbol as string);
  const period = (req.query.period as string) || "1y";
  const interval = (req.query.interval as string) || "1d";

  const periodMonthMap: Record<string, number> = { "1mo": 1, "3mo": 3, "6mo": 6, "1y": 12, "2y": 24, "5y": 60 };
  const validIntervals = ["1d", "1wk", "1mo"] as const;

  const safePeriod = periodMonthMap[period] ? period : "1y";
  const safeInterval = validIntervals.includes(interval as typeof validIntervals[number])
    ? (interval as typeof validIntervals[number]) : "1d";

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - (periodMonthMap[safePeriod] ?? 12));

  try {
    const result = await yahooFinance.chart(symbol, {
      period1: startDate.toISOString().slice(0, 10),
      interval: safeInterval,
    });

    const quotes = (result as Record<string, unknown>).quotes as Array<Record<string, unknown>> | undefined ?? [];
    const candles = quotes
      .filter((q) => q.open != null && q.close != null && q.high != null && q.low != null)
      .map((q) => ({
        time: new Date(q.date as string | number).toISOString().slice(0, 10),
        open: q.open as number,
        high: q.high as number,
        low: q.low as number,
        close: q.close as number,
        volume: (q.volume as number) ?? 0,
      }));

    res.json(GetMarketCandlesResponse.parse({ symbol, interval: safeInterval, candles }));
  } catch (err) {
    req.log.error(err, "candles fetch failed");
    res.status(500).json({ error: "Failed to fetch candle data" });
  }
});

router.post("/market/explain-candle", async (req, res): Promise<void> => {
  const body = ExplainCandleBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const { open, high, low, close, volume, previousClose, context } = body.data;
  const isGreen = close >= open;
  const bodySize = Math.abs(close - open);
  const totalRange = high - low || 1;
  const upperWick = high - Math.max(open, close);
  const lowerWick = Math.min(open, close) - low;
  const changePercent = previousClose ? ((close - previousClose) / previousClose * 100).toFixed(2) : null;

  const prompt = `You are an expert stock market educator explaining candlestick charts to a beginner investor in India.

Candle data:
- Open: ${open}, High: ${high}, Low: ${low}, Close: ${close}
- Volume: ${volume.toLocaleString()}
- ${changePercent ? `Change: ${changePercent}%` : ""}
- ${isGreen ? "BULLISH (green) candle" : "BEARISH (red) candle"}
- Body: ${((bodySize / totalRange) * 100).toFixed(0)}% of total range
- Upper wick: ${upperWick.toFixed(2)}, Lower wick: ${lowerWick.toFixed(2)}
${context ? `- Context: ${context}` : ""}

Respond in this EXACT JSON format (no markdown, no code blocks):
{
  "pattern": "name of the pattern (e.g. Long Red Candle, Doji, Hammer, Shooting Star, Marubozu)",
  "sentiment": "${isGreen ? "bullish" : "bearish"}",
  "explanation": "2-3 simple sentences a 20-year-old would understand. Use a relatable analogy.",
  "buyerSellerPressure": "1 sentence about who controlled this session and what it means",
  "beginnerMistake": "The most common mistake a beginner makes seeing this candle",
  "expertThinking": "What an experienced investor thinks when they see this pattern",
  "volatilityNote": "What the wick sizes reveal about market uncertainty this session"
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", maxOutputTokens: 512 },
    });

    const raw = response.text?.trim() ?? "{}";
    const parsed = JSON.parse(raw);
    res.json(ExplainCandleResponse.parse(parsed));
  } catch (err) {
    req.log.error(err, "candle explanation failed");
    res.json(ExplainCandleResponse.parse({
      pattern: isGreen ? "Bullish Candle" : "Bearish Candle",
      sentiment: isGreen ? "bullish" : "bearish",
      explanation: isGreen
        ? "This green candle shows buyers were stronger than sellers. The price closed higher than it opened — a positive signal."
        : "This red candle shows sellers overwhelmed buyers. The price fell from open to close — expressing fear or correction.",
      buyerSellerPressure: isGreen ? "Buyers dominated — demand exceeded supply this session." : "Sellers dominated — supply exceeded demand this session.",
      beginnerMistake: isGreen ? "Beginners often chase the price after a big green candle — but the move may already be over." : "Beginners panic-sell after a red candle, locking in losses at the worst moment.",
      expertThinking: isGreen ? "Experts check volume confirmation and watch for resistance levels ahead." : "Experts watch for support levels and assess whether this is a buying opportunity.",
      volatilityNote: "Wick size shows how hard buyers and sellers fought — longer wicks = more uncertainty.",
    }));
  }
});

export default router;
