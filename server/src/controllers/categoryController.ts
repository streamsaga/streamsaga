import { Request, Response } from 'express';
import { Category } from '../models/Category';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';
import { slugify } from '../utils/slugify';

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find().sort({ order: 1, name: 1 });
  res.json({ success: true, data: { categories } });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const slug = slugify(req.body.name);
  const exists = await Category.exists({ slug });
  if (exists) throw new ApiError(409, 'A category with this name already exists');

  const category = await Category.create({
    name: req.body.name,
    slug,
    description: req.body.description,
    order: req.body.order,
  });
  res.status(201).json({ success: true, data: { category } });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');

  if (req.body.name) {
    category.name = req.body.name;
    category.slug = slugify(req.body.name);
  }
  if (req.body.description !== undefined) category.description = req.body.description;
  if (req.body.order !== undefined) category.order = req.body.order;

  await category.save();
  res.json({ success: true, data: { category } });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, message: 'Category deleted successfully' });
});
