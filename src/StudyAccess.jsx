import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from 'react-dom';
import { StudyAccountContext, StudyAccountControls } from "./StudyAccount.jsx";
import ViewerTabPermissions from './ViewerTabPermissions.jsx';
import { canViewPath, canViewTab, effectiveTabAccess, permittedTabs, tabAccessSummary, validateTabAccess } from './viewerTabAccess.js';
import './viewerManagement.css';
import ThemeToggle from "./ThemeToggle.jsx";
import StudyLoading from './StudyLoading.jsx';
import "./studyLogin.css";
import ViewerAccountDialog from "./ViewerAccountDialog.jsx";
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
import { get, onValue, ref, runTransaction, set, update } from "firebase/database";
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
const DEVICE_SLOTS = ["0", "1", "2", "3", "4"];
const authEmailForUsername = (username) => `${username.trim().toLowerCase()}@users.akkh-jlpt.invalid`;

export function PracticeUserManager() {
  const [open,setOpen] = useState(false);
  const modal = useRef(null);
  const launcher = useRef(null);
  const [tabAccess,setTabAccess] = useState({mode:'all'});
  const [users, setUsers] = useState({});
  const [accountDialog, setAccountDialog] = useState(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(()=> {
    if(!open) return;
    const previous=launcher.current||document.activeElement;
    const overflow=document.body.style.overflow;
    const element=modal.current;
    element.showModal(); document.body.style.overflow='hidden';
    return ()=> { element.close();document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus(); };
  },[open]);
  const closeManager=()=> { if(!busy && !accountDialog) {setOpen(false);setPassword('');setError('');} };

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
        await update(ref(database, `practiceUsers/${existing.uid}`), { active: true, tabAccess:validateTabAccess(tabAccess), restoredAt: Date.now(), changedBy: auth.currentUser?.uid || "" });
        setMessage(`Viewing access restored for ${cleanUsername}.`);
      } else {
        const credential = await createUserWithEmailAndPassword(practiceProvisioningAuth, authEmailForUsername(cleanUsername), password);
        createdUser = credential.user;
        if (displayName.trim()) await updateProfile(credential.user, { displayName: displayName.trim() });
        await set(ref(database, `practiceUsers/${credential.user.uid}`), {
          username: cleanUsername,
          displayName: displayName.trim(),
          active: true,
          tabAccess:validateTabAccess(tabAccess),
          createdAt: Date.now(),
          createdBy: auth.currentUser?.uid || "",
        });
        setMessage(`Viewer account created for ${cleanUsername}. Share the password with them securely; it is not saved in the user table.`);
      }
      setUsername("");
      setDisplayName("");
      setPassword("");
      setTabAccess({mode:'all'});
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
    <><button ref={launcher} type="button" className="viewer-manager-launcher" aria-haspopup="dialog" onClick={()=>setOpen(true)}>Manage viewer accounts</button>
      {open && createPortal(<dialog ref={modal} className="viewer-manager-modal" aria-labelledby="viewer-manager-title" onCancel={event=>{event.preventDefault();closeManager();}}>
      <div className="viewer-manager-heading"><h2 id="viewer-manager-title">Viewer accounts</h2><button type="button" disabled={busy||Boolean(accountDialog)} onClick={closeManager} autoFocus>Close</button></div>
      <div className="practice-user-manager-content">
        <p>These username/password accounts can view the study site. They do not need real email addresses and cannot edit study content. Google sign-in remains the editor sign-in.</p>
        <form className="practice-user-form" onSubmit={addUser}>
          <label>Username<input type="text" autoComplete="off" minLength={3} maxLength={24} pattern="[a-zA-Z0-9._-]{3,24}" required value={username} onChange={(event) => setUsername(event.target.value)} /></label>
          <label>Name (optional)<input type="text" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
          <label>Password<input type="password" autoComplete="new-password" minLength={6} required={!sortedUsers.some((user) => (user.username || "").toLowerCase() === username.trim().toLowerCase() && !user.active)} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" /></label>
          <ViewerTabPermissions value={tabAccess} onChange={setTabAccess} disabled={busy} />
          <button type="submit" className="primary-button" disabled={busy}>{busy ? "Saving…" : "Add viewer"}</button>
        </form>
        {error && <p className="practice-access-error" role="alert">{error}</p>}
        {message && <p className="practice-access-message" role="status">{message}</p>}
        <div className="practice-user-table-wrap">
          <table className="practice-user-table">
            <thead><tr><th>Username</th><th>Status</th><th>Allowed tabs</th><th>Actions</th></tr></thead>
            <tbody>{sortedUsers.map((user) => <tr key={user.uid}>
              <td data-label="Username">{user.username || user.email}<small>{user.displayName}</small></td>
              <td data-label="Status"><span className={`practice-user-status ${user.active ? "active" : "inactive"}`}>{user.active ? "Can view" : "Access removed"}</span></td>
              <td data-label="Allowed tabs"><span className="viewer-access-summary">{tabAccessSummary(user.tabAccess)}</span></td>
              <td data-label="Actions"><div className="practice-user-actions">
                <button type="button" className="secondary-button" disabled={busy} onClick={()=>setAccountDialog({user,mode:'access'})}>Tab access</button>
                <button type="button" className="secondary-button" disabled={busy} onClick={() => setAccountDialog({ user, mode: "edit" })}>Edit</button>
                <button type="button" className="secondary-button" disabled={busy} onClick={() => setAccountDialog({ user, mode: "delete" })}>Delete permanently</button>
                {user.active ? <button type="button" className="secondary-button" disabled={busy} onClick={() => setActive(user, false)}>Remove access</button> : <button type="button" className="secondary-button" disabled={busy} onClick={() => setActive(user, true)}>Restore access</button>}
              </div></td>
            </tr>)}</tbody>
          </table>
          {!sortedUsers.length && <p className="practice-user-empty">No viewer accounts yet.</p>}
        </div>
        {accountDialog && <ViewerAccountDialog user={accountDialog.user} mode={accountDialog.mode} onClose={() => setAccountDialog(null)} onSaved={text => { setMessage(text); setError(""); setAccountDialog(null); }} />}
        <p className="practice-user-note">Removing access disables the account in this site but keeps its record, so you can restore it later. Passwords are not stored in the user table. The Google editor account is managed separately.</p>
      </div>
    </dialog>,document.body)}</>
  );
}

export default function StudyAccess({ children }) {
  const [pathname,setPathname] = useState(()=>location.pathname);
  useEffect(()=> {
    const navigate=()=>setPathname(location.pathname);
    window.addEventListener('popstate',navigate);window.addEventListener('study-navigation',navigate);
    return ()=>{window.removeEventListener('popstate',navigate);window.removeEventListener('study-navigation',navigate);};
  },[]);
  const [user, setUser] = useState(null);
  const [claims, setClaims] = useState(null);
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const loginScreenRef = useRef(null);
  const loginShellRef = useRef(null);
  const [sessionStatus, setSessionStatus] = useState("checking");
  const allowed = Boolean(claims?.profile?.active || claims?.editor || claims?.admin);
  const canManageUsers = Boolean(claims?.editor || claims?.admin);

  useLayoutEffect(() => {
    const screen = loginScreenRef.current;
    const shell = loginShellRef.current;
    if (!screen || !shell) return undefined;
    const fitLogin = () => {
      const padding = parseFloat(getComputedStyle(screen).paddingTop) || 0;
      const availableHeight = Math.max(1, screen.clientHeight - padding * 2);
      const scale = Math.min(1, availableHeight / shell.offsetHeight);
      shell.style.setProperty("--login-fit", String(scale));
    };
    const observer = new ResizeObserver(fitLogin);
    observer.observe(screen);
    observer.observe(shell);
    fitLogin();
    return () => observer.disconnect();
  }, [checking, user, allowed, sessionStatus]);

  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    setUser(nextUser);
    setClaims(null);
    setChecking(Boolean(nextUser));
    setSessionStatus(nextUser ? "checking" : "ready");
  }, (reason) => { setError(explainAuthError(reason)); setChecking(false); }), []);

  useEffect(() => {
    // Only the auth observer knows when persisted sign-in restoration is done.
    // The initial null user must not expose the login form while it is pending.
    if (!user) { setClaims(null); return undefined; }
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
        const slotsPath = `practiceSessions/${user.uid}/slots`;
        const slotsSnapshot = await get(ref(database, slotsPath));
        const slots = slotsSnapshot.val() || {};
        const now = Date.now();
        const currentSlot = Object.keys(slots).find((slot) => slots[slot]?.sessionId === sessionId);
        const candidates = currentSlot ? [currentSlot] : DEVICE_SLOTS.filter((slot) => !slots[slot] || slots[slot].startedAt <= now - SESSION_MILLISECONDS);
        let registered = false;
        for (const slot of candidates) {
          const slotRef = ref(database, `${slotsPath}/${slot}`);
          const result = await runTransaction(slotRef, (current) => {
            const active = current?.startedAt > now - SESSION_MILLISECONDS;
            if (active && current.sessionId !== sessionId) return;
            return { sessionId, startedAt: active ? current.startedAt : now, device: "browser" };
          });
          if (result.committed) { registered = true; break; }
        }
        if (!registered) throw new Error("This account already has five active devices. Sign out on another device and try again.");
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
      if (user && sessionId) {
        const slotsPath = `practiceSessions/${user.uid}/slots`;
        const snapshot = await get(ref(database, slotsPath));
        const slot = Object.keys(snapshot.val() || {}).find((key) => snapshot.val()[key]?.sessionId === sessionId);
        if (slot) await runTransaction(ref(database, `${slotsPath}/${slot}`), (current) => current?.sessionId === sessionId ? null : undefined);
      }
    } catch (reason) { setError(explainAuthError(reason)); }
    try { await signOut(auth); }
    catch (reason) { setError(explainAuthError(reason)); }
    finally { setBusy(false); }
  };

  if (checking || (user && allowed && sessionStatus === "checking")) return <StudyLoading />;
  if (!user || !allowed || sessionStatus !== "ready") return (
    <main className="study-access-screen study-login-screen" ref={loginScreenRef}>
      <section className="study-login-shell" ref={loginShellRef} aria-label="JLPT Study sign in">
        <aside className="study-login-story" lang="my">
          <a className="login-brand" href="/" aria-label="JLPT Study home"><span className="login-brand-mark" lang="ja">&#23398;</span><span>JLPT<span className="login-brand-light"> Study</span></span></a>
          <div className="login-story-copy"><p className="login-overline">နေ့စဉ် နည်းနည်းစီ လေ့ကျင့်ရင်း</p><h2>ဂျပန်စာခရီးကို<br />ဒီကနေ စလိုက်ပါ<span>။</span></h2><p>တစ်နေ့ နည်းနည်းစီ သင်ယူရင်း<br />ဂျပန်စာကို ယုံကြည်မှုရှိရှိ အသုံးချနိုင်ဖို့။</p></div>
          <div className="login-illustration" aria-hidden="true">
            <div className="login-sun" /><div className="login-orbit" />
            <div className="login-word-card login-word-back"><span>နေ့တိုင်း အတူလေ့လာမယ်</span><div className="login-card-lines"><i /><i /><i /></div></div>
            <div className="login-word-card login-word-front"><div className="login-card-top"><span>ဒီနေ့အတွက် စကားလုံး</span><span>01 / 12</span></div><strong lang="ja">&#23398;&#12406;</strong><span className="login-reading" lang="ja">&#12414;&#12394;&#12406;</span><div className="login-word-rule" /><b>သင်ယူသည်</b><p>စကားလုံးအသစ်၊ အစပြုခြင်းအသစ်။</p><div className="login-card-progress"><i /><i /><i /><i /></div></div>
            <div className="login-mini-card"><span className="login-check">&#10003;</span><span>တစ်လှမ်းချင်း သင်ယူရင်း<strong>နေ့တိုင်း ပိုတိုးတက်လာမယ်။</strong></span></div>
            <span className="login-spark login-spark-one">&#10022;</span><span className="login-spark login-spark-two">&#10023;</span>
          </div>
          <div className="login-story-footer"><span>ဝေါဟာရ</span><i /> <span>သဒ္ဒါ</span><i /><span>လေ့ကျင့်ခန်း</span></div>
        </aside>
        <div className="study-access-card study-login-panel" lang="my">
          <div className="study-access-theme"><ThemeToggle /></div>
          <div className="study-login-heading">
            <p className="eyebrow">သင့်ရဲ့ ဂျပန်စာလေ့လာရေးခရီး</p>
            <h1>{user ? (sessionStatus === "error" ? "ဤစက်မှ ဝင်ရောက်၍မရပါ" : "ဝင်ရောက်ခွင့် လိုအပ်ပါသည်") : "ပြန်လည်ကြိုဆိုပါတယ်။"}</h1>
            <p className="login-form-intro">{user ? "အကောင့်မှ ထွက်ပြီး လေ့လာခွင့်ရှိသော အကောင့်ဖြင့် ပြန်ဝင်ပါ။" : "လေ့လာခဲ့တဲ့နေရာကနေ ပြန်စလိုက်ရအောင်။"}</p>
          </div>
          {user ? <button type="button" className="primary-button" onClick={logout} disabled={busy}>အကောင့်မှ ထွက်မည်</button> : <>
            <form className="study-access-form" onSubmit={submitLogin}>
              <label htmlFor="study-username">အသုံးပြုသူအမည်<input id="study-username" type="text" autoComplete="username" placeholder="အသုံးပြုသူအမည် ထည့်ပါ" required value={username} onChange={(event) => setUsername(event.target.value)} /></label>
              <label htmlFor="study-password">စကားဝှက်<span className="login-password-wrap"><input id="study-password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="စကားဝှက် ထည့်ပါ" required value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" className="login-password-toggle" aria-label={showPassword ? "စကားဝှက် ဖျောက်မည်" : "စကားဝှက် ပြမည်"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{showPassword && <path d="m3 3 18 18" />}</svg></button></span></label>
              <p className="login-access-hint">စီမံခန့်ခွဲသူ ပေးထားသော အကောင့်ဖြင့် ဝင်ရောက်ပါ။</p>
              <button type="submit" className="primary-button" disabled={busy}>{busy ? "ဝင်ရောက်နေပါသည်…" : "ဝင်ရောက်လေ့လာမည်"}</button>
            </form>
            <div className="study-access-divider"><span>အကြောင်းအရာ တည်းဖြတ်သူများအတွက်</span></div>
            <button type="button" className="secondary-button login-google" onClick={signInEditor} disabled={busy}><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c2-1.8 2.9-4.4 2.9-7.5Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4H3v2.7A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.4H3a10 10 0 0 0 0 9.2l3.4-2.7Z"/><path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.4l3.4 2.7C7.2 7.8 9.4 6.1 12 6.1Z"/></svg>Google ဖြင့် ဝင်ရောက်မည်</button>
            <p className="login-account-note">အကောင့် သို့မဟုတ် ဝင်ရောက်ရန် အကူအညီလိုပါသလား။<br /><strong>စီမံခန့်ခွဲသူထံ ဆက်သွယ်ပါ။</strong></p>
          </>}
          {error && <p className="practice-access-error" role="alert">{error}</p>}
          <p className="login-panel-footer">ကိုယ့်အချိန်နဲ့ကိုယ်၊ ကိုယ့်ဟန်နဲ့ကိုယ် လေ့လာပါ။</p>
        </div>
      </section>
    </main>
  );

  const tabAccess=canManageUsers?{mode:'all'}:effectiveTabAccess(claims?.profile?.tabAccess);
  const available=permittedTabs(tabAccess);
  return <StudyAccountContext.Provider value={{ uid: user.uid, username: claims?.profile?.username || claims?.profile?.email || user.email, displayName:claims?.profile?.displayName||user.displayName, email:claims?.profile?.email||user.email, logout, busy, tabAccess, canViewTab:(level,tab)=>canViewTab(tabAccess,level,tab), manager: canManageUsers ? <PracticeUserManager /> : null }}>
    <div className="study-access-root">{canViewPath(tabAccess,pathname)?children:<main className="study-tab-restricted"><StudyAccountControls /><h1>This tab is not available for your account.</h1><p>{available.length?'Choose one of your allowed study tabs below.':'No study tabs have been assigned. Contact your account manager for access.'}</p><nav aria-label="Allowed study tabs">{available.map(tab=><a key={tab.key} href={tab.path}>{tab.subject} · {tab.label}</a>)}</nav></main>}</div>
  </StudyAccountContext.Provider>;
}
