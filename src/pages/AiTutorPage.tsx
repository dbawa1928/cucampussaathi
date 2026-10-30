import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Send,
  Sparkles,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ExternalLink,
  FileQuestion,
  Layers,
  Clock,
  Eye,
  X,
  MessageSquare,
} from 'lucide-react';
import { apiClient, API_BASE_URL, type ApiResponse } from '../api/client';
import { Button } from '../components/ui/Button';

export interface DocumentItem {
  _id: string;
  title: string;
  originalFilename: string;
  fileSize: number;
  pageCount: number;
  processingStatus: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  processingError?: string;
  chunkCount: number;
  embeddingProvider: string;
  createdAt: string;
  updatedAt: string;
}

export interface SourceCitation {
  pageNumber: number;
  chunkId: string;
  excerpt: string;
}

export interface ChatMessage {
  id?: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  sourceReferences?: SourceCitation[];
  createdAt: string;
}

export interface ConversationItem {
  _id: string;
  document: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export const AiTutorPage: React.FC = () => {
  // Documents state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [docsLoading, setDocsLoading] = useState<boolean>(true);
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');

  // Chat & Conversation state
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string>('');

  // Summaries state
  const [summaryModalOpen, setSummaryModalOpen] = useState<boolean>(false);
  const [summaryType, setSummaryType] = useState<'short' | 'detailed' | 'key_concepts' | 'important_definitions' | 'exam_notes'>('short');
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);

  // PDF Viewer state
  const [showPdfViewer, setShowPdfViewer] = useState<boolean>(true);
  const [pdfPage, setPdfPage] = useState<number>(1);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<DocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isChatLoading]);

  // Load documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Poll for status if any document is PROCESSING
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.processingStatus === 'PROCESSING' || d.processingStatus === 'UPLOADED');
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchDocuments(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [documents]);

  // When selected document changes, fetch its conversations
  useEffect(() => {
    if (selectedDoc) {
      fetchConversations(selectedDoc._id);
    } else {
      setConversations([]);
      setMessages([]);
      setActiveConversationId(null);
    }
  }, [selectedDoc?._id]);

  const fetchDocuments = async (showLoader = true) => {
    if (showLoader) setDocsLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<DocumentItem[]>>('/documents');
      if (res.success && res.data) {
        setDocuments(res.data);
        if (!selectedDoc && res.data.length > 0) {
          setSelectedDoc(res.data[0]);
        } else if (selectedDoc) {
          const updated = res.data.find((d) => d._id === selectedDoc._id);
          if (updated) setSelectedDoc(updated);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch documents', err);
    } finally {
      if (showLoader) setDocsLoading(false);
    }
  };

  const fetchConversations = async (documentId: string) => {
    try {
      const res = await apiClient.get<ApiResponse<ConversationItem[]>>(`/ai/conversations?documentId=${documentId}`);
      if (res.success && res.data) {
        setConversations(res.data);
        if (res.data.length > 0) {
          loadConversation(res.data[0]._id);
        } else {
          setActiveConversationId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  };

  const loadConversation = async (conversationId: string) => {
    setActiveConversationId(conversationId);
    try {
      const res = await apiClient.get<
        ApiResponse<{
          conversation: ConversationItem;
          messages: ChatMessage[];
        }>
      >(`/ai/conversations/${conversationId}`);
      if (res.success && res.data?.messages) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error('Failed to load conversation history', err);
    }
  };

  const handleStartNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInputQuery('');
    setChatError('');
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please choose a valid PDF file.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (uploadTitle.trim()) {
        formData.append('title', uploadTitle.trim());
      }

      const res = await apiClient.postFormData<ApiResponse<{ document: DocumentItem }>>('/documents', formData);

      if (res.success && res.data?.document) {
        setUploadModalOpen(false);
        setUploadFile(null);
        setUploadTitle('');
        await fetchDocuments(false);
        setSelectedDoc(res.data.document);
      } else {
        setUploadError(res.message || 'Upload failed. Please check the file.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'File upload failed. Ensure file is PDF and under 15MB.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!deleteConfirmDoc) return;
    setIsDeleting(true);
    try {
      const res = await apiClient.delete<ApiResponse<any>>(`/documents/${deleteConfirmDoc._id}`);
      if (res.success) {
        setDeleteConfirmDoc(null);
        if (selectedDoc?._id === deleteConfirmDoc._id) {
          setSelectedDoc(null);
        }
        await fetchDocuments(false);
      }
    } catch (err: any) {
      console.error('Failed to delete document', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, directQuery?: string) => {
    if (e) e.preventDefault();
    const query = directQuery || inputQuery.trim();
    if (!query || !selectedDoc) return;

    if (selectedDoc.processingStatus !== 'COMPLETED') {
      setChatError('This document is still indexing. Please wait until status is Indexed.');
      return;
    }

    const userMessage: ChatMessage = {
      role: 'USER',
      content: query,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!directQuery) setInputQuery('');
    setIsChatLoading(true);
    setChatError('');

    try {
      const res = await apiClient.post<
        ApiResponse<{
          conversationId: string;
          reply: string;
          sourceReferences: SourceCitation[];
        }>
      >('/ai/chat', {
        documentId: selectedDoc._id,
        conversationId: activeConversationId || undefined,
        message: query,
      });

      if (res.success && res.data) {
        const assistantMessage: ChatMessage = {
          role: 'ASSISTANT',
          content: res.data.reply,
          sourceReferences: res.data.sourceReferences,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (!activeConversationId) {
          setActiveConversationId(res.data.conversationId);
          fetchConversations(selectedDoc._id);
        }
      }
    } catch (err: any) {
      setChatError(err.message || 'Failed to generate response. Please try again.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedDoc) return;
    setSummaryModalOpen(false);
    setIsSummarizing(true);
    setChatError('');

    const summaryPrompts: Record<string, string> = {
      short: 'Executive Quick Summary',
      detailed: 'Comprehensive In-Depth Document Summary',
      key_concepts: 'Core Key Concepts & Formulas',
      important_definitions: 'Important Definitions Glossary',
      exam_notes: 'Exam Preparation & High-Yield Revision Notes',
    };

    const userMessage: ChatMessage = {
      role: 'USER',
      content: `[Summary Request] Generate ${summaryPrompts[summaryType]} for this document.`,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await apiClient.post<
        ApiResponse<{
          summary: string;
          summaryType: string;
          sourceReferences: SourceCitation[];
        }>
      >(`/ai/documents/${selectedDoc._id}/summarize`, {
        summaryType,
      });

      if (res.success && res.data) {
        const assistantMessage: ChatMessage = {
          role: 'ASSISTANT',
          content: res.data.summary,
          sourceReferences: res.data.sourceReferences,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err: any) {
      setChatError(err.message || 'Failed to generate summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCitationClick = (pageNumber: number) => {
    setPdfPage(pageNumber);
    if (!showPdfViewer) setShowPdfViewer(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderStatusBadge = (status: DocumentItem['processingStatus']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF7F7] text-[#8E1717] border border-[#8E1717]/25">
            <CheckCircle2 className="w-3 h-3" /> Indexed
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/25 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" /> Processing
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF1F1] text-[#C62828] border border-[#C62828]/30">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20">
            <Clock className="w-3 h-3" /> Uploaded
          </span>
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-70px)] bg-[#FFF7F7] flex flex-col">
      {/* Top Header Banner */}
      <div className="bg-white border-b border-[#E7DADA] px-4 sm:px-6 py-4 shadow-xs shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20 flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-5 h-5 text-[#C62828]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-[#252525] tracking-tight">AI Document Tutor</h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20">
                  RAG • Groq Powered
                </span>
              </div>
              <p className="text-xs text-[#666666]">
                Upload university lecture notes, textbooks, and syllabus PDFs for grounded answers with verified page citations.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setUploadModalOpen(true)}
              icon={<Upload className="w-3.5 h-3.5" />}
            >
              Upload PDF
            </Button>
            {selectedDoc && selectedDoc.processingStatus === 'COMPLETED' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSummaryModalOpen(true)}
                icon={<BookOpen className="w-3.5 h-3.5" />}
              >
                Summarize
              </Button>
            )}
            {selectedDoc && (
              <button
                type="button"
                onClick={() => setShowPdfViewer(!showPdfViewer)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  showPdfViewer
                    ? 'bg-[#FFF7F7] text-[#C62828] border-[#C62828]/30'
                    : 'bg-white text-[#666666] border-[#E7DADA] hover:bg-[#FFF7F7]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showPdfViewer ? 'Hide PDF' : 'View PDF'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto p-4 sm:p-6 gap-4">
        {/* Left Sidebar: Document Management */}
        <aside className="w-80 bg-white border border-[#E7DADA] rounded-2xl flex flex-col shadow-xs shrink-0 overflow-hidden">
          <div className="p-4 border-b border-[#E7DADA] flex items-center justify-between bg-[#FFF7F7]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C62828]" />
              <h2 className="text-sm font-bold text-[#252525]">Study Materials</h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-[#C62828] border border-[#C62828]/20">
              {documents.length}
            </span>
          </div>

          <div className="p-3">
            <button
              onClick={() => setUploadModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-[#C62828]/40 hover:border-[#C62828] bg-[#FFF7F7] hover:bg-white text-[#C62828] text-xs font-bold transition-all cursor-pointer group"
            >
              <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Upload New PDF</span>
            </button>
          </div>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto px-3 space-y-2 pb-4">
            {docsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#666666]">
                <Loader2 className="w-6 h-6 animate-spin text-[#C62828] mb-2" />
                <p className="text-xs">Loading library...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 px-4">
                <FileQuestion className="w-8 h-8 text-[#999999] mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#252525]">No documents uploaded</p>
                <p className="text-[11px] text-[#666666] mt-1">
                  Upload a PDF to start asking document-grounded questions.
                </p>
              </div>
            ) : (
              documents.map((doc) => {
                const isSelected = selectedDoc?._id === doc._id;
                return (
                  <div
                    key={doc._id}
                    onClick={() => {
                      setSelectedDoc(doc);
                      setPdfPage(1);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-[#FFF7F7] border-[#C62828] shadow-xs'
                        : 'bg-white border-[#E7DADA] hover:border-[#C62828]/40 hover:bg-[#FFF7F7]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'bg-[#C62828] text-white' : 'bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <h3 className="text-xs font-bold text-[#252525] truncate leading-tight">
                          {doc.title || doc.originalFilename}
                        </h3>
                        <p className="text-[11px] text-[#666666] truncate mt-0.5">
                          {doc.originalFilename}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {renderStatusBadge(doc.processingStatus)}
                          <span className="text-[10px] text-[#666666]">
                            {doc.pageCount ? `${doc.pageCount} pgs` : ''} • {formatFileSize(doc.fileSize)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete action */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmDoc(doc);
                      }}
                      className="absolute top-2.5 right-2.5 p-1 rounded-md text-[#999999] hover:text-[#C62828] hover:bg-[#FFF1F1] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Center: Chat Area */}
        <main className="flex-1 bg-white border border-[#E7DADA] rounded-2xl flex flex-col shadow-xs overflow-hidden">
          {/* Document Status Header */}
          {selectedDoc ? (
            <div className="px-5 py-3.5 border-b border-[#E7DADA] bg-[#FFF7F7] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-[#C62828] shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-xs sm:text-sm font-bold text-[#252525] truncate">
                    {selectedDoc.title || selectedDoc.originalFilename}
                  </h2>
                  <div className="flex items-center gap-2 text-[11px] text-[#666666]">
                    <span>{selectedDoc.pageCount} Pages</span>
                    <span>•</span>
                    <span>{selectedDoc.chunkCount} Indexed Chunks</span>
                    <span>•</span>
                    <span className="font-mono text-[10px] text-[#8E1717]">{selectedDoc.embeddingProvider}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {conversations.length > 0 && (
                  <select
                    value={activeConversationId || ''}
                    onChange={(e) => {
                      if (e.target.value) loadConversation(e.target.value);
                      else handleStartNewConversation();
                    }}
                    className="px-2 py-1 text-xs font-medium rounded-lg bg-white border border-[#E7DADA] text-[#252525] focus:outline-none focus:ring-1 focus:ring-[#C62828] max-w-[140px] truncate"
                  >
                    <option value="">+ New Chat</option>
                    {conversations.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={handleStartNewConversation}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-[#E7DADA] hover:border-[#C62828]/40 hover:text-[#C62828] text-[#252525] transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3 text-[#C62828]" />
                  <span>New Chat</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="px-5 py-3.5 border-b border-[#E7DADA] bg-[#FFF7F7]">
              <h2 className="text-sm font-bold text-[#252525]">Welcome to AI Document Tutor</h2>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {!selectedDoc ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20 flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-base font-extrabold text-[#252525] mb-2">
                  Select or Upload a PDF
                </h3>
                <p className="text-xs text-[#666666] mb-6 leading-relaxed">
                  Upload lecture slides, chapters, research papers, or syllabus documents to ask questions grounded strictly in your content.
                </p>
                <Button variant="primary" onClick={() => setUploadModalOpen(true)} icon={<Upload className="w-4 h-4" />}>
                  Upload Study Material
                </Button>
              </div>
            ) : selectedDoc.processingStatus === 'PROCESSING' ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <Loader2 className="w-10 h-10 animate-spin text-[#C62828] mb-3" />
                <h3 className="text-sm font-bold text-[#252525]">Indexing Document Content...</h3>
                <p className="text-xs text-[#666666] max-w-sm mt-1">
                  Extracting pages, performing sentence-aware chunking, and preparing BM25 lexical retrieval. This usually takes just a few seconds.
                </p>
              </div>
            ) : selectedDoc.processingStatus === 'FAILED' ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <AlertCircle className="w-10 h-10 text-[#C62828] mb-3" />
                <h3 className="text-sm font-bold text-[#252525]">Processing Failed</h3>
                <p className="text-xs text-[#C62828] max-w-sm mt-1">
                  {selectedDoc.processingError || 'Could not extract readable text from this PDF. If this is a scanned document without a text layer, OCR is required.'}
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center max-w-lg mx-auto py-8">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#252525]">
                  Ask Anything About &ldquo;{selectedDoc.title || selectedDoc.originalFilename}&rdquo;
                </h3>
                <p className="text-xs text-[#666666] mt-1 mb-6">
                  Responses are generated by Groq LLM strictly using facts from the indexed pages. Page citations will accompany every response.
                </p>

                {/* Suggested Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-left">
                  {[
                    'Summarize the core concepts covered in this PDF.',
                    'What are the key terms and their definitions?',
                    'Generate 3 practice exam questions from this material.',
                    'Explain the most important formulas or principles step-by-step.',
                  ].map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(undefined, prompt)}
                      className="p-3 rounded-xl border border-[#E7DADA] hover:border-[#C62828] hover:bg-[#FFF7F7] text-left transition-all text-xs text-[#252525] font-medium group cursor-pointer"
                    >
                      <p className="line-clamp-2">{prompt}</p>
                      <span className="text-[10px] text-[#C62828] font-semibold mt-1 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Ask this <ChevronRight className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.role === 'USER';
                return (
                  <div
                    key={index}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl ${
                      isUser ? 'ml-auto' : 'mr-auto'
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                        isUser
                          ? 'bg-[#C62828] text-white rounded-br-xs'
                          : 'bg-white border border-[#E7DADA] text-[#252525] rounded-bl-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Source Citations */}
                      {!isUser && msg.sourceReferences && msg.sourceReferences.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#E7DADA]">
                          <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-[#C62828]" /> Verified Document Sources:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.sourceReferences.map((cite, cIdx) => (
                              <button
                                key={cIdx}
                                type="button"
                                onClick={() => handleCitationClick(cite.pageNumber)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#FFF7F7] border border-[#E7DADA] text-[#C62828] hover:bg-white hover:border-[#C62828] text-[11px] font-semibold transition-all cursor-pointer shadow-2xs group"
                                title={cite.excerpt ? `Page ${cite.pageNumber}: "${cite.excerpt}"` : `Jump to page ${cite.pageNumber}`}
                              >
                                <FileText className="w-3 h-3 text-[#C62828]" />
                                <span>Page {cite.pageNumber}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isChatLoading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#FFF7F7] border border-[#E7DADA] text-xs text-[#666666] max-w-xs">
                <Loader2 className="w-4 h-4 animate-spin text-[#C62828]" />
                <span>Searching document & generating answer...</span>
              </div>
            )}

            {isSummarizing && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#FFF7F7] border border-[#E7DADA] text-xs text-[#666666] max-w-xs">
                <Sparkles className="w-4 h-4 animate-spin text-[#C62828]" />
                <span>Generating grounded summary...</span>
              </div>
            )}

            {chatError && (
              <div className="p-3 rounded-xl bg-[#FFF1F1] border border-[#C62828]/30 text-xs text-[#C62828] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#C62828] shrink-0" />
                <span>{chatError}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Form */}
          {selectedDoc && selectedDoc.processingStatus === 'COMPLETED' && (
            <div className="p-3 sm:p-4 border-t border-[#E7DADA] bg-white">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={`Ask a question about ${selectedDoc.title || 'this PDF'}...`}
                  disabled={isChatLoading || isSummarizing}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#E7DADA] text-xs sm:text-sm text-[#252525] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828] transition-all bg-[#FFF7F7] focus:bg-white"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!inputQuery.trim() || isChatLoading || isSummarizing}
                  icon={<Send className="w-4 h-4" />}
                >
                  Ask
                </Button>
              </form>
              <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-[#666666]">
                <span>Answers are verified against your uploaded pages. Citations open directly in the viewer.</span>
                <span>Max 1,000 chars</span>
              </div>
            </div>
          )}
        </main>

        {/* Right Pane: Integrated PDF Viewer */}
        {showPdfViewer && selectedDoc && (
          <aside className="w-96 lg:w-[460px] bg-white border border-[#E7DADA] rounded-2xl flex flex-col shadow-xs overflow-hidden shrink-0">
            {/* Viewer Controls */}
            <div className="px-4 py-3 border-b border-[#E7DADA] bg-[#FFF7F7] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-[#C62828] shrink-0" />
                <span className="text-xs font-bold text-[#252525] truncate">Document Reader</span>
              </div>

              {/* Page Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                  disabled={pdfPage <= 1}
                  className="px-2 py-1 text-xs font-bold rounded-md bg-white border border-[#E7DADA] disabled:opacity-40 hover:bg-[#FFF7F7] cursor-pointer"
                >
                  &larr;
                </button>
                <span className="text-xs font-semibold text-[#252525] px-1">
                  Page {pdfPage} / {selectedDoc.pageCount || 1}
                </span>
                <button
                  type="button"
                  onClick={() => setPdfPage((p) => Math.min(selectedDoc.pageCount || 999, p + 1))}
                  disabled={selectedDoc.pageCount > 0 && pdfPage >= selectedDoc.pageCount}
                  className="px-2 py-1 text-xs font-bold rounded-md bg-white border border-[#E7DADA] disabled:opacity-40 hover:bg-[#FFF7F7] cursor-pointer"
                >
                  &rarr;
                </button>
                <a
                  href={`${API_BASE_URL}/documents/${selectedDoc._id}/file#page=${pdfPage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded-md text-[#666666] hover:text-[#C62828] hover:bg-[#FFF7F7] transition-colors"
                  title="Open full PDF in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Embedded Native PDF Viewer */}
            <div className="flex-1 bg-white relative">
              <iframe
                key={`${selectedDoc._id}-page-${pdfPage}`}
                src={`${API_BASE_URL}/documents/${selectedDoc._id}/file#page=${pdfPage}&zoom=100`}
                className="w-full h-full border-0"
                title={selectedDoc.title}
              />
            </div>
          </aside>
        )}
      </div>

      {/* Upload Document Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E7DADA]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/25 flex items-center justify-center font-bold">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#252525]">Upload Study Material</h3>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="p-1 rounded-lg text-[#666666] hover:text-[#252525] hover:bg-[#FFF7F7] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Document Title (Optional)
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Operating Systems Chapter 3 - CPU Scheduling"
                  className="w-full px-3 py-2 rounded-xl border border-[#E7DADA] text-xs text-[#252525] focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828] bg-[#FFF7F7] focus:bg-white"
                />
              </div>

              {/* Drag and Drop Box */}
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Select PDF File <span className="text-[#C62828]">*</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#E7DADA] hover:border-[#C62828] rounded-xl p-6 text-center cursor-pointer bg-[#FFF7F7] hover:bg-white transition-all"
                >
                  <FileText className="w-8 h-8 text-[#C62828] mx-auto mb-2" />
                  {uploadFile ? (
                    <div>
                      <p className="text-xs font-bold text-[#252525] truncate">{uploadFile.name}</p>
                      <p className="text-[11px] text-[#666666] mt-0.5">{formatFileSize(uploadFile.size)}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-[#252525]">Click to browse or drop PDF here</p>
                      <p className="text-[10px] text-[#666666] mt-1">PDF format only • Max 15 MB</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>

              {uploadError && (
                <div className="p-2.5 rounded-lg bg-[#FFF1F1] border border-[#C62828]/30 text-xs text-[#C62828] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#C62828] shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadModalOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!uploadFile || isUploading}
                  icon={isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                >
                  {isUploading ? 'Uploading & Indexing...' : 'Upload & Process'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary Options Modal */}
      {summaryModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E7DADA]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/25 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#252525]">Generate Document Summary</h3>
              </div>
              <button
                type="button"
                onClick={() => setSummaryModalOpen(false)}
                className="p-1 rounded-lg text-[#666666] hover:text-[#252525] hover:bg-[#FFF7F7] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#666666] mb-4">
              Select the type of AI-grounded summary you wish to generate for &ldquo;{selectedDoc.title}&rdquo;:
            </p>

            <div className="space-y-2 mb-6">
              {[
                { id: 'short', title: 'Executive Quick Summary', desc: 'Brief overview with key takeaways in 3-4 bullet points.' },
                { id: 'detailed', title: 'Comprehensive Summary', desc: 'In-depth breakdown of sections and themes.' },
                { id: 'key_concepts', title: 'Key Concepts & Principles', desc: 'Core theoretical concepts, mechanisms, and rules.' },
                { id: 'important_definitions', title: 'Important Definitions Glossary', desc: 'Alphabetical glossary of terms defined in text.' },
                { id: 'exam_notes', title: 'High-Yield Exam Revision Notes', desc: 'Must-know formulas, likely exam questions, and memory aids.' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    summaryType === opt.id
                      ? 'bg-[#FFF7F7] border-[#C62828]'
                      : 'bg-white border-[#E7DADA] hover:bg-[#FFF7F7]'
                  }`}
                >
                  <input
                    type="radio"
                    name="summaryType"
                    checked={summaryType === opt.id}
                    onChange={() => setSummaryType(opt.id as any)}
                    className="mt-0.5 text-[#C62828] focus:ring-[#C62828]"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#252525]">{opt.title}</p>
                    <p className="text-[11px] text-[#666666]">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSummaryModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateSummary}
                icon={<Sparkles className="w-4 h-4" />}
              >
                Generate Grounded Summary
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-[#E7DADA]">
            <div className="w-10 h-10 rounded-full bg-[#FFF1F1] text-[#C62828] border border-[#C62828]/25 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#252525]">Delete Document?</h3>
            <p className="text-xs text-[#666666] mt-1 mb-4 leading-relaxed">
              Are you sure you want to delete &ldquo;{deleteConfirmDoc.title || deleteConfirmDoc.originalFilename}&rdquo;?
              This will permanently delete the physical file, all indexed chunks, and associated chat history.
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmDoc(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isDeleting}
                onClick={handleDeleteDocument}
                icon={isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
