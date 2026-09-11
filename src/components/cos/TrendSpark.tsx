import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function TrendSpark({
  data,
  xKey,
  series,
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: Array<{ key: string; color: string }>;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-aryx-muted">No daily facts yet.</p>;
  }

  return (
    <div className="h-52 w-full min-w-0 md:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey={xKey} hide />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: 'var(--aryx-bg-elevated)',
              border: 'none',
              borderRadius: 16,
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12)',
              fontSize: 12,
              color: 'var(--aryx-ink)',
            }}
          />
          {series.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              dot={false}
              strokeWidth={2}
              animationDuration={800}
              animationEasing="ease-out"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
