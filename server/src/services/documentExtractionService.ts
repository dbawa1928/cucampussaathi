import { PDFParse } from 'pdf-parse';
import AdmZip from 'adm-zip';
import * as mammoth from 'mammoth';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  type?: 'page' | 'slide' | 'section';
}

export interface DocumentChunkData {
  chunkIndex: number;
  pageNumber: number;
  content: string;
  tokenCount: number;
}

export class DocumentExtractionService {
  /**
   * Validate file signature and detect document format.
   * Rejects executable files, empty buffers, and unsupported binary formats with clear guidance.
   */
  detectFormatAndValidate(
    buffer: Buffer,
    originalFilename: string
  ): 'pdf' | 'pptx' | 'docx' {
    if (!buffer || buffer.length < 10) {
      throw new AppError('The uploaded file is empty or corrupted.', 400);
    }

    const ext = originalFilename.toLowerCase().split('.').pop() || '';

    // 1. PDF detection (Magic bytes: %PDF-)
    const headerAscii = buffer.subarray(0, 8).toString('ascii');
    if (headerAscii.startsWith('%PDF-') || ext === 'pdf') {
      if (!headerAscii.startsWith('%PDF-')) {
        throw new AppError(
          'Invalid PDF file signature. The file appears to be corrupted or disguised.',
          400
        );
      }
      return 'pdf';
    }

    // 2. Check for legacy binary OLE/CFB formats (.ppt or .doc)
    // CFB magic bytes: 0xD0 0xCF 0x11 0xE0 0xA1 0xB1 0x1A 0xE1
    const isLegacyOle =
      buffer[0] === 0xd0 &&
      buffer[1] === 0xcf &&
      buffer[2] === 0x11 &&
      buffer[3] === 0xe0 &&
      buffer[4] === 0xa1 &&
      buffer[5] === 0xb1 &&
      buffer[6] === 0x1a &&
      buffer[7] === 0xe1;

    if (isLegacyOle || ext === 'ppt' || ext === 'doc') {
      const formatName = ext === 'ppt' || ext === 'pptx' ? 'PowerPoint (.ppt)' : 'Word (.doc)';
      const modernAlternative =
        ext === 'ppt' || ext === 'pptx' ? 'PowerPoint (.pptx) or PDF' : 'Word (.docx) or PDF';
      throw new AppError(
        `Legacy ${formatName} binary format is not supported for AI indexing. Please open your document in Microsoft Office or Google Docs and save or export it as modern ${modernAlternative}.`,
        400
      );
    }

    // 3. Modern Office formats (.pptx, .docx) are standard ZIP archives (Magic bytes: PK\x03\x04)
    const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
    if (!isZip) {
      throw new AppError(
        'Unsupported file format. Please upload a standard PDF (.pdf), PowerPoint (.pptx), or Word document (.docx).',
        400
      );
    }

    if (ext === 'pptx') {
      return 'pptx';
    }
    if (ext === 'docx') {
      return 'docx';
    }

    // Inspect internal ZIP structure to distinguish between DOCX and PPTX
    try {
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries().map((e) => e.entryName);
      if (entries.some((n) => n.startsWith('ppt/'))) {
        return 'pptx';
      }
      if (entries.some((n) => n.startsWith('word/'))) {
        return 'docx';
      }
    } catch {
      // fallback
    }

    throw new AppError(
      'Unable to process this Office file. Ensure it is a valid, uncorrupted .pptx or .docx document.',
      400
    );
  }

  /**
   * Clean raw extracted text by normalizing line breaks and whitespace.
   */
  cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\0/g, '')
      .replace(/[\t ]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Extract text from PDF buffer preserving exact page numbers.
   */
  async extractPdfPages(buffer: Buffer): Promise<{ pages: ExtractedPage[]; totalTextLength: number }> {
    let parser: InstanceType<typeof PDFParse> | null = null;
    try {
      // PDFParse expects a TypedArray; convert Buffer to Uint8Array
      parser = new PDFParse({ data: new Uint8Array(buffer) });
      const parseResult = await parser.getText({ lineEnforce: true });
      const pages: ExtractedPage[] = [];
      let totalTextLength = 0;

      if (parseResult.pages && parseResult.pages.length > 0) {
        for (const p of parseResult.pages) {
          const cleaned = this.cleanText(p.text || '');
          totalTextLength += cleaned.length;
          pages.push({
            pageNumber: p.num || pages.length + 1,
            text: cleaned,
            type: 'page',
          });
        }
      } else if (parseResult.text) {
        const cleaned = this.cleanText(parseResult.text);
        totalTextLength = cleaned.length;
        pages.push({
          pageNumber: 1,
          text: cleaned,
          type: 'page',
        });
      }

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
   * Extract text from PowerPoint (.pptx) buffer slide-by-slide.
   * Maps each slide XML directly to a distinct slide number for accurate citations.
   */
  async extractPptxSlides(buffer: Buffer): Promise<{ pages: ExtractedPage[]; totalTextLength: number }> {
    try {
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();

      // Find all slide entries (ppt/slides/slide1.xml, slide2.xml, etc.)
      const slideEntries = entries.filter((e) =>
        /^ppt\/slides\/slide\d+\.xml$/i.test(e.entryName)
      );

      if (slideEntries.length === 0) {
        throw new AppError('No slides found in the uploaded PowerPoint presentation.', 400);
      }

      // Sort slides numerically by slide number in entryName
      slideEntries.sort((a, b) => {
        const numA = parseInt(a.entryName.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.entryName.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });

      const pages: ExtractedPage[] = [];
      let totalTextLength = 0;

      for (let i = 0; i < slideEntries.length; i++) {
        const slideXml = slideEntries[i].getData().toString('utf-8');

        // Extract all text inside <a:t>...</a:t> XML nodes
        const textMatches = slideXml.match(/<a:t>([^<]*)<\/a:t>/gi) || [];
        const slideText = textMatches
          .map((tag) => tag.replace(/<\/?a:t>/gi, ''))
          .join(' ');

        const cleaned = this.cleanText(slideText);
        totalTextLength += cleaned.length;

        pages.push({
          pageNumber: i + 1,
          text: cleaned || `[Slide ${i + 1} Visual Content / Diagram]`,
          type: 'slide',
        });
      }

      if (totalTextLength < 20) {
        throw new AppError(
          'This PowerPoint presentation contains no extractable text. Please ensure slides have text boxes or notes.',
          422
        );
      }

      return { pages, totalTextLength };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to parse PowerPoint presentation', err);
      throw new AppError(
        `Failed to parse PowerPoint presentation: ${err.message || 'Corrupted presentation file.'}`,
        400
      );
    }
  }

  /**
   * Extract text from Microsoft Word (.docx) buffer.
   * Splits text into logical page-equivalent sections by headings and paragraphs.
   */
  async extractDocxPages(buffer: Buffer): Promise<{ pages: ExtractedPage[]; totalTextLength: number }> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const rawText = result.value || '';
      const cleaned = this.cleanText(rawText);

      if (cleaned.length < 30) {
        throw new AppError(
          'This Word document contains no extractable text or is empty.',
          422
        );
      }

      // Segment Word document into ~400-word sections to represent pages for citations
      const paragraphs = cleaned.split('\n\n').filter(Boolean);
      const pages: ExtractedPage[] = [];
      let currentSectionText = '';
      let sectionIndex = 1;

      for (const p of paragraphs) {
        if ((currentSectionText + '\n\n' + p).length > 2200 && currentSectionText.length > 0) {
          pages.push({
            pageNumber: sectionIndex++,
            text: currentSectionText.trim(),
            type: 'section',
          });
          currentSectionText = p;
        } else {
          currentSectionText = currentSectionText ? currentSectionText + '\n\n' + p : p;
        }
      }

      if (currentSectionText.trim()) {
        pages.push({
          pageNumber: sectionIndex,
          text: currentSectionText.trim(),
          type: 'section',
        });
      }

      const totalTextLength = cleaned.length;
      return { pages, totalTextLength };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to parse Word document', err);
      throw new AppError(
        `Failed to parse Word document: ${err.message || 'Corrupted Word file.'}`,
        400
      );
    }
  }

  /**
   * Unified extraction for PDF, PowerPoint (.pptx), and Word (.docx).
   */
  async extractDocument(
    buffer: Buffer,
    originalFilename: string
  ): Promise<{
    format: 'pdf' | 'pptx' | 'docx';
    pages: ExtractedPage[];
    totalTextLength: number;
    mimeType: string;
  }> {
    const format = this.detectFormatAndValidate(buffer, originalFilename);

    let result: { pages: ExtractedPage[]; totalTextLength: number };
    let mimeType = 'application/pdf';

    switch (format) {
      case 'pdf':
        result = await this.extractPdfPages(buffer);
        mimeType = 'application/pdf';
        break;
      case 'pptx':
        result = await this.extractPptxSlides(buffer);
        mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        break;
      case 'docx':
        result = await this.extractDocxPages(buffer);
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
    }

    return {
      format,
      pages: result.pages,
      totalTextLength: result.totalTextLength,
      mimeType,
    };
  }

  /**
   * Split extracted pages or slides into context-rich, overlapping chunks.
   * Respects sentence and paragraph boundaries to prevent context fragmentation.
   */
  createChunks(
    pages: ExtractedPage[],
    chunkSizeTokens = env.RAG_CHUNK_SIZE,
    overlapTokens = env.RAG_CHUNK_OVERLAP
  ): DocumentChunkData[] {
    const chunks: DocumentChunkData[] = [];
    let globalChunkIndex = 0;

    for (const page of pages) {
      const pageText = page.text;
      if (!pageText || pageText.trim().length === 0) continue;

      // Approximate tokens: ~4 characters per token
      const approxTokens = Math.ceil(pageText.length / 4);

      if (approxTokens <= chunkSizeTokens) {
        chunks.push({
          chunkIndex: globalChunkIndex++,
          pageNumber: page.pageNumber,
          content: pageText,
          tokenCount: approxTokens,
        });
        continue;
      }

      // Split page into sentences
      const sentences = pageText.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [pageText];
      let currentChunkText = '';
      let currentChunkTokens = 0;

      for (const sentence of sentences) {
        const sentenceTokens = Math.ceil(sentence.length / 4);

        if (currentChunkTokens + sentenceTokens > chunkSizeTokens && currentChunkText.length > 0) {
          chunks.push({
            chunkIndex: globalChunkIndex++,
            pageNumber: page.pageNumber,
            content: currentChunkText.trim(),
            tokenCount: currentChunkTokens,
          });

          // Retain overlapping suffix
          const overlapCharCount = overlapTokens * 4;
          const overlapText = currentChunkText.slice(-overlapCharCount);
          currentChunkText = overlapText + ' ' + sentence;
          currentChunkTokens = Math.ceil(currentChunkText.length / 4);
        } else {
          currentChunkText = currentChunkText ? currentChunkText + ' ' + sentence : sentence;
          currentChunkTokens += sentenceTokens;
        }
      }

      if (currentChunkText.trim().length > 0) {
        chunks.push({
          chunkIndex: globalChunkIndex++,
          pageNumber: page.pageNumber,
          content: currentChunkText.trim(),
          tokenCount: currentChunkTokens,
        });
      }
    }

    return chunks;
  }
}

export const documentExtractionService = new DocumentExtractionService();
