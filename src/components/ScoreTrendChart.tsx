// Static inline-SVG line chart — no hover/tooltip layer (kept intentionally
// simple for a personal-scale dashboard). Colors are the dataviz skill's
// validated categorical palette, light-mode chrome only (this app doesn't
// yet support a dark theme).

type Series = { key: string; label: string; color: string; scores: number[] };

const CHROME = {
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  mutedText: "#898781",
  primaryText: "#0b0b0b",
};

const WIDTH = 600;
const HEIGHT = 220;
const PAD = { top: 16, right: 16, bottom: 24, left: 32 };

export default function ScoreTrendChart({
  data,
}: {
  data: { mode: string; label: string; scores: number[] }[];
}) {
  const palette = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"];
  const series: Series[] = data
    .filter((d) => d.scores.length > 0)
    .map((d, i) => ({ key: d.mode, label: d.label, color: palette[i % palette.length], scores: d.scores }));

  if (series.length === 0) {
    return (
      <p className="rounded-md border border-neutral-200 bg-white px-4 py-6 text-center text-sm text-neutral-500">
        No graded attempts yet — take a practice exam to start your trend.
      </p>
    );
  }

  const maxPoints = Math.max(...series.map((s) => s.scores.length));
  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;

  function x(i: number) {
    return maxPoints <= 1 ? PAD.left : PAD.left + (i / (maxPoints - 1)) * plotWidth;
  }
  function y(score: number) {
    return PAD.top + plotHeight - (score / 100) * plotHeight;
  }

  const gridLines = [0, 25, 50, 60, 75, 100];

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Score trend by skill">
        {gridLines.map((g) => (
          <g key={g}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(g)}
              y2={y(g)}
              stroke={g === 60 ? CHROME.axis : CHROME.grid}
              strokeWidth={1}
              strokeDasharray={g === 60 ? "4 3" : undefined}
            />
            <text x={PAD.left - 6} y={y(g)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill={CHROME.mutedText}>
              {g}
            </text>
          </g>
        ))}
        <text x={WIDTH - PAD.right} y={y(60) - 4} textAnchor="end" fontSize={9} fill={CHROME.mutedText}>
          60% pass threshold
        </text>

        {series.map((s) => {
          const points = s.scores.map((score, i) => `${x(i)},${y(score)}`).join(" ");
          const lastIndex = s.scores.length - 1;
          return (
            <g key={s.key}>
              <polyline points={points} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" />
              {s.scores.map((score, i) => (
                <circle key={i} cx={x(i)} cy={y(score)} r={3} fill={s.color} />
              ))}
              <text
                x={x(lastIndex) + 4}
                y={y(s.scores[lastIndex])}
                fontSize={10}
                fill={CHROME.primaryText}
                dominantBaseline="middle"
              >
                {Math.round(s.scores[lastIndex])}%
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap gap-4 text-xs text-neutral-600">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <p className="mt-1 text-xs text-neutral-400">
        Each line shows your most recent attempts for that skill, oldest to newest.
      </p>
    </div>
  );
}
