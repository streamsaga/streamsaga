import { Schema, model, Document } from 'mongoose';

export interface IGenre extends Document {
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const genreSchema = new Schema<IGenre>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

export const Genre = model<IGenre>('Genre', genreSchema);
