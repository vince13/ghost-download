# Embedding Service Setup Guide

## Current Status

Hugging Face Router endpoints are currently returning 404 errors for embedding models. The following alternatives are available:

## Option 1: Jina API (Recommended for Jina Models)

**Pros:**
- Optimized for Jina embedding models
- Handles long inputs (up to 8192 tokens)
- 768-dimensional embeddings (better quality than 384-dim)
- Reliable and scalable

**Setup:**
1. Sign up at https://jina.ai/embeddings
2. Get your free API key
3. Add to Vercel: `JINA_API_KEY` (Production environment)
4. Redeploy

**Cost:** Free tier available, then pay-as-you-go

## Option 2: OpenAI Embeddings (Most Reliable)

**Pros:**
- Most reliable and widely used
- High-quality embeddings (1536 dimensions)
- Excellent documentation and support
- Works consistently

**Setup:**
1. Get API key from https://platform.openai.com/api-keys
2. Add to Vercel: `OPENAI_API_KEY` (Production environment)
3. Redeploy

**Cost:** $0.02 per 1M tokens (very affordable)

## Option 3: Hugging Face (Currently Broken)

Hugging Face Router endpoints are returning 404 errors. This appears to be a temporary issue with their API migration. Once fixed, the code will automatically use it if `HUGGINGFACE_API_KEY` is set.

## Priority Order

The code tries embedding services in this order:
1. **Jina API** (if `JINA_API_KEY` is set)
2. **Hugging Face** (if `HUGGINGFACE_API_KEY` is set) - Currently broken
3. **OpenAI** (if `OPENAI_API_KEY` is set)
4. **Fallback** (hash-based, not semantic)

## Recommendation

**For FREE production use:** Use **Jina API** - it has a generous free tier and works reliably.

**For paid production:** Use **OpenAI embeddings** (`text-embedding-3-small`) - it's the most reliable option, but costs money.

## Quick Setup (Jina API - FREE)

1. Go to https://jina.ai/embeddings
2. Sign up for a free account
3. Get your API key from the dashboard
4. In Vercel: Settings → Environment Variables
5. Add: `JINA_API_KEY` = `jina_...`
6. Set for: Production (and Preview if needed)
7. Redeploy

After redeploy, you'll see:
- `✅ Jina API success, vector length: 768`
- No more 404 errors
- Real semantic embeddings
- **FREE** (within tier limits)

## Alternative: Keep Using Fallback Embeddings

If you don't want to set up an API key right now, the system will continue using hash-based fallback embeddings. These work for storing documents but **won't provide semantic search** - they're just deterministic vectors for testing.

**Note:** For real RAG (Retrieval Augmented Generation) functionality, you need real semantic embeddings from Jina or OpenAI.
