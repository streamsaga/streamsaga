import { Schema, model, Document, Types } from 'mongoose';
import { IQualityVariant } from './Movie';

export interface IEpisode extends Document {
  series: Types.ObjectId;
  season: number;
  episodeNumber: number;
  title: string;
  description: string;
  duration: number;
  thumbnail: string;
  hlsMasterPlaylistUrl?: string;
  qualities: IQualityVariant[];
  status: 'processing' | 'draft' | 'published' | 'failed';
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

const episodeSchema = new Schema<IEpisode>(
  {
    series: { type: Schema.Types.ObjectId, ref: 'Series', required: true },
    season: { type: Number, required: true },
    episodeNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    duration: { type: Number, default: 0 },
    thumbnail: { type: String, default: '' },
    hlsMasterPlaylistUrl: { type: String, default: '' },
    qualities: { type: [qualitySchema], default: [] },
    status: { type: String, enum: ['processing', 'draft', 'published', 'failed'], default: 'draft' },
  },
  { timestamps: true }
);

episodeSchema.index({ series: 1, season: 1, episodeNumber: 1 }, { unique: true });

export const Episode = model<IEpisode>('Episode', episodeSchema);
