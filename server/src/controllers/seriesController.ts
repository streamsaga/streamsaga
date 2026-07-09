import { Request, Response } from 'express';
import { Series } from '../models/Series';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';
import { slugify } from '../utils/slugify';
import { AuthenticatedRequest } from '../middleware/auth';

export const listSeries = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const filter: Record<string, unknown> = {};
  if (req.query.search) filter.$text = { $search: String(req.query.search) };
  if (req.query.status) filter.status = req.query.status;

  const [series, total] = await Promise.all([
    Series.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('genres categories'),
    Series.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { series, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
  });
});

export const getSeriesById = asyncHandler(async (req: Request, res: Response) => {
  const series = await Series.findById(req.params.id).populate('genres categories');
  if (!series) throw new ApiError(404, 'Series not found');
  
  if (series.status === 'published') {
    series.views = (series.views || 0) + 1;
    await series.save();
  }

  res.json({ success: true, data: { series } });
});

export const createSeries = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const baseSlug = slugify(req.body.title);
  let slug = baseSlug;
  let suffix = 1;
  while (await Series.exists({ slug })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const series = await Series.create({ ...req.body, slug, createdBy: req.user!.userId, status: 'draft' });
  res.status(201).json({ success: true, data: { series } });
});

export const updateSeries = asyncHandler(async (req: Request, res: Response) => {
  const series = await Series.findById(req.params.id);
  if (!series) throw new ApiError(404, 'Series not found');

  Object.assign(series, req.body);
  await series.save();
  res.json({ success: true, data: { series } });
});

export const deleteSeries = asyncHandler(async (req: Request, res: Response) => {
  const series = await Series.findByIdAndDelete(req.params.id);
  if (!series) throw new ApiError(404, 'Series not found');
  res.json({ success: true, message: 'Series deleted successfully' });
});

export const publishSeries = asyncHandler(async (req: Request, res: Response) => {
  const series = await Series.findByIdAndUpdate(req.params.id, { status: 'published' }, { new: true });
  if (!series) throw new ApiError(404, 'Series not found');
  res.json({ success: true, data: { series } });
});

export const unpublishSeries = asyncHandler(async (req: Request, res: Response) => {
  const series = await Series.findByIdAndUpdate(req.params.id, { status: 'draft' }, { new: true });
  if (!series) throw new ApiError(404, 'Series not found');
  res.json({ success: true, data: { series } });
});
