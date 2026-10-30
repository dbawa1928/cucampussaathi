import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onCitationClick?: (pageNumber: number) => void;
  documentFormat?: 'pdf' | 'pptx' | 'docx';
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onCitationClick,
  documentFormat = 'pdf',
}) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(index);
    setTimeout(() => {
      setCopiedCodeIndex(null);
    }, 2000);
  };

  // Helper to render inline elements (bold, italic, inline code, and citations)
  const renderInline = (text: string): React.ReactNode[] => {
    // Regex splits on:
    // 1. Citations: \[(?:Page|Slide)\s*(\d+)[^\]]*\]
    // 2. Bold: \*\*(.+?)\*\*
    // 3. Inline code: `([^`]+)`
    // 4. Italic: \*([^*]+)\*
    const parts: React.ReactNode[] = [];
    const inlineRegex =
      /(\[(?:Page|Slide)\s*(\d+)[^\]]*\])|(\*\*[^*]+?\*\*)|(`[^`]+?`)|(\*[^*]+?\*)/gi;

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = inlineRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const fullMatch = match[0];

      // 1. Citation match: [Page X] or [Slide X]
      if (match[1]) {
        const pageNum = parseInt(match[2], 10);
        const isSlide = documentFormat === 'pptx' || /slide/i.test(fullMatch);
        parts.push(
          <button
            key={`cite-${match.index}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onCitationClick && !isNaN(pageNum)) {
                onCitationClick(pageNum);
              }
            }}
            className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded-md bg-[#FFF7F7] border border-[#C62828]/30 hover:border-[#C62828] text-[11px] font-bold text-[#C62828] hover:bg-red-50 transition-colors shadow-2xs align-baseline cursor-pointer"
            title={`View ${isSlide ? 'Slide' : 'Page'} ${pageNum} in Document Viewer`}
          >
            <span>{isSlide ? `Slide ${pageNum}` : `Page ${pageNum}`}</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        );
      }
      // 2. Bold match: **text**
      else if (match[3]) {
        const boldText = fullMatch.slice(2, -2);
        parts.push(
          <strong key={`b-${match.index}`} className="font-extrabold text-[#111827]">
            {boldText}
          </strong>
        );
      }
      // 3. Inline code match: `code`
      else if (match[4]) {
        const codeText = fullMatch.slice(1, -1);
        parts.push(
          <code
            key={`c-${match.index}`}
            className="px-1.5 py-0.5 rounded bg-gray-100 text-[#C62828] font-mono text-xs border border-gray-200"
          >
            {codeText}
          </code>
        );
      }
      // 4. Italic match: *text*
      else if (match[5]) {
        const italicText = fullMatch.slice(1, -1);
        parts.push(
          <em key={`i-${match.index}`} className="italic">
            {italicText}
          </em>
        );
      }

      lastIndex = inlineRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  // Split into blocks: code blocks vs text blocks
  const blocks: React.ReactNode[] = [];
  const lines = content.split('\n');

  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines: string[] = [];
  let codeBlockIndex = 0;

  let currentListItems: { type: 'ul' | 'ol'; content: string }[] = [];

  const flushList = () => {
    if (currentListItems.length === 0) return;
    const listType = currentListItems[0].type;
    if (listType === 'ul') {
      blocks.push(
        <ul key={`list-${blocks.length}`} className="my-2 space-y-1 pl-4 list-disc marker:text-[#C62828]">
          {currentListItems.map((item, idx) => (
            <li key={idx} className="text-xs sm:text-sm leading-relaxed text-[#252525]">
              {renderInline(item.content)}
            </li>
          ))}
        </ul>
      );
    } else {
      blocks.push(
        <ol key={`list-${blocks.length}`} className="my-2 space-y-1 pl-4 list-decimal marker:text-[#C62828] marker:font-bold">
          {currentListItems.map((item, idx) => (
            <li key={idx} className="text-xs sm:text-sm leading-relaxed text-[#252525]">
              {renderInline(item.content)}
            </li>
          ))}
        </ol>
      );
    }
    currentListItems = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for fenced code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        const fullCode = codeBlockLines.join('\n');
        const currentIndex = codeBlockIndex++;
        blocks.push(
          <div key={`code-${blocks.length}`} className="my-3 rounded-xl overflow-hidden border border-gray-800 bg-[#1E1E2E] shadow-sm">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#181825] border-b border-gray-800 text-[11px] text-gray-400">
              <span className="font-mono uppercase font-semibold text-gray-300">{codeBlockLang || 'code'}</span>
              <button
                type="button"
                onClick={() => handleCopyCode(fullCode, currentIndex)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors cursor-pointer"
              >
                {copiedCodeIndex === currentIndex ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 text-xs font-mono text-gray-200 overflow-x-auto leading-relaxed whitespace-pre">
              <code>{fullCode}</code>
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockLines = [];
        codeBlockLang = '';
      } else {
        // Start of code block
        flushList();
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Unordered list item: - item or * item
    const ulMatch = line.match(/^[\t\s]*[-*+]\s+(.+)/);
    if (ulMatch) {
      if (currentListItems.length > 0 && currentListItems[0].type !== 'ul') {
        flushList();
      }
      currentListItems.push({ type: 'ul', content: ulMatch[1] });
      continue;
    }

    // Ordered list item: 1. item
    const olMatch = line.match(/^[\t\s]*\d+\.\s+(.+)/);
    if (olMatch) {
      if (currentListItems.length > 0 && currentListItems[0].type !== 'ol') {
        flushList();
      }
      currentListItems.push({ type: 'ol', content: olMatch[1] });
      continue;
    }

    // Normal line: flush any pending list first
    flushList();

    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      blocks.push(
        <h4 key={`h3-${blocks.length}`} className="text-xs sm:text-sm font-bold text-[#252525] mt-3 mb-1">
          {renderInline(trimmed.slice(4))}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      blocks.push(
        <h3 key={`h2-${blocks.length}`} className="text-sm sm:text-base font-extrabold text-[#C62828] mt-3.5 mb-1.5 pb-1 border-b border-[#E7DADA]/50">
          {renderInline(trimmed.slice(3))}
        </h3>
      );
    } else if (trimmed.startsWith('# ')) {
      blocks.push(
        <h2 key={`h1-${blocks.length}`} className="text-base sm:text-lg font-black text-[#252525] mt-4 mb-2">
          {renderInline(trimmed.slice(2))}
        </h2>
      );
    } else if (trimmed.startsWith('> ')) {
      blocks.push(
        <blockquote key={`quote-${blocks.length}`} className="border-l-3 border-[#C62828] pl-3 py-1 my-2 bg-[#FFF7F7] rounded-r-lg text-xs italic text-[#555555]">
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
    } else {
      blocks.push(
        <p key={`p-${blocks.length}`} className="my-1.5 text-xs sm:text-sm leading-relaxed text-[#252525]">
          {renderInline(line)}
        </p>
      );
    }
  }

  // Final flush
  flushList();
  if (inCodeBlock && codeBlockLines.length > 0) {
    blocks.push(
      <pre key={`code-end`} className="my-2 p-3 rounded-xl bg-gray-900 text-gray-100 text-xs font-mono overflow-x-auto">
        <code>{codeBlockLines.join('\n')}</code>
      </pre>
    );
  }

  return <div className="space-y-1">{blocks}</div>;
};

