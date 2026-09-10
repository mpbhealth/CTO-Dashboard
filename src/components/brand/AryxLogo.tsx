import { BRAND } from '../../lib/brand';

type AryxLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  wordmark?: boolean;
  tone?: 'auto' | 'onDark';
  className?: string;
};

const SIZES = {
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

export function AryxLogo({ size = 'md', wordmark = false, tone = 'auto', className = '' }: AryxLogoProps) {
  const titleClass = tone === 'onDark' ? 'text-[#F4F1EA]' : 'text-aryx-ink';
  const subtitleClass = tone === 'onDark' ? 'text-white/45' : 'text-aryx-faint';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/brand/aryx-mark.png"
        alt="ARYX"
        className={`${SIZES[size]} rounded-xl bg-[#0B0B0D] object-cover ring-1 ring-white/10`}
      />
      {wordmark && (
        <div className="min-w-0 text-left">
          <p className={`font-display text-sm font-semibold tracking-[0.28em] ${titleClass}`}>ARYX</p>
          <p className={`text-[10px] uppercase tracking-[0.2em] ${subtitleClass}`}>{BRAND.short}</p>
        </div>
      )}
    </div>
  );
}
