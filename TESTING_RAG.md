# Testing RAG/Pinecone Integration

## Quick Test Checklist

### ✅ Step 1: Verify Environment Variables
Check that these are set in Vercel (or `.env.local` for local):
- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME`
- `HUGGINGFACE_API_KEY` (or `OPENAI_API_KEY`)

### ✅ Step 2: Test Document Upload
1. Open Ghost app
2. Click **Knowledge Base** button
3. Upload a test document (text file, markdown, etc.)
4. Watch the status progress: `pending` → `chunking` → `indexed`

**Expected:**
- Document appears in Knowledge Base list
- Status changes to "indexed" within 10-30 seconds
- No errors in browser console

**If stuck on "chunking":**
- Check Vercel function logs for `/api/store-document`
- Verify Pinecone API key is correct
- Check embedding service API key

### ✅ Step 3: Verify Pinecone Storage
1. Go to Pinecone Console
2. Navigate to your index
3. Check vector count (should increase after upload)
4. View vectors in namespace `user-{yourUserId}`

**Expected:**
- Vectors appear in Pinecone
- Namespace matches your user ID
- Metadata includes document info

### ✅ Step 4: Test RAG Retrieval
1. Start a new call/session in Ghost
2. Say something related to your uploaded document
3. Check if coaching cues reference your document content

**Example:**
- If you uploaded a document about "pricing strategy"
- Say: "The price seems too high"
- Expected: Coaching cue should reference your pricing document

### ✅ Step 5: Check Logs
Monitor Vercel function logs:
- `/api/store-document` - Document processing
- `/api/retrieve-rag` - RAG queries during calls
- `/api/process-transcript` - LLM processing with RAG context

## Detailed Testing Steps

### Test 1: Document Upload Flow

**Create a test document:**
```
test-playbook.txt
---
Our pricing strategy:
- Base price: $99/month
- Enterprise: Custom pricing
- Key objection: "Price is too high"
- Response: "Let's discuss ROI and value"
```

**Steps:**
1. Upload `test-playbook.txt` to Knowledge Base
2. Wait for status to become "indexed"
3. Check browser console for any errors
4. Check Vercel logs for `/api/store-document`

**Success indicators:**
- ✅ Status = "indexed"
- ✅ No errors in console
- ✅ Vercel logs show "Stored X chunks"
- ✅ Pinecone shows new vectors

### Test 2: RAG Retrieval During Call

**Steps:**
1. Start a new session/call
2. Say: "The price seems too high for us"
3. Watch for coaching cues
4. Check if cue mentions your playbook content

**Expected behavior:**
- Coaching cue should reference your pricing strategy
- Cue should be more specific than generic responses
- Vercel logs should show RAG context retrieved

**Check logs:**
```bash
# In Vercel function logs for /api/retrieve-rag
# Should see:
"Retrieved X chunks for user {userId}"
```

### Test 3: Multiple Documents

**Steps:**
1. Upload 2-3 different documents
2. Each about different topics (pricing, competitors, timeline)
3. Test each topic during calls
4. Verify correct document is retrieved

**Expected:**
- Each document indexed separately
- Correct document retrieved based on query
- No cross-contamination between documents

### Test 4: Document Deletion

**Steps:**
1. Delete a document from Knowledge Base
2. Check Pinecone - vectors should be removed
3. Try to retrieve content - should not find deleted document

**Expected:**
- Document removed from UI
- Vectors deleted from Pinecone
- No errors during deletion

## Troubleshooting

### Document Stuck on "chunking"
**Check:**
1. Vercel function logs for `/api/store-document`
2. Pinecone API key is valid
3. Embedding service API key is valid
4. Pinecone index exists and is accessible

**Common errors:**
- `PINECONE_API_KEY` invalid → Check API key
- `PINECONE_INDEX_NAME` wrong → Verify index name
- Embedding service down → Check Hugging Face/OpenAI status

### No RAG Context Retrieved
**Check:**
1. Documents are actually indexed (status = "indexed")
2. Vercel logs for `/api/retrieve-rag`
3. Query text is similar to document content
4. Pinecone index dimensions match embedding model

**Debug:**
- Check if embeddings are being generated
- Verify Pinecone query is working
- Check namespace matches user ID

### Coaching Cues Not Using KB Content
**Check:**
1. RAG context is being retrieved (check logs)
2. LLM is receiving RAG context (check `/api/process-transcript` logs)
3. Document content is relevant to query

**Expected log output:**
```
[process-transcript] Processing with LLM
[llmProcessor] RAG context retrieved: "..."
[llmProcessor] Coaching cue generated with context
```

## Quick Test Script

You can also test the API endpoints directly:

### Test Embedding Generation
```bash
curl -X POST https://your-app.vercel.app/api/generate-embedding \
  -H "Content-Type: application/json" \
  -d '{"text": "test embedding"}'
```

### Test RAG Retrieval
```bash
curl -X POST https://your-app.vercel.app/api/retrieve-rag \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "query": "pricing strategy",
    "topK": 5
  }'
```

## Success Criteria

✅ **Document Upload:**
- Documents upload successfully
- Status reaches "indexed"
- Vectors stored in Pinecone

✅ **RAG Retrieval:**
- Relevant chunks retrieved during calls
- Coaching cues reference KB content
- No errors in logs

✅ **End-to-End:**
- Upload document → Start call → Mention topic → Get KB-enhanced cue

## Next Steps After Testing

Once everything works:
1. Upload your real playbooks and battlecards
2. Test with actual sales scenarios
3. Monitor performance and costs
4. Fine-tune chunk sizes if needed

