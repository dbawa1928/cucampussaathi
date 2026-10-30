import { PDFParse } from 'pdf-parse';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface DocumentChunkData {
  chunkIndex: number;
  pageNumber: number;
  content: string;
  tokenCount: number;
}

export class PdfProcessingService {
  /**
   * Validate PDF signature (magic bytes: %PDF-).
   * Prevents disguised binary or executable uploads.
   */
  validatePdfSignature(buffer: Buffer): void {
    if (!buffer || buffer.length < 5) {
      throw new AppError('File is empty or too small to be a valid PDF document.', 400);
    }

    const header = buffer.subarray(0, 5).toString('ascii');
    if (!header.startsWith('%PDF-')) {
      throw new AppError(
        'Invalid document signature. Only valid, uncorrupted PDF documents are accepted.',
        400
      );
    }
  }

  /**
   * Clean raw extracted text by removing control characters, excess whitespace,
   * while preserving natural paragraph and sentence structure.
   */
  cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\0/g, '') // remove null characters
      .replace(/[\t ]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Extract text from PDF buffer page-by-page.
   * Preserves exact page numbers for Grounded RAG citations.
   */
  async extractPages(buffer: Buffer): Promise<{ pages: ExtractedPage[]; totalTextLength: number }> {
    this.validatePdfSignature(buffer);

    let parser: any = null;
    try {
      parser = new PDFParse({ data: buffer });
      const parseResult = await parser.getText({
        lineEnforce: true,
      });

      const pages: ExtractedPage[] = [];
      let totalTextLength = 0;

      if (parseResult.pages && parseResult.pages.length > 0) {
        for (const p of parseResult.pages) {
          const cleaned = this.cleanText(p.text || '');
          totalTextLength += cleaned.length;
          pages.push({
            pageNumber: p.num || pages.length + 1,
            text: cleaned,
          });
        }
      } else if (parseResult.text) {
        // Fallback for single page or unstructured parse
        const cleaned = this.cleanText(parseResult.text);
        totalTextLength = cleaned.length;
        pages.push({
          pageNumber: 1,
          text: cleaned,
        });
      }

      // Detect empty or scanned image PDFs
      if (totalTextLength < 30) {
        throw new AppError(
          'This PDF document contains no extractable text. Scanned document images without embedded text layers require OCR, which is not currently available.',
          422
        );
      }

      return { pages, totalTextLength };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to parse PDF document', err);
      throw new AppError(
        `Failed to parse PDF: ${err.message || 'Corrupted or password-protected PDF document.'}`,
        400
      );
    } finally {
      if (parser && typeof parser.destroy === 'function') {
        await parser.destroy().catch(() => {});
      }
    }
  }

  /**
   * Split extracted pages into context-rich, overlapping chunks.
   * Respects sentence and paragraph boundaries to prevent context fragmentation.
   */
  createChunks(
    pages: ExtractedPage[],
    chunkSizeTokens = env.RAG_CHUNK_SIZE,
    overlapTokens = env.RAG_CHUNK_OVERLAP
  ): DocumentChunkData[] {
    const chunks: DocumentChunkData[] = [];
    let globalChunkIndex = 0;

    // Approximate token size in characters (~4 chars per token)
    const chunkSizeChars = chunkSizeTokens * 4;
    const overlapChars = overlapTokens * 4;

    for (const page of pages) {
      const pageText = page.text.trim();
      if (!pageText) continue;

      if (pageText.length <= chunkSizeChars) {
        // Page fits in a single chunk
        chunks.push({
          chunkIndex: globalChunkIndex++,
          pageNumber: page.pageNumber,
          content: pageText,
          tokenCount: Math.ceil(pageText.length / 4),
        });
        continue;
      }

      // Split large page text into coherent chunks
      let startIdx = 0;
      while (startIdx < pageText.length) {
        let endIdx = Math.min(startIdx + chunkSizeChars, pageText.length);

        if (endIdx < pageText.length) {
          // Look for clean break (paragraph break, period, semicolon, question mark)
          const searchWindow = pageText.substring(
            Math.max(startIdx, endIdx - 200),
            Math.min(pageText.length, endIdx + 100)
          );

          const sentenceBreak = searchWindow.lastIndexOf('. ');
          const newlineBreak = searchWindow.lastIndexOf('\n');

          if (sentenceBreak !== -1) {
            endIdx = Math.max(startIdx, endIdx - 200) + sentenceBreak + 1;
          } else if (newlineBreak !== -1) {
            endIdx = Math.max(startIdx, endIdx - 200) + newlineBreak;
          }
        }

        const chunkText = pageText.substring(startIdx, endIdx).trim();
        if (chunkText.length > 20) {
          chunks.push({
            chunkIndex: globalChunkIndex++,
            pageNumber: page.pageNumber,
            content: chunkText,
            tokenCount: Math.ceil(chunkText.length / 4),
          });
        }

        if (endIdx >= pageText.length) break;

        // Advance startIdx taking overlap into account
        startIdx = Math.max(startIdx + 1, endIdx - overlapChars);
      }
    }

    return chunks;
  }
}

export const pdfProcessingService = new PdfProcessingService();
