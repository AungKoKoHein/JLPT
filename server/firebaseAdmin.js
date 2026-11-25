import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { ExternalAccountClient } from 'google-auth-library';
import { getVercelOidcToken } from '@vercel/oidc';
const projectId = 'akkh-jlpt';
const projectNumber = '756645666314';
export function adminAuth() {
  const existing = getApps().find(app => app.name === 'viewer-management');
  if (existing) return getAuth(existing);
  const serviceAccount = 'viewer-manager@akkh-jlpt.iam.gserviceaccount.com';
  const client = ExternalAccountClient.fromJSON({
    type: 'external_account',
    audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/jlpt-vercel/providers/production`,
    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
    token_url: 'https://sts.googleapis.com/v1/token',
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccount}:generateAccessToken`,
    subject_token_supplier: { getSubjectToken: () => getVercelOidcToken() },
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  return getAuth(initializeApp({ projectId, credential: {
    async getAccessToken() {
      const { token } = await client.getAccessToken();
      if (!token) throw new Error('Missing server credential.');
      return { access_token: token, expires_in: Math.max(1, Math.floor(((client.credentials.expiry_date || Date.now() + 300000) - Date.now()) / 1000)) };
    },
  } }, 'viewer-management'));
}
