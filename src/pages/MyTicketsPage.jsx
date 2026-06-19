import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TicketAPI, timeAgo, fmtDate } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { PriorityBadge, StatusBadge, SlaBadge } from "../components/Badges";
import { Loading } from "../components/Spinner";
import EmptyState from "../components/EmptyState";

export default function MyTicketsPage() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [tickets,   setTickets]   = useState([]);
  const [loadingMy, setLoadingMy] = useState(true);
  const [trackId,   setTrackId]   = useState("");
  const [trackData, setTrackData] = useState(null);
  const [trackErr,  setTrackErr]  = useState("");
  const [trackLoading, setTrackLoading] = useState(false);

  const loadMy = useCallback(async () => {
    if (!isLoggedIn) { setLoadingMy(false); return; }
    setLoadingMy(true);
    try {
      const res = await TicketAPI.myTickets();
      setTickets(res.data?.tickets || []);
    } catch (e) {
      setTickets([]);
    } finally {
      setLoadingMy(false);
    }
  }, [isLoggedIn]);

  useEffect(() => { loadMy(); }, [loadMy]);

  async function trackById() {
    if (!trackId.trim()) return;
    setTrackErr("");
    setTrackData(null);
    setTrackLoading(true);
    try {
      const res = await TicketAPI.getById(trackId.trim().toUpperCase());
      setTrackData(res.data);
    } catch (e) {
      setTrackErr(`Ticket not found: ${trackId.toUpperCase()}`);
    } finally {
      setTrackLoading(false);
    }
  }

  return (
    <div className="page-md">
      <div className="page-header">
        <h1>📋 My Tickets</h1>
        <p>Track all tickets you have submitted</p>
      </div>

      {/* Track by ID */}
      <div className="card">
        <div className="card-title">🔎 Track by Ticket ID</div>
        <div style={{ display: "flex", gap: 12, alignItems: "end" }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Ticket ID</label>
            <input
              type="text"
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              placeholder="e.g. INC5082"
              onKeyDown={(e) => e.key === "Enter" && trackById()}
            />
          </div>
          <button className="btn btn-primary" onClick={trackById} disabled={trackLoading}>
            {trackLoading ? "Searching..." : "Track"}
          </button>
        </div>

        {trackErr && <div className="alert alert-error" style={{ marginTop: 12 }}>{trackErr}</div>}

        {trackData && (
          <div style={{ marginTop: 16, background: "var(--bg3)", borderRadius: 10, padding: 16, border: "1px solid var(--primary)" }}>
            <div className="flex-between" style={{ marginBottom: 10 }}>
              <span className="ticket-id">{trackData.ticket_id}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <PriorityBadge p={trackData.priority} />
                <StatusBadge   s={trackData.status}   />
              </div>
            </div>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>{trackData.title}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
              <div><span className="text-muted">Team: </span>{(trackData.assigned_team || "—").replace(/_/g, " ")}</div>
              <div><span className="text-muted">Rule: </span>{trackData.rule_used || "—"}</div>
              <div><span className="text-muted">SLA: </span><SlaBadge info={trackData.sla_info} /></div>
              <div><span className="text-muted">Created: </span>{timeAgo(trackData.created_at)}</div>
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-primary btn-sm" onClick={() => navigate(`/ticket/${trackData.ticket_id}`)}>
                View Full Details
              </button>
            </div>
          </div>
        )}
      </div>

      {/* My Tickets list */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <span className="card-title" style={{ marginBottom: 0 }}>Your Tickets</span>
          <button className="btn btn-primary btn-sm" onClick={() => navigate("/submit-ticket")}>➕ New Ticket</button>
        </div>

        {!isLoggedIn ? (
          <EmptyState icon="🔒" title="Login to see your tickets" sub="Or track by ID above" />
        ) : loadingMy ? (
          <Loading />
        ) : tickets.length === 0 ? (
          <EmptyState icon="📭" title="No tickets yet" sub="Submit your first ticket!" />
        ) : (
          tickets.map((t) => (
            <div
              key={t.ticket_id}
              onClick={() => navigate(`/ticket/${t.ticket_id}`)}
              style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 12, cursor: "pointer", transition: "border-color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div className="flex-between" style={{ marginBottom: 8 }}>
                <span className="ticket-id">{t.ticket_id}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <PriorityBadge p={t.priority} />
                  <StatusBadge   s={t.status}   />
                </div>
              </div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{t.title}</div>
              <div className="flex-between">
                <span className="text-sm text-muted">Team: {(t.assigned_team || "Unassigned").replace(/_/g, " ")}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <SlaBadge info={t.sla_info} />
                  <span className="text-sm text-muted">{timeAgo(t.created_at)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
