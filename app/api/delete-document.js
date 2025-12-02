/**
 * Delete document from Pinecone
 * POST /api/delete-document
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, documentId } = req.body;

  if (!userId || !documentId) {
    return res.status(400).json({ error: 'Missing userId or documentId' });
  }

  const pineconeApiKey = process.env.PINECONE_API_KEY;
  const pineconeIndex = process.env.PINECONE_INDEX_NAME;

  if (!pineconeApiKey || !pineconeIndex) {
    return res.status(200).json({ success: true }); // Graceful degradation
  }

  try {
    const { Pinecone } = await import('@pinecone-database/pinecone');
    const pinecone = new Pinecone({ apiKey: pineconeApiKey });
    const index = pinecone.index(pineconeIndex);

    const namespace = `user-${userId}`;
    
    // Delete all vectors with this documentId
    // Note: Pinecone doesn't support delete by metadata filter directly
    // We need to query first, then delete by IDs
    const queryResponse = await index.namespace(namespace).query({
      vector: Array(384).fill(0.001), // Small non-zero vector for metadata-only query
      topK: 10000, // Get all vectors for this document
      filter: {
        documentId: { $eq: documentId }
      },
      includeMetadata: true
    });

    if (queryResponse.matches.length > 0) {
      const idsToDelete = queryResponse.matches.map(match => match.id);
      await index.namespace(namespace).deleteMany(idsToDelete);
      console.log(`[delete-document] Deleted ${idsToDelete.length} vectors for document ${documentId}`);
    }

    return res.status(200).json({ 
      success: true,
      deleted: queryResponse.matches.length
    });
  } catch (error) {
    console.error('[delete-document] Error:', error);
    // Still return success to avoid blocking document deletion in Firestore
    return res.status(200).json({ success: true });
  }
}

