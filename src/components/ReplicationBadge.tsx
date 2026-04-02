const BADGE_CONFIG: Record<string, { label: string; icon: string; classes: string }> = {
  replicated: {
    label: "Replicated",
    icon: "✓",
    classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  disputed: {
    label: "Disputed",
    icon: "⚠",
    classes: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  retracted: {
    label: "Retracted",
    icon: "✗",
    classes: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  preprint: {
    label: "Preprint",
    icon: "📄",
    classes: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  },
  peer_reviewed: {
    label: "Peer Reviewed",
    icon: "✓",
    classes: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
};

interface ReplicationBadgeProps {
  status: string;
}

export function ReplicationBadge({ status }: ReplicationBadgeProps) {
  const config = BADGE_CONFIG[status];
  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}
