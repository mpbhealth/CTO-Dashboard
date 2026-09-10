import { useOrg } from '@/contexts/OrgContext';

export function OrgPicker() {
  const { orgId, memberships, switchOrg, rollup, setRollup } = useOrg();
  if (memberships.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-[10px] uppercase tracking-[0.18em] text-aryx-faint">
        Organization
        <select
          className="ml-2 rounded-full border border-aryx-line bg-aryx-elevated px-3 py-1 text-xs text-aryx-ink"
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
        <label className="text-[10px] uppercase tracking-[0.18em] text-aryx-faint">
          <input
            type="checkbox"
            className="mr-2"
            checked={rollup}
            onChange={(event) => setRollup(event.target.checked)}
          />
          Roll up my orgs
        </label>
      )}
    </div>
  );
}
