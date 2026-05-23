import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetWatchlist,
  useGetMarketCandles,
  useGetMarketQuote,
  useExplainCandle,
  type Candle,
  type CandleExplanation,
} from "@workspace/api-client-react";
import { TrendingUp, TrendingDown, Search, X, Loader2, Brain, BookOpen, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CandleChart } from "@/components/CandleChart";

const DEFAULT_SYMBOLS = ['^NSEI', 'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS'];

function WatchlistRow({ symbol, onClick, isActive }: { symbol: string; onClick: () => void; isActive: boolean }) {
  const { data: quote } = useGetMarketQuote(symbol, { query: { enabled: true } });

  const isUp = (quote?.changePercent ?? 0) >= 0;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 text-left ${
        isActive
          ? 'border-primary/50 bg-primary/5 shadow-[0_0_15px_rgba(0,212,255,0.1)]'
          : 'border-border/30 hover:border-border/60 hover:bg-white/3'
      }`}
    >
      <div>
        <div className="font-orbitron text-xs font-bold text-foreground">{quote?.shortName ?? symbol.replace('.NS', '').replace('^', '')}</div>
        <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{symbol}</div>
      </div>
      <div className="text-right">
        {quote ? (
          <>
            <div className="font-mono text-xs font-bold text-foreground">{quote.price.toFixed(2)}</div>
            <div className={`text-[10px] font-mono font-bold flex items-center gap-0.5 justify-end ${isUp ? 'text-accent' : 'text-destructive'}`}>
              {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {isUp ? '+' : ''}{(quote.changePercent ?? 0).toFixed(2)}%
            </div>
          </>
        ) : (
          <div className="w-12 h-4 bg-border/50 animate-pulse rounded" />
        )}
      </div>
    </button>
  );
}

function ExplanationPanel({ explanation, onClose }: { explanation: CandleExplanation; onClose: () => void }) {
  const sentimentColor = explanation.sentiment === 'bullish' ? '#00ff88' : explanation.sentiment === 'bearish' ? '#ff3366' : '#00d4ff';

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="absolute right-0 top-0 bottom-0 w-80 z-30 flex flex-col"
      style={{ background: 'hsl(225,43%,6%)', borderLeft: '1px solid hsl(225,43%,15%)' }}
    >
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="font-orbitron text-xs text-primary uppercase tracking-widest">AI Analysis</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Pattern */}
        <div>
          <p className="text-[10px] font-orbitron text-muted-foreground uppercase tracking-widest mb-2">Pattern Detected</p>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 rounded-md text-xs font-orbitron font-bold" style={{ background: `${sentimentColor}15`, border: `1px solid ${sentimentColor}40`, color: sentimentColor }}>
              {explanation.pattern}
            </div>
            <span className="text-xs font-orbitron capitalize" style={{ color: sentimentColor }}>{explanation.sentiment}</span>
          </div>
        </div>

        {/* Market Psychology */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-3 h-3 text-primary" />
            <p className="text-[10px] font-orbitron text-muted-foreground uppercase tracking-widest">Market Psychology</p>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">{explanation.marketPsychology}</p>
        </div>

        {/* Beginner Explanation */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-3 h-3 text-accent" />
            <p className="text-[10px] font-orbitron text-accent uppercase tracking-widest">What This Means For You</p>
          </div>
          <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
            <p className="text-sm text-foreground/90 leading-relaxed">{explanation.beginnerExplanation}</p>
          </div>
        </div>

        {/* What to Watch */}
        {explanation.whatToWatch && (
          <div>
            <p className="text-[10px] font-orbitron text-muted-foreground uppercase tracking-widest mb-2">Watch For</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{explanation.whatToWatch}</p>
          </div>
        )}

        {/* Strength */}
        {explanation.patternStrength !== undefined && (
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-[10px] font-orbitron text-muted-foreground uppercase tracking-widest">Signal Strength</p>
              <span className="text-xs font-orbitron font-bold" style={{ color: sentimentColor }}>{explanation.patternStrength}/10</span>
            </div>
            <div className="h-1.5 bg-border/50 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(explanation.patternStrength / 10) * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full rounded-full" style={{ background: sentimentColor }} />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function MarketWatch() {
  const [activeSymbol, setActiveSymbol] = useState<string>('^NSEI');
  const [symbolInput, setSymbolInput] = useState('');
  const [explanation, setExplanation] = useState<CandleExplanation | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  const { data: watchlist, isLoading: loadingWatchlist } = useGetWatchlist();
  const { data: candleData, isLoading: loadingCandles } = useGetMarketCandles(
    activeSymbol,
    { interval: '1d', range: '3mo' },
    { query: { enabled: !!activeSymbol } }
  );
  const { data: quote } = useGetMarketQuote(activeSymbol, { query: { enabled: !!activeSymbol } });
  const explainCandle = useExplainCandle();

  const watchlistSymbols = watchlist?.map(w => w.symbol) ?? DEFAULT_SYMBOLS;

  const handleScan = () => {
    const sym = symbolInput.trim().toUpperCase();
    if (sym) {
      setActiveSymbol(sym);
      setSymbolInput('');
      setExplanation(null);
    }
  };

  const handleCandleClick = (candle: Candle) => {
    setLoadingExplanation(true);
    setExplanation(null);
    explainCandle.mutate(
      { data: { open: candle.open, high: candle.high, low: candle.low, close: candle.close, volume: candle.volume } },
      {
        onSuccess: (res) => {
          setExplanation(res);
          setLoadingExplanation(false);
        },
        onError: () => setLoadingExplanation(false),
      }
    );
  };

  const isUp = (quote?.changePercent ?? 0) >= 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-orbitron font-bold text-foreground flex items-center gap-3">
            <TrendingUp className="text-primary w-8 h-8" />
            Market Watch
          </h1>
          <p className="text-muted-foreground mt-2 font-light">Live candlestick data with AI-powered beginner explanations.</p>
        </div>
        {/* Symbol scanner */}
        <div className="flex gap-2">
          <Input
            value={symbolInput}
            onChange={e => setSymbolInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleScan()}
            placeholder="e.g. AAPL, ^NSEI, RELIANCE.NS"
            className="w-56 bg-card/50 border-primary/20 focus-visible:ring-primary/50 font-mono text-sm h-10"
          />
          <Button onClick={handleScan} className="scanning-button h-10 px-4 font-orbitron text-xs tracking-widest border border-primary/40 text-primary hover:bg-primary hover:text-black" style={{ background: 'rgba(0,212,255,0.08)' }}>
            <Search className="w-4 h-4 mr-2" /> SCAN
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Watchlist sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-card/40 border-border h-full">
            <CardHeader className="pb-3">
              <CardTitle className="font-orbitron text-sm text-muted-foreground uppercase tracking-widest">Watchlist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingWatchlist ? (
                Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
              ) : (
                watchlistSymbols.map(sym => (
                  <WatchlistRow
                    key={sym}
                    symbol={sym}
                    onClick={() => { setActiveSymbol(sym); setExplanation(null); }}
                    isActive={activeSymbol === sym}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main chart area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Quote bar */}
          {quote && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-6 p-4 rounded-xl border border-border/50 bg-card/40">
              <div>
                <p className="font-orbitron font-black text-2xl text-foreground">{quote.shortName || activeSymbol}</p>
                <p className="text-xs font-mono text-muted-foreground">{activeSymbol}</p>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-orbitron font-bold text-3xl text-foreground">{quote.price.toFixed(2)}</span>
                <div className={`flex items-center gap-1 ${isUp ? 'text-accent' : 'text-destructive'}`}>
                  {isUp ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  <span className="font-mono font-bold text-lg">{isUp ? '+' : ''}{(quote.changePercent ?? 0).toFixed(2)}%</span>
                </div>
              </div>
              <div className="ml-auto flex gap-4 text-xs">
                {[
                  { label: 'Day High', val: quote.dayHigh?.toFixed(2) ?? '—', color: 'text-accent' },
                  { label: 'Day Low', val: quote.dayLow?.toFixed(2) ?? '—', color: 'text-destructive' },
                  { label: 'Volume', val: quote.volume ? `${(quote.volume / 1e6).toFixed(1)}M` : '—', color: 'text-chart-3' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="text-center">
                    <p className="text-muted-foreground font-orbitron text-[9px] uppercase tracking-widest mb-1">{label}</p>
                    <p className={`font-mono font-bold ${color}`}>{val}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Chart card */}
          <Card className="bg-card/40 border-border relative overflow-hidden">
            <CardHeader className="pb-2 border-b border-border/30">
              <div className="flex items-center justify-between">
                <CardTitle className="font-orbitron text-sm text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(0,212,255,0.8)] animate-pulse" />
                  Candlestick — 3 Months · 1D
                </CardTitle>
                <div className="text-[10px] font-orbitron text-muted-foreground">Click any candle for AI explanation</div>
              </div>
            </CardHeader>
            <CardContent className="p-3 relative">
              {loadingCandles ? (
                <div className="h-[380px] flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="relative mx-auto w-12 h-12">
                      <Loader2 className="w-12 h-12 text-primary animate-spin" />
                      <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl animate-pulse" />
                    </div>
                    <p className="font-orbitron text-xs text-primary tracking-widest animate-pulse">SCANNING MARKET DATA...</p>
                    {/* Fake scanning lines */}
                    <div className="w-48 space-y-2">
                      {[100, 75, 90, 60, 85].map((w, i) => (
                        <div key={i} className="h-0.5 bg-primary/20 rounded" style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : candleData?.candles?.length ? (
                <div className="relative">
                  <CandleChart candles={candleData.candles} onCandleClick={handleCandleClick} height={380} />
                  {/* AI explanation panel */}
                  <AnimatePresence>
                    {(loadingExplanation || explanation) && (
                      explanation ? (
                        <ExplanationPanel explanation={explanation} onClose={() => setExplanation(null)} />
                      ) : (
                        <motion.div
                          initial={{ x: '100%', opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: '100%', opacity: 0 }}
                          className="absolute right-0 top-0 bottom-0 w-72 z-30 flex items-center justify-center"
                          style={{ background: 'hsl(225,43%,6%)', borderLeft: '1px solid hsl(225,43%,15%)' }}
                        >
                          <div className="text-center space-y-3">
                            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                            <p className="font-orbitron text-xs text-primary tracking-widest">AI ANALYZING...</p>
                          </div>
                        </motion.div>
                      )
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="h-[380px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="font-orbitron text-sm">No chart data available</p>
                    <p className="text-xs text-muted-foreground mt-1">Try a different symbol or range</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Learning tip */}
          <div className="p-4 rounded-xl border border-primary/15 bg-primary/3 flex items-start gap-3">
            <BookOpen className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-orbitron text-primary uppercase tracking-widest mb-1">How to read this chart</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Each bar is one day of trading. <span className="text-accent">Green bars</span> = price went up (buyers won). <span className="text-destructive">Red bars</span> = price went down (sellers won). The thin lines above/below show the day's highest and lowest prices. Click any bar for a detailed AI explanation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
