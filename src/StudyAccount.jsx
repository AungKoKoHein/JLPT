import React, { createContext, useContext } from 'react';

export const StudyAccountContext = createContext(null);

export function StudyAccountControls() {
  const account = useContext(StudyAccountContext);
  if (!account) return null;
  return <div className="study-header-account">
    <div className="study-account-identity" title={account.username}>
      <span className="study-account-avatar" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="8" r="3.5" /><path d="M5 20v-2a7 7 0 0 1 14 0v2" /></svg></span>
      <strong className="study-account-name">{account.username}</strong>
    </div>
    <div className="study-account-actions">
      {account.manager}
      <button type="button" className="study-signout-button" onClick={account.logout} disabled={account.busy}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H5v14h4M10 12h10m-4-4 4 4-4 4" /></svg><span>Sign out</span></button>
    </div>
  </div>;
}
