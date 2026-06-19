import React from "react";

export function PriorityBadge({ p }) {
  return (
    <span className={`badge badge-${p}`}>
      <span className={`dot dot-${p}`}></span>
      {p}
    </span>
  );
}

export function StatusBadge({ s }) {
  return <span className={`badge badge-${s}`}>{s.replace(/_/g, " ")}</span>;
}

export function SlaBadge({ info }) {
  if (!info || !info.sla_status) return <span>—</span>;
  const m = info.minutes_remaining;
  const label =
    m != null
      ? m < 0
        ? ` · ${Math.abs(Math.round(m))}m overdue`
        : ` · ${Math.round(m)}m left`
      : "";
  return (
    <span className={`badge badge-${info.sla_status}`}>
      {info.sla_status}{label}
    </span>
  );
}
