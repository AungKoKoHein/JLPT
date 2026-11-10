import React, { useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getIdTokenResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { onValue, ref, runTransaction, set, update } from "firebase/database";
import { auth, database, googleProvider, practiceProvisioningAuth } from "./firebase.js";

const explainAuthError = (error) => ({
  "auth/invalid-credential": "Username or password is incorrect.",
  "auth/user-not-found": "Username or password is incorrect.",
  "auth/wrong-password": "Username or password is incorrect.",
  "auth/email-already-in-use": "An account with this username already exists.",
  "auth/weak-password": "Use a password with at least 6 characters.",
  "auth/unauthorized-domain": "Add this website's domain in Firebase Authentication → Settings → Authorized domains.",
  "auth/operation-not-allowed": "Enable Email/Password sign-in in Firebase Authentication.",
  PERMISSION_DENIED: "Firebase denied this request. Deploy the updated database rules and check the user permissions.",
}[error?.code] || error?.message || "Authentication could not be completed.");

const SESSION_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;
const MAX_DEVICE_SESSIONS = 5;
const authEmailForUsername = (username) => `${username.trim().toLowerCase()}@users.akkh-jlpt.invalid`;

function PracticeUserManager() {
  const [users, setUsers] = useState({});
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => onValue(ref(database, "practiceUsers"), (snapshot) => setUsers(snapshot.val() || {}), (reason) => setError(explainAuthError(reason))), []);

  const sortedUsers = useMemo(() => Object.entries(users).map(([uid, user]) => ({ uid, ...user })).sort((a, b) => (a.username || a.email || "").localeCompare(b.username || b.email || "")), [users]);

  const addUser = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const cleanUsername = username.trim().toLowerCase();
    let createdUser = null;
    try {
      if (!/^[a-z0-9._-]{3,24}$/.test(cleanUsername)) throw new Error("Use 3–24 lowercase letters, numbers, dots, underscores, or hyphens for a username.");
      const existing = sortedUsers.find((user) => (user.username || "").toLowerCase() === cleanUsername);
      if (existing) {
        if (existing.active) throw new Error("This username already has viewing access.");
        await update(ref(database, `practiceUsers/${existing.uid}`), { active: true, restoredAt: Date.now(), changedBy: auth.currentUser?.uid || "" });
        setMessage(`Viewing access restored for ${cleanUsername}.`);
      } else {
        const credential = await createUserWithEmailAndPassword(practiceProvisioningAuth, authEmailForUsername(cleanUsername), password);
        createdUser = credential.user;
        if (displayName.trim()) await updateProfile(credential.user, { displayName: displayName.trim() });
        await set(ref(database, `practiceUsers/${credential.user.uid}`), {
          username: cleanUsername,
          displayName: displayName.trim(),
          active: true,
          createdAt: Date.now(),
          createdBy: auth.currentUser?.uid || "",
        });
        setMessage(`Viewer account created for ${cleanUsername}. Share the password with them securely; it is not saved in the user table.`);
      }
      setUsername("");
      setDisplayName("");
      setPassword("");
    } catch (reason) {
      if (createdUser) {
        try { await deleteUser(createdUser); } catch { /* Access remains denied if cleanup is blocked. */ }
      }
      setError(explainAuthError(reason));
    } finally {
      if (practiceProvisioningAuth.currentUser) {
        try { await signOut(practiceProvisioningAuth); } catch { /* The main editor session is independent. */ }
      }
      setBusy(false);
    }
  };

  const setActive = async (user, active) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await update(ref(database, `practiceUsers/${user.uid}`), { active, changedAt: Date.now(), changedBy: auth.currentUser?.uid || "" });
      setMessage(active ? `Viewing access restored for ${user.username}.` : `Viewing access removed for ${user.username}.`);
    } catch (reason) {
      setError(explainAuthError(reason));
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="practice-user-manager">
      <summary>Manage viewer accounts</summary>
      <div className="practice-user-manager-content">
        <h2>Viewer accounts</h2>
        <p>These username/password accounts can view the study site. They do not need real email addresses and cannot edit study content. Google sign-in remains the editor sign-in.</p>
        <form className="practice-user-form" onSubmit={addUser}>
          <label>Username<input type="text" autoComplete="off" minLength={3} maxLength={24} pattern="[a-zA-Z0-9._-]{3,24}" required value={username} onChange={(event) => setUsername(event.target.value)} /></label>
          <label>Name (optional)<input type="text" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
          <label>Password<input type="password" autoComplete="new-password" minLength={6} required={!sortedUsers.some((user) => (user.username || "").toLowerCase() === username.trim().toLowerCase() && !user.active)} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" /></label>
          <button type="submit" className="primary-button" disabled={busy}>{busy ? "Saving…" : "Add viewer"}</button>
        </form>
        {error && <p className="practice-access-error" role="alert">{error}</p>}
        {message && <p className="practice-access-message" role="status">{message}</p>}
        <div className="practice-user-table-wrap">
          <table className="practice-user-table">
            <thead><tr><th>Username</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{sortedUsers.map((user) => <tr key={user.uid}>
              <td data-label="Username">{user.username || user.email}<small>{user.displayName}</small></td>
              <td data-label="Status"><span className={`practice-user-status ${user.active ? "active" : "inactive"}`}>{user.active ? "Can view" : "Access removed"}</span></td>
              <td data-label="Actions"><div className="practice-user-actions">
                {user.active ? <button type="button" className="secondary-button" disabled={busy} onClick={() => setActive(user, false)}>Remove access</button> : <button type="button" className="secondary-button" disabled={busy} onClick={() => setActive(user, true)}>Restore access</button>}
              </div></td>
            </tr>)}</tbody>
          </table>
          {!sortedUsers.length && <p className="practice-user-empty">No viewer accounts yet.</p>}
        </div>
        <p className="practice-user-note">Removing access disables the account in this site but keeps its record, so you can restore it later. Passwords are not stored in the user table. The Google editor account is managed separately.</p>
      </div>
    </details>
  );
}

export default function StudyAccess({ children }) {
  const [user, setUser] = useState(null);
  const [claims, setClaims] = useState(null);
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sessionStatus, setSessionStatus] = useState("checking");
  const allowed = Boolean(claims?.profile?.active || claims?.editor || claims?.admin);
  const canManageUsers = Boolean(claims?.editor || claims?.admin);

  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    setUser(nextUser);
    setClaims(null);
    setChecking(Boolean(nextUser));
    setSessionStatus(nextUser ? "checking" : "ready");
  }, (reason) => { setError(explainAuthError(reason)); setChecking(false); }), []);

  useEffect(() => {
    if (!user) { setClaims(null); setChecking(false); return undefined; }
    setChecking(true);
    const state = { profile: undefined, editor: undefined, admin: undefined };
    const updateClaim = (key, value) => {
      state[key] = value;
      if (Object.values(state).every((entry) => entry !== undefined)) {
        setClaims({ ...state });
        setChecking(false);
      }
    };
    const stops = [
      onValue(ref(database, `practiceUsers/${user.uid}`), (snapshot) => updateClaim("profile", snapshot.val()), (reason) => { updateClaim("profile", null); setError(explainAuthError(reason)); }),
      onValue(ref(database, `editors/${user.uid}`), (snapshot) => updateClaim("editor", snapshot.val() === true), (reason) => { updateClaim("editor", false); setError(explainAuthError(reason)); }),
      onValue(ref(database, `practiceAdmins/${user.uid}`), (snapshot) => updateClaim("admin", snapshot.val() === true), (reason) => updateClaim("admin", false)),
    ];
    return () => stops.forEach((stop) => stop());
  }, [user]);

  useEffect(() => {
    if (!user || !allowed) return undefined;
    let stopped = false;
    let timeoutId;
    setSessionStatus("checking");
    const registerDevice = async () => {
      try {
        const token = await getIdTokenResult(user);
        const expiresAt = Number(token.claims.auth_time || 0) * 1000 + SESSION_MILLISECONDS;
        const remaining = expiresAt - Date.now();
        if (remaining <= 0) { await signOut(auth); return; }
        timeoutId = window.setTimeout(() => signOut(auth), remaining);
        const key = `study-session:${user.uid}`;
        let sessionId = window.localStorage.getItem(key);
        if (!sessionId) {
          sessionId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          window.localStorage.setItem(key, sessionId);
        }
        const sessionsRef = ref(database, `practiceSessions/${user.uid}`);
        const now = Date.now();
        const result = await runTransaction(sessionsRef, (sessions) => {
          const active = Object.fromEntries(Object.entries(sessions || {}).filter(([, value]) => value?.startedAt > now - SESSION_MILLISECONDS));
          if (!active[sessionId] && Object.keys(active).length >= MAX_DEVICE_SESSIONS) return;
          active[sessionId] = { startedAt: active[sessionId]?.startedAt || now, device: "browser" };
          return active;
        });
        if (!result.committed) throw new Error("This account already has five active devices. Sign out on another device and try again.");
        if (!stopped) setSessionStatus("ready");
      } catch (reason) {
        if (!stopped) {
          setError(reason.message || explainAuthError(reason));
          setSessionStatus("error");
        }
      }
    };
    registerDevice();
    return () => { stopped = true; window.clearTimeout(timeoutId); };
  }, [user, allowed]);

  const submitLogin = async (event) => {
    event.preventDefault();
    setBusy(true); setError("");
    try { await signInWithEmailAndPassword(auth, authEmailForUsername(username), password); setPassword(""); }
    catch (reason) { setError(explainAuthError(reason)); }
    finally { setBusy(false); }
  };
  const signInEditor = async () => {
    setBusy(true); setError("");
    try { await signInWithPopup(auth, googleProvider); }
    catch (reason) { setError(explainAuthError(reason)); }
    finally { setBusy(false); }
  };
  const logout = async () => {
    setBusy(true); setError("");
    try {
      const sessionId = window.localStorage.getItem(`study-session:${user?.uid}`);
      if (user && sessionId) await runTransaction(ref(database, `practiceSessions/${user.uid}`), (sessions) => {
        if (!sessions || !sessions[sessionId]) return sessions;
        const next = { ...sessions };
        delete next[sessionId];
        return next;
      });
      await signOut(auth);
    } catch (reason) { setError(explainAuthError(reason)); }
    finally { setBusy(false); }
  };

  if (checking) return <main className="study-access-screen"><section className="study-access-card"><p className="eyebrow">JLPT Study</p><h1>Checking access…</h1></section></main>;
  if (!user || !allowed || sessionStatus !== "ready") return (
    <main className="study-access-screen">
      <section className="study-access-card">
        <p className="eyebrow">JLPT Study</p>
        <h1>{user ? (sessionStatus === "error" ? "Device access unavailable" : checking ? "Checking account…" : "This account does not have access") : "Sign in to study"}</h1>
        {user ? <button type="button" className="primary-button" onClick={logout} disabled={busy}>Sign out</button> : <>
          <form className="study-access-form" onSubmit={submitLogin}>
            <label>Username<input type="text" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} /></label>
            <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            <button type="submit" className="primary-button" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          </form>
          <div className="study-access-divider"><span>Owner editing</span></div>
          <button type="button" className="secondary-button" onClick={signInEditor} disabled={busy}>Sign in with Google to edit</button>
        </>}
        {error && <p className="practice-access-error" role="alert">{error}</p>}
      </section>
    </main>
  );

  return <div className="study-access-root">
    <div className="study-access-bar"><span>Signed in as <strong>{claims?.profile?.username || claims?.profile?.email || user.email}</strong></span><div>{canManageUsers && <PracticeUserManager />}<button type="button" className="secondary-button" onClick={logout} disabled={busy}>Sign out</button></div></div>
    {children}
  </div>;
}
