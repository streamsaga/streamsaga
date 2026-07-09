import { Request, Response } from 'express';
import { Genre } from '../models/Genre';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';
import { slugify } from '../utils/slugify';

export const listGenres = asyncHandler(async (_req: Request, res: Response) => {
  const genres = await Genre.find().sort({ name: 1 });
  res.json({ success: true, data: { genres } });
});

export const createGenre = asyncHandler(async (req: Request, res: Response) => {
  const slug = slugify(req.body.name);
  const exists = await Genre.exists({ slug });
  if (exists) throw new ApiError(409, 'A genre with this name already exists');

  const genre = await Genre.create({ name: req.body.name, slug });
  res.status(201).json({ success: true, data: { genre } });
});

export const updateGenre = asyncHandler(async (req: Request, res: Response) => {
  const genre = await Genre.findById(req.params.id);
  if (!genre) throw new ApiError(404, 'Genre not found');

  genre.name = req.body.name ?? genre.name;
  genre.slug = slugify(genre.name);
  await genre.save();

  res.json({ success: true, data: { genre } });
});

export const deleteGenre = asyncHandler(async (req: Request, res: Response) => {
  const genre = await Genre.findByIdAndDelete(req.params.id);
  if (!genre) throw new ApiError(404, 'Genre not found');
  res.json({ success: true, message: 'Genre deleted successfully' });
});
