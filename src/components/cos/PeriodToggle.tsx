import type { PeriodKey } from '@/lib/cos';

const OPTIONS: Array<{ id: PeriodKey; label: string }> = [
  { id: 'mtd', label: 'MTD' },
  { id: 'qtd', label: 'QTD' },
  { id: 'ytd', label: 'YTD' },
  { id: 'custom', label: 'Custom' },
];

export function PeriodToggle({
  value,
  onChange,
  customStart,
  customEnd,
  onCustom,
}: {
  value: PeriodKey;
  onChange: (next: PeriodKey) => void;
  customStart?: string;
  customEnd?: string;
  onCustom?: (start: string, end: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.16em] ${
            value === option.id ? 'bg-aryx-accent text-white' : 'border border-aryx-line text-aryx-muted'
          }`}
        >
          {option.label}
        </button>
      ))}
      {value === 'custom' && onCustom && (
        <div className="flex items-center gap-2 text-xs text-aryx-muted">
          <input
            type="date"
            value={customStart || ''}
            onChange={(event) => onCustom(event.target.value, customEnd || event.target.value)}
            className="rounded-full border border-aryx-line bg-aryx-elevated px-2 py-1"
          />
          <input
            type="date"
            value={customEnd || ''}
            onChange={(event) => onCustom(customStart || event.target.value, event.target.value)}
            className="rounded-full border border-aryx-line bg-aryx-elevated px-2 py-1"
          />
        </div>
      )}
    </div>
  );
}
