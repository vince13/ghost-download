# Quick RAG Testing Guide

## 🚀 Fast Test (5 minutes)

### Step 1: Upload a Test Document
1. Open Ghost app → Click **Knowledge Base** button
2. Click **Upload Document**
3. Create a simple text file with this content:
   ```
   Pricing Strategy:
   - Base price: $99/month
   - Enterprise: Custom pricing
   - When customer says "price is too high", respond with: "Let's discuss ROI and long-term value"
   - Key objection handling: Focus on cost savings over time
   ```
4. Save as `test-pricing.txt` and upload
5. **Watch the status**: Should go `pending` → `chunking` → `indexed` (takes 10-30 seconds)

### Step 2: Verify in Pinecone (Optional)
1. Go to [Pinecone Console](https://app.pinecone.io)
2. Open your index
3. Check if vectors appear (may take a moment to show)

### Step 3: Test During a Call
1. Start a new session/call in Ghost
2. Say: **"The price seems too high for us"**
3. **Watch for coaching cue** - it should reference your pricing document!

### Step 4: Check Logs
Go to Vercel → Your project → Functions → Check logs for:
- `/api/store-document` - Should show "✅ Successfully stored X chunks"
- `/api/retrieve-rag` - Should show "✅ Retrieved X chunks" when you mention pricing
- `/api/process-transcript` - Should show "✅ RAG context retrieved"

## ✅ Success Indicators

**Document Upload:**
- ✅ Status changes to "indexed"
- ✅ No errors in browser console
- ✅ Vercel logs show "Stored X chunks"

**RAG Retrieval:**
- ✅ Vercel logs show "Retrieved X chunks"
- ✅ Coaching cues mention your document content
- ✅ Cues are more specific than generic responses

## ❌ Troubleshooting

### Document stuck on "chunking"
**Check Vercel logs for `/api/store-document`:**
- Error about Pinecone? → Check `PINECONE_API_KEY` and `PINECONE_INDEX_NAME`
- Error about embeddings? → Check `HUGGINGFACE_API_KEY` or `OPENAI_API_KEY`
- Timeout? → Check Pinecone index is accessible

### No RAG context retrieved
**Check Vercel logs for `/api/retrieve-rag`:**
- "Retrieved 0 chunks" → Document might not be indexed yet, or query doesn't match
- Error about Pinecone? → Check API key and index name
- Error about embeddings? → Check embedding service API key

### Coaching cues don't use KB content
**Check Vercel logs for `/api/process-transcript`:**
- Should see "✅ RAG context retrieved" if working
- If not, check if `userId` is being passed correctly

## 🎯 Expected Behavior

**Before RAG:**
- Generic cue: "Ask: What would make this a no-brainer?"

**After RAG (with pricing document):**
- Specific cue: "Focus on ROI and long-term value" (from your document!)

## 📝 Test Document Ideas

Try uploading different types of documents:

1. **Pricing Playbook** - Test price objections
2. **Competitor Battlecard** - Test competitor mentions
3. **Timeline Strategy** - Test urgency/timeline questions

Each should enhance coaching cues when relevant topics come up!

