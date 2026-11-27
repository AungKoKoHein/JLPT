import React, { useEffect, useRef, useState } from 'react';
import { auth } from './firebase.js';
import { database } from './firebase.js';
import { ref, update } from 'firebase/database';
import ViewerTabPermissions from './ViewerTabPermissions.jsx';
import { effectiveTabAccess, validateTabAccess } from './viewerTabAccess.js';
import './viewerManagement.css';

export default function ViewerAccountDialog({ user, mode, onClose, onSaved }) {
  const dialog = useRef(null);
  const deleting = mode === 'delete';
  const accessOnly = mode === 'access';
  const [tabAccess,setTabAccess] = useState(()=>effectiveTabAccess(user.tabAccess));
  const [username, setUsername] = useState(user.username || '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current.showModal();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  const submit = async event => {
    event.preventDefault();
    if (busy || (deleting && confirmation !== user.username)) return;
    setBusy(true);
    setError('');
    try {
      if (!auth.currentUser) throw new Error('Please sign in again.');
      if(accessOnly) {
        await update(ref(database,`practiceUsers/${user.uid}`),{tabAccess:validateTabAccess(tabAccess),changedAt:Date.now(),changedBy:auth.currentUser.uid});
        onSaved(`Tab access updated for ${user.username}.`);
        return;
      }
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/viewer-accounts', {
        method: deleting ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(deleting ? { uid: user.uid } : { uid: user.uid, username, password, tabAccess:validateTabAccess(tabAccess) }),
      });
      const result = await response.json().catch(() => ({ error: 'Account management is unavailable. Please try again.' }));
      if (!response.ok) throw new Error(result.error || 'The account could not be updated.');
      setPassword('');
      onSaved(result.message);
    } catch (reason) { setError(reason.message || 'Please check your connection and try again.'); }
    finally { setBusy(false); }
  };
  return <dialog ref={dialog} className="exam-confirm-dialog viewer-account-dialog" aria-labelledby="viewer-dialog-title" aria-describedby="viewer-dialog-description" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <form onSubmit={submit}>
      <div className="exam-confirm-body"><h2 id="viewer-dialog-title">{deleting ? 'Delete viewer permanently' : accessOnly ? 'Manage tab access' : 'Edit viewer account'}</h2>
        <p id="viewer-dialog-description">{deleting ? `Delete ${user.username}, including their login, profile, device sessions, and all mock exam records? This cannot be undone.` : accessOnly ? `Choose which study tabs ${user.username} can open. Login details and exam records stay unchanged.` : `Update the login details and allowed tabs for ${user.username}. Their account and exam records will be kept.`}</p>
        <fieldset disabled={busy} className="viewer-account-fields">
          {deleting ? <label>Type {user.username} to confirm<input autoFocus autoComplete="off" value={confirmation} onChange={event => setConfirmation(event.target.value)} required /></label> : accessOnly ? <ViewerTabPermissions value={tabAccess} onChange={setTabAccess} /> : <>
            <label>Username<input autoFocus autoComplete="off" minLength={3} maxLength={24} pattern="[a-zA-Z0-9._-]{3,24}" required value={username} onChange={event => setUsername(event.target.value)} /></label>
            <label>New password<input type="password" autoComplete="new-password" minLength={6} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} placeholder="Leave blank to keep current password" /></label>
            <p>The current password is never displayed. Share changed login details with the viewer securely.</p>
            <ViewerTabPermissions value={tabAccess} onChange={setTabAccess} />
          </>}
        </fieldset>
        {error && <p className="practice-access-error" role="alert">{error}</p>}
      </div>
      <div className="exam-confirm-actions"><button type="button" className="secondary-button" disabled={busy} onClick={onClose}>Cancel</button><button type="submit" className={deleting ? 'delete-confirm' : 'primary-button'} disabled={busy || (deleting && confirmation !== user.username)}>{busy ? (deleting ? 'Deleting…' : 'Saving…') : deleting ? 'Delete permanently' : 'Save changes'}</button></div>
    </form>
  </dialog>;
}
