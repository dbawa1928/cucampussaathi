import { Types } from 'mongoose';
import { DocumentChunkModel, IDocumentChunk } from '../models/DocumentChunk';

export interface ScoredChunk {
  chunk: IDocumentChunk;
  score: number;
  matchedTerms: string[];
}

export interface RetrievalResult {
  chunks: IDocumentChunk[];
  retrievalMethod: 'bm25-lexical' | 'vector-atlas';
  totalChunksExamined: number;
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will',
  'with', 'the', 'this', 'but', 'they', 'have', 'had', 'what', 'when', 'where',
  'who', 'which', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 'can', 'just', 'should', 'now', 'tell', 'me', 'about'
]);

export class RetrievalService {
  /**
   * Tokenize and normalize query text into informative search tokens.
   */
  tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((term) => term.length > 1 && !STOP_WORDS.has(term));
  }

  /**
   * Retrieve top-K most relevant chunks using BM25 ranking algorithm.
   * Strictly enforces document ownership filtering.
   */
  async retrieveRelevantChunks(
    documentId: string | Types.ObjectId,
    ownerId: string | Types.ObjectId,
    query: string,
    topK = 4
  ): Promise<RetrievalResult> {
    const docObjId = typeof documentId === 'string' ? new Types.ObjectId(documentId) : documentId;
    const ownerObjId = typeof ownerId === 'string' ? new Types.ObjectId(ownerId) : ownerId;

    // Fetch all chunks for this specific document and verified owner
    const allChunks = await DocumentChunkModel.find({
      document: docObjId,
      owner: ownerObjId,
    }).sort({ chunkIndex: 1 });

    if (!allChunks || allChunks.length === 0) {
      return {
        chunks: [],
        retrievalMethod: 'bm25-lexical',
        totalChunksExamined: 0,
      };
    }

    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) {
      // If query only contains stop words, return initial document chunks as default context
      return {
        chunks: allChunks.slice(0, topK),
        retrievalMethod: 'bm25-lexical',
        totalChunksExamined: allChunks.length,
      };
    }

    // --- BM25 Calculation ---
    const N = allChunks.length;
    const k1 = 1.5;
    const b = 0.75;

    // 1. Calculate chunk lengths & average length
    const docTokensList = allChunks.map((chunk) => this.tokenize(chunk.content));
    const totalTokensCount = docTokensList.reduce((sum, tokens) => sum + tokens.length, 0);
    const avgdl = totalTokensCount / (N || 1);

    // 2. Calculate document frequency n(q) for each query token
    const docFreq: Record<string, number> = {};
    for (const q of queryTokens) {
      let count = 0;
      for (const dTokens of docTokensList) {
        if (dTokens.includes(q)) count++;
      }
      docFreq[q] = count;
    }

    // 3. Score each chunk using BM25 with exact phrase boosting
    const normalizedQueryLower = query.toLowerCase().trim();
    const scoredList: ScoredChunk[] = [];

    for (let i = 0; i < N; i++) {
      const chunk = allChunks[i];
      const dTokens = docTokensList[i];
      const docLen = dTokens.length;

      let score = 0;
      const matchedTerms: string[] = [];

      // Term Frequency table for this chunk
      const tfMap: Record<string, number> = {};
      for (const term of dTokens) {
        tfMap[term] = (tfMap[term] || 0) + 1;
      }

      for (const q of queryTokens) {
        const tf = tfMap[q] || 0;
        if (tf > 0) {
          matchedTerms.push(q);
          const nq = docFreq[q] || 1;
          const idf = Math.log((N - nq + 0.5) / (nq + 0.5) + 1);
          const numerator = tf * (k1 + 1);
          const denominator = tf + k1 * (1 - b + b * (docLen / (avgdl || 1)));
          score += idf * (numerator / denominator);
        }
      }

      // Exact phrase bonus if contiguous sequence appears in chunk
      if (normalizedQueryLower.length > 5 && chunk.content.toLowerCase().includes(normalizedQueryLower)) {
        score += 3.0;
      }

      if (score > 0) {
        scoredList.push({
          chunk,
          score,
          matchedTerms,
        });
      }
    }

    // Sort by descending BM25 score
    scoredList.sort((a, b) => b.score - a.score);

    // 4. Duplicate chunk removal (filter out overlapping adjacent chunks with same content)
    const selectedChunks: IDocumentChunk[] = [];
    const seenContents = new Set<string>();

    for (const item of scoredList) {
      // Create a fingerprint from first 100 characters to detect redundant overlap
      const fingerprint = item.chunk.content.substring(0, 80).toLowerCase().trim();
      if (!seenContents.has(fingerprint)) {
        seenContents.add(fingerprint);
        selectedChunks.push(item.chunk);
      }
      if (selectedChunks.length >= topK) break;
    }

    // If no BM25 matches were found (unusual words/synonyms), fallback to first top-K overview chunks
    const finalChunks =
      selectedChunks.length > 0 ? selectedChunks : allChunks.slice(0, Math.min(topK, allChunks.length));

    // Sort retrieved chunks chronologically by pageNumber & chunkIndex for natural narrative reading
    finalChunks.sort((a, b) => {
      if (a.pageNumber !== b.pageNumber) return a.pageNumber - b.pageNumber;
      return a.chunkIndex - b.chunkIndex;
    });

    return {
      chunks: finalChunks,
      retrievalMethod: 'bm25-lexical',
      totalChunksExamined: N,
    };
  }
}

export const retrievalService = new RetrievalService();
