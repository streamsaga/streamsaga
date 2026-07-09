import { Request, Response } from 'express';
import { User } from '../models/User';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';
import { validateRealEmail } from '../utils/emailValidator';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const search = req.query.search ? String(req.query.search) : '';

  const filter = search
    ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
    : {};

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: { user } });
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body;
  if (!['user', 'admin', 'superadmin'].includes(role)) {
    throw new ApiError(400, 'Invalid role');
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: { user } });
});

export const toggleUserActive = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, data: { user } });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, message: 'User deleted successfully' });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  await validateRealEmail(email);

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({ name, email, password, role });

  res.status(201).json({ success: true, data: { user } });
});
