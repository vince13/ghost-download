/**
 * Retrieve relevant context from Pinecone using RAG
 * POST /api/retrieve-rag
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, query, topK = 5 } = req.body;

  if (!userId || !query) {
    return res.status(400).json({ error: 'Missing userId or query' });
  }

  const pineconeApiKey = process.env.PINECONE_API_KEY;
  const pineconeIndex = process.env.PINECONE_INDEX_NAME;

  if (!pineconeApiKey || !pineconeIndex) {
    return res.status(200).json({ context: null }); // Graceful degradation
  }

  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Query Pinecone
    const { Pinecone } = await import('@pinecone-database/pinecone');
    const pinecone = new Pinecone({ apiKey: pineconeApiKey });
    const index = pinecone.index(pineconeIndex);

    const namespace = `user-${userId}`;
    const queryResponse = await index.namespace(namespace).query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true
    });

    // Format context from matches
    const context = queryResponse.matches
      .map(match => match.metadata?.text || '')
      .filter(text => text.length > 0)
      .join('\n\n');

    console.log(`[retrieve-rag] ✅ Retrieved ${queryResponse.matches.length} chunks for user ${userId}`);
    if (queryResponse.matches.length > 0) {
      console.log(`[retrieve-rag] Top match score: ${queryResponse.matches[0].score?.toFixed(3)}`);
      console.log(`[retrieve-rag] Context preview: ${context.substring(0, 100)}...`);
    }

    return res.status(200).json({ 
      context: context || null,
      matches: queryResponse.matches.length
    });
  } catch (error) {
    console.error('[retrieve-rag] Error:', error);
    // Return null context on error (graceful degradation)
    return res.status(200).json({ context: null });
  }
}

/**
 * Generate embedding using available service
 */
async function generateEmbedding(text) {
  // Try Jina API first (most reliable for embeddings, optimized for Jina models)
  const jinaApiKey = process.env.JINA_API_KEY;
  if (jinaApiKey) {
    try {
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
        })
      });

      if (response.ok) {
        const data = await response.json();
        const embedding = data.data[0].embedding;
        return embedding;
      } else {
        const errorText = await response.text();
        console.warn('[retrieve-rag] Jina API failed:', response.status, errorText.substring(0, 200));
      }
    } catch (error) {
      console.warn('[retrieve-rag] Jina API error:', error.message);
    }
  }
  
  // Try Hugging Face (may be deprecated/unavailable)
  const hfApiKey = process.env.HUGGINGFACE_API_KEY;
  if (hfApiKey) {
    try {
      // Use correct Router path for embeddings: /hf-inference/pipeline/feature-extraction/{model}
      // The old api-inference.huggingface.co is deprecated (410 Gone)
      // Plain /models/ path returns 404 for embeddings - must use /pipeline/feature-extraction/
      const endpoints = [
        'https://router.huggingface.co/hf-inference/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
        'https://router.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2' // Fallback (may still 404)
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${hfApiKey}`
            },
            body: JSON.stringify({ inputs: text })
          });

          if (response.ok) {
            const embedding = await response.json();
            // Handle different response formats (same as store-document.js)
            let vector = embedding;
            
            // If it's a 3D array (pipeline feature extraction), apply mean pooling
            if (Array.isArray(embedding) && Array.isArray(embedding[0]) && Array.isArray(embedding[0][0])) {
              const tokenEmbeddings = embedding[0];
              const dim = tokenEmbeddings[0].length;
              vector = new Array(dim).fill(0);
              for (const tokenEmb of tokenEmbeddings) {
                for (let i = 0; i < dim; i++) {
                  vector[i] += tokenEmb[i];
                }
              }
              const tokenCount = tokenEmbeddings.length;
              vector = vector.map(v => v / tokenCount);
            } else if (Array.isArray(embedding[0]) && !Array.isArray(embedding[0][0])) {
              vector = embedding[0];
            } else if (Array.isArray(embedding) && !Array.isArray(embedding[0])) {
              vector = embedding;
            }
            
            return vector;
          } else if (response.status !== 404 && response.status !== 410) {
            // If it's not 404/410, log and try next endpoint
            const errorText = await response.text();
            console.warn(`[retrieve-rag] Hugging Face failed (${endpoint}):`, response.status, errorText.substring(0, 200));
          }
        } catch (error) {
          console.warn(`[retrieve-rag] Hugging Face error (${endpoint}):`, error.message);
        }
      }
    } catch (error) {
      console.warn('[retrieve-rag] Hugging Face error:', error.message);
    }
  }

  // Try OpenAI
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (openaiApiKey) {
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
        return data.data[0].embedding;
      } else {
        const errorText = await response.text();
        console.warn('[retrieve-rag] OpenAI failed:', response.status, errorText.substring(0, 200));
      }
    } catch (error) {
      console.warn('[retrieve-rag] OpenAI error:', error.message);
    }
  }

  console.error('[retrieve-rag] ❌ No embedding service available');
  console.error('[retrieve-rag] JINA_API_KEY:', jinaApiKey ? 'SET (but failed)' : 'NOT SET');
  console.error('[retrieve-rag] HUGGINGFACE_API_KEY:', hfApiKey ? 'SET (but failed)' : 'NOT SET');
  console.error('[retrieve-rag] OPENAI_API_KEY:', openaiApiKey ? 'SET (but failed)' : 'NOT SET');

  // Fallback: use the same deterministic embedding as api/store-document.js
  const fallbackVector = fallbackEmbedding(text);
  console.warn('[retrieve-rag] ⚠️ Using fallback embedding vector of length', fallbackVector.length);
  return fallbackVector;
}

function fallbackEmbedding(text) {
  const dim = 768; // Match Pinecone index dimension (upgraded from 384)
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  const vector = new Array(dim);
  for (let i = 0; i < dim; i++) {
    vector[i] = Math.sin(hash + i) * 0.1;
  }
  return vector;
}

