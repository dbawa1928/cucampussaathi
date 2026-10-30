import mongoose, { Schema, Document as MongooseDoc, Types } from 'mongoose';

export interface IDocumentChunk extends MongooseDoc {
  document: Types.ObjectId;
  owner: Types.ObjectId;
  chunkIndex: number;
  pageNumber: number;
  content: string;
  tokenCount: number;
  embedding?: number[];
  metadata?: Record<string, any>;
  createdAt: Date;
}

const documentChunkSchema = new Schema<IDocumentChunk>(
  {
    document: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: [true, 'Document reference is required'],
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner reference is required'],
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: [true, 'Chunk index is required'],
    },
    pageNumber: {
      type: Number,
      required: [true, 'Page number is required'],
      min: 1,
    },
    content: {
      type: String,
      required: [true, 'Chunk content is required'],
      trim: true,
    },
    tokenCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    embedding: {
      type: [Number],
      default: undefined,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes for fast retrieval & owner protection
documentChunkSchema.index({ document: 1, chunkIndex: 1 });
documentChunkSchema.index({ owner: 1, document: 1 });
documentChunkSchema.index({ document: 1, pageNumber: 1 });

// Full text search index on content for high-performance lexical search
documentChunkSchema.index({ content: 'text' });

export const DocumentChunkModel = mongoose.model<IDocumentChunk>(
  'DocumentChunk',
  documentChunkSchema
);
