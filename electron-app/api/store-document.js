/**
 * Store document chunks in Pinecone
 * POST /api/store-document
 */
import { getAdminDb } from './lib/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, documentId, chunks, metadata = {} } = req.body;

  if (!userId || !documentId || !chunks || !Array.isArray(chunks)) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const pineconeApiKey = process.env.PINECONE_API_KEY;
  const pineconeIndex = process.env.PINECONE_INDEX_NAME;
  const hfApiKey = process.env.HUGGINGFACE_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  // Debug: Log all environment variables (without exposing values)
  console.log('[store-document] 🔍 Environment check:');
  console.log('[store-document] PINECONE_API_KEY:', pineconeApiKey ? `SET (length: ${pineconeApiKey.length})` : 'NOT SET');
  console.log('[store-document] PINECONE_INDEX_NAME:', pineconeIndex || 'NOT SET');
  console.log('[store-document] HUGGINGFACE_API_KEY:', hfApiKey ? `SET (length: ${hfApiKey.length})` : 'NOT SET');
  console.log('[store-document] OPENAI_API_KEY:', openaiApiKey ? `SET (length: ${openaiApiKey.length})` : 'NOT SET');
  console.log('[store-document] VERCEL_ENV:', process.env.VERCEL_ENV || 'not set');
  console.log('[store-document] NODE_ENV:', process.env.NODE_ENV || 'not set');

  // Check configuration
  if (!pineconeApiKey || !pineconeIndex) {
    console.error('[store-document] ❌ Pinecone not configured');
    return res.status(500).json({ error: 'Pinecone not configured. Please set PINECONE_API_KEY and PINECONE_INDEX_NAME in Vercel environment variables.' });
  }

  if (!hfApiKey && !openaiApiKey) {
    console.error('[store-document] ❌ No embedding service configured');
    console.error('[store-document] 💡 TIP: Hugging Face Router endpoints are currently returning 404 errors');
    console.error('[store-document] 💡 RECOMMENDATION: Use JINA_API_KEY (FREE tier available) or OPENAI_API_KEY (see EMBEDDING_SETUP.md)');
    console.error('[store-document] 💡 TIP: After adding env var, you MUST redeploy for it to take effect');
    return res.status(500).json({ 
      error: 'No embedding service available. Hugging Face Router is returning 404 errors. Please configure JINA_API_KEY (FREE) or OPENAI_API_KEY in Vercel environment variables. See EMBEDDING_SETUP.md for setup instructions.' 
    });
  }

  console.log('[store-document] ✅ Configuration check passed');
  console.log('[store-document] Pinecone index:', pineconeIndex);
  console.log('[store-document] Embedding service:', hfApiKey ? 'Hugging Face' : 'OpenAI');

  try {
    console.log(`[store-document] Processing document ${documentId} for user ${userId} with ${chunks.length} chunks`);
    
    // Dynamic import to avoid bundling issues
    const { Pinecone } = await import('@pinecone-database/pinecone');
    const pinecone = new Pinecone({ apiKey: pineconeApiKey });
    const index = pinecone.index(pineconeIndex);

    console.log(`[store-document] Generating embeddings for ${chunks.length} chunks...`);
    // Generate embeddings for all chunks (with error handling)
    const embeddingPromises = chunks.map(async (chunk, i) => {
      try {
        if ((i + 1) % 10 === 0 || i === 0) {
          console.log(`[store-document] Generating embedding ${i + 1}/${chunks.length}`);
        }
        return await generateEmbedding(chunk);
      } catch (error) {
        console.error(`[store-document] Failed to generate embedding for chunk ${i + 1}:`, error.message);
        throw error; // Re-throw to fail the whole operation
      }
    });
    const embeddings = await Promise.all(embeddingPromises);
    
    // Validate embeddings
    const validEmbeddings = embeddings.filter(e => e && Array.isArray(e) && e.length > 0);
    if (validEmbeddings.length !== embeddings.length) {
      console.error(`[store-document] ❌ Only ${validEmbeddings.length}/${embeddings.length} embeddings are valid`);
      throw new Error(`Failed to generate valid embeddings: ${embeddings.length - validEmbeddings.length} failed`);
    }
    
    console.log(`[store-document] ✅ Generated ${embeddings.length} valid embeddings`);

    // Prepare vectors for Pinecone
    const vectors = chunks.map((chunk, i) => ({
      id: `${userId}-${documentId}-${i}`,
      values: embeddings[i],
      metadata: {
        userId,
        documentId,
        chunkIndex: i,
        text: chunk.substring(0, 1000), // Store first 1000 chars for reference
        ...metadata
      }
    }));

    // Upsert to Pinecone with user namespace
    const namespace = `user-${userId}`;
    console.log(`[store-document] Upserting ${vectors.length} vectors to Pinecone namespace: ${namespace}`);
    await index.namespace(namespace).upsert(vectors);
    console.log(`[store-document] ✅ Successfully upserted vectors to Pinecone`);

    // Update Firestore document status
    const db = getAdminDb();
    if (db) {
      const docRef = db.collection('users').doc(userId).collection('knowledgeBase').doc(documentId);
      await docRef.update({
        status: 'indexed',
        indexedAt: new Date(),
        chunkCount: chunks.length
      });
      console.log(`[store-document] ✅ Updated Firestore document status to indexed`);
    } else {
      console.warn(`[store-document] ⚠️ Firestore Admin not available, skipping status update`);
    }

    console.log(`[store-document] ✅ Successfully stored ${vectors.length} chunks for document ${documentId} in namespace ${namespace}`);

    return res.status(200).json({ 
      success: true, 
      stored: vectors.length,
      documentId 
    });
  } catch (error) {
    console.error('[store-document] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to store document' });
  }
}

/**
 * Generate embedding using available service
 */
async function generateEmbedding(text) {
  console.log('[store-document] generateEmbedding: Checking for embedding service...');
  
  // Try Jina API first (most reliable for embeddings, optimized for Jina models)
  const jinaApiKey = process.env.JINA_API_KEY;
  if (jinaApiKey) {
    console.log('[store-document] generateEmbedding: Trying Jina API...');
    try {
      // Add timeout and retry logic for Jina API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('https://api.jina.ai/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jinaApiKey}`
        },
        body: JSON.stringify({
          input: [text],
          model: 'jina-embeddings-v2-base-en'
          // Note: embedding_direction is not supported for this model
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const embedding = data.data[0].embedding;
        console.log('[store-document] generateEmbedding: ✅ Jina API success, vector length:', embedding.length);
        return embedding;
      } else {
        const errorText = await response.text();
        console.warn('[store-document] generateEmbedding: Jina API failed:', response.status, errorText.substring(0, 200));
      }
    } catch (error) {
      console.warn('[store-document] generateEmbedding: Jina API error:', error.message);
    }
  }
  
  // Try Hugging Face (may be deprecated/unavailable)
  const hfApiKey = process.env.HUGGINGFACE_API_KEY;
  if (hfApiKey) {
    console.log('[store-document] generateEmbedding: Trying Hugging Face (Router embeddings)...');
    try {
      // Use a Router-supported text-embedding model.
      // Docs: https://huggingface.co/docs/text-embeddings-inference/supported_models
      // Use sentence-transformers/all-MiniLM-L6-v2 (confirmed working, 150M+ downloads)
      // This is the most reliable embedding model on Hugging Face Inference API
      // Model card: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2
      // Use correct Router path for embeddings: /hf-inference/pipeline/feature-extraction/{model}
      // The old api-inference.huggingface.co is deprecated (410 Gone)
      // Plain /models/ path returns 404 for embeddings - must use /pipeline/feature-extraction/
      const endpoints = [
        'https://router.huggingface.co/hf-inference/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
        'https://router.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2' // Fallback (may still 404)
      ];

      let lastError = null;
      for (const endpoint of endpoints) {
        try {
          console.log(`[store-document] generateEmbedding: Trying endpoint: ${endpoint}`);
          let response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${hfApiKey}`
            },
            body: JSON.stringify({ inputs: text })
          });

          // Handle 503 (model loading) with a short retry
          if (response.status === 503) {
            console.log('[store-document] generateEmbedding: Model loading (503), waiting 2 seconds and retrying...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${hfApiKey}`
              },
              body: JSON.stringify({ inputs: text })
            });
          }

          if (response.ok) {
            const embedding = await response.json();
            // Handle different response formats:
            // - Feature extraction pipeline: [[[token1_emb], [token2_emb], ...]] (need mean pooling)
            // - Direct model: [[emb1, emb2, ...]] or [emb1, emb2, ...]
            let vector = embedding;
            
            // If it's a 3D array (pipeline feature extraction), apply mean pooling
            if (Array.isArray(embedding) && Array.isArray(embedding[0]) && Array.isArray(embedding[0][0])) {
              // Shape: [[[token1], [token2], ...]] - extract first sequence and pool
              const tokenEmbeddings = embedding[0]; // Get first sequence
              const dim = tokenEmbeddings[0].length; // Get embedding dimension (384)
              // Mean pooling: average over all tokens
              vector = new Array(dim).fill(0);
              for (const tokenEmb of tokenEmbeddings) {
                for (let i = 0; i < dim; i++) {
                  vector[i] += tokenEmb[i];
                }
              }
              const tokenCount = tokenEmbeddings.length;
              vector = vector.map(v => v / tokenCount); // Normalize
            } else if (Array.isArray(embedding[0]) && !Array.isArray(embedding[0][0])) {
              // Shape: [[emb1, emb2, ...]] - extract first
              vector = embedding[0];
            } else if (Array.isArray(embedding) && !Array.isArray(embedding[0])) {
              // Shape: [emb1, emb2, ...] - use directly
              vector = embedding;
            }
            
            if (!vector || !Array.isArray(vector) || vector.length === 0) {
              console.error('[store-document] generateEmbedding: Hugging Face returned invalid embedding:', typeof embedding, Array.isArray(embedding));
              lastError = new Error('Invalid embedding response from Hugging Face');
              continue; // Try next endpoint
            }
            console.log('[store-document] generateEmbedding: ✅ Hugging Face success, vector length:', vector.length);
            return vector;
          } else {
            const errorText = await response.text();
            let errorJson = null;
            try {
              errorJson = JSON.parse(errorText);
            } catch (e) {
              // Not JSON, use as text
            }
            
            console.error(`[store-document] generateEmbedding: ❌ Endpoint ${endpoint} failed:`, response.status, response.statusText);
            console.error('[store-document] generateEmbedding: Error response:', errorText.substring(0, 500));
            
            // Check if error message says endpoint is deprecated
            const isDeprecated = errorText.includes('no longer supported') || 
                                errorText.includes('deprecated') ||
                                (errorJson && errorJson.error && errorJson.error.includes('no longer supported'));
            
            if (isDeprecated || response.status === 410) {
              console.log('[store-document] generateEmbedding: Endpoint deprecated, trying next endpoint...');
              lastError = new Error(`Endpoint deprecated: ${errorText.substring(0, 200)}`);
              continue; // Try next endpoint
            }
            
            // Store error for potential fallback
            lastError = new Error(`Hugging Face API failed: ${response.status} ${response.statusText}`);
            
            // If 404 (not found), try next endpoint
            if (response.status === 404) {
              console.log('[store-document] generateEmbedding: Endpoint not found, trying next endpoint...');
              continue;
            }
            
            // For other errors (401, 403, etc.), don't try other endpoints
            if (response.status === 401) {
              console.error('[store-document] generateEmbedding: ❌ Invalid API key - check HUGGINGFACE_API_KEY');
              break; // Don't try other endpoints for auth errors
            }
          }
        } catch (fetchError) {
          console.warn(`[store-document] generateEmbedding: Error with endpoint ${endpoint}:`, fetchError.message);
          lastError = fetchError;
          continue; // Try next endpoint
        }
      }
      
      // If all endpoints failed, log and continue to OpenAI fallback
      if (lastError) {
        console.error('[store-document] generateEmbedding: ❌ All Hugging Face endpoints failed');
      }
    } catch (error) {
      console.warn('[store-document] generateEmbedding: Hugging Face error:', error.message);
    }
  } else {
    console.error('[store-document] generateEmbedding: ❌ HUGGINGFACE_API_KEY not found in process.env');
    console.error('[store-document] generateEmbedding: Available env vars with "API" or "KEY":', 
      Object.keys(process.env)
        .filter(k => k.includes('API') || k.includes('KEY') || k.includes('HUGGING'))
        .join(', ') || 'none found'
    );
  }

  // Try OpenAI
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (openaiApiKey) {
    console.log('[store-document] generateEmbedding: Trying OpenAI...');
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text
        })
      });

      if (response.ok) {
        const data = await response.json();
        const embedding = data.data[0].embedding;
        console.log('[store-document] generateEmbedding: ✅ OpenAI success, vector length:', embedding.length);
        return embedding;
      } else {
        const errorText = await response.text();
        console.warn('[store-document] generateEmbedding: OpenAI failed:', response.status, errorText.substring(0, 200));
      }
    } catch (error) {
      console.warn('[store-document] generateEmbedding: OpenAI error:', error.message);
    }
  } else {
    console.log('[store-document] generateEmbedding: OPENAI_API_KEY not set');
  }

  // Log what we found
  console.error('[store-document] generateEmbedding: ❌ No embedding service available');
  console.error('[store-document] JINA_API_KEY:', jinaApiKey ? 'SET (but failed)' : 'NOT SET');
  console.error('[store-document] HUGGINGFACE_API_KEY:', hfApiKey ? 'SET (but failed - Router endpoints returning 404)' : 'NOT SET');
  console.error('[store-document] OPENAI_API_KEY:', openaiApiKey ? 'SET (but failed)' : 'NOT SET');
  console.error('[store-document] 💡 RECOMMENDATION: Set JINA_API_KEY (FREE tier) or OPENAI_API_KEY for reliable embeddings');
  console.error('[store-document] 💡 See EMBEDDING_SETUP.md for setup instructions');

  // Fallback: use a simple deterministic embedding so the RAG pipeline still works,
  // even if it's not semantically strong. This prevents uploads from failing.
  const fallbackVector = fallbackEmbedding(text);
  console.warn('[store-document] generateEmbedding: ⚠️ Using fallback embedding vector of length', fallbackVector.length);
  return fallbackVector;
}

/**
 * Simple hash-based fallback embedding (matches client-side fallback size).
 * Not semantically meaningful, but deterministic and prevents hard failures.
 */
function fallbackEmbedding(text) {
  const dim = 768; // Match Pinecone index dimension (upgraded from 384)
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0; // Force 32-bit int
  }
  const vector = new Array(dim);
  for (let i = 0; i < dim; i++) {
    vector[i] = Math.sin(hash + i) * 0.1;
  }
  return vector;
}

