import { useMemo } from "react";
import { motion } from "framer-motion";

interface HeartbeatECGProps {
  panicScore: number;
  greedScore: number;
  width?: number;
  height?: number;
}

function buildECGPath(width: number, height: number): string {
  const mid = height / 2;
  const segW = width / 3;

  const buildSegment = (ox: number) => {
    const p = (pct: number) => ox + pct * segW;
    return [
      `M ${ox} ${mid}`,
      `L ${p(0.15)} ${mid}`,
      `Q ${p(0.2)} ${mid} ${p(0.22)} ${mid - height * 0.08}`,
      `Q ${p(0.24)} ${mid} ${p(0.25)} ${mid}`,
      `L ${p(0.35)} ${mid}`,
      `L ${p(0.38)} ${mid + height * 0.1}`,
      `L ${p(0.42)} ${mid - height * 0.45}`,
      `L ${p(0.46)} ${mid + height * 0.15}`,
      `L ${p(0.5)} ${mid}`,
      `Q ${p(0.55)} ${mid} ${p(0.58)} ${mid - height * 0.06}`,
      `Q ${p(0.62)} ${mid} ${p(0.65)} ${mid}`,
      `L ${p(1.0)} ${mid}`,
    ].join(" ");
  };

  return [buildSegment(0), buildSegment(segW), buildSegment(segW * 2)].join(" ");
}

export function HeartbeatECG({ panicScore, greedScore, width = 600, height = 80 }: HeartbeatECGProps) {
  const speed = useMemo(() => {
    const baseSpeed = 3;
    const panicBoost = (panicScore / 100) * 2.5;
    const greedBoost = (greedScore / 100) * 1;
    return Math.max(0.8, baseSpeed - panicBoost - greedBoost);
  }, [panicScore, greedScore]);

  const color = useMemo(() => {
    if (panicScore > 70) return '#ff3366';
    if (greedScore > 70) return '#ffaa00';
    return '#00d4ff';
  }, [panicScore, greedScore]);

  const glowColor = useMemo(() => {
    if (panicScore > 70) return 'rgba(255,51,102,0.6)';
    if (greedScore > 70) return 'rgba(255,170,0,0.6)';
    return 'rgba(0,212,255,0.6)';
  }, [panicScore, greedScore]);

  const bpm = useMemo(() => {
    const base = 72;
    return Math.round(base + (panicScore / 100) * 80 + (greedScore / 100) * 20);
  }, [panicScore, greedScore]);

  const svgWidth = width * 3;
  const path = useMemo(() => buildECGPath(svgWidth, height), [svgWidth, height]);

  return (
    <div className="relative overflow-hidden rounded-lg bg-black/40 border border-border/50" style={{ width, height: height + 40 }}>
      {/* Scan lines overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
        }}
      />

      {/* BPM label */}
      <div className="absolute top-2 left-3 z-20">
        <motion.span
          key={bpm}
          initial={{ opacity: 0.5, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="font-orbitron font-bold text-xl"
          style={{ color }}
        >
          {bpm}
        </motion.span>
        <span className="text-[10px] font-orbitron text-muted-foreground ml-1">BPM</span>
      </div>

      {/* ECG line container */}
      <div className="absolute inset-0 top-8 overflow-hidden">
        <motion.svg
          width={svgWidth}
          height={height}
          className="ecg-track"
          style={{ ['--ecg-speed' as string]: `${speed}s` }}
        >
          <defs>
            <filter id="ecg-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Glow path */}
          <path
            d={path}
            fill="none"
            stroke={glowColor}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.4}
          />
          {/* Main ECG path */}
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#ecg-glow)"
          />
        </motion.svg>
      </div>

      {/* Status label */}
      <div className="absolute bottom-2 right-3 z-20">
        <span className="text-[9px] font-orbitron tracking-widest uppercase" style={{ color, opacity: 0.7 }}>
          {panicScore > 70 ? 'CRITICAL STRESS' : greedScore > 70 ? 'HIGH GREED' : 'NOMINAL'}
        </span>
      </div>
    </div>
  );
}
