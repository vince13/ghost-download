# How to Check Vercel Function Logs

## Quick Guide to Find Logs

### Step 1: Go to Your Deployment
1. In Vercel Dashboard, click **Deployments** tab
2. Click on the **latest deployment** (the most recent one, usually at the top)

### Step 2: Find the Logs Section
Once you're in the deployment details, look for one of these:

**Option A: "Logs" Tab**
- You should see tabs like: Overview, Logs, Build Logs, etc.
- Click on **"Logs"** tab
- This shows runtime logs from your functions

**Option B: "Function Logs" Section**
- Scroll down in the deployment page
- Look for a section called "Function Logs" or "Runtime Logs"
- This shows logs from serverless functions

**Option C: "View Logs" Button**
- Look for a button that says "View Logs" or "Function Logs"
- Click it to see the logs

### Step 3: Trigger the Function
To see logs from `/api/store-document`:

1. **Keep the logs page open**
2. **Go back to your Ghost app** (in another tab)
3. **Upload a document** to Knowledge Base
4. **Go back to Vercel logs** - you should see new logs appear

### Step 4: What to Look For

After uploading a document, you should see logs like:

```
[store-document] 🔍 Environment check:
[store-document] PINECONE_API_KEY: SET (length: XX)
[store-document] PINECONE_INDEX_NAME: ghost-knowledge-base
[store-document] HUGGINGFACE_API_KEY: SET (length: XX)
[store-document] OPENAI_API_KEY: NOT SET
[store-document] VERCEL_ENV: production
[store-document] ✅ Configuration check passed
[store-document] Embedding service: Hugging Face
[store-document] Processing document XXX for user YYY with 3 chunks
```

## Alternative: Use Vercel CLI

If you can't find logs in the dashboard, use the CLI:

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login
vercel login

# View logs
vercel logs --follow
```

This will show real-time logs from all functions.

## Still Can't Find Logs?

1. **Make sure you're looking at the Production deployment**
   - Preview deployments have separate logs
   - Check the "Environment" column in Deployments

2. **Try the Observability tab**
   - Some Vercel projects have an "Observability" tab
   - This shows function metrics and logs

3. **Check the deployment was successful**
   - If deployment failed, logs might be in "Build Logs" instead

4. **Upload a document first**
   - Logs only appear when functions are called
   - Upload a document to trigger `/api/store-document`
   - Then check logs

## Quick Test

1. Open Vercel Dashboard → Deployments → Latest deployment
2. Open the Logs section (or Function Logs)
3. In another tab, open your Ghost app
4. Upload a document to Knowledge Base
5. Go back to Vercel logs - you should see the function being called!

