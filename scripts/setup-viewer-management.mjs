// One-time production setup. Uses the existing Firebase CLI login in memory.
// No service-account keys or user credentials are written to the repository.
import path from 'node:path';
import { createRequire } from 'node:module';
const cliDirectory = process.argv[2];
if (!cliDirectory) throw new Error('Pass the installed firebase-tools directory.');
const require = createRequire(path.resolve(cliDirectory, 'package.json'));
const cliAuth = require(path.resolve(cliDirectory, 'lib/auth.js'));
const account = cliAuth.getGlobalDefaultAccount();
if (!account) throw new Error('Sign in to Firebase CLI first.');
const tokens = account.tokens.access_token && account.tokens.expires_at > Date.now() + 60000 ? account.tokens : await cliAuth.getAccessToken(account.tokens.refresh_token, account.tokens.scopes);
async function api(url, method = 'GET', body) {
  const response = await fetch(url, { method, headers: { Authorization: `Bearer ${tokens.access_token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error(`${method} ${new URL(url).pathname}: HTTP ${response.status}; unexpected response format.`); }
  if (!response.ok) { const error = new Error(`${method} ${new URL(url).pathname}: HTTP ${response.status}: ${data.error?.message || 'Request failed'}`); error.status = response.status; throw error; }
  return data;
}
const project = 'akkh-jlpt';
const number = '756645666314';
const iam = 'https://iam.googleapis.com/v1';
for (const service of ['iam.googleapis.com', 'iamcredentials.googleapis.com', 'sts.googleapis.com']) {
  const url = `https://serviceusage.googleapis.com/v1/projects/${number}/services/${service}`;
  const current = await api(url);
  if (current.state !== 'ENABLED') { await api(`${url}:enable`, 'POST', {}); console.log(`Enabled ${service}`); }
}
const pool = `projects/${number}/locations/global/workloadIdentityPools/jlpt-vercel`;
try { await api(`${iam}/${pool}`); }
catch (error) { if (error.status !== 404) throw error; await api(`${iam}/projects/${number}/locations/global/workloadIdentityPools?workloadIdentityPoolId=jlpt-vercel`, 'POST', { displayName: 'JLPT Vercel viewer management' }); console.log('Created workload identity pool.'); }
// Creation is asynchronous; bounded polling reads only this pool.
for (let i = 0; i < 20; i++) {
  try { await api(`${iam}/${pool}`); break; }
  catch (error) { if (error.status !== 404 || i === 19) throw error; await new Promise(resolve => setTimeout(resolve, 1000)); }
}
const provider = `${pool}/providers/production`;
const providerConfig = {
  displayName: 'JLPT production only',
  attributeMapping: { 'google.subject': 'assertion.sub' },
  attributeCondition: "assertion.sub == 'owner:akkh:project:jlpt:environment:production' && assertion.owner_id == 'team_xC32PhON8uCVRapOj8WNXnnA' && assertion.project_id == 'prj_FAMAPuqhLwQaMzQjxamJHQi4AKya'",
  oidc: { issuerUri: 'https://oidc.vercel.com/akkh', allowedAudiences: ['https://vercel.com/akkh'] },
};
try { const current = await api(`${iam}/${provider}`); if (current.attributeCondition !== providerConfig.attributeCondition) throw new Error('Existing provider configuration differs; review before changing.'); }
catch (error) { if (error.status !== 404) throw error; await api(`${iam}/${pool}/providers?workloadIdentityPoolProviderId=production`, 'POST', providerConfig); console.log('Created production-only identity provider.'); }
const serviceAccount = `viewer-manager@${project}.iam.gserviceaccount.com`;
const saPath = `projects/${project}/serviceAccounts/${serviceAccount}`;
try { await api(`${iam}/${saPath}`); }
catch (error) { if (error.status !== 404) throw error; await api(`${iam}/projects/${project}/serviceAccounts`, 'POST', { accountId: 'viewer-manager', serviceAccount: { displayName: 'JLPT viewer account manager' } }); console.log('Created viewer-manager service account without keys.'); }
const roleName = `projects/${project}/roles/jlptViewerAccountManager`;
try { await api(`${iam}/${roleName}`); }
catch (error) { if (error.status !== 404) throw error; await api(`${iam}/projects/${project}/roles`, 'POST', { roleId: 'jlptViewerAccountManager', role: { title: 'JLPT viewer login maintenance', description: 'Read, update and delete Firebase Auth users for the protected account management endpoint.', includedPermissions: ['firebaseauth.users.get', 'firebaseauth.users.update', 'firebaseauth.users.delete'], stage: 'GA' } }); console.log('Created restricted Auth maintenance role.'); }
const crm = `https://cloudresourcemanager.googleapis.com/v1/projects/${project}`;
const policy = await api(`${crm}:getIamPolicy`, 'POST', {});
policy.bindings ??= [];
const member = `serviceAccount:${serviceAccount}`;
let role = policy.bindings.find(binding => binding.role === roleName && !binding.condition);
if (!role) { role = { role: roleName, members: [] }; policy.bindings.push(role); }
if (!role.members.includes(member)) { role.members.push(member); await api(`${crm}:setIamPolicy`, 'POST', { policy }); console.log('Granted restricted Auth maintenance permissions.'); }
const principal = `principal://iam.googleapis.com/${pool}/subject/owner:akkh:project:jlpt:environment:production`;
const saPolicy = await api(`${iam}/${saPath}:getIamPolicy`, 'POST');
saPolicy.bindings ??= [];
let impersonation = saPolicy.bindings.find(binding => binding.role === 'roles/iam.workloadIdentityUser' && !binding.condition);
if (!impersonation) { impersonation = { role: 'roles/iam.workloadIdentityUser', members: [] }; saPolicy.bindings.push(impersonation); }
if (!impersonation.members.includes(principal)) { impersonation.members.push(principal); await api(`${iam}/${saPath}:setIamPolicy`, 'POST', { policy: saPolicy }); console.log('Granted production JLPT deployment access to the service account.'); }
console.log('Viewer management identity setup complete. No private keys created.');
