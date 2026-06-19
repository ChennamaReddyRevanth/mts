import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TicketAPI, fmtDate } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { PriorityBadge, StatusBadge, SlaBadge } from "../components/Badges";
import { Loading } from "../components/Spinner";

export default function TicketDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const toast    = useToast();
  const { isLoggedIn } = useAuth();

  const [ticket,  setTicket]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await TicketAPI.getById(id);
      setTicket(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(newStatus) {
    try {
      await TicketAPI.update({ ticket_id: id, status: newStatus });
      toast(`Status updated to ${newStatus}`);
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  if (loading) return <div className="page-md"><Loading /></div>;

  if (error) return (
    <div className="page-md">
      <div className="empty-state"><div className="icon">❌</div><h3>{error}</h3></div>
    </div>
  );

  const t   = ticket;
  const sla = t.sla_info || {};
  const logs = [...(t.logs || [])].reverse();
  const slaColor = sla.sla_status === "BREACHED" ? "var(--red)" : sla.sla_status === "AT_RISK" ? "var(--yellow)" : "var(--green)";

  return (
    <div className="page-md">
      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("/all-tickets")}>← Back to All Tickets</button>
      </div>

      {/* Header */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <div>
            <span className="ticket-id" style={{ fontSize: 18 }}>{t.ticket_id}</span>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>{t.title}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
            <PriorityBadge p={t.priority} />
            <StatusBadge   s={t.status}   />
          </div>
        </div>

        {t.description && (
          <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{t.description}</p>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, background: "var(--bg)", borderRadius: 10, padding: 16 }}>
          {[
            { label: "Assigned Team", value: (t.assigned_team || "—").replace(/_/g, " "), style: { color: "var(--primary)" } },
            { label: "Routed By",     value: `${t.rule_used || "—"} Rule`,                style: { color: "var(--yellow)" } },
            { label: "Department",    value: t.department || "—",                          style: {} },
            { label: "Location",      value: t.location   || "—",                          style: {} },
            { label: "Source",        value: t.source     || "—",                          style: {} },
            { label: "Raised By",     value: t.created_by || "—",                          style: { fontSize: 12 } },
          ].map(({ label, value, style }) => (
            <div key={label}>
              <div className="text-sm text-muted">{label}</div>
              <div style={{ fontWeight: 700, marginTop: 4, ...style }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SLA */}
      <div className="card" style={{ borderColor: slaColor }}>
        <div className="card-title">⏱️ SLA Status</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          <div>
            <div className="text-sm text-muted">Status</div>
            <div style={{ marginTop: 6 }}><SlaBadge info={sla} /></div>
          </div>
          <div>
            <div className="text-sm text-muted">Deadline</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6, color: slaColor }}>{fmtDate(t.sla_deadline)}</div>
          </div>
          <div>
            <div className="text-sm text-muted">Time Remaining</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: slaColor, marginTop: 4 }}>
              {sla.minutes_remaining != null
                ? sla.minutes_remaining < 0
                  ? `${Math.abs(Math.round(sla.minutes_remaining))}m overdue`
                  : `${Math.round(sla.minutes_remaining)}m`
                : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Update Status (logged-in users) */}
      {isLoggedIn && (
        <div className="card">
          <div className="card-title">🔄 Update Status</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {["IN_PROGRESS", "RESOLVED", "ESCALATED"].map((s) => (
              <button
                key={s}
                className="btn btn-ghost btn-sm"
                style={t.status === s ? { borderColor: "var(--primary)", color: "var(--primary)" } : {}}
                onClick={() => updateStatus(s)}
              >
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Audit Log */}
      <div className="card">
        <div className="card-title">
          📋 Audit Log <span className="text-muted text-sm">({logs.length} events)</span>
        </div>
        {logs.length === 0 ? (
          <div className="empty-state"><div className="icon">📋</div><p>No log entries</p></div>
        ) : (
          <ul className="timeline">
            {logs.map((l, i) => (
              <li key={i} className="timeline-item">
                <div className="timeline-action">{l.action}</div>
                <div className="timeline-meta">By {l.performed_by} · {fmtDate(l.timestamp)}</div>
                {l.detail && <div className="timeline-detail">{l.detail}</div>}
                {l.old_value && l.new_value && (
                  <div className="timeline-detail">{l.old_value} → {l.new_value}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
