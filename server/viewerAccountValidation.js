// Shared validation for the protected viewer-account endpoint.
import { validateTabAccess } from '../src/viewerTabAccess.js';
export class AccountError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const emailForUsername = username => `${username}@users.akkh-jlpt.invalid`;
export function validateAccountEdit(body, method) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AccountError(400, 'Invalid account details.');
  const allowed = method === 'DELETE' ? ['uid'] : ['uid', 'username', 'password', 'tabAccess'];
  if (Object.keys(body).some(key => !allowed.includes(key))) throw new AccountError(400, 'Unsupported account field.');
  if (typeof body.uid !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(body.uid)) throw new AccountError(400, 'Invalid viewer account.');
  if (method === 'DELETE') return { uid: body.uid };
  if (typeof body.username !== 'string') throw new AccountError(400, 'Enter a username.');
  const username = body.username.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,24}$/.test(username)) throw new AccountError(400, 'Use 3–24 letters, numbers, dots, underscores, or hyphens for the username.');
  const password = body.password ?? '';
  if (typeof password !== 'string' || (password && (password.length < 6 || password.length > 128))) throw new AccountError(400, 'Use a password between 6 and 128 characters.');
  let tabAccess;
  if(Object.hasOwn(body,'tabAccess')) { try { tabAccess=validateTabAccess(body.tabAccess); } catch(error) { throw new AccountError(400,error.message); } }
  return { uid: body.uid, username, password, ...(tabAccess?{tabAccess}:{}) };
}
export function assertViewer(user, profile, callerUid) {
  if (!profile?.username || !user || user.uid === callerUid || !user.email?.endsWith('@users.akkh-jlpt.invalid') || !user.providerData?.length || user.providerData.some(provider => provider.providerId !== 'password')) throw new AccountError(403, 'Only viewer accounts can be changed here.');
}
export function publicAccountError(error) {
  if (error instanceof AccountError) return { status: error.status, message: error.message };
  const known = {
    'auth/email-already-exists': [409, 'This username is already in use. Choose another username.'],
    'auth/user-not-found': [404, 'This viewer login no longer exists. Refresh the account list.'],
    'auth/invalid-password': [400, 'The new password does not meet the password requirements.'],
    'auth/id-token-expired': [401, 'Your sign-in expired. Sign in again.'],
    'auth/argument-error': [401, 'Please sign in again.'],
    'auth/invalid-id-token': [401, 'Please sign in again.'],
  };
  const [status, message] = known[error?.code] || [503, 'Account update is unavailable. Please try again.'];
  return { status, message };
}
