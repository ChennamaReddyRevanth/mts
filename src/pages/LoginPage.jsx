import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { AuthAPI } from "../api/api";
import Spinner from "../components/Spinner";

export default function LoginPage() {
  const { login, isLoggedIn, isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [err,      setErr]      = useState("");
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (isLoggedIn) navigate(isAdmin ? "/dashboard" : "/my-tickets");
  }, [isLoggedIn, isAdmin, navigate]);

  async function doLogin(e) {
    e.preventDefault();
    setErr("");
    if (!email || !password) { setErr("Email and password required"); return; }
    setLoading(true);
    try {
      const res = await AuthAPI.login({ email, password });
      login(res.data);
      toast("Login successful! Redirecting...");
      setTimeout(() => {
        navigate(["ADMIN", "MANAGER"].includes(res.data.role) ? "/dashboard" : "/my-tickets");
      }, 500);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-sm">
      <div className="login-box">
        <div className="login-logo">
          <div className="icon">🎫</div>
          <h2>Enterprise Ticket Router</h2>
          <p>Sign in to access the dashboard</p>
        </div>

        {err && <div className="alert alert-error">{err}</div>}

        <form onSubmit={doLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your organization mail" autoFocus />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter the password" />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
            {loading ? <><Spinner /> Loading...</> : "Sign In"}
          </button>
        </form>

        <div className="divider"></div>

        <div style={{ textAlign: "center" }}>
          <p className="text-muted text-sm">Don't need login?</p>
          <button className="btn btn-ghost btn-sm mt-4" onClick={() => navigate("/submit-ticket")}>
            🎫 Submit a Ticket (Public)
          </button>
        </div>

        
        
      </div>
    </div>
  );
}
