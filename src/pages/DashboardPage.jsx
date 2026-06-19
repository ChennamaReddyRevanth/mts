import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthAPI, timeAgo } from "../api/api";
import { useToast } from "../context/ToastContext";
import { PriorityBadge, StatusBadge, SlaBadge } from "../components/Badges";
import { Loading } from "../components/Spinner";
import EmptyState from "../components/EmptyState";

export default function DashboardPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const toast    = useToast();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AuthAPI.dashboard();
      setData(res.data);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  if (loading || !data) return <div className="page"><Loading /></div>;

  const { stats, teams = [], breached = [], recent_tickets = [] } = data;
  const total = stats.total || 1;

  return (
    <div className="page">
      <div className="flex-between page-header">
        <div>
          <h1>📊 Dashboard</h1>
          <p>Real-time overview of all tickets and team performance</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>🔄 Refresh</button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="num">{stats.total}</div>
          <div className="lbl">Total Tickets</div>
        </div>
        <div className="stat-card" style={{ "--accent": "var(--yellow)" }}>
          <div className="num">{stats.open + stats.assigned + stats.in_progress}</div>
          <div className="lbl">Open / Assigned</div>
        </div>
        <div className="stat-card" style={{ "--accent": "var(--green)" }}>
          <div className="num">{stats.resolved}</div>
          <div className="lbl">Resolved</div>
        </div>
        <div className="stat-card" style={{ "--accent": "var(--red)" }}>
          <div className="num">{stats.sla_breached}</div>
          <div className="lbl">SLA Breached</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Priority Breakdown */}
        <div className="card">
          <div className="card-title">🎯 Priority Breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "P1 Critical", count: stats.p1_count, color: "var(--red)"    },
              { label: "P2 High",     count: stats.p2_count, color: "var(--yellow)" },
              { label: "P3 Normal",   count: stats.p3_count, color: "var(--green)"  },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex-between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 13 }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{r.count}</span>
                </div>
                <div style={{ background: "var(--border)", borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{ width: `${Math.round((r.count / total) * 100)}%`, height: "100%", background: r.color, borderRadius: 4, transition: "width 0.5s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Load */}
        <div className="card">
          <div className="card-title">👥 Team Load</div>
          {teams.filter((t) => t.current_load > 0).sort((a, b) => b.current_load - a.current_load).slice(0, 6).length === 0 ? (
            <EmptyState icon="👥" title="No active team loads" />
          ) : (
            teams.filter((t) => t.current_load > 0).sort((a, b) => b.current_load - a.current_load).slice(0, 6).map((t) => {
              const pct   = Math.min(Math.round((t.current_load / t.max_load) * 100), 100);
              const color = pct > 80 ? "var(--red)" : pct > 50 ? "var(--yellow)" : "var(--green)";
              return (
                <div key={t.team_id} style={{ marginBottom: 12 }}>
                  <div className="flex-between" style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 12 }}>{t.team_id.replace(/_/g, " ")}</span>
                    <span style={{ fontSize: 12 }}>{t.current_load}/{t.max_load}</span>
                  </div>
                  <div style={{ background: "var(--border)", borderRadius: 4, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Breached */}
      <div className="card">
        <div className="flex-between card-title">
          <span>🚨 SLA Breached / At Risk</span>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/all-tickets?filter=breached")}>View All</button>
        </div>
        <TicketTable tickets={breached} showSla={true} />
      </div>

      {/* Recent */}
      <div className="card">
        <div className="flex-between card-title">
          <span>🕐 Recent Tickets</span>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/all-tickets")}>View All</button>
        </div>
        <TicketTable tickets={recent_tickets} showSla={false} />
      </div>
    </div>
  );
}

function TicketTable({ tickets, showSla }) {
  const navigate = useNavigate();
  if (!tickets.length) {
    return <EmptyState icon={showSla ? "✅" : "📭"} title={showSla ? "No SLA issues!" : "No tickets found"} />;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ticket ID</th><th>Title</th><th>Priority</th><th>Status</th>
            <th>Team</th><th>{showSla ? "SLA" : "Created"}</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.ticket_id} onClick={() => navigate(`/ticket/${t.ticket_id}`)}>
              <td className="ticket-id">{t.ticket_id}</td>
              <td>{t.title}</td>
              <td><PriorityBadge p={t.priority} /></td>
              <td><StatusBadge s={t.status} /></td>
              <td style={{ color: "var(--muted)" }}>{t.assigned_team || "—"}</td>
              <td>{showSla ? <SlaBadge info={t.sla_info} /> : <span className="text-muted">{timeAgo(t.created_at)}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
