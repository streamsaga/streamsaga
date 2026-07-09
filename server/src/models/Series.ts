import { Schema, model, Document, Types } from 'mongoose';

export interface ISeries extends Document {
  title: string;
  slug: string;
  description: string;
  releaseYear: number;
  ageRating: string;
  genres: Types.ObjectId[];
  categories: Types.ObjectId[];
  cast: string[];
  poster: string;
  banner: string;
  trailerUrl?: string;
  totalSeasons: number;
  status: 'draft' | 'published';
  isFeatured: boolean;
  isTrending: boolean;
  views: number;
  averageRating: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const seriesSchema = new Schema<ISeries>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    releaseYear: { type: Number, required: true },
    ageRating: { type: String, default: 'NR' },
    genres: [{ type: Schema.Types.ObjectId, ref: 'Genre' }],
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    cast: [{ type: String }],
    poster: { type: String, default: '' },
    banner: { type: String, default: '' },
    trailerUrl: { type: String, default: '' },
    totalSeasons: { type: Number, default: 1 },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 10 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

seriesSchema.index({ title: 'text', description: 'text' });

export const Series = model<ISeries>('Series', seriesSchema);
