import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TicketAPI, fmtDate } from "../api/api";
import { useToast } from "../context/ToastContext";
import { PriorityBadge } from "../components/Badges";
import Spinner from "../components/Spinner";

// Client-side keyword → team preview map (mirrors backend rules)
const ROUTE_MAP = {
  vpn: "NETWORK_TEAM", wifi: "NETWORK_TEAM", network: "NETWORK_TEAM", internet: "NETWORK_TEAM", firewall: "NETWORK_TEAM",
  payroll: "FINANCE_TEAM", salary: "FINANCE_TEAM", invoice: "FINANCE_TEAM",
  laptop: "DESKTOP_TEAM", desktop: "DESKTOP_TEAM", printer: "DESKTOP_TEAM",
  password: "SECURITY_TEAM", access: "SECURITY_TEAM", breach: "SECURITY_TEAM",
  leave: "HR_SUPPORT", onboarding: "HR_SUPPORT", policy: "HR_SUPPORT",
};

function routePreview(title, priority, department) {
  if (priority === "P1") return { text: "⚡ P1 Critical → CRITICAL_RESPONSE_TEAM (Priority Rule)", color: "var(--red)" };
  const lower = title.toLowerCase();
  for (const [kw, team] of Object.entries(ROUTE_MAP)) {
    if (lower.includes(kw)) return { text: `🎯 Keyword "${kw}" detected → ${team}`, color: "var(--green)" };
  }
  if (department) return { text: `🏢 Department routing → ${department}_SUPPORT`, color: "var(--yellow)" };
  return { text: "Type your issue title to see where it will be routed...", color: "var(--muted)" };
}

const INITIAL = {
  title: "", description: "", priority: "P2",
  department: "IT", location: "PUNE", source: "PORTAL", email: "",
};

export default function SubmitTicketPage() {
  const [form,      setForm]      = useState(INITIAL);
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const toast    = useToast();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const preview = routePreview(form.title, form.priority, form.department);

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim())          { toast("Please enter a title", "error"); return; }
    if (form.title.trim().length < 5){ toast("Title must be at least 5 characters", "error"); return; }
    if (!form.email.trim())          { toast("Please enter your email", "error"); return; }
    if (!form.email.includes("@"))   { toast("Please enter a valid email", "error"); return; }

    setLoading(true);
    try {
      const res = await TicketAPI.create({
        title:       form.title.trim(),
        description: form.description.trim(),
        priority:    form.priority,
        department:  form.department,
        location:    form.location,
        source:      form.source,
        created_by:  form.email.trim(),
      });
      setSubmitted(res.data);
      window.scrollTo(0, 0);
    } catch (e2) {
      toast(e2.message, "error");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setForm(INITIAL);
    setSubmitted(null);
  }

  if (submitted) {
    return (
      <div className="page-md">
        <div className="card" style={{ borderColor: "var(--green)" }}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 52 }}>✅</div>
            <h2 style={{ margin: "12px 0 8px", color: "var(--green)" }}>Ticket Submitted!</h2>
            <p className="text-muted">Your ticket has been created and routed automatically.</p>

            <div style={{ background: "var(--bg)", borderRadius: 10, padding: 20, margin: "20px 0", textAlign: "left" }}>
              {[
                { label: "Ticket ID",   value: <span className="ticket-id" style={{ fontSize: 16 }}>{submitted.ticket_id}</span> },
                { label: "Assigned To", value: <span style={{ color: "var(--primary)", fontWeight: 700 }}>{submitted.assigned_team}</span> },
                { label: "Routed By",   value: <span style={{ color: "var(--yellow)" }}>{submitted.rule_used} Rule</span> },
                { label: "Priority",    value: <PriorityBadge p={submitted.priority} /> },
                { label: "SLA Deadline",value: <span style={{ color: "var(--red)" }}>{fmtDate(submitted.sla_deadline)}</span> },
              ].map(({ label, value }) => (
                <div key={label} className="flex-between" style={{ marginBottom: 10 }}>
                  <span className="text-muted">{label}</span>
                  {value}
                </div>
              ))}
            </div>

            <p className="text-muted text-sm">A confirmation email has been sent to your email address.</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
              <button className="btn btn-primary" onClick={reset}>Submit Another Ticket</button>
              <button className="btn btn-ghost" onClick={() => navigate("/my-tickets")}>Track My Tickets</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-md">
      <div className="page-header" style={{ textAlign: "center" }}>
        <h1>🎫 Submit Support Ticket</h1>
        <p>Fill in the details below. Your ticket will be automatically routed to the right team.</p>
      </div>

      <div className="card">
        <div className="card-title">📝 New Support Ticket</div>
        <form onSubmit={submit}>
          <div className="form-grid">
            {/* Title */}
            <div className="form-group full">
              <label>Issue Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={set("title")}
                placeholder="e.g. VPN not working in Pune office"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="form-group full">
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={set("description")}
                placeholder="Describe the issue in detail — what happened, when it started, what you tried..."
              />
            </div>

            {/* Priority */}
            <div className="form-group">
              <label>Priority *</label>
              <select value={form.priority} onChange={set("priority")}>
                <option value="P1">🔴 P1 — Critical (SLA: 15 minutes)</option>
                <option value="P2">🟡 P2 — High (SLA: 1 hour)</option>
                <option value="P3">🟢 P3 — Normal (SLA: 4 hours)</option>
              </select>
            </div>

            {/* Department */}
            <div className="form-group">
              <label>Department</label>
              <select value={form.department} onChange={set("department")}>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="FINANCE">Finance</option>
                <option value="SECURITY">Security</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* Location */}
            <div className="form-group">
              <label>Location / Office</label>
              <select value={form.location} onChange={set("location")}>
                <option value="PUNE">Pune</option>
                <option value="MUMBAI">Mumbai</option>
                <option value="HYDERABAD">Hyderabad</option>
                <option value="DELHI">Delhi</option>
                <option value="BANGALORE">Bangalore</option>
              </select>
            </div>

            {/* Source */}
            <div className="form-group">
              <label>Source</label>
              <select value={form.source} onChange={set("source")}>
                <option value="PORTAL">Web Portal</option>
                <option value="EMAIL">Email</option>
                <option value="JIRA">Jira</option>
                <option value="SERVICENOW">ServiceNow</option>
              </select>
            </div>

            {/* Email */}
            <div className="form-group full">
              <label>Your Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="yourname@company.com"
              />
              <span className="text-sm text-muted">Confirmation + follow-up emails will be sent here</span>
            </div>
          </div>

          {/* Routing Preview */}
          <div style={{ marginTop: 16, background: "var(--bg)", borderRadius: 8, padding: 14, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>🔍 Routing Preview:</span>
              <span style={{ fontSize: 13, color: preview.color }}>{preview.text}</span>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
              {loading ? <><Spinner /> Submitting...</> : "🚀 Submit & Route Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
