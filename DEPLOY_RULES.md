# Quick Fix: Deploy Firestore Rules

## The Problem
You're seeing "Missing or insufficient permissions" because the Firestore security rules haven't been deployed to Firebase yet.

## Quick Solution (Choose One)

### Option 1: Firebase Console (Fastest - 2 minutes)

1. Go to https://console.firebase.google.com/
2. Select your Ghost project
3. Click **Firestore Database** in the left sidebar
4. Click the **Rules** tab
5. Copy the entire contents of `firestore.rules` file from this project
6. Paste it into the rules editor (replace everything)
7. Click **Publish**

**Done!** The analytics dashboard should work immediately.

### Option 2: Firebase CLI (If you have it set up)

```bash
# If you haven't initialized Firebase in this project:
firebase init firestore
# Select your project, use existing firestore.rules

# Deploy rules:
firebase deploy --only firestore:rules
```

## Verify It Worked

1. Refresh your app
2. Open the Analytics Dashboard
3. The permission error should be gone

## If You Still See Errors

The query might need a composite index. Firebase will show you a link to create it automatically when you try to query. Just click the link in the error message and Firebase will create the index for you.

