/**
 * RAG Service for Knowledge Base retrieval
 * Complete Pinecone integration with embedding generation
 */

export class RAGService {
  constructor() {
    this.pineconeApiKey = null;
    this.pineconeIndex = null;
    this.pineconeClient = null;
    this.index = null;
  }

  async initialize(apiKey, indexName, environment = null) {
    this.pineconeApiKey = apiKey;
    this.pineconeIndex = indexName;
    
    if (!apiKey || !indexName) {
      console.warn('[RAG] Pinecone not configured');
      return;
    }

    // Client-side: Pinecone operations are handled via API endpoints
    // No need to initialize Pinecone client on the client
    console.log('[RAG] Pinecone configured (using API endpoints)');
  }

  /**
   * Generate embedding for text using Hugging Face Inference API (free tier)
   * or OpenAI embeddings as fallback
   */
  async generateEmbedding(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input for embedding');
    }

    // Note: Embeddings are generated server-side in store-document.js and retrieve-rag.js
    // This client-side function is only used as a fallback for offline/development
    try {
      // Option 1: Try Hugging Face Inference API directly (if API key is exposed to client)
      const hfApiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
      if (hfApiKey) {
        // Use sentence-transformers/all-MiniLM-L6-v2 (confirmed working, most reliable)
        const endpoints = [
          `https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2`,
          `https://router.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2`
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
              return Array.isArray(embedding[0]) ? embedding[0] : embedding;
            }
          } catch (error) {
            // Try next endpoint
          }
        }
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${hfApiKey}`
          },
          body: JSON.stringify({
            inputs: text,
            options: { wait_for_model: true }
          })
        });

        if (response.ok) {
          const embedding = await response.json();
          return Array.isArray(embedding[0]) ? embedding[0] : embedding;
        }
      }

      // Fallback: Use a simple hash-based embedding (not semantic, but prevents errors)
      console.warn('[RAG] Embedding API unavailable, using fallback embedding');
      return this.fallbackEmbedding(text);
    } catch (error) {
      console.error('[RAG] Embedding generation error:', error);
      return this.fallbackEmbedding(text);
    }
  }

  fallbackEmbedding(text) {
    // Simple hash-based embedding (not semantic, but prevents errors)
    const hash = text.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    return Array(384).fill(0).map((_, i) => Math.sin(hash + i) * 0.1);
  }

  /**
   * Chunk document into semantic pieces
   */
  chunkDocument(text, chunkSize = 500, overlap = 50) {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const words = text.split(/\s+/);
    const chunks = [];

    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim().length > 0) {
        chunks.push({
          text: chunk,
          index: chunks.length,
          startWord: i,
          endWord: Math.min(i + chunkSize, words.length)
        });
      }
    }

    return chunks;
  }

  /**
   * Store document chunks in Pinecone via API endpoint
   */
  async storeDocument(userId, documentId, text, metadata = {}) {
    if (!userId || !documentId || !text) {
      throw new Error('Missing required parameters for storeDocument');
    }

    try {
      // Chunk the document
      const chunks = this.chunkDocument(text);
      if (chunks.length === 0) {
        console.warn('[RAG] No chunks generated from document');
        return { success: false, chunks: 0 };
      }

      // Use server-side API to process and store
      console.log(`[RAG] Calling /api/store-document with ${chunks.length} chunks for document ${documentId}`);
      const response = await fetch('/api/store-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          documentId,
          chunks: chunks.map(c => c.text),
          metadata: {
            ...metadata,
            documentId,
            chunkCount: chunks.length
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[RAG] Store document API error:', errorData);
        throw new Error(errorData.error || `Failed to store document: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`[RAG] ✅ Stored ${result.stored} chunks for document ${documentId} in Pinecone`);
      return { success: true, chunks: result.stored };
    } catch (error) {
      console.error('[RAG] Error storing document:', error);
      throw error;
    }
  }

  /**
   * Query Pinecone for relevant context via API endpoint
   */
  async retrieveContext(userId, queryText, topK = 5) {
    if (!userId || !queryText) {
      return null;
    }

    try {
      const response = await fetch('/api/retrieve-rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          query: queryText,
          topK
        })
      });

      if (!response.ok) {
        console.warn('[RAG] RAG retrieval failed:', response.statusText);
        return null;
      }

      const { context } = await response.json();
      return context;
    } catch (error) {
      console.error('[RAG] RAG retrieval error:', error);
      return null;
    }
  }

  /**
   * Delete document from Pinecone
   */
  async deleteDocument(userId, documentId) {
    if (!userId || !documentId) {
      return;
    }

    try {
      const response = await fetch('/api/delete-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, documentId })
      });

      if (response.ok) {
        console.log(`[RAG] Deleted document ${documentId} from Pinecone`);
      }
    } catch (error) {
      console.error('[RAG] Error deleting document:', error);
    }
  }
}

export const ragService = new RAGService();
