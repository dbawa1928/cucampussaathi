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
  Layers,
  Clock,
  Eye,
  X,
  Search,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Square,
  GraduationCap,
  Award,
  Lightbulb,
  FileCheck,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Split,
  Presentation,
  FileCode,
} from 'lucide-react';
import { apiClient, API_BASE_URL, type ApiResponse } from '../api/client';
import { Button } from '../components/ui/Button';

export interface DocumentItem {
  _id: string;
  title: string;
  originalFilename: string;
  fileSize: number;
  pageCount: number;
  documentFormat?: 'pdf' | 'pptx' | 'docx';
  processingStatus: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  processingError?: string;
  chunkCount: number;
  embeddingProvider: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedPageContent {
  pageNumber: number;
  text: string;
  type?: 'page' | 'slide' | 'section';
}

export interface SourceCitation {
  pageNumber: number;
  chunkId?: string;
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

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  citationPage: number;
}

export const AiTutorPage: React.FC = () => {
  // Documents state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [docsLoading, setDocsLoading] = useState<boolean>(true);
  const [docSearchQuery, setDocSearchQuery] = useState<string>('');
  const [docFormatFilter, setDocFormatFilter] = useState<'ALL' | 'pdf' | 'pptx' | 'docx'>('ALL');

  // Upload modal & drag-drop
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Chat & Conversation state
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string>('');
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Voice Input (Speech Recognition) state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  // Voice Output (Speech Synthesis) state
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const [isSpeechPaused, setIsSpeechPaused] = useState<boolean>(false);

  // Document Viewer state
  const [showViewer, setShowViewer] = useState<boolean>(true);
  const [viewerFullscreen, setViewerFullscreen] = useState<boolean>(false);
  const [viewerPages, setViewerPages] = useState<ExtractedPageContent[]>([]);
  const [activeViewerPage, setActiveViewerPage] = useState<number>(1);
  const [viewerZoom, setViewerZoom] = useState<number>(100);
  const [isViewerLoading, setIsViewerLoading] = useState<boolean>(false);

  // Learning Tools Modal state
  const [toolsModalOpen, setToolsModalOpen] = useState<boolean>(false);
  const [activeToolTab, setActiveToolTab] = useState<'summary' | 'exam_prep' | 'notes' | 'concept_explainer' | 'quiz'>('summary');
  const [explainerStyle, setExplainerStyle] = useState<'beginner' | 'academic' | 'step_by_step' | 'exam_oriented'>('academic');
  const [explainerTopic, setExplainerTopic] = useState<string>('');
  const [isToolLoading, setIsToolLoading] = useState<boolean>(false);
  const [toolResultContent, setToolResultContent] = useState<string>('');
  const [toolError, setToolError] = useState<string>('');

  // Practice Quiz Interactive Runner state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizUserAnswers, setQuizUserAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Deletion modal
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<DocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // AbortController for Stop Generation
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isChatLoading]);

  // Check SpeechRecognition support on mount
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechRecognitionSupported(false);
    }
  }, []);

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // When selected document changes, load its conversations & viewer content
  useEffect(() => {
    if (selectedDoc) {
      fetchConversations(selectedDoc._id);
      fetchDocumentContent(selectedDoc._id);
      setMessages([]);
      setActiveConversationId(null);
      setToolResultContent('');
      setQuizQuestions([]);
      setQuizSubmitted(false);
    }
  }, [selectedDoc?._id]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // 1. Fetch user's uploaded documents
  // 1. Fetch user's uploaded documents
  const fetchDocuments = async (autoSelectLatest = true) => {
    setDocsLoading(true);
    try {
      const res = await apiClient.get<any>('/documents');
      const docsList: DocumentItem[] = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.documents)
        ? res.data.documents
        : Array.isArray(res.data?.data?.documents)
        ? res.data.data.documents
        : [];
      setDocuments(docsList);
      if (autoSelectLatest && docsList.length > 0 && !selectedDoc) {
        setSelectedDoc(docsList[0]);
      }
    } catch (err: any) {
      console.error('Failed to load documents:', err);
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }
  };

  // 2. Fetch extracted pages/slides for document viewer
  const fetchDocumentContent = async (docId: string) => {
    setIsViewerLoading(true);
    try {
      const res = await apiClient.get<any>(`/documents/${docId}/content`);
      const pagesList: ExtractedPageContent[] = Array.isArray(res.data?.pages)
        ? res.data.pages
        : Array.isArray(res.data?.data?.pages)
        ? res.data.data.pages
        : [];
      setViewerPages(pagesList);
      setActiveViewerPage(1);
    } catch (err) {
      console.error('Failed to fetch document content:', err);
      setViewerPages([]);
    } finally {
      setIsViewerLoading(false);
    }
  };

  // 3. Fetch conversations for selected document
  const fetchConversations = async (docId: string) => {
    try {
      const res = await apiClient.get<any>(`/ai/documents/${docId}/conversations`);
      const convList: ConversationItem[] = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.conversations)
        ? res.data.conversations
        : Array.isArray(res.data?.data?.conversations)
        ? res.data.data.conversations
        : [];
      setConversations(convList);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setConversations([]);
    }
  };

  // 4. Load messages for a specific conversation
  const loadConversationMessages = async (convId: string) => {
    setActiveConversationId(convId);
    setIsChatLoading(true);
    try {
      const res = await apiClient.get<any>(`/ai/conversations/${convId}`);
      const rawMsgs = res.data?.conversation?.messages || res.data?.messages || res.data;
      if (Array.isArray(rawMsgs)) {
        setMessages(rawMsgs);
      } else {
        setMessages([]);
      }
    } catch (err: any) {
      setChatError('Failed to load conversation history.');
      setMessages([]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // 5. Handle File Upload (Drag & Drop or Browser File Dialog)
  const handleFileUpload = async (fileToUpload?: File) => {
    const file = fileToUpload || uploadFile;
    if (!file) {
      setUploadError('Please select a file to upload.');
      return;
    }

    const ext = '.' + (file.name.toLowerCase().split('.').pop() || '');
    const allowed = ['.pdf', '.pptx', '.docx', '.ppt', '.doc'];
    if (!allowed.includes(ext)) {
      setUploadError('Supported file formats: PDF (.pdf), PowerPoint (.pptx), and Word (.docx).');
      return;
    }

    if (ext === '.ppt' || ext === '.doc') {
      const type = ext === '.ppt' ? 'PowerPoint (.ppt)' : 'Word (.doc)';
      const target = ext === '.ppt' ? 'PowerPoint (.pptx) or PDF' : 'Word (.docx) or PDF';
      setUploadError(`Legacy binary ${type} is not supported. Please export your file as modern ${target} before uploading.`);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File exceeds maximum size limit of 15MB.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('file', file);
    if (uploadTitle.trim()) {
      formData.append('title', uploadTitle.trim());
    }

    try {
      setUploadProgress(50);
      let res: any;
      try {
        res = await apiClient.postFormData<any>('/documents/upload', formData);
      } catch (postErr: any) {
        if (postErr?.message?.includes('Route not found') || postErr?.message?.includes('404')) {
          res = await apiClient.postFormData<any>('/documents', formData);
        } else {
          throw postErr;
        }
      }
      setUploadProgress(90);

      const uploadedDoc = res.data?.document || res.data;
      if (res.success && uploadedDoc?._id) {
        setUploadProgress(100);
        setUploadModalOpen(false);
        setUploadFile(null);
        setUploadTitle('');
        await fetchDocuments(false);
        setSelectedDoc(uploadedDoc);
      } else {
        setUploadError(res.message || 'Upload failed. Please check the file.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'File upload failed. Ensure file is a valid PDF, PPTX, or DOCX under 15MB.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // 6. Delete document
  const handleDeleteDocument = async () => {
    if (!deleteConfirmDoc) return;
    setIsDeleting(true);
    try {
      const res = await apiClient.delete<ApiResponse<any>>(`/documents/${deleteConfirmDoc._id}`);
      if (res.success) {
        setDeleteConfirmDoc(null);
        const remaining = documents.filter((d) => d._id !== deleteConfirmDoc._id);
        setDocuments(remaining);
        if (selectedDoc?._id === deleteConfirmDoc._id) {
          setSelectedDoc(remaining.length > 0 ? remaining[0] : null);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete document.');
    } finally {
      setIsDeleting(false);
    }
  };

  // 7. Send Chat Message
  const handleSendMessage = async (customPrompt?: string) => {
    const query = (customPrompt || inputQuery).trim();
    if (!query || !selectedDoc || isChatLoading) return;

    if (selectedDoc.processingStatus !== 'COMPLETED') {
      setChatError('This document is still indexing. Please wait a moment until processing finishes.');
      return;
    }

    setInputQuery('');
    setChatError('');

    // Add user message to UI
    const userMsg: ChatMessage = {
      role: 'USER',
      content: query,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const res = await apiClient.post<ApiResponse<{
        conversationId: string;
        answer: string;
        sourceReferences: SourceCitation[];
        retrievalMethod: string;
      }>>(`/ai/documents/${selectedDoc._id}/chat`, {
        question: query,
        conversationId: activeConversationId || undefined,
      });

      if (res.success && res.data) {
        setActiveConversationId(res.data.conversationId);
        const assistantMsg: ChatMessage = {
          role: 'ASSISTANT',
          content: res.data.answer,
          sourceReferences: res.data.sourceReferences,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        fetchConversations(selectedDoc._id);
      } else {
        setChatError(res.message || 'Unable to generate answer from document.');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setChatError('Generation cancelled by user.');
      } else {
        setChatError(err.message || 'Failed to retrieve answer from AI Tutor.');
      }
    } finally {
      setIsChatLoading(false);
      abortControllerRef.current = null;
    }
  };

  // 8. Stop generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsChatLoading(false);
    }
  };

  // 9. Voice Input using Web Speech API
  const handleToggleVoiceInput = () => {
    if (!speechRecognitionSupported) {
      alert('Speech Recognition is not supported by your current browser. Try Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInputQuery(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  // 10. Voice Output using SpeechSynthesis
  const handleSpeakAnswer = (text: string, index: number) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech audio synthesis is not supported on this browser.');
      return;
    }

    if (speakingMessageIndex === index) {
      if (isSpeechPaused) {
        window.speechSynthesis.resume();
        setIsSpeechPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsSpeechPaused(true);
      }
      return;
    }

    window.speechSynthesis.cancel();

    // Strip citations like [Page 1], Markdown asterisks, hashtags, and code fences so speech reads naturally
    const cleanSpeechText = text
      .replace(/\[(?:Page|Slide)\s*\d+[^\]]*\]/gi, '')
      .replace(/[#*`_~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setSpeakingMessageIndex(null);
      setIsSpeechPaused(false);
    };

    utterance.onerror = () => {
      setSpeakingMessageIndex(null);
      setIsSpeechPaused(false);
    };

    setSpeakingMessageIndex(index);
    setIsSpeechPaused(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingMessageIndex(null);
      setIsSpeechPaused(false);
    }
  };

  // 11. Copy answer text to clipboard
  const handleCopyAnswer = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageIndex(index);
    setTimeout(() => {
      setCopiedMessageIndex(null);
    }, 2000);
  };

  // 12. Run Learning Tools (Chapter Summarizer, Exam Prep, Notes, Concept Explainer)
  const handleRunLearningTool = async (tab?: 'summary' | 'exam_prep' | 'notes' | 'concept_explainer') => {
    const targetTool = tab || activeToolTab;
    if (!selectedDoc || targetTool === 'quiz') return;

    setIsToolLoading(true);
    setToolError('');
    setToolResultContent('');

    try {
      const res = await apiClient.post<ApiResponse<{
        toolType: string;
        content: string;
      }>>(`/ai/documents/${selectedDoc._id}/tools`, {
        toolType: targetTool,
        style: explainerStyle,
        topic: explainerTopic.trim() || undefined,
      });

      if (res.success && res.data?.content) {
        setToolResultContent(res.data.content);
      } else {
        setToolError(res.message || 'Failed to generate learning tool output.');
      }
    } catch (err: any) {
      setToolError(err.message || 'Unable to connect to AI learning tool engine.');
    } finally {
      setIsToolLoading(false);
    }
  };

  // 13. Generate Practice Quiz
  const handleGenerateQuiz = async () => {
    if (!selectedDoc) return;
    setIsToolLoading(true);
    setToolError('');
    setQuizSubmitted(false);
    setQuizUserAnswers({});

    try {
      const res = await apiClient.post<ApiResponse<{
        questions: QuizQuestion[];
      }>>(`/ai/documents/${selectedDoc._id}/quiz`, {
        numQuestions: 5,
      });

      if (res.success && Array.isArray(res.data?.questions)) {
        setQuizQuestions(res.data.questions);
      } else {
        setQuizQuestions([]);
        setToolError(res.message || 'Failed to generate quiz.');
      }
    } catch (err: any) {
      setQuizQuestions([]);
      setToolError(err.message || 'Failed to generate practice quiz.');
    } finally {
      setIsToolLoading(false);
    }
  };

  // 14. Jump to cited page in viewer
  const handleJumpToCitation = (pageNumber: number) => {
    setActiveViewerPage(pageNumber);
    setShowViewer(true);
  };

  // Helper: Format file size
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Helper: Get document format badge & icon
  const getFormatDetails = (format?: string, filename = '') => {
    const ext = (format || filename.split('.').pop() || '').toLowerCase();
    if (ext === 'pptx' || ext === 'ppt') {
      return {
        label: 'PPTX',
        bgColor: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: Presentation,
        accent: '#D97706',
      };
    }
    if (ext === 'docx' || ext === 'doc') {
      return {
        label: 'DOCX',
        bgColor: 'bg-blue-50 text-blue-800 border-blue-200',
        icon: FileCode,
        accent: '#2563EB',
      };
    }
    return {
      label: 'PDF',
      bgColor: 'bg-red-50 text-[#C62828] border-red-200',
      icon: FileText,
      accent: '#C62828',
    };
  };

  // Filtered documents
  const safeDocs = Array.isArray(documents) ? documents : [];
  const filteredDocuments = safeDocs.filter((doc) => {
    if (!doc) return false;
    const title = doc.title || '';
    const filename = doc.originalFilename || '';
    const matchesSearch =
      title.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
      filename.toLowerCase().includes(docSearchQuery.toLowerCase());
    const ext = (doc.documentFormat || filename.split('.').pop() || '').toLowerCase();
    const matchesFormat =
      docFormatFilter === 'ALL'
        ? true
        : docFormatFilter === 'pptx'
        ? ext === 'pptx' || ext === 'ppt'
        : docFormatFilter === 'docx'
        ? ext === 'docx' || ext === 'doc'
        : ext === 'pdf';
    return matchesSearch && matchesFormat;
  });

  // Calculate Quiz Score
  const calculateQuizScore = () => {
    let correct = 0;
    const safeQuestions = Array.isArray(quizQuestions) ? quizQuestions : [];
    safeQuestions.forEach((q) => {
      if (q && quizUserAnswers[q.id] === q.correctOptionIndex) {
        correct++;
      }
    });
    return { correct, total: safeQuestions.length };
  };

  return (
    <div className="min-h-screen bg-[#FFF7F7] text-[#252525] flex flex-col">
      {/* 1. HERO / WELCOME SECTION WITH 3D-INSPIRED VISUAL */}
      <section className="bg-gradient-to-b from-white via-white to-[#FFF7F7] border-b border-[#E7DADA] py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Soft background ambient glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-100/50 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
        <div className="absolute -bottom-10 left-10 w-72 h-72 bg-red-50 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
          {/* Left content */}
          <div className="flex-1 text-center lg:text-left space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF7F7] border border-[#E7DADA] text-xs font-semibold text-[#C62828] shadow-sm">
              <Sparkles className="w-4 h-4 text-[#C62828] animate-pulse" />
              <span>AI Document Tutor • Grounded RAG Workspace</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#252525] tracking-tight leading-tight">
              Your AI Academic <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C62828] to-[#EF5350]">
                Learning Assistant
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#6B7280] max-w-2xl leading-relaxed">
              Upload your study material, ask questions, understand concepts, and learn smarter.
              Retrieval-augmented intelligence with verified page and slide citations.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Button
                variant="primary"
                onClick={() => setUploadModalOpen(true)}
                className="gap-2 px-5 py-2.5 shadow-md hover:shadow-lg transition-all"
              >
                <Upload className="w-4 h-4" />
                Upload Study Material
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedDoc) {
                    setToolsModalOpen(true);
                  } else {
                    setUploadModalOpen(true);
                  }
                }}
                className="gap-2 px-5 py-2.5 border-[#C62828] text-[#C62828] hover:bg-[#FFF7F7]"
              >
                <Lightbulb className="w-4 h-4" />
                AI Learning Tools & Quiz
              </Button>
            </div>

            {/* Supported Document Formats Guide */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs text-[#6B7280]">
              <span className="font-semibold text-[#252525]">Supported formats:</span>
              <span className="px-2 py-0.5 rounded bg-white border border-[#E7DADA] font-medium text-[#C62828]">
                PDF (.pdf)
              </span>
              <span className="px-2 py-0.5 rounded bg-white border border-[#E7DADA] font-medium text-amber-700">
                PowerPoint (.pptx)
              </span>
              <span className="px-2 py-0.5 rounded bg-white border border-[#E7DADA] font-medium text-blue-700">
                Word (.docx)
              </span>
              <span className="text-[11px] text-gray-500 italic">
                (Legacy .ppt & .doc require export to .pptx/.docx)
              </span>
            </div>
          </div>

          {/* Right: Tasteful 3D-inspired AI Assistant Visual */}
          <div className="flex-1 w-full max-w-md lg:max-w-lg flex items-center justify-center relative">
            <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full border-2 border-red-200/60 animate-wave-pulse pointer-events-none" />
              <div className="absolute inset-6 rounded-full border border-red-300/40 animate-pulse-glow pointer-events-none" />

              {/* 3D Floating Central Core */}
              <div className="relative w-56 h-56 rounded-3xl bg-gradient-to-br from-white via-[#FFF7F7] to-red-50 border border-[#E7DADA] shadow-3d-red flex flex-col items-center justify-center p-6 text-center animate-float-3d">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#C62828] to-[#EF5350] text-white flex items-center justify-center shadow-lg shadow-red-500/20 mb-3">
                  <Sparkles className="w-10 h-10" />
                </div>
                <h2 className="text-base font-bold text-[#252525]">CUCampusSaathi Tutor</h2>
                <p className="text-xs text-[#6B7280] mt-1">Grounded RAG Intelligence</p>
                <div className="flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Active & Ready
                </div>
              </div>

              {/* Floating 3D Badge 1: Page Citations */}
              <div className="absolute top-4 left-2 bg-white/95 backdrop-blur-md border border-[#E7DADA] rounded-xl px-3 py-2 shadow-card-3d flex items-center gap-2 animate-float-gentle">
                <div className="w-7 h-7 rounded-lg bg-red-100 text-[#C62828] flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-[#252525]">Exact Citations</p>
                  <p className="text-[10px] text-[#6B7280]">Page & Slide references</p>
                </div>
              </div>

              {/* Floating 3D Badge 2: Voice Enabled */}
              <div className="absolute bottom-6 left-0 bg-white/95 backdrop-blur-md border border-[#E7DADA] rounded-xl px-3 py-2 shadow-card-3d flex items-center gap-2 animate-float-gentle delay-700">
                <div className="w-7 h-7 rounded-lg bg-red-100 text-[#C62828] flex items-center justify-center">
                  <Mic className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-[#252525]">Voice Enabled</p>
                  <p className="text-[10px] text-[#6B7280]">Dictate & Listen</p>
                </div>
              </div>

              {/* Floating 3D Badge 3: Multi-format */}
              <div className="absolute top-12 right-2 bg-white/95 backdrop-blur-md border border-[#E7DADA] rounded-xl px-3 py-2 shadow-card-3d flex items-center gap-2 animate-float-gentle delay-1000">
                <div className="w-7 h-7 rounded-lg bg-red-100 text-[#C62828] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-[#252525]">Multi-Format</p>
                  <p className="text-[10px] text-[#6B7280]">PDF, PPTX & Word</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-8">
        {/* DASHBOARD TOP CONTROL BAR */}
        <div className="bg-white rounded-2xl border border-[#E7DADA] p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Document Switcher or Indicator */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl bg-[#FFF7F7] border border-[#E7DADA] flex items-center justify-center text-[#C62828] shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="truncate">
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Active Study Material</span>
              <h2 className="text-sm sm:text-base font-bold text-[#252525] truncate max-w-xs sm:max-w-md">
                {selectedDoc ? selectedDoc.title : 'No study material selected'}
              </h2>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowViewer(!showViewer)}
              className="gap-1.5 text-xs border-[#E7DADA]"
            >
              <Split className="w-3.5 h-3.5" />
              {showViewer ? 'Hide Viewer' : 'Show Viewer'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveToolTab('quiz');
                setToolsModalOpen(true);
                handleGenerateQuiz();
              }}
              disabled={!selectedDoc || selectedDoc.processingStatus !== 'COMPLETED'}
              className="gap-1.5 text-xs border-[#E7DADA] text-amber-700 hover:bg-amber-50"
            >
              <Award className="w-3.5 h-3.5" />
              Practice Quiz
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveToolTab('summary');
                setToolsModalOpen(true);
                handleRunLearningTool('summary');
              }}
              disabled={!selectedDoc || selectedDoc.processingStatus !== 'COMPLETED'}
              className="gap-1.5 text-xs border-[#E7DADA] text-[#C62828] hover:bg-[#FFF7F7]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Summarizer & Tools
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setUploadModalOpen(true)}
              className="gap-1.5 text-xs shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Material
            </Button>
          </div>
        </div>

        {/* WORKSPACE LAYOUT: DOCUMENT VIEWER + AI CHAT PANEL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: INTEGRATED DOCUMENT VIEWER (When toggled on) */}
          {showViewer && selectedDoc && (
            <div
              className={`${
                viewerFullscreen
                  ? 'fixed inset-4 z-50 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col'
                  : 'lg:col-span-6 bg-white rounded-2xl border border-[#E7DADA] shadow-card-3d overflow-hidden flex flex-col h-[720px]'
              }`}
            >
              {/* Viewer Header */}
              <div className="bg-[#FFF7F7] border-b border-[#E7DADA] px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 truncate">
                  {(() => {
                    const details = getFormatDetails(selectedDoc.documentFormat, selectedDoc.originalFilename);
                    const IconComponent = details.icon;
                    return (
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${details.bgColor} flex items-center gap-1`}>
                        <IconComponent className="w-3 h-3" />
                        {details.label}
                      </span>
                    );
                  })()}
                  <span className="text-xs font-bold text-[#252525] truncate">{selectedDoc.originalFilename}</span>
                </div>

                {/* Viewer Navigation & Zoom Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1 bg-white border border-[#E7DADA] rounded-lg px-2 py-1 text-xs">
                    <button
                      onClick={() => setActiveViewerPage((p) => Math.max(1, p - 1))}
                      disabled={activeViewerPage <= 1}
                      className="text-[#6B7280] hover:text-[#252525] disabled:opacity-30"
                      title="Previous Page / Slide"
                    >
                      <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                    </button>
                    <span className="font-semibold text-xs px-1 text-[#252525]">
                      {activeViewerPage} / {selectedDoc.pageCount || viewerPages.length || 1}
                    </span>
                    <button
                      onClick={() =>
                        setActiveViewerPage((p) =>
                          Math.min(selectedDoc.pageCount || viewerPages.length || 1, p + 1)
                        )
                      }
                      disabled={activeViewerPage >= (selectedDoc.pageCount || viewerPages.length || 1)}
                      className="text-[#6B7280] hover:text-[#252525] disabled:opacity-30"
                      title="Next Page / Slide"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => setViewerZoom((z) => Math.max(60, z - 15))}
                    className="p-1 rounded bg-white border border-[#E7DADA] text-[#6B7280] hover:text-[#252525]"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewerZoom((z) => Math.min(180, z + 15))}
                    className="p-1 rounded bg-white border border-[#E7DADA] text-[#6B7280] hover:text-[#252525]"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setViewerFullscreen(!viewerFullscreen)}
                    className="p-1 rounded bg-white border border-[#E7DADA] text-[#6B7280] hover:text-[#252525]"
                    title={viewerFullscreen ? 'Exit Fullscreen' : 'Fullscreen Viewer'}
                  >
                    {viewerFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>

                  {viewerFullscreen && (
                    <button
                      onClick={() => setViewerFullscreen(false)}
                      className="p-1 rounded bg-red-50 text-[#C62828] hover:bg-red-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Viewer Content Canvas */}
              <div className="flex-1 bg-gray-50 overflow-auto p-4 flex flex-col items-center justify-start">
                {isViewerLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20 text-[#6B7280]">
                    <Loader2 className="w-8 h-8 text-[#C62828] animate-spin mb-3" />
                    <p className="text-xs font-semibold">Loading document content...</p>
                  </div>
                ) : selectedDoc.documentFormat === 'pdf' ? (
                  // PDF Viewer using iframe stream
                  <div
                    className="w-full h-full bg-white rounded-xl border border-[#E7DADA] shadow-sm overflow-hidden flex flex-col"
                    style={{ transform: `scale(${viewerZoom / 100})`, transformOrigin: 'top center' }}
                  >
                    <iframe
                      src={`${API_BASE_URL}/documents/${selectedDoc._id}/file#page=${activeViewerPage}`}
                      className="w-full h-full border-0"
                      title={selectedDoc.title}
                    />
                  </div>
                ) : (
                  // PowerPoint Slide Viewer or Word Document Viewer
                  <div
                    className="w-full max-w-xl bg-white rounded-xl border border-[#E7DADA] shadow-md p-6 sm:p-8 transition-transform"
                    style={{ transform: `scale(${viewerZoom / 100})`, transformOrigin: 'top center' }}
                  >
                    <div className="border-b border-[#E7DADA] pb-3 mb-4 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#C62828]">
                        {selectedDoc.documentFormat === 'pptx' ? `Slide ${activeViewerPage}` : `Section ${activeViewerPage}`}
                      </span>
                      <span className="text-[11px] text-[#6B7280]">
                        {selectedDoc.documentFormat === 'pptx' ? 'PowerPoint Presentation' : 'Word Study Material'}
                      </span>
                    </div>

                    <div className="text-sm leading-relaxed text-[#252525] whitespace-pre-wrap font-sans">
                      {viewerPages.find((p) => p.pageNumber === activeViewerPage)?.text ||
                        'No text content extracted for this slide.'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RIGHT: AI CHAT WORKSPACE */}
          <div
            className={`${
              showViewer && selectedDoc ? 'lg:col-span-6' : 'lg:col-span-12'
            } bg-white rounded-2xl border border-[#E7DADA] shadow-card-3d flex flex-col h-[720px] overflow-hidden`}
          >
            {/* Chat Panel Header */}
            <div className="bg-[#FFF7F7] border-b border-[#E7DADA] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#C62828] text-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#252525]">AI Academic Tutor</h3>
                  <p className="text-[11px] text-[#6B7280]">
                    {selectedDoc ? `Grounded in: ${selectedDoc.title}` : 'No document selected'}
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2">
                {speakingMessageIndex !== null && (
                  <button
                    onClick={handleStopSpeech}
                    className="p-1.5 rounded-lg bg-red-100 border border-red-300 text-xs font-bold text-[#C62828] hover:bg-red-200 flex items-center gap-1 animate-pulse"
                    title="Stop Audio Speech"
                  >
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Stop Audio</span>
                  </button>
                )}

                {conversations.length > 0 && (
                  <button
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className="p-1.5 rounded-lg bg-white border border-[#E7DADA] text-xs font-semibold text-[#6B7280] hover:text-[#252525] flex items-center gap-1"
                    title="View Conversations"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#C62828]" />
                    <span className="hidden sm:inline">History</span>
                  </button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMessages([]);
                    setActiveConversationId(null);
                    setChatError('');
                  }}
                  className="gap-1 text-xs border-[#E7DADA] py-1 px-2.5"
                  title="New conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>New Chat</span>
                </Button>
              </div>
            </div>

            {/* Conversation History Drawer (Collapsible) */}
            {isHistoryOpen && (
              <div className="bg-[#FFF7F7] border-b border-[#E7DADA] p-3 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E7DADA]">
                  <span className="text-xs font-bold text-[#252525]">Recent Conversations</span>
                  <button onClick={() => setIsHistoryOpen(false)} className="text-[#6B7280] hover:text-[#252525]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {Array.isArray(conversations) && conversations.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => {
                        loadConversationMessages(c._id);
                        setIsHistoryOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        activeConversationId === c._id
                          ? 'bg-red-100 font-bold text-[#C62828]'
                          : 'bg-white hover:bg-red-50 text-[#252525]'
                      }`}
                    >
                      <span className="truncate max-w-[280px]">{c.title || 'Untitled Conversation'}</span>
                      <span className="text-[10px] text-[#6B7280]">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                // Empty Chat State with Suggested Prompts
                <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#FFF7F7] border border-[#E7DADA] text-[#C62828] flex items-center justify-center shadow-sm mb-3">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-[#252525]">Ask Anything About This Study Material</h4>
                  <p className="text-xs text-[#6B7280] max-w-sm mt-1 mb-6">
                    The AI Tutor retrieves grounded context from your document and provides verified citations.
                  </p>

                  {/* Suggested Prompts */}
                  <div className="w-full max-w-md space-y-2 text-left">
                    <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider text-center">
                      Suggested Prompts
                    </p>
                    {[
                      'Explain this chapter in simple academic language.',
                      'Summarize the core concepts and methodologies.',
                      'What are the most probable university exam questions from this document?',
                      'Generate short revision notes and key formulas.',
                      'Explain the step-by-step mechanism described in this material.',
                    ].map((promptText, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(promptText)}
                        disabled={!selectedDoc || selectedDoc.processingStatus !== 'COMPLETED'}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl bg-white border border-[#E7DADA] hover:border-[#C62828] hover:bg-[#FFF7F7] text-xs font-medium text-[#252525] transition-all flex items-center justify-between group shadow-xs"
                      >
                        <span className="truncate">{promptText}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#6B7280] group-hover:text-[#C62828] shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // Message List
                Array.isArray(messages) && messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.role === 'USER' ? 'items-end' : 'items-start'} space-y-1.5`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        msg.role === 'USER'
                          ? 'bg-[#C62828] text-white rounded-br-xs shadow-sm'
                          : 'bg-[#FFF7F7] border border-[#E7DADA] text-[#252525] rounded-bl-xs shadow-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Source Citations Pills */}
                      {msg.role === 'ASSISTANT' && Array.isArray(msg.sourceReferences) && msg.sourceReferences.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#E7DADA]/60 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mr-1">
                            Citations:
                          </span>
                          {msg.sourceReferences.map((ref, rIdx) => (
                            <button
                              key={rIdx}
                              onClick={() => handleJumpToCitation(ref.pageNumber)}
                              className="px-2 py-0.5 rounded-md bg-white border border-[#C62828]/30 hover:border-[#C62828] text-[11px] font-bold text-[#C62828] hover:bg-red-50 transition-colors flex items-center gap-1 shadow-xs"
                              title={`Jump to Page/Slide ${ref.pageNumber}`}
                            >
                              <span>{selectedDoc?.documentFormat === 'pptx' ? `Slide ${ref.pageNumber}` : `Page ${ref.pageNumber}`}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Message Actions (Copy & Read Aloud) */}
                    {msg.role === 'ASSISTANT' && (
                      <div className="flex items-center gap-1 text-[11px] text-[#6B7280] pl-1">
                        <button
                          onClick={() => handleCopyAnswer(msg.content, idx)}
                          className="p-1 rounded hover:bg-red-50 text-[#6B7280] hover:text-[#C62828] flex items-center gap-1"
                          title="Copy Answer"
                        >
                          {copiedMessageIndex === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-[10px] text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleSpeakAnswer(msg.content, idx)}
                          className="p-1 rounded hover:bg-red-50 text-[#6B7280] hover:text-[#C62828] flex items-center gap-1"
                          title={speakingMessageIndex === idx ? 'Pause / Resume Speech' : 'Read Aloud'}
                        >
                          {speakingMessageIndex === idx ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-[#C62828] animate-pulse" />
                              <span className="text-[10px] text-[#C62828]">Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Speak</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Generating Animation */}
              {isChatLoading && (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#C62828] bg-red-50 border border-red-100 rounded-xl p-3 w-fit">
                  <Loader2 className="w-4 h-4 animate-spin text-[#C62828]" />
                  <span>Searching document chunks & generating grounded response...</span>
                  <button
                    onClick={handleStopGeneration}
                    className="ml-3 px-2 py-0.5 rounded bg-white border border-red-200 text-[10px] font-bold text-[#C62828] hover:bg-red-100 flex items-center gap-1"
                  >
                    <Square className="w-2.5 h-2.5" />
                    Stop
                  </button>
                </div>
              )}

              {/* Error Banner */}
              {chatError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#C62828] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{chatError}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Area */}
            <div className="p-3 sm:p-4 border-t border-[#E7DADA] bg-white">
              {isListening && (
                <div className="mb-2 p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-[#C62828] flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                    <span className="font-semibold">Listening to your question... Speak clearly.</span>
                  </div>
                  <button
                    onClick={handleToggleVoiceInput}
                    className="text-xs font-bold underline"
                  >
                    Done
                  </button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  disabled={!selectedDoc || isChatLoading}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isListening
                      ? 'bg-red-600 text-white border-red-600 animate-wave-pulse shadow-md'
                      : 'bg-[#FFF7F7] border-[#E7DADA] text-[#6B7280] hover:text-[#C62828] hover:border-[#C62828]'
                  }`}
                  title={isListening ? 'Stop Listening' : 'Voice Input (Speech-to-Text)'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Input Text Box */}
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={
                    selectedDoc
                      ? `Ask a question about ${selectedDoc.title}...`
                      : 'Select or upload a document first...'
                  }
                  disabled={!selectedDoc || selectedDoc.processingStatus !== 'COMPLETED' || isChatLoading}
                  className="flex-1 bg-[#FFF7F7] border border-[#E7DADA] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#252525] focus:outline-none focus:border-[#C62828] focus:bg-white placeholder:text-gray-400"
                />

                {/* Send / Stop Button */}
                {isChatLoading ? (
                  <button
                    type="button"
                    onClick={handleStopGeneration}
                    className="p-2.5 rounded-xl bg-gray-800 hover:bg-black text-white shadow-sm flex items-center justify-center"
                    title="Stop Generation"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!selectedDoc || !inputQuery.trim() || selectedDoc.processingStatus !== 'COMPLETED'}
                    className="p-2.5 rounded-xl shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* 3. MY STUDY MATERIALS SECTION */}
        <section className="bg-white rounded-2xl border border-[#E7DADA] p-6 shadow-card-3d">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#E7DADA]">
            <div>
              <h2 className="text-xl font-extrabold text-[#252525]">My Study Materials</h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Manage, search, and interrogate your uploaded course documents with AI.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#FFF7F7] p-1 rounded-xl border border-[#E7DADA]">
              {(['ALL', 'pdf', 'pptx', 'docx'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setDocFormatFilter(fmt)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    docFormatFilter === fmt
                      ? 'bg-[#C62828] text-white shadow-xs'
                      : 'text-[#6B7280] hover:text-[#252525]'
                  }`}
                >
                  {fmt === 'ALL' ? 'All Files' : fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="pt-4 pb-2">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
                placeholder="Search by document title or filename..."
                className="w-full bg-[#FFF7F7] border border-[#E7DADA] rounded-xl pl-9 pr-4 py-2 text-xs text-[#252525] focus:outline-none focus:border-[#C62828] focus:bg-white"
              />
            </div>
          </div>

          {/* Document Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            {docsLoading ? (
              <div className="col-span-full py-12 text-center text-[#6B7280]">
                <Loader2 className="w-6 h-6 text-[#C62828] animate-spin mx-auto mb-2" />
                <p className="text-xs font-semibold">Loading your library...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-[#E7DADA] rounded-2xl bg-[#FFF7F7]">
                <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-[#252525]">No study materials found</p>
                <p className="text-xs text-[#6B7280] max-w-sm mx-auto mt-1 mb-4">
                  Upload your PDFs, PowerPoint lecture slides (.pptx), or Word notes (.docx) to start learning.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setUploadModalOpen(true)}
                  className="gap-1.5 text-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload First Document
                </Button>
              </div>
            ) : (
              Array.isArray(filteredDocuments) && filteredDocuments.map((doc) => {
                const details = getFormatDetails(doc.documentFormat, doc.originalFilename);
                const IconComp = details.icon;
                const isSelected = selectedDoc?._id === doc._id;

                return (
                  <div
                    key={doc._id}
                    className={`rounded-xl border p-4 transition-all card-3d-tilt flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#C62828] bg-white ring-2 ring-red-100 shadow-md'
                        : 'border-[#E7DADA] bg-white hover:border-[#C62828]/50 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${details.bgColor} flex items-center gap-1`}>
                          <IconComp className="w-3 h-3" />
                          {details.label}
                        </span>

                        {/* Processing Status */}
                        {doc.processingStatus === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Ready
                          </span>
                        ) : doc.processingStatus === 'PROCESSING' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Indexing
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                            <AlertCircle className="w-3 h-3" />
                            Failed
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-[#252525] line-clamp-1 mb-1" title={doc.title}>
                        {doc.title}
                      </h3>
                      <p className="text-xs text-[#6B7280] line-clamp-1 mb-3" title={doc.originalFilename}>
                        {doc.originalFilename}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-[#6B7280] border-t border-gray-100 pt-2 mb-4">
                        <span>{formatBytes(doc.fileSize)}</span>
                        <span>•</span>
                        <span>
                          {doc.pageCount} {doc.documentFormat === 'pptx' ? 'slides' : 'pages'}
                        </span>
                        <span>•</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-gray-100">
                      <Button
                        variant={isSelected ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedDoc(doc)}
                        className="flex-1 text-xs py-1.5"
                      >
                        {isSelected ? 'Selected' : 'Ask AI'}
                      </Button>

                      <button
                        onClick={() => {
                          setSelectedDoc(doc);
                          setShowViewer(true);
                        }}
                        className="p-2 rounded-lg bg-[#FFF7F7] border border-[#E7DADA] text-[#6B7280] hover:text-[#C62828] hover:border-[#C62828] transition-colors"
                        title="View Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmDoc(doc)}
                        className="p-2 rounded-lg bg-red-50 border border-red-100 text-[#C62828] hover:bg-red-100 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* 4. MODAL: UPLOAD STUDY MATERIAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E7DADA] shadow-3d-red max-w-lg w-full p-6 sm:p-8 animate-float-gentle relative">
            <button
              onClick={() => {
                if (!isUploading) {
                  setUploadModalOpen(false);
                  setUploadError('');
                }
              }}
              className="absolute top-5 right-5 p-1.5 rounded-full text-[#6B7280] hover:text-[#252525] hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 text-[#C62828] flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#252525]">Upload Study Material</h3>
                <p className="text-xs text-[#6B7280]">Add files to your private AI academic knowledge base.</p>
              </div>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  setUploadFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#C62828] bg-red-50'
                  : 'border-[#E7DADA] bg-[#FFF7F7] hover:border-[#C62828]/60 hover:bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.pptx,.docx,.ppt,.doc"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setUploadFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-xl bg-white border border-[#E7DADA] text-[#C62828] flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Upload className="w-6 h-6" />
              </div>

              {uploadFile ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#252525] truncate">{uploadFile.name}</p>
                  <p className="text-[11px] text-[#6B7280]">{formatBytes(uploadFile.size)}</p>
                  <span className="inline-block mt-1 text-[11px] font-semibold text-[#C62828] underline">
                    Click to choose a different file
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#252525]">Drag & drop file here, or click to browse</p>
                  <p className="text-[11px] text-[#6B7280]">Supports PDF (.pdf), PowerPoint (.pptx), and Word (.docx)</p>
                  <p className="text-[10px] text-gray-400">Maximum file size: 15MB</p>
                </div>
              )}
            </div>

            {/* Optional Custom Title */}
            <div className="mt-4 space-y-1.5 text-left">
              <label className="text-xs font-bold text-[#252525]">Custom Document Title (Optional)</label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. DBMS Normalization Chapter 4"
                className="w-full bg-[#FFF7F7] border border-[#E7DADA] rounded-xl px-3.5 py-2 text-xs text-[#252525] focus:outline-none focus:border-[#C62828] focus:bg-white"
              />
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#C62828] flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Progress bar */}
            {isUploading && (
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#6B7280]">
                  <span>Extracting & Indexing...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-red-100 overflow-hidden">
                  <div
                    className="h-full bg-[#C62828] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUploadModalOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleFileUpload()}
                disabled={!uploadFile || isUploading}
                className="gap-1.5 shadow-sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Index Document</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: AI LEARNING TOOLS & INTERACTIVE PRACTICE QUIZ */}
      {toolsModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E7DADA] shadow-3d-red max-w-3xl w-full p-6 sm:p-8 max-h-[85vh] flex flex-col relative animate-float-gentle">
            <button
              onClick={() => setToolsModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-[#6B7280] hover:text-[#252525] hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#E7DADA]">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#C62828] flex items-center justify-center">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#252525]">AI Academic Learning Tools</h3>
                <p className="text-xs text-[#6B7280]">Grounded in: {selectedDoc.title}</p>
              </div>
            </div>

            {/* Tool Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#FFF7F7] p-1.5 rounded-xl border border-[#E7DADA] mb-5">
              {[
                { id: 'summary', label: 'Chapter Summary', icon: Sparkles },
                { id: 'exam_prep', label: 'Exam Prep Kit', icon: GraduationCap },
                { id: 'notes', label: 'Revision Notes', icon: FileCheck },
                { id: 'concept_explainer', label: 'Concept Explainer', icon: Lightbulb },
                { id: 'quiz', label: 'Practice Quiz', icon: Award },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeToolTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveToolTab(tab.id as any);
                      if (tab.id === 'quiz') {
                        if (quizQuestions.length === 0) handleGenerateQuiz();
                      } else {
                        handleRunLearningTool(tab.id as any);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#C62828] text-white shadow-xs'
                        : 'text-[#6B7280] hover:text-[#252525] hover:bg-white'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Concept Explainer Style Controls */}
            {activeToolTab === 'concept_explainer' && (
              <div className="mb-4 p-3 rounded-xl bg-[#FFF7F7] border border-[#E7DADA] space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-[#252525]">Explanation Style:</span>
                  {(['beginner', 'academic', 'step_by_step', 'exam_oriented'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setExplainerStyle(s);
                        handleRunLearningTool('concept_explainer');
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                        explainerStyle === s
                          ? 'bg-white text-[#C62828] border border-[#C62828] shadow-xs'
                          : 'text-[#6B7280] hover:text-[#252525]'
                      }`}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={explainerTopic}
                    onChange={(e) => setExplainerTopic(e.target.value)}
                    placeholder="Specific concept or topic to explain (e.g. 3NF, Semaphore, Dijkstra)..."
                    className="flex-1 bg-white border border-[#E7DADA] rounded-lg px-3 py-1.5 text-xs text-[#252525] focus:outline-none focus:border-[#C62828]"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleRunLearningTool('concept_explainer')}
                    disabled={isToolLoading}
                    className="text-xs py-1.5 px-3"
                  >
                    Explain Topic
                  </Button>
                </div>
              </div>
            )}

            {/* Result Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 border border-[#E7DADA] rounded-2xl p-5 text-xs sm:text-sm leading-relaxed text-[#252525]">
              {isToolLoading ? (
                <div className="flex flex-col items-center justify-center h-48 text-center py-10 text-[#6B7280]">
                  <Loader2 className="w-8 h-8 text-[#C62828] animate-spin mb-3" />
                  <p className="text-xs font-semibold">Generating grounded academic analysis...</p>
                </div>
              ) : toolError ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-[#C62828] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{toolError}</span>
                </div>
              ) : activeToolTab === 'quiz' ? (
                // Interactive Practice Quiz Test Runner
                quizQuestions.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-xs text-[#6B7280]">Click below to generate multiple choice quiz questions.</p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleGenerateQuiz}
                      className="mt-3 text-xs"
                    >
                      Generate 5 Practice Questions
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Array.isArray(quizQuestions) && quizQuestions.map((q, qIndex) => (
                      <div key={q.id} className="bg-white rounded-xl border border-[#E7DADA] p-4 shadow-xs">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h4 className="text-xs sm:text-sm font-bold text-[#252525]">
                            {qIndex + 1}. {q.question}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-[#C62828] border border-red-200">
                            Page {q.citationPage}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {Array.isArray(q?.options) && q.options.map((opt, optIndex) => {
                            const isSelected = quizUserAnswers[q.id] === optIndex;
                            const isCorrect = q.correctOptionIndex === optIndex;
                            let optionClass = 'bg-[#FFF7F7] border-[#E7DADA] text-[#252525] hover:border-[#C62828]';

                            if (quizSubmitted) {
                              if (isCorrect) {
                                optionClass = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                              } else if (isSelected && !isCorrect) {
                                optionClass = 'bg-red-50 border-red-500 text-red-900 line-through';
                              }
                            } else if (isSelected) {
                              optionClass = 'bg-red-50 border-[#C62828] text-[#C62828] font-bold shadow-xs';
                            }

                            return (
                              <button
                                key={optIndex}
                                onClick={() => {
                                  if (!quizSubmitted) {
                                    setQuizUserAnswers((prev) => ({ ...prev, [q.id]: optIndex }));
                                  }
                                }}
                                disabled={quizSubmitted}
                                className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${optionClass}`}
                              >
                                <span>{opt}</span>
                                {quizSubmitted && isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                              </button>
                            );
                          })}
                        </div>

                        {quizSubmitted && (
                          <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-[#6B7280]">
                            <span className="font-bold text-[#252525]">Explanation: </span>
                            <span>{q.explanation}</span>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Quiz Controls & Score Card */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E7DADA]">
                      {quizSubmitted ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#252525]">
                            Score: {calculateQuizScore().correct} / {calculateQuizScore().total}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateQuiz}
                            className="text-xs gap-1 border-[#E7DADA]"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            New Questions
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setQuizSubmitted(true)}
                          disabled={Object.keys(quizUserAnswers).length === 0}
                          className="text-xs shadow-sm"
                        >
                          Submit & Check Answers
                        </Button>
                      )}
                    </div>
                  </div>
                )
              ) : (
                // Markdown Output for Summaries, Notes, Exam Prep, Explainer
                <div className="whitespace-pre-wrap">{toolResultContent || 'Click generate to run this tool.'}</div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="mt-4 pt-3 border-t border-[#E7DADA] flex items-center justify-between">
              <span className="text-[11px] text-[#6B7280]">
                Grounded in extracted chunks • Verified academic content
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setToolsModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: DELETE CONFIRMATION */}
      {deleteConfirmDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E7DADA] shadow-2xl max-w-sm w-full p-6 text-center animate-float-gentle">
            <div className="w-12 h-12 rounded-full bg-red-100 text-[#C62828] flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#252525]">Delete Study Material?</h3>
            <p className="text-xs text-[#6B7280] mt-1.5 mb-5">
              Are you sure you want to delete <span className="font-bold text-[#252525]">"{deleteConfirmDoc.title}"</span>?
              All indexed chunks and conversation history will be permanently removed.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmDoc(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDeleteDocument}
                disabled={isDeleting}
                className="bg-red-700 hover:bg-red-800"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
