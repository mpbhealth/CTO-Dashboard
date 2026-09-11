import { useOrg } from '@/contexts/OrgContext';

export function OrgPicker() {
  const { orgId, memberships, switchOrg, rollup, setRollup } = useOrg();
  if (memberships.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex min-h-11 items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-aryx-faint">
        Organization
        <select
          className="min-h-11 min-w-0 max-w-full rounded-full bg-aryx-elevated px-4 py-2 text-xs text-aryx-ink ring-1 ring-aryx-line"
          value={orgId || ''}
          onChange={(event) => {
            if (event.target.value) void switchOrg(event.target.value);
          }}
        >
          {memberships.map((row) => (
            <option key={row.org_id} value={row.org_id}>
              {row.orgs?.name || row.org_id}
            </option>
          ))}
        </select>
      </label>
      {memberships.length > 1 && (
        <label className="flex min-h-11 items-center text-[10px] uppercase tracking-[0.18em] text-aryx-faint">
          <input
            type="checkbox"
            className="mr-2 h-4 w-4 accent-aryx-accent"
            checked={rollup}
            onChange={(event) => setRollup(event.target.checked)}
          />
          Roll up my orgs
        </label>
      )}
    </div>
  );
}
