import { useEffect, useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { compactNumber } from '@/lib/cos';
import {
  buildTideSeries,
  projectTideMembers,
  type TideMemberBand,
  type TideMonth,
  type TidePoint,
} from '@/lib/movementTide';

const VIEW_W = 1000;
const VIEW_H = 420;
const PAD = { l: 56, r: 28, t: 28, b: 44 };

function monthLabel(ym: string): string {
  const [year, month] = ym.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  });
}

function curve(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const point = points[0];
    return `M ${point.x - 18} ${point.y} Q ${point.x} ${point.y} ${point.x + 18} ${point.y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function area(line: string, firstX: number, lastX: number, midY: number): string {
  return `${line} L ${lastX} ${midY} L ${firstX} ${midY} Z`;
}

function bandPath(high: Array<{ x: number; y: number }>, low: Array<{ x: number; y: number }>): string {
  if (high.length === 0 || low.length === 0) return '';
  return `${curve(high)} L ${low[low.length - 1].x} ${low[low.length - 1].y} ${curve([...low].reverse()).replace(/^M/, 'L')} Z`;
}

function useCount(target: number, ready: boolean): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!ready) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setValue(target);
      return undefined;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1100);
      const eased = 1 - (1 - t) ** 3;
      setValue(target * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ready, target]);
  return value;
}

function geometry(series: TidePoint[]) {
  const midY = 200;
  const plotW = VIEW_W - PAD.l - PAD.r;
  const amp = 152;
  const max = Math.max(
    1,
    ...series.flatMap((row) => [
      row.gained,
      row.lost,
      row.gainedHi ?? 0,
      row.lostHi ?? 0,
      Math.abs(row.gained - row.lost),
    ]),
  );
  const xAt = (i: number) => PAD.l + (series.length === 1 ? plotW / 2 : (i / (series.length - 1)) * plotW);
  const yGain = (v: number) => midY - (v / max) * amp;
  const yLost = (v: number) => midY + (v / max) * amp;
  const yNet = (row: TidePoint) => midY - ((row.gained - row.lost) / max) * amp;
  const lastLive = Math.max(0, series.findLastIndex((row) => !row.projected));
  return { midY, max, xAt, yGain, yLost, yNet, lastLive };
}

export function MovementTide({
  history,
  membersNow,
  membersProjection,
  href,
  headline,
}: {
  history: TideMonth[];
  membersNow?: number | null;
  membersProjection?: TideMemberBand | null;
  href?: string;
  headline?: { gained: number; lost: number; caption?: string };
}) {
  const reactId = useId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const series = useMemo(() => buildTideSeries(history), [history]);
  const live = useMemo(() => series.filter((row) => !row.projected), [series]);
  const projected = useMemo(() => series.filter((row) => row.projected), [series]);
  const geo = useMemo(() => geometry(series), [series]);

  const gained = headline?.gained ?? live.reduce((sum, row) => sum + row.gained, 0);
  const lost = headline?.lost ?? live.reduce((sum, row) => sum + row.lost, 0);
  const net = gained - lost;
  const caption = headline?.caption ?? 'Book so far';
  const flow = {
    gained: projected.reduce((sum, row) => sum + row.gained, 0),
    lost: projected.reduce((sum, row) => sum + row.lost, 0),
  };
  const book = membersProjection
    || (membersNow != null ? projectTideMembers(membersNow, projected) : null);

  const gainedN = useCount(gained, ready);
  const lostN = useCount(lost, ready);
  const netN = useCount(net, ready);

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (series.length === 0) return null;

  const { midY, xAt, yGain, yLost, yNet, lastLive } = geo;
  const nowX = xAt(lastLive);
  const gainPts = series.map((row, i) => ({ x: xAt(i), y: yGain(row.gained) }));
  const lostPts = series.map((row, i) => ({ x: xAt(i), y: yLost(row.lost) }));
  const netPts = series.map((row, i) => ({ x: xAt(i), y: yNet(row) }));
  const liveGain = gainPts.slice(0, lastLive + 1);
  const liveLost = lostPts.slice(0, lastLive + 1);
  const liveNet = netPts.slice(0, lastLive + 1);
  const projGain = gainPts.slice(lastLive);
  const projLost = lostPts.slice(lastLive);
  const projNet = netPts.slice(lastLive);
  const gainHi = projected.map((row, i) => ({ x: xAt(lastLive + i), y: yGain(row.gainedHi ?? row.gained) }));
  const gainLo = projected.map((row, i) => ({ x: xAt(lastLive + i), y: yGain(row.gainedLo ?? row.gained) }));
  const lostHi = projected.map((row, i) => ({ x: xAt(lastLive + i), y: yLost(row.lostHi ?? row.lost) }));
  const lostLo = projected.map((row, i) => ({ x: xAt(lastLive + i), y: yLost(row.lostLo ?? row.lost) }));
  // Re-include the last live point so the cone grows out of now.
  if (live.length > 0) {
    gainHi.unshift({ x: nowX, y: yGain(live[live.length - 1].gained) });
    gainLo.unshift({ x: nowX, y: yGain(live[live.length - 1].gained) });
    lostHi.unshift({ x: nowX, y: yLost(live[live.length - 1].lost) });
    lostLo.unshift({ x: nowX, y: yLost(live[live.length - 1].lost) });
  }

  const gainLine = curve(liveGain);
  const lostLine = curve(liveLost);
  const netLine = curve(liveNet);
  const active = hover == null ? null : series[hover];
  const ticks = series.filter((_, i) => i === 0 || i === lastLive || i === series.length - 1 || i % 3 === 0);

  const label = `Gained ${compactNumber(gained)}, lost ${compactNumber(lost)}, net ${compactNumber(net)}. 90-day projection ${book ? compactNumber(book.base) : 'unlinked'} members.`;

  return (
    <section
      aria-label={label}
      className="rounded-[2rem] bg-aryx-ink/5 p-1.5 ring-1 ring-aryx-line"
    >
      <div className="overflow-hidden rounded-[calc(2rem-0.375rem)] bg-aryx-elevated">
        <div className="flex flex-col gap-6 px-6 pt-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-[10px] uppercase tracking-[0.2em] text-aryx-faint">Movement</h2>
              {href && (
                <Link to={href} className="text-[10px] uppercase tracking-[0.16em] text-aryx-accent">
                  Open
                </Link>
              )}
            </div>
            <p className="max-w-md text-sm text-aryx-muted">
              In above the line, out below it. The gold thread is net. The wash after now is the next 90 days.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 md:min-w-[22rem]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-aryx-faint">Gained · {caption}</p>
              <p className="mt-2 font-display text-3xl font-semibold text-aryx-accent md:text-4xl">
                +{compactNumber(gainedN)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-aryx-faint">Net · {caption}</p>
              <p className={`mt-2 font-display text-3xl font-semibold md:text-4xl ${net >= 0 ? 'text-aryx-ink' : 'text-aryx-muted'}`}>
                {net >= 0 ? '+' : '−'}{compactNumber(Math.abs(netN))}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-aryx-faint">Lost · {caption}</p>
              <p className="mt-2 font-display text-3xl font-semibold text-aryx-faint md:text-4xl">
                −{compactNumber(lostN)}
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-2 h-64 w-full md:h-80">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="h-full w-full"
            role="img"
            aria-hidden="true"
            onMouseLeave={() => setHover(null)}
            onMouseMove={(event) => {
              const box = event.currentTarget.getBoundingClientRect();
              const x = ((event.clientX - box.left) / box.width) * VIEW_W;
              let nearest = 0;
              let best = Infinity;
              series.forEach((_, i) => {
                const dist = Math.abs(xAt(i) - x);
                if (dist < best) {
                  best = dist;
                  nearest = i;
                }
              });
              setHover(nearest);
            }}
          >
            <defs>
              <linearGradient id={`${reactId}-gain`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="var(--aryx-accent)" stopOpacity="0.04" />
                <stop offset="100%" stopColor="var(--aryx-accent)" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id={`${reactId}-lost`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--aryx-ink)" stopOpacity="0.04" />
                <stop offset="100%" stopColor="var(--aryx-ink)" stopOpacity="0.28" />
              </linearGradient>
              <linearGradient id={`${reactId}-cone`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--aryx-gold)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--aryx-gold)" stopOpacity="0.05" />
              </linearGradient>
              <clipPath id={`${reactId}-live`}>
                <rect
                  x={PAD.l}
                  y="0"
                  width={Math.max(1, nowX - PAD.l + 8)}
                  height={VIEW_H}
                  className={reduceMotion ? undefined : 'origin-left animate-tide-reveal'}
                  style={{ transformBox: 'fill-box', transformOrigin: 'left center' }}
                />
              </clipPath>
            </defs>

            <text x="16" y="36" className="fill-aryx-faint" fontSize="11" letterSpacing="2">IN</text>
            <text x="16" y={VIEW_H - 28} className="fill-aryx-faint" fontSize="11" letterSpacing="2">OUT</text>

            <line
              x1={PAD.l}
              x2={VIEW_W - PAD.r}
              y1={midY}
              y2={midY}
              stroke="currentColor"
              strokeOpacity="0.16"
            />

            <rect
              x={nowX}
              y={PAD.t}
              width={VIEW_W - PAD.r - nowX}
              height={VIEW_H - PAD.t - PAD.b}
              fill={`url(#${reactId}-cone)`}
              opacity={ready ? 1 : 0}
              className={reduceMotion ? undefined : 'animate-tide-fade'}
            />

            <path d={bandPath(gainHi, gainLo)} fill="var(--aryx-accent)" fillOpacity="0.12" />
            <path d={bandPath(lostHi, lostLo)} fill="var(--aryx-ink)" fillOpacity="0.08" />

            <g clipPath={`url(#${reactId}-live)`}>
              <path d={area(gainLine, liveGain[0].x, liveGain[liveGain.length - 1].x, midY)} fill={`url(#${reactId}-gain)`} />
              <path d={area(lostLine, liveLost[0].x, liveLost[liveLost.length - 1].x, midY)} fill={`url(#${reactId}-lost)`} />
              <path d={gainLine} fill="none" stroke="var(--aryx-accent)" strokeWidth="2.5" />
              <path d={lostLine} fill="none" stroke="var(--aryx-ink)" strokeOpacity="0.45" strokeWidth="2.5" />
              <path d={netLine} fill="none" stroke="var(--aryx-gold)" strokeWidth="2.25" />
            </g>

            <path d={curve(projGain)} fill="none" stroke="var(--aryx-accent)" strokeDasharray="6 8" strokeOpacity="0.7" strokeWidth="2" />
            <path d={curve(projLost)} fill="none" stroke="var(--aryx-ink)" strokeDasharray="6 8" strokeOpacity="0.35" strokeWidth="2" />
            <path d={curve(projNet)} fill="none" stroke="var(--aryx-gold)" strokeDasharray="5 7" strokeOpacity="0.85" strokeWidth="2" />

            <line x1={nowX} x2={nowX} y1={PAD.t} y2={VIEW_H - PAD.b} stroke="var(--aryx-ink)" strokeOpacity="0.22" />
            <circle cx={nowX} cy={midY} r="5" fill="var(--aryx-ink)" />
            {!reduceMotion && (
              <circle cx={nowX} cy={midY} r="5" fill="var(--aryx-accent)" className="origin-center animate-tide-pulse" style={{ transformBox: 'fill-box' }} />
            )}

            {!reduceMotion && liveGain.filter((_, i) => i % 2 === 0).slice(0, 4).map((point, i) => (
              <circle
                key={`g-${i}`}
                cx={point.x}
                cy={point.y}
                r="3"
                fill="var(--aryx-accent)"
                className="animate-tide-bob"
                style={{ animationDelay: `${i * 0.35}s` }}
              />
            ))}
            {!reduceMotion && liveLost.filter((_, i) => i % 2 === 1).slice(0, 4).map((point, i) => (
              <circle
                key={`l-${i}`}
                cx={point.x}
                cy={point.y}
                r="3"
                fill="var(--aryx-ink)"
                fillOpacity="0.45"
                className="animate-tide-bob"
                style={{ animationDelay: `${0.2 + i * 0.4}s` }}
              />
            ))}

            {ticks.map((row) => {
              const i = series.indexOf(row);
              return (
                <text
                  key={row.month}
                  x={xAt(i)}
                  y={VIEW_H - 16}
                  textAnchor="middle"
                  className="fill-aryx-faint"
                  fontSize="11"
                >
                  {row.projected ? `→ ${monthLabel(row.month)}` : monthLabel(row.month)}
                </text>
              );
            })}

            <text x={nowX + 8} y={PAD.t + 14} className="fill-aryx-ink" fontSize="11" letterSpacing="1.4">NOW</text>
            <text x={VIEW_W - PAD.r} y={PAD.t + 14} textAnchor="end" className="fill-aryx-faint" fontSize="11" letterSpacing="1.4">+90D</text>

            {active && hover != null && (
              <g>
                <line x1={xAt(hover)} x2={xAt(hover)} y1={PAD.t} y2={VIEW_H - PAD.b} stroke="var(--aryx-accent)" strokeOpacity="0.45" />
                <rect
                  x={Math.min(VIEW_W - 196, Math.max(PAD.l, xAt(hover) - 86))}
                  y={36}
                  width="172"
                  height="58"
                  rx="14"
                  fill="var(--aryx-bg)"
                  stroke="var(--aryx-line)"
                />
                <text
                  x={Math.min(VIEW_W - 196, Math.max(PAD.l, xAt(hover) - 86)) + 86}
                  y={58}
                  textAnchor="middle"
                  className="fill-aryx-ink"
                  fontSize="12"
                >
                  {active.projected ? 'Projected ' : ''}{monthLabel(active.month)}
                </text>
                <text
                  x={Math.min(VIEW_W - 196, Math.max(PAD.l, xAt(hover) - 86)) + 86}
                  y={78}
                  textAnchor="middle"
                  className="fill-aryx-muted"
                  fontSize="12"
                >
                  +{compactNumber(active.gained)} in · −{compactNumber(active.lost)} out
                </text>
              </g>
            )}
          </svg>
        </div>

        <div className="grid gap-4 border-t border-aryx-line px-6 py-5 md:grid-cols-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-aryx-faint">Next 90 days in</p>
            <p className="mt-2 text-xl font-semibold text-aryx-accent">+{compactNumber(flow.gained)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-aryx-faint">Next 90 days out</p>
            <p className="mt-2 text-xl font-semibold">−{compactNumber(flow.lost)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-aryx-faint">
              {book ? '90-day book' : '90-day net flow'}
            </p>
            <p className="mt-2 text-xl font-semibold">
              {book
                ? `${compactNumber(book.base)} · ${compactNumber(book.pessimistic)}–${compactNumber(book.optimistic)}`
                : compactNumber(flow.gained - flow.lost)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
