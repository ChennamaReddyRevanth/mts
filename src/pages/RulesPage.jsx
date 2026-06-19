import React, { useEffect, useState, useCallback } from "react";
import { RulesAPI, api } from "../api/api";
import { useToast } from "../context/ToastContext";
import { Loading } from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import Spinner from "../components/Spinner";

const HINTS = {
  KEYWORD:    "Word to look for in ticket title/description (lowercase)",
  DEPARTMENT: "Department value to match (e.g. hr, finance, it)",
  REGION:     "Location to match (e.g. pune, mumbai, hyderabad)",
  PRIORITY:   "Priority to match (p1, p2, p3)",
};

const TYPE_ICON = { KEYWORD: "🔤", DEPARTMENT: "🏢", REGION: "📍", PRIORITY: "⚡" };

export default function RulesPage() {
  const toast = useToast();

  const [allRules,     setAllRules]     = useState([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [filter,       setFilter]       = useState("ALL");

  // Add rule form
  const [ruleType,   setRuleType]   = useState("KEYWORD");
  const [matchVal,   setMatchVal]   = useState("");
  const [assignTeam, setAssignTeam] = useState("");
  const [adding,     setAdding]     = useState(false);

  // Test routing
  const [testTitle, setTestTitle]   = useState("");
  const [testPri,   setTestPri]     = useState("P2");
  const [testDept,  setTestDept]    = useState("");
  const [testLoc,   setTestLoc]     = useState("");
  const [testResult,setTestResult]  = useState(null);
  const [testErr,   setTestErr]     = useState("");
  const [testing,   setTesting]     = useState(false);

  const load = useCallback(async () => {
    setLoadingRules(true);
    try {
      const res = await RulesAPI.list();
      setAllRules(res.data?.rules || []);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoadingRules(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function addRule(e) {
    e.preventDefault();
    if (!matchVal.trim() || !assignTeam.trim()) { toast("Match value and team are required", "error"); return; }
    setAdding(true);
    try {
      await RulesAPI.add({ rule_type: ruleType, match_value: matchVal.trim().toLowerCase(), assign_team: assignTeam.trim().toUpperCase(), is_active: true });
      toast(`Rule added: ${matchVal} → ${assignTeam}`);
      setMatchVal("");
      setAssignTeam("");
      load();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setAdding(false);
    }
  }

  async function deleteRule(ruleType, matchValue) {
    if (!window.confirm(`Delete rule: ${ruleType} → ${matchValue}?`)) return;
    try {
      await api("DELETE", "/rules/delete", { rule_type: ruleType, match_value: matchValue }, true);
      toast("Rule deleted");
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  async function seedRules() {
    try {
      await RulesAPI.seed();
      toast("Default rules seeded successfully");
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  async function testRouting(e) {
    e.preventDefault();
    setTestResult(null);
    setTestErr("");
    setTesting(true);
    try {
      const res = await RulesAPI.test({
        title:      testTitle,
        priority:   testPri,
        department: testDept.toUpperCase(),
        location:   testLoc.toUpperCase(),
      });
      setTestResult(res.data);
    } catch (e) {
      setTestErr(e.message);
    } finally {
      setTesting(false);
    }
  }

  const displayed = filter === "ALL" ? allRules : allRules.filter((r) => r.rule_type === filter);

  return (
    <div className="page">
      <div className="page-header">
        <h1>⚙️ Routing Rules</h1>
        <p>Manage dynamic routing rules — changes take effect immediately, no code deployment needed</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 20, alignItems: "start" }}>

        {/* Left column */}
        <div>
          {/* Add Rule */}
          <div className="card">
            <div className="card-title">➕ Add New Rule</div>
            <form onSubmit={addRule} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label>Rule Type</label>
                <select value={ruleType} onChange={(e) => setRuleType(e.target.value)}>
                  <option value="KEYWORD">🔤 Keyword — matches words in title/description</option>
                  <option value="DEPARTMENT">🏢 Department — matches department field</option>
                  <option value="REGION">📍 Region — matches location field</option>
                  <option value="PRIORITY">⚡ Priority — matches priority level</option>
                </select>
              </div>
              <div className="form-group">
                <label>Match Value</label>
                <input type="text" value={matchVal} onChange={(e) => setMatchVal(e.target.value)} placeholder="e.g. vpn, wifi, zoom" />
                <span className="text-sm text-muted">{HINTS[ruleType]}</span>
              </div>
              <div className="form-group">
                <label>Assign Team</label>
                <input
                  type="text"
                  value={assignTeam}
                  onChange={(e) => setAssignTeam(e.target.value)}
                  placeholder="e.g. NETWORK_TEAM"
                  list="teamList"
                />
                <datalist id="teamList">
                  {["NETWORK_TEAM","HR_SUPPORT","FINANCE_TEAM","SECURITY_TEAM","DESKTOP_TEAM","IT_SUPPORT","CRITICAL_RESPONSE_TEAM","GENERAL_SUPPORT"].map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
              <button className="btn btn-primary" type="submit" disabled={adding}>
                {adding ? <><Spinner /> Adding...</> : "➕ Add Rule"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={seedRules}>🌱 Seed Default Rules</button>
            </form>
          </div>

          {/* Test Routing */}
          <div className="card">
            <div className="card-title">🧪 Test Routing</div>
            <p className="text-muted text-sm" style={{ marginBottom: 14 }}>Test where a ticket would route without creating it</p>
            <form onSubmit={testRouting} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="form-group">
                <label>Title</label>
                <input type="text" value={testTitle} onChange={(e) => setTestTitle(e.target.value)} placeholder="e.g. VPN not working" />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={testPri} onChange={(e) => setTestPri(e.target.value)}>
                  <option value="P1">P1</option>
                  <option value="P2">P2</option>
                  <option value="P3">P3</option>
                </select>
              </div>
              <div className="form-group">
                <label>Department</label>
                <input type="text" value={testDept} onChange={(e) => setTestDept(e.target.value)} placeholder="IT" />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" value={testLoc} onChange={(e) => setTestLoc(e.target.value)} placeholder="PUNE" />
              </div>
              <button className="btn btn-ghost" type="submit" disabled={testing}>
                {testing ? <><Spinner /> Testing...</> : "🧪 Test Routing"}
              </button>
            </form>

            {testResult && (
              <div style={{ background: "var(--bg3)", borderRadius: 8, padding: 14, borderLeft: "3px solid var(--green)", marginTop: 8 }}>
                <div style={{ fontSize: 13, marginBottom: 6 }}>✅ <strong>Would route to:</strong></div>
                <div style={{ color: "var(--green)", fontWeight: 700, fontSize: 15 }}>{testResult.assigned_team}</div>
                <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>Rule fired: {testResult.rule_used}</div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>Business hours: {testResult.is_business_hours ? "Yes" : "No (Night shift)"}</div>
              </div>
            )}
            {testErr && <div className="alert alert-error" style={{ marginTop: 8 }}>{testErr}</div>}
          </div>
        </div>

        {/* Rules Table */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <span className="card-title" style={{ marginBottom: 0 }}>
              All Rules <span className="text-muted text-sm">({allRules.length})</span>
            </span>
            <button className="btn btn-ghost btn-sm" onClick={load}>🔄 Refresh</button>
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {["ALL", "KEYWORD", "DEPARTMENT", "REGION", "PRIORITY"].map((f) => (
              <button
                key={f}
                className={filter === f ? "btn btn-sm btn-primary" : "btn btn-ghost btn-sm"}
                onClick={() => setFilter(f)}
              >
                {f === "ALL" ? "All" : `${TYPE_ICON[f]} ${f.charAt(0) + f.slice(1).toLowerCase()}`}
              </button>
            ))}
          </div>

          {loadingRules ? <Loading /> : displayed.length === 0 ? (
            <EmptyState icon="⚙️" title="No rules found" sub="Add rules or seed defaults" />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Type</th><th>Match Value</th><th>Assign Team</th><th>Active</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {displayed.map((r) => (
                    <tr key={`${r.rule_type}-${r.match_value}`}>
                      <td>{TYPE_ICON[r.rule_type]} <strong>{r.rule_type}</strong></td>
                      <td style={{ color: "var(--yellow)", fontFamily: "monospace" }}>{r.match_value}</td>
                      <td style={{ color: "var(--green)" }}>{r.assign_team.replace(/_/g, " ")}</td>
                      <td>{r.is_active ? "✅" : "❌"}</td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteRule(r.rule_type, r.match_value)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
