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
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey={xKey} hide />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: 'var(--aryx-elevated, #111)',
              border: '1px solid var(--aryx-line, #333)',
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          {series.map((line) => (
            <Line key={line.key} type="monotone" dataKey={line.key} stroke={line.color} dot={false} strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
