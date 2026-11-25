import { AccountError, assertViewer, emailForUsername, publicAccountError, validateAccountEdit } from './viewerAccountValidation.js';
const origin = 'https://akkh-jlpt-default-rtdb.asia-southeast1.firebasedatabase.app';
export function createViewerAccountHandler({ getAuth, request = fetch, now = Date.now }) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (!['PATCH', 'DELETE'].includes(req.method)) { res.setHeader('Allow', 'PATCH, DELETE'); return res.status(405).json({ error: 'Method not allowed.' }); }
    try {
      const bearer = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
      if (!bearer) throw new AccountError(401, 'Sign in to manage viewer accounts.');
      const auth = getAuth();
      const caller = await auth.verifyIdToken(bearer);
      if (!caller.auth_time || caller.auth_time * 1000 <= now() - 604800000) throw new AccountError(401, 'Your sign-in expired. Sign in again.');
      const db = async (path, options = {}) => {
        const response = await request(`${origin}/${path}.json?auth=${encodeURIComponent(bearer)}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers }, signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new AccountError(response.status === 401 || response.status === 403 ? 403 : 503, 'Could not update the account records. Please try again.');
        return response.json();
      };
      const [editor, admin] = await Promise.all([db(`editors/${caller.uid}`), db(`practiceAdmins/${caller.uid}`)]);
      if (editor !== true && admin !== true) throw new AccountError(403, 'Only account managers can change viewer accounts.');
      const input = validateAccountEdit(req.body, req.method);
      const profile = await db(`practiceUsers/${input.uid}`);
      let user;
      try { user = await auth.getUser(input.uid); }
      catch (error) {
        // Retry cleanup after a completed Auth deletion whose database cleanup failed.
        if (req.method !== 'DELETE' || error.code !== 'auth/user-not-found' || !profile?.username || input.uid === caller.uid) throw error;
      }
      if (user) assertViewer(user, profile, caller.uid);
      if (req.method === 'DELETE') {
        if (user) await auth.deleteUser(input.uid);
        try {
          await db('', { method: 'PATCH', body: JSON.stringify({ [`practiceUsers/${input.uid}`]: null, [`practiceSessions/${input.uid}`]: null, [`mockExamRecords/${input.uid}`]: null }) });
        } catch { throw new AccountError(503, 'The login was deleted, but record cleanup did not finish. Retry Delete permanently to finish removing the records.'); }
        return res.status(200).json({ message: `Viewer account ${profile.username} and its records were permanently deleted.` });
      }
      const email = emailForUsername(input.username);
      const renamed = email !== user.email;
      if (renamed) await auth.updateUser(input.uid, { email });
      try {
        await db(`practiceUsers/${input.uid}`, { method: 'PATCH', body: JSON.stringify({ username: input.username, changedAt: now(), changedBy: caller.uid }) });
      } catch (error) {
        if (renamed) {
          try { await auth.updateUser(input.uid, { email: user.email }); }
          catch { throw new AccountError(503, `The login username changed to ${input.username}, but its profile did not update. Retry saving this username to finish.`); }
        }
        throw error;
      }
      if (input.password) {
        try { await auth.updateUser(input.uid, { password: input.password }); }
        catch { throw new AccountError(503, 'The username was saved, but the password could not be changed. Retry saving the new password.'); }
      }
      return res.status(200).json({ message: `Viewer account ${input.username} updated${input.password ? ' with a new password' : ''}.` });
    } catch (error) {
      const result = publicAccountError(error);
      return res.status(result.status).json({ error: result.message });
    }
  };
}
