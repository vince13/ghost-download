# Vercel Environment Variable Troubleshooting

## Problem: Environment Variable Not Recognized

If you've added `HUGGINGFACE_API_KEY` to Vercel but it's still not working, follow these steps:

## Step 1: Verify Variable is Set Correctly

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Check that `HUGGINGFACE_API_KEY` exists
3. **IMPORTANT**: Check the **Environment** column:
   - ✅ Must be set for **Production** (or **All Environments**)
   - ❌ If only set for Preview/Development, Production won't see it

## Step 2: Check Variable Name

The variable name must be **exactly**:
```
HUGGINGFACE_API_KEY
```

Common mistakes:
- ❌ `HUGGING_FACE_API_KEY` (underscore in wrong place)
- ❌ `huggingface_api_key` (lowercase)
- ❌ `HUGGINGFACE_API` (missing `_KEY`)

## Step 3: Redeploy (CRITICAL!)

**Environment variables only apply to NEW deployments.**

After adding/changing an environment variable:

1. **Option A: Redeploy from Dashboard**
   - Go to **Deployments** tab
   - Click the **three dots** (⋯) on the latest deployment
   - Click **Redeploy**
   - ✅ Check "Use existing Build Cache" is **UNCHECKED** (to force rebuild)

2. **Option B: Push a New Commit**
   ```bash
   git commit --allow-empty -m "Trigger redeploy for env vars"
   git push
   ```

3. **Option C: Force Redeploy via CLI**
   ```bash
   vercel --force
   ```

## Step 4: Verify in Logs

After redeploying, check Vercel function logs:

### How to Find Logs:

1. **Go to Deployments tab** (you're already there!)
2. **Click on the latest deployment** (the most recent one at the top)
3. **Look for one of these:**
   - A **"Logs"** tab in the deployment details
   - A **"Function Logs"** section
   - A **"Runtime Logs"** section
   - Or scroll down to find logs

4. **Trigger the function:**
   - Keep the logs page open
   - Go to your Ghost app in another tab
   - Upload a document to Knowledge Base
   - Go back to Vercel logs - you should see new logs appear!

5. **Look for logs like:**
   ```
   [store-document] 🔍 Environment check:
   [store-document] HUGGINGFACE_API_KEY: SET (length: XX)
   ```

**Note:** Logs only appear when the function is called. Upload a document to trigger `/api/store-document` and generate logs.

If you see `NOT SET`, the variable isn't being read.

## Common Issues

### Issue 1: Variable Set for Wrong Environment
**Symptom**: Variable shows in Vercel but logs say "NOT SET"

**Fix**: 
- Edit the variable in Vercel
- Make sure **Environment** is set to **Production** (or **All Environments**)
- Redeploy

### Issue 2: Variable Added But Not Redeployed
**Symptom**: Variable exists but old deployment is still running

**Fix**: 
- **MUST redeploy** after adding environment variables
- Old deployments don't have new variables

### Issue 3: Variable Name Typo
**Symptom**: Variable exists but code can't find it

**Fix**: 
- Double-check spelling: `HUGGINGFACE_API_KEY` (exact match, case-sensitive)
- Check for extra spaces or special characters

### Issue 4: Preview vs Production
**Symptom**: Works in Preview but not Production (or vice versa)

**Fix**: 
- Set variable for **All Environments** in Vercel
- Or set separately for Production and Preview

## Quick Test

After redeploying, upload a document and check logs. You should see:

```
[store-document] 🔍 Environment check:
[store-document] HUGGINGFACE_API_KEY: SET (length: 37)
[store-document] ✅ Configuration check passed
[store-document] Embedding service: Hugging Face
```

If you see `NOT SET`, the variable isn't configured correctly.

## Still Not Working?

1. **Double-check Vercel dashboard:**
   - Settings → Environment Variables
   - Confirm `HUGGINGFACE_API_KEY` exists
   - Confirm it's set for **Production**

2. **Check the deployment:**
   - Go to latest deployment
   - Check if it was created AFTER you added the variable
   - If not, redeploy

3. **Check logs:**
   - Look for the detailed environment check logs
   - They'll show exactly what's set/missing

4. **Try a different variable name temporarily:**
   - Add `TEST_VAR=test123` for Production
   - Redeploy
   - Check if it appears in logs
   - This confirms environment variables are working

