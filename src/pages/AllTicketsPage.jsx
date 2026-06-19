import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TicketAPI, timeAgo } from "../api/api";
import { useToast } from "../context/ToastContext";
import { PriorityBadge, StatusBadge, SlaBadge } from "../components/Badges";
import { Loading } from "../components/Spinner";
import EmptyState from "../components/EmptyState";

export default function AllTicketsPage() {
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [count,    setCount]    = useState(0);
  const [status,   setStatus]   = useState("");
  const [priority, setPriority] = useState("");
  const [dept,     setDept]     = useState("");
  const [slaFlt,   setSlaFlt]   = useState("");
  const toast    = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let list;
      if (slaFlt === "breached") {
        const res = await TicketAPI.breached();
        list = res.data?.tickets || [];
      } else {
        const filters = {};
        if (status)   filters.status     = status;
        if (priority) filters.priority   = priority;
        if (dept)     filters.department = dept;
        const res = await TicketAPI.list(Object.keys(filters).length ? filters : null);
        list = res.data?.tickets || [];
      }
      setTickets(list);
      setCount(list.length);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [status, priority, dept, slaFlt, toast]);

  useEffect(() => {
    if (searchParams.get("filter") === "breached") setSlaFlt("breached");
  }, [searchParams]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(ticketId, newStatus) {
    if (!newStatus) return;
    try {
      await TicketAPI.update({ ticket_id: ticketId, status: newStatus });
      toast(`Ticket ${ticketId} → ${newStatus}`);
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  return (
    <div className="page">
      <div className="flex-between page-header">
        <div>
          <h1>🎫 All Tickets</h1>
          <p>View and manage all support tickets</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate("/submit-ticket")}>➕ New Ticket</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr) auto", gap: 12, alignItems: "end" }}>
          <div className="form-group">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="ESCALATED">Escalated</option>
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="P1">P1 Critical</option>
              <option value="P2">P2 High</option>
              <option value="P3">P3 Normal</option>
            </select>
          </div>
          <div className="form-group">
            <label>Department</label>
            <select value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="">All Departments</option>
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="FINANCE">Finance</option>
              <option value="SECURITY">Security</option>
            </select>
          </div>
          <div className="form-group">
            <label>SLA Status</label>
            <select value={slaFlt} onChange={(e) => setSlaFlt(e.target.value)}>
              <option value="">All</option>
              <option value="breached">Breached Only</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={load}>🔍 Filter</button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <span className="card-title" style={{ marginBottom: 0 }}>
            Results <span className="text-muted text-sm">({count})</span>
          </span>
          <button className="btn btn-ghost btn-sm" onClick={load}>🔄 Refresh</button>
        </div>

        {loading ? <Loading /> : tickets.length === 0 ? (
          <EmptyState icon="📭" title="No tickets found" sub="Try changing the filters" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ticket ID</th><th>Title</th><th>Priority</th><th>Status</th>
                  <th>Team</th><th>Department</th><th>Created</th><th>SLA</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.ticket_id} onClick={() => navigate(`/ticket/${t.ticket_id}`)}>
                    <td className="ticket-id">{t.ticket_id}</td>
                    <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</td>
                    <td><PriorityBadge p={t.priority} /></td>
                    <td><StatusBadge s={t.status} /></td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{(t.assigned_team || "—").replace(/_/g, " ")}</td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{t.department || "—"}</td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{timeAgo(t.created_at)}</td>
                    <td><SlaBadge info={t.sla_info} /></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        defaultValue=""
                        onChange={(e) => updateStatus(t.ticket_id, e.target.value)}
                        style={{ fontSize: 11, padding: "4px 8px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 6, cursor: "pointer" }}
                      >
                        <option value="" disabled>Update</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="ESCALATED">Escalated</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
