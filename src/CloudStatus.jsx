import React from "react";

export default function CloudStatus({ cloud }) {
  return (
    <section className="cloud-status" aria-label="Cloud storage">
      <div>
        <strong>
          {cloud.saving
            ? cloud.connected
              ? "Saving to Firebase…"
              : "Save pending — keep this page open until reconnected"
            : !cloud.connected
              ? "Connecting to Firebase — editing unavailable"
              : !cloud.loaded
                ? "Loading shared content…"
                : cloud.isEditor
                  ? "Owner editing enabled"
                  : "Shared study content · view only"}
        </strong>
        {cloud.user && <p>Signed in as {cloud.user.email}</p>}
        {cloud.user && !cloud.isEditor && (
          <p>
            Your account has no editing permission. Your Firebase user ID:{" "}
            <code>{cloud.user.uid}</code>
          </p>
        )}
        <p role="status">{cloud.message}</p>
        {cloud.error && <p role="alert">{cloud.error}</p>}
      </div>
      <div className="cloud-actions">
        {cloud.user ? (
          <button type="button" onClick={cloud.logOut} disabled={cloud.saving}>
            Sign Out
          </button>
        ) : (
          <button
            type="button"
            onClick={cloud.signIn}
            disabled={cloud.authBusy}
          >
            {cloud.authBusy ? "Signing in…" : "Owner Sign In with Google"}
          </button>
        )}
        {cloud.error && (
          <button type="button" onClick={cloud.retry} disabled={cloud.saving}>
            Retry Connection
          </button>
        )}
        {cloud.isEditor && cloud.loaded && cloud.revision === 0 && (
          <button
            type="button"
            onClick={cloud.importBrowserEdits}
            disabled={!cloud.canEdit}
          >
            Publish Previous Browser Edits
          </button>
        )}
      </div>
    </section>
  );
}
