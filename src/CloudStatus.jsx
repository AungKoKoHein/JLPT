import React from "react";

export default function CloudStatus({ cloud }) {
  const isGoogleEditor = cloud.isEditor && cloud.user?.providerData?.some(provider => provider.providerId === "google.com");
  if (!isGoogleEditor) return null;
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
        <p role="status">{cloud.message}</p>
        {cloud.error && <p role="alert">{cloud.error}</p>}
      </div>
      <div className="cloud-actions">
        {cloud.error && (
          <button type="button" onClick={cloud.retry} disabled={cloud.saving}>
            Retry Connection
          </button>
        )}
        {cloud.level === "n3" && cloud.isEditor && cloud.loaded && cloud.revision === 0 && (
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
