import { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { getFirestoreDb } from '../services/firebase.js';

const STATUS_FLOW = ['pending', 'chunking', 'indexed'];

export const useKnowledgeBase = (userId, options = {}) => {
  const [documents, setDocuments] = useState([]);
  // Support both old maxDocuments (for backward compatibility) and new maxSizeBytes
  const maxSizeBytes =
    typeof options.maxSizeBytes === 'number' 
      ? options.maxSizeBytes 
      : typeof options.maxDocuments === 'number'
      ? Number.POSITIVE_INFINITY // Old API - treat as unlimited size if using document count
      : Number.POSITIVE_INFINITY;
  const db = getFirestoreDb();

  const collectionRef = useMemo(() => {
    if (!userId) return null;
    return collection(db, 'users', userId, 'knowledgeBase');
  }, [db, userId]);

  useEffect(() => {
    if (!collectionRef) {
      setDocuments([]);
      return;
    }

    return onSnapshot(collectionRef, (snapshot) => {
      setDocuments(
        snapshot.docs
          .map((docSnapshot) => {
            const data = docSnapshot.data();
            const createdAt =
              data.createdAt && typeof data.createdAt.toDate === 'function'
                ? data.createdAt.toDate().toISOString()
                : new Date().toISOString();

            return {
              id: docSnapshot.id,
              ...data,
              createdAt
            };
          })
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      );
    });
  }, [collectionRef]);

  // Calculate total size of all documents
  const totalSize = useMemo(() => {
    return documents.reduce((sum, doc) => sum + (doc.size || 0), 0);
  }, [documents]);

  // Check if limit is reached based on total size
  const limitReached = useMemo(() => {
    if (!Number.isFinite(maxSizeBytes)) {
      return false; // Unlimited
    }
    return totalSize >= maxSizeBytes;
  }, [totalSize, maxSizeBytes]);

  // Check if adding this file would exceed the limit
  const wouldExceedLimit = (fileSize) => {
    if (!Number.isFinite(maxSizeBytes)) {
      return false; // Unlimited
    }
    return (totalSize + fileSize) > maxSizeBytes;
  };

  const uploadDocument = async (file) => {
    if (limitReached) {
      throw new Error('Knowledge base storage limit reached for your current plan.');
    }

    if (wouldExceedLimit(file.size)) {
      const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
      };
      const remaining = maxSizeBytes - totalSize;
      throw new Error(
        `File size (${formatBytes(file.size)}) would exceed your plan's storage limit. ` +
        `You have ${formatBytes(remaining)} remaining of ${formatBytes(maxSizeBytes)} total.`
      );
    }

    const baseDoc = {
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      status: 'pending'
    };

    if (!collectionRef) {
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      setDocuments((prev) => [{ id, ...baseDoc, createdAt }, ...prev]);
      STATUS_FLOW.slice(1).forEach((status, index) => {
        setTimeout(() => {
          setDocuments((prev) =>
            prev.map((docItem) => (docItem.id === id ? { ...docItem, status } : docItem))
          );
        }, (index + 1) * 1200);
      });
      return;
    }

    const docData = {
      ...baseDoc,
      createdAt: serverTimestamp()
    };

    try {
      const docRef = await addDoc(collectionRef, docData);
      const documentId = docRef.id;

      // Read file content and process for RAG
      const fileText = await readFileContent(file);
      
      // Update status to chunking
      await updateDoc(docRef, { status: 'chunking' });

      // Process document for RAG (chunk, embed, store in Pinecone)
      try {
        console.log('[useKnowledgeBase] Starting RAG processing for document:', documentId);
        const { ragService } = await import('../services/ragService.js');
        const result = await ragService.storeDocument(userId, documentId, fileText, {
          name: file.name,
          size: file.size,
          type: file.type
        });
        
        console.log('[useKnowledgeBase] ✅ RAG processing complete:', result);
        
        // Update status to indexed
        await updateDoc(docRef, { 
          status: 'indexed',
          indexedAt: serverTimestamp(),
          chunkCount: result.chunks
        });
      } catch (ragError) {
        console.error('[useKnowledgeBase] ❌ RAG processing failed:', ragError);
        // Still mark as indexed even if RAG fails (graceful degradation)
        await updateDoc(docRef, { 
          status: 'indexed',
          indexedAt: serverTimestamp(),
          ragError: ragError.message
        });
      }
    } catch (error) {
      console.error('Failed to upload knowledge base doc', error);
      throw error;
    }
  };

  /**
   * Read file content as text
   */
  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        if (!text || text.trim().length === 0) {
          reject(new Error('File appears to be empty or could not be read as text.'));
          return;
        }
        resolve(text);
      };
      reader.onerror = (error) => {
        console.error('[useKnowledgeBase] FileReader error:', error);
        reject(new Error('Failed to read file. Please ensure it\'s a valid text file.'));
      };
      
      // Handle different file types
      const fileType = file.type || '';
      const fileName = file.name.toLowerCase();
      
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        // PDF requires special handling - for now, return placeholder
        // TODO: Integrate PDF.js or use server-side processing
        reject(new Error('PDF processing not yet implemented. Please upload text files (.txt, .md, .docx).'));
      } else if (
        fileType.startsWith('text/') || 
        fileType === 'application/json' ||
        fileName.endsWith('.txt') ||
        fileName.endsWith('.md') ||
        fileName.endsWith('.markdown') ||
        fileName.endsWith('.docx') ||
        fileName.endsWith('.doc')
      ) {
        // Try reading as text
        reader.readAsText(file);
      } else {
        // For unknown types, try reading as text anyway
        console.warn('[useKnowledgeBase] Unknown file type, attempting to read as text:', fileType, fileName);
        reader.readAsText(file);
      }
    });
  };

  const removeDocument = async (id) => {
    if (collectionRef) {
      try {
        // Delete from Pinecone first
        try {
          const { ragService } = await import('../services/ragService.js');
          await ragService.deleteDocument(userId, id);
        } catch (ragError) {
          console.warn('[useKnowledgeBase] Failed to delete from Pinecone:', ragError);
          // Continue with Firestore deletion even if Pinecone fails
        }

        // Delete from Firestore
        await deleteDoc(doc(collectionRef, id));
      } catch (error) {
        console.error('Failed to delete doc', error);
        throw error;
      }
      return;
    }

    setDocuments((prev) => prev.filter((docItem) => docItem.id !== id));
  };

  return {
    documents,
    uploadDocument,
    removeDocument,
    limitReached,
    totalSize,
    maxSizeBytes,
    // Legacy support
    maxDocuments: Number.isFinite(maxSizeBytes) ? undefined : Number.POSITIVE_INFINITY
  };
};
