import mongoose, { Schema, Document as MongooseDoc, Types } from 'mongoose';

export interface ISourceReference {
  documentId: Types.ObjectId;
  pageNumber: number;
  chunkId?: Types.ObjectId;
  excerpt: string;
}

export interface IConversationMessage {
  _id?: Types.ObjectId;
  role: 'USER' | 'ASSISTANT';
  content: string;
  sourceReferences?: ISourceReference[];
  createdAt: Date;
}

export interface IDocumentConversation extends MongooseDoc {
  owner: Types.ObjectId;
  document: Types.ObjectId;
  title: string;
  messages: IConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const sourceReferenceSchema = new Schema<ISourceReference>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    pageNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    chunkId: {
      type: Schema.Types.ObjectId,
      ref: 'DocumentChunk',
    },
    excerpt: {
      type: String,
      required: true,
      maxlength: 600,
    },
  },
  { _id: false }
);

const conversationMessageSchema = new Schema<IConversationMessage>({
  role: {
    type: String,
    enum: ['USER', 'ASSISTANT'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  sourceReferences: {
    type: [sourceReferenceSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const documentConversationSchema = new Schema<IDocumentConversation>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Conversation owner is required'],
      index: true,
    },
    document: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: [true, 'Document reference is required'],
      index: true,
    },
    title: {
      type: String,
      default: 'New Consultation Session',
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    messages: {
      type: [conversationMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

documentConversationSchema.index({ owner: 1, document: 1, updatedAt: -1 });

export const DocumentConversationModel = mongoose.model<IDocumentConversation>(
  'DocumentConversation',
  documentConversationSchema
);
