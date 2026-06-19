import React from "react";

export default function EmptyState({ icon, title, sub }) {
  return (
    <div className="empty-state">
      <div className="icon">{icon}</div>
      <h3>{title}</h3>
      {sub && <p>{sub}</p>}
    </div>
  );
}
