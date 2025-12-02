# Firestore Security Rules Deployment

## Issue
Users are getting "Missing or insufficient permissions" errors when trying to access analytics data.

## Solution
Deploy the updated Firestore security rules to allow users to read their own analytics data.

## Deployment Steps

### Option 1: Using Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project** (if not already done):
   ```bash
   firebase init firestore
   ```
   - Select your Firebase project
   - Use the existing `firestore.rules` file
   - Use the existing `firestore.indexes.json` (or create one if needed)

4. **Deploy the rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Option 2: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules` from this project
5. Paste into the rules editor
6. Click **Publish**

## Rules Overview

The security rules allow:
- ✅ Users to read/write their own profile (`users/{userId}`)
- ✅ Users to read/write their own sessions (`users/{userId}/sessions/{sessionId}`)
- ✅ Users to read/write their own analytics (`users/{userId}/analytics/{analyticsId}`)
- ✅ Users to read/write their own knowledge base docs (`users/{userId}/knowledgeBase/{docId}`)
- ✅ Users to read/write their own settings (`users/{userId}/settings/{settingsId}`)
- ✅ Authenticated users to read Vapi calls (filtered by userId in queries)

## Testing

After deploying, test by:
1. Logging in with Google
2. Starting a session
3. Opening the Analytics Dashboard
4. Verifying that analytics data loads without permission errors

