import type { ReactorStatus } from '@/lib/reactors/types';
import { STATUS_COLORS } from './statusColors';

const STATUS_LABEL: Record<ReactorStatus, string> = {
  operating: 'Operating',
  suspended: 'Suspended / Offline',
  shutdown: 'Shutdown',
  under_construction: 'Under Construction',
  planned: 'Planned',
};

export default function StatusPill(props: { status: ReactorStatus; compact?: boolean }) {
  const c = STATUS_COLORS[props.status];
  const label = STATUS_LABEL[props.status];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 ${
        props.compact ? 'py-0.5 text-[11px]' : 'py-1 text-xs'
      }`}
      style={{
        borderColor: c.border,
        background: c.bg,
        color: '#0F172A',
      }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: c.dot }} />
      {label}
    </span>
  );
}

