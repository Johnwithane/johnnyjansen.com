# Human tasks

- [ ] Create the Firebase project `__PROJECT__` (Blaze). Enable Authentication (Google), Firestore, Storage, Cloud Functions, App Check.
- [ ] Register a web app; GitHub variables `__ENV___FIREBASE_API_KEY`, `__ENV___FIREBASE_AUTH_DOMAIN`, `__ENV___FIREBASE_PROJECT_ID`, `__ENV___FIREBASE_APP_ID`; same in `app/.env`.
- [ ] Service account key as the GitHub secret `FIREBASE_SA___ENV__` (Firebase Admin + Cloud Functions Developer + Service Account User).
- [ ] First deploy: `npm run deploy:rules && npm run deploy:functions`, then from the root `npm run deploy:hosting`.
