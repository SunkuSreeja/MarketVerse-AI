import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Candle } from "@workspace/api-client-react";

interface CandleChartProps {
  candles: Candle[];
  onCandleClick: (candle: Candle) => void;
  height?: number;
}

interface TooltipState {
  candle: Candle;
  x: number;
  y: number;
}

const PADDING = { top: 20, right: 60, bottom: 40, left: 10 };

export function CandleChart({ candles, onCandleClick, height = 380 }: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    ro.observe(containerRef.current);
    setWidth(containerRef.current.clientWidth);
    return () => ro.disconnect();
  }, []);

  if (!candles.length) return null;

  const chartW = width - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;

  const prices = candles.flatMap(c => [c.high, c.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;
  const pricePad = priceRange * 0.05;
  const minP = minPrice - pricePad;
  const maxP = maxPrice + pricePad;

  const totalCandles = candles.length;
  const candleSlotW = chartW / totalCandles;
  const candleBodyW = Math.max(2, Math.min(candleSlotW * 0.6, 20));
  const wickW = 1.5;

  const toY = (price: number) =>
    PADDING.top + chartH - ((price - minP) / (maxP - minP)) * chartH;

  const toCandleX = (i: number) =>
    PADDING.left + i * candleSlotW + candleSlotW / 2;

  // Price axis labels
  const priceSteps = 5;
  const priceLabelStep = (maxP - minP) / priceSteps;
  const priceLabels = Array.from({ length: priceSteps + 1 }, (_, i) => minP + i * priceLabelStep);

  // Time axis labels (show ~6)
  const timeLabelCount = Math.min(6, totalCandles);
  const timeStep = Math.floor(totalCandles / timeLabelCount);
  const timeLabels = Array.from({ length: timeLabelCount }, (_, i) => {
    const idx = Math.min(i * timeStep, totalCandles - 1);
    return { idx, label: candles[idx].time.slice(5) }; // MM-DD
  });

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left - PADDING.left;
    const idx = Math.floor(mx / candleSlotW);
    if (idx >= 0 && idx < totalCandles) {
      setHoveredIdx(idx);
      const cx = toCandleX(idx);
      setTooltip({
        candle: candles[idx],
        x: cx,
        y: toY((candles[idx].high + candles[idx].low) / 2),
      });
    }
  }, [candles, candleSlotW, totalCandles]);

  const handleMouseLeave = useCallback(() => {
    setHoveredIdx(null);
    setTooltip(null);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left - PADDING.left;
    const idx = Math.floor(mx / candleSlotW);
    if (idx >= 0 && idx < totalCandles) {
      onCandleClick(candles[idx]);
    }
  }, [candles, candleSlotW, totalCandles, onCandleClick]);

  return (
    <div ref={containerRef} className="relative w-full select-none" style={{ height }}>
      <svg
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="cursor-crosshair"
      >
        <defs>
          <filter id="green-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="red-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(225,43%,7%)" stopOpacity="0" />
            <stop offset="100%" stopColor="hsl(225,43%,5%)" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect x={PADDING.left} y={PADDING.top} width={chartW} height={chartH} fill="url(#bg-grad)" />

        {/* Horizontal grid lines */}
        {priceLabels.map((price, i) => {
          const y = toY(price);
          return (
            <g key={i}>
              <line
                x1={PADDING.left}
                x2={PADDING.left + chartW}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={1}
              />
              <text
                x={PADDING.left + chartW + 6}
                y={y + 4}
                fill="rgba(148,163,184,0.7)"
                fontSize={9}
                fontFamily="monospace"
              >
                {price >= 1000 ? `${(price / 1000).toFixed(1)}k` : price.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Time axis labels */}
        {timeLabels.map(({ idx, label }) => {
          const x = toCandleX(idx);
          return (
            <text
              key={idx}
              x={x}
              y={PADDING.top + chartH + 20}
              fill="rgba(148,163,184,0.6)"
              fontSize={9}
              fontFamily="monospace"
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}

        {/* Candles */}
        {candles.map((c, i) => {
          const isBull = c.close >= c.open;
          const color = isBull ? 'rgba(0,255,136,0.85)' : 'rgba(255,51,102,0.85)';
          const dimColor = isBull ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,102,0.3)';
          const isHovered = hoveredIdx === i;
          const cx = toCandleX(i);

          const openY = toY(c.open);
          const closeY = toY(c.close);
          const highY = toY(c.high);
          const lowY = toY(c.low);

          const bodyTop = Math.min(openY, closeY);
          const bodyH = Math.max(1.5, Math.abs(closeY - openY));

          return (
            <g key={i} opacity={isHovered ? 1 : hoveredIdx !== null ? 0.5 : 1}>
              {/* Wick */}
              <line
                x1={cx}
                x2={cx}
                y1={highY}
                y2={lowY}
                stroke={isHovered ? color : dimColor}
                strokeWidth={wickW}
              />
              {/* Body */}
              <rect
                x={cx - candleBodyW / 2}
                y={bodyTop}
                width={candleBodyW}
                height={bodyH}
                fill={isHovered ? color : dimColor}
                stroke={color}
                strokeWidth={isHovered ? 1 : 0}
                rx={1}
                filter={isHovered ? (isBull ? 'url(#green-glow)' : 'url(#red-glow)') : undefined}
              />
            </g>
          );
        })}

        {/* Hover crosshair */}
        {hoveredIdx !== null && (
          <g>
            <line
              x1={toCandleX(hoveredIdx)}
              x2={toCandleX(hoveredIdx)}
              y1={PADDING.top}
              y2={PADDING.top + chartH}
              stroke="rgba(0,212,255,0.3)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
            <line
              x1={PADDING.left}
              x2={PADDING.left + chartW}
              y1={toY((candles[hoveredIdx].high + candles[hoveredIdx].low) / 2)}
              y2={toY((candles[hoveredIdx].high + candles[hoveredIdx].low) / 2)}
              stroke="rgba(0,212,255,0.2)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          </g>
        )}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && hoveredIdx !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.1 }}
            className="absolute pointer-events-none z-20"
            style={{
              left: Math.min(tooltip.x + 12, width - 180),
              top: Math.max(tooltip.y - 60, PADDING.top),
            }}
          >
            <div className="bg-card/95 border border-primary/30 rounded-lg p-3 text-xs font-mono shadow-[0_0_20px_rgba(0,212,255,0.15)] backdrop-blur-sm min-w-[160px]">
              <div className="text-primary font-orbitron text-[10px] mb-2">{tooltip.candle.time}</div>
              <div className="space-y-1">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">O</span>
                  <span>{tooltip.candle.open.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-accent">H</span>
                  <span>{tooltip.candle.high.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-destructive">L</span>
                  <span>{tooltip.candle.low.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">C</span>
                  <span className={tooltip.candle.close >= tooltip.candle.open ? 'text-accent' : 'text-destructive'}>
                    {tooltip.candle.close.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-border/50 pt-1 mt-1 flex justify-between gap-4">
                  <span className="text-muted-foreground">VOL</span>
                  <span className="text-chart-3">{(tooltip.candle.volume / 1000).toFixed(0)}K</span>
                </div>
              </div>
              <div className="mt-2 text-[9px] text-primary/60 uppercase tracking-widest text-center">
                Click for AI analysis
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
