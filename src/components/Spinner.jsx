import React from "react";

export default function Spinner() {
  return <span className="spinner"></span>;
}

export function Loading() {
  return (
    <div className="empty-state">
      <Spinner />
    </div>
  );
}
