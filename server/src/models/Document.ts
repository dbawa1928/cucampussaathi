import mongoose, { Schema, Document as MongooseDoc, Types } from 'mongoose';

export type DocumentProcessingStatus = 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface IDocument extends MongooseDoc {
  owner: Types.ObjectId;
  title: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
  storageKey: string;
  pageCount: number;
  documentFormat?: 'pdf' | 'pptx' | 'docx';
  extractedPages?: {
    pageNumber: number;
    text: string;
    type?: string;
  }[];
  processingStatus: DocumentProcessingStatus;
  processingError?: string;
  chunkCount: number;
  embeddingProvider: string;
  extractedTextLength: number;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Document owner is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    originalFilename: {
      type: String,
      required: [true, 'Original filename is required'],
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      default: 'application/pdf',
    },
    fileSize: {
      type: Number,
      required: [true, 'File size in bytes is required'],
      min: [1, 'File cannot be empty'],
    },
    storagePath: {
      type: String,
      required: [true, 'Storage path is required'],
    },
    storageKey: {
      type: String,
      required: [true, 'Unique storage key is required'],
      unique: true,
    },
    pageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    documentFormat: {
      type: String,
      enum: ['pdf', 'pptx', 'docx'],
      default: 'pdf',
    },
    extractedPages: [
      {
        pageNumber: { type: Number, required: true },
        text: { type: String, default: '' },
        type: { type: String, default: 'page' },
      },
    ],
    processingStatus: {
      type: String,
      enum: ['UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'UPLOADED',
      index: true,
    },
    processingError: {
      type: String,
      default: null,
    },
    chunkCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    embeddingProvider: {
      type: String,
      default: 'bm25-lexical',
    },
    extractedTextLength: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ owner: 1, createdAt: -1 });

export const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);
