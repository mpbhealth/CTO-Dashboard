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
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      <div className="-mx-1 flex snap-x items-center gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`snap-start whitespace-nowrap rounded-full px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
              value === option.id
                ? 'bg-aryx-accent text-white'
                : 'bg-aryx-ink/[0.04] text-aryx-muted ring-1 ring-aryx-line'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {value === 'custom' && onCustom && (
        <div className="flex flex-col gap-2 text-xs text-aryx-muted sm:flex-row sm:items-center">
          <input
            type="date"
            value={customStart || ''}
            onChange={(event) => onCustom(event.target.value, customEnd || event.target.value)}
            className="min-h-11 rounded-full bg-aryx-elevated px-3 py-2 ring-1 ring-aryx-line"
          />
          <input
            type="date"
            value={customEnd || ''}
            onChange={(event) => onCustom(customStart || event.target.value, event.target.value)}
            className="min-h-11 rounded-full bg-aryx-elevated px-3 py-2 ring-1 ring-aryx-line"
          />
        </div>
      )}
    </div>
  );
}
