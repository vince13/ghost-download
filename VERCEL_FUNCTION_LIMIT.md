# Vercel Function Limit Fix

## Problem
Vercel's free Hobby plan limits deployments to **12 serverless functions**. We exceeded this limit.

## Solution
Optimized API routes to stay under the limit:

### Removed Files:
1. ✅ **Deleted `api/generate-embedding.js`** - Embedding generation is handled in `store-document.js` and `retrieve-rag.js`
2. ✅ **Deleted `api/firestore-health.js`** - Debug endpoint, not needed for production
3. ✅ **Moved `api/ghost-scenarios.js`** → `src/data/ghost-scenarios.js` - Not a function, just data

### Previously Removed:
- `api/v2v-webhook-test.js` - Test endpoint
- `api/vapi-create-call.js` - Deprecated (we use Vapi Web SDK now)
- `api/llm-process.js` - Replaced by `api/process-transcript.js`

## Current API Routes (9 total)

1. `api/delete-document.js` - Delete KB documents from Pinecone
2. `api/ghost-sim.js` - Mock simulation
3. `api/process-transcript.js` - Main transcript processing
4. `api/retrieve-rag.js` - RAG retrieval (includes embedding generation)
5. `api/store-document.js` - Store KB documents (includes embedding generation)
6. `api/stripe-create-checkout.js` - Payment checkout
7. `api/stripe-verify-session.js` - Payment verification
8. `api/stripe-webhook.js` - Payment webhook
9. `api/v2v-webhook.js` - Vapi webhook handler

## Result
- **Current:** 9 API routes
- **Remaining capacity:** 3 more functions available
- **Status:** ✅ Well under the 12 function limit

## Next Steps
You can now deploy to Vercel without hitting the function limit. If you need more than 12 functions in the future, consider:
- Upgrading to Vercel Pro plan ($20/month)
- Consolidating related functions
- Using a single function with routing logic
