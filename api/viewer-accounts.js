import { adminAuth } from '../server/firebaseAdmin.js';
import { createViewerAccountHandler } from '../server/viewerAccounts.js';
export default createViewerAccountHandler({ getAuth: adminAuth });
