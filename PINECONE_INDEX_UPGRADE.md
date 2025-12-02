# Pinecone Index Dimension Upgrade Guide

## Current Issue

Your Pinecone index is configured for **384 dimensions**, but Jina API returns **768-dimensional embeddings**. 

The code currently truncates Jina embeddings to 384 dimensions to maintain compatibility, but this loses information and reduces embedding quality.

## Solution: Upgrade Index to 768 Dimensions ⭐ Recommended

**Why 768?** Jina API (`jina-embeddings-v2-base-en`) returns exactly 768 dimensions. Using 768 matches perfectly - no wasted space, no information loss.

**Why NOT 1024?** If you use 1024, you'd need to pad the 768-dim embeddings with 256 zeros, which:
- Wastes storage space
- Doesn't improve quality (zeros add no information)
- Increases costs unnecessarily

### Step-by-Step: Create New 768-Dimension Index

1. **Create a new Pinecone index** with 768 dimensions:
   - Go to [Pinecone Console](https://app.pinecone.io)
   - Click "Create Index"
   - **Name**: `ghost-knowledge-base-768` (or your preferred name)
   - **Dimensions**: `768` ⭐ (matches Jina API exactly)
   - **Metric**: `cosine`
   - **Pod Type**: `s1.x1` (free tier) or higher

2. **Update environment variable**:
   - In Vercel: Settings → Environment Variables
   - Update `PINECONE_INDEX_NAME` to the new index name
   - Redeploy

3. **Re-index all documents**:
   - Delete old documents from the Knowledge Base UI
   - Re-upload them (they'll be indexed with 768-dim embeddings)

4. **Delete old index** (optional):
   - Once verified, delete the old 384-dim index to save resources

### Option 2: Keep Current Setup

If you want to keep using 384 dimensions:
- The code automatically truncates Jina embeddings to 384
- This works but reduces embedding quality
- Consider switching to a 384-dim embedding model instead

## Recommended Embedding Dimensions

- **Jina API**: **768 dimensions** ⭐ (current, matches exactly - recommended)
- **OpenAI text-embedding-3-small**: 1536 dimensions (requires index upgrade to 1536)
- **Hugging Face all-MiniLM-L6-v2**: 384 dimensions (if it worked)

**For your setup with Jina API: Use 768 dimensions** - it's the perfect match!

## After Upgrading

Once you've created the new 768-dim index and updated `PINECONE_INDEX_NAME`:
1. Remove the truncation code in `api/store-document.js` and `api/retrieve-rag.js`
2. Redeploy
3. Re-index all documents

The truncation code is marked with `// TODO: Update Pinecone index to 768 dimensions` - remove it after upgrading.

