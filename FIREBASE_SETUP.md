# Firebase setup for JLPT

The app uses your `akkh-jlpt` project, Firebase Authentication (Google), and **Realtime Database**. It continues to run on GitHub Pages. No custom server is needed.

Everyone can read the published study content. Only the account you grant access to can add, edit, delete, or reorder it. Signing in alone does not grant edit access.

## 1. Enable Google sign-in

In [Firebase Authentication](https://console.firebase.google.com/project/akkh-jlpt/authentication/providers), enable the **Google** provider and select your project support email.

In **Authentication → Settings → Authorized domains**, add:

- `aungkokohein.github.io` (your GitHub Pages hostname, without a repository path)
- `localhost` and `127.0.0.1` if you will edit while running the app locally
- Your custom hostname, if you use one

## 2. Publish the database rules

Open [Realtime Database](https://console.firebase.google.com/project/akkh-jlpt/database), select the `akkh-jlpt-default-rtdb` instance, and open **Rules**. Copy the contents of [database.rules.json](database.rules.json) and click **Publish**. If this project also serves other apps, merge their existing rules rather than removing them.

The rules allow public reads only at `/jlpt/content`. Writes require `/editors/<your Firebase UID>` to be the boolean `true`. Browser clients cannot grant themselves editor access.

Alternatively, with an authenticated Firebase CLI, run `firebase deploy --only database --project akkh-jlpt`. The included `firebase.json` and `.firebaserc` select the rules and project. No rules have been deployed by this code change.

## 3. Grant your account edit access

1. Run `npm run dev`, open the site, and click **Owner sign in with Google**. Choose your Google account.
2. Copy the Firebase user ID shown on the page. You can also find it under **Authentication → Users** in the Firebase console.
3. In **Realtime Database → Data**, add an `editors` child at the root. Under it, add your UID as the key and boolean `true` as the value. For example:

   ```json
   {
     "editors": {
       "YOUR_FIREBASE_USER_ID": true
     }
   }
   ```

   Add this child to the database; do not import this example over existing database data. Use a boolean, not the string `"true"`.

4. The site should show **Owner editing enabled**. Existing Add/Edit/Delete and position controls now save to Firebase.

Do not add other UIDs unless you want those accounts to edit too. Removing your editor entry revokes edit permission.

## 4. Publish the app and verify

Push these source changes and the updated npm lockfile to `main` for the existing GitHub Pages workflow to rebuild the site. The Firebase web configuration is already in `src/firebase.js`; no GitHub secret is needed for it. Access is enforced by database rules.

Add a test card while signed in, wait for **Saved to Firebase**, then open the site in a signed-out browser. It should show the same card with editing disabled. Edit and delete the test card to verify that both views update.

The baseline vocabulary, Kanji, and exercises remain bundled in the app. Firebase stores additions, overrides, deletions, and card positions. It does not rewrite the source files in the GitHub repository.

## Existing browser edits and offline behavior

Your previous `jlpt-user-content` local storage is left intact. When the cloud content is empty, the authorized owner can click **Publish previous browser edits** to publish that browser's old changes. This is explicit; opening the page never uploads or overwrites the database automatically.

Shared data is cached separately for reading. Editing requires a connection and loaded cloud data. A save started just before disconnection can remain pending; keep the page open until Firebase confirms it. Permission failures are shown on screen, and a failed form save keeps the editor open. Changes made simultaneously on another device cause a conflict message instead of silently overwriting that device's work.

The database record uses a versioned JSON `payload` because the app's existing ordering keys contain characters that are invalid as Realtime Database child keys, and Firebase otherwise removes empty arrays. A revision-checked transaction protects the shared record against concurrent overwrites.

## Checks

- `npm test` tests the content format, deletion/order round trips, and stale-save protection.
- `npm run build` builds the GitHub Pages site. This restored project still regenerates its document-derived source data during the build.

Google sign-in and owner writes must be verified after the console steps above; they cannot be enabled using the public web configuration alone.

References: [Google sign-in](https://firebase.google.com/docs/auth/web/google-signin), [Realtime Database reads and writes](https://firebase.google.com/docs/database/web/read-and-write), [Database security rules](https://firebase.google.com/docs/database/security/core-syntax).
