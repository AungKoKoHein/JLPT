import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import {
  onValue,
  ref,
  runTransaction,
  serverTimestamp,
} from "firebase/database";
import { auth, database, googleProvider } from "./firebase.js";
import {
  CONTENT_PATH,
  createCloudUpdate,
  decodeSnapshot,
  emptyContent,
  normalizeContent,
} from "./cloudContent.js";

const CACHE_KEY = "jlpt-public-cloud-cache";

function readCache() {
  try {
    return normalizeContent(
      JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"),
    );
  } catch {
    return structuredClone(emptyContent);
  }
}

function explainError(error) {
  const messages = {
    "auth/unauthorized-domain":
      "Add this website's domain in Firebase Authentication → Settings → Authorized domains.",
    "auth/operation-not-allowed":
      "Enable Google sign-in in Firebase Authentication first.",
    "auth/popup-blocked":
      "Allow the sign-in popup in your browser and try again.",
    "auth/popup-closed-by-user": "Sign-in was cancelled. You can try again.",
    "auth/invalid-api-key":
      "The Firebase API key is invalid. Check src/firebase.js against your project settings.",
    PERMISSION_DENIED:
      "Firebase denied access. Check the database rules and your editor permission.",
  };
  return (
    messages[error.code] ??
    error.message ??
    "Firebase could not complete this request."
  );
}

export function useCloudContent() {
  const [content, setContent] = useState(readCache);
  const [user, setUser] = useState(null);
  const [editorUid, setEditorUid] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [connected, setConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  const latest = useRef({ content, revision: 0 });
  const pending = useRef(false);
  const [subscription, setSubscription] = useState(0);
  const isEditor = Boolean(user && editorUid === user.uid);

  useEffect(
    () =>
      onAuthStateChanged(auth, setUser, (error) =>
        setError(explainError(error)),
      ),
    [],
  );

  useEffect(() => {
    setEditorUid(null);
    if (!user) return;
    return onValue(
      ref(database, `editors/${user.uid}`),
      (snapshot) => {
        setEditorUid(snapshot.val() === true ? user.uid : null);
      },
      (error) => setError(explainError(error)),
    );
  }, [user, subscription]);

  useEffect(
    () =>
      onValue(ref(database, ".info/connected"), (snapshot) => {
        setConnected(snapshot.val() === true);
      }),
    [],
  );

  useEffect(() => {
    setLoaded(false);
    setLoadError("");
    return onValue(
      ref(database, CONTENT_PATH),
      (snapshot) => {
        try {
          const next = decodeSnapshot(snapshot.val());
          latest.current = next;
          setContent(next.content);
          setRevision(next.revision);
          setLoaded(true);
          setLoadError("");
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(next.content));
          } catch {
            /* Cloud remains the source of truth. */
          }
        } catch (error) {
          setLoaded(false);
          setLoadError(explainError(error));
        }
      },
      (error) => {
        setLoaded(false);
        setLoadError(explainError(error));
      },
    );
  }, [subscription]);

  useEffect(() => {
    if (!saving) return;
    const warnBeforeLeaving = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [saving]);

  const canEdit = Boolean(user && isEditor && loaded && connected && !saving);

  const updateContent = async (update) => {
    if (pending.current || !canEdit) {
      setError(
        "Editing requires your authorized account and a live database connection.",
      );
      return false;
    }
    pending.current = true;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const base = latest.current;
      // Evaluate the existing UI updater once, outside Firebase's retry callback.
      const next = typeof update === "function" ? update(base.content) : update;
      if (next === base.content) return true;
      const result = await runTransaction(
        ref(database, CONTENT_PATH),
        (current) =>
          createCloudUpdate(
            current,
            base.revision,
            next,
            user.uid,
            serverTimestamp(),
          ),
        { applyLocally: false },
      );
      if (!result.committed) {
        setError(
          "Content changed on another device. Review the latest content and save again.",
        );
        return false;
      }
      const saved = decodeSnapshot(result.snapshot.val());
      // A newer listener event may already have arrived from another device.
      if (saved.revision >= latest.current.revision) {
        latest.current = saved;
        setContent(saved.content);
        setRevision(saved.revision);
      }
      setMessage("Saved to Firebase. Everyone can see this change.");
      return true;
    } catch (error) {
      setError(`Not saved: ${explainError(error)}`);
      return false;
    } finally {
      pending.current = false;
      setSaving(false);
    }
  };

  const signIn = async () => {
    setAuthBusy(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setError(explainError(error));
    } finally {
      setAuthBusy(false);
    }
  };
  const logOut = async () => {
    if (pending.current) return;
    setError("");
    try {
      await signOut(auth);
      setMessage("");
    } catch (error) {
      setError(explainError(error));
    }
  };
  const importBrowserEdits = async () => {
    if (!canEdit || revision !== 0) return;
    try {
      const legacy = localStorage.getItem("jlpt-user-content");
      if (!legacy) {
        setMessage("No previous browser edits were found.");
        return;
      }
      const data = normalizeContent(JSON.parse(legacy));
      if (
        !window.confirm(
          "Publish this browser's previous edits to Firebase so everyone can see them?",
        )
      )
        return;
      await updateContent(data);
    } catch (error) {
      setError(`Could not import browser edits: ${explainError(error)}`);
    }
  };

  return {
    content,
    updateContent,
    user,
    isEditor,
    canEdit,
    saving,
    authBusy,
    loaded,
    connected,
    error: loadError || error,
    message,
    revision,
    signIn,
    logOut,
    importBrowserEdits,
    retry: () => {
      setError("");
      setSubscription((value) => value + 1);
    },
  };
}
