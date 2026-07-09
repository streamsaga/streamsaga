import { Schema, model, Document, Types } from 'mongoose';

export interface IQualityVariant {
  resolution: '240p' | '360p' | '480p' | '720p' | '1080p';
  url: string;
  bitrate?: number;
}

export interface IMovie extends Document {
  title: string;
  slug: string;
  description: string;
  releaseYear: number;
  duration: number; // in minutes
  ageRating: string;
  genres: Types.ObjectId[];
  categories: Types.ObjectId[];
  cast: string[];
  director: string;
  poster: string;
  banner: string;
  trailerUrl?: string;
  previewClipUrl?: string;
  hlsMasterPlaylistUrl?: string;
  qualities: IQualityVariant[];
  rawVideoKey?: string; // original R2 object key, kept for reprocessing
  status: 'processing' | 'draft' | 'published' | 'failed';
  isFeatured: boolean;
  isTrending: boolean;
  views: number;
  averageRating: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const qualitySchema = new Schema<IQualityVariant>(
  {
    resolution: { type: String, enum: ['240p', '360p', '480p', '720p', '1080p'], required: true },
    url: { type: String, required: true },
    bitrate: { type: Number },
  },
  { _id: false }
);

const movieSchema = new Schema<IMovie>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    releaseYear: { type: Number, required: true },
    duration: { type: Number, required: true },
    ageRating: { type: String, default: 'NR' },
    genres: [{ type: Schema.Types.ObjectId, ref: 'Genre' }],
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    cast: [{ type: String }],
    director: { type: String, default: '' },
    poster: { type: String, default: '' },
    banner: { type: String, default: '' },
    trailerUrl: { type: String, default: '' },
    previewClipUrl: { type: String, default: '' },
    hlsMasterPlaylistUrl: { type: String, default: '' },
    qualities: { type: [qualitySchema], default: [] },
    rawVideoKey: { type: String, default: '' },
    status: { type: String, enum: ['processing', 'draft', 'published', 'failed'], default: 'draft' },
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 10 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

movieSchema.index({ title: 'text', description: 'text' });
movieSchema.index({ status: 1, isFeatured: 1, isTrending: 1 });

export const Movie = model<IMovie>('Movie', movieSchema);
