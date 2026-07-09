import { Response } from 'express';
import { User } from '../models/User';
import { Movie } from '../models/Movie';
import { Series } from '../models/Series';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { Types } from 'mongoose';

/**
 * Get the current user's watchlist (populated movies and series)
 */
export const getMyList = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.user!.userId);
  if (!user) throw new ApiError(404, 'User not found');

  const movieIds = user.myList || [];

  // Fetch populated movies and series in parallel
  const [movies, series] = await Promise.all([
    Movie.find({ _id: { $in: movieIds }, status: 'published' }).populate('genres categories'),
    Series.find({ _id: { $in: movieIds }, status: 'published' }).populate('genres categories'),
  ]);

  res.json({
    success: true,
    data: {
      movies,
      series,
    },
  });
});

/**
 * Add an item (Movie or Series) to the watchlist
 */
export const addToMyList = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { itemId } = req.body;
  if (!itemId) throw new ApiError(400, 'itemId is required');

  if (!Types.ObjectId.isValid(itemId)) {
    throw new ApiError(400, 'Invalid itemId format');
  }

  const user = await User.findById(req.user!.userId);
  if (!user) throw new ApiError(404, 'User not found');

  const objectId = new Types.ObjectId(itemId);

  // Check if item is already in watchlist
  const existsInList = user.myList.some((id) => id.toString() === itemId);
  if (existsInList) {
    return res.json({ success: true, message: 'Item is already in your watchlist' });
  }

  // Check if the item exists in Movies or Series
  const [movieExists, seriesExists] = await Promise.all([
    Movie.exists({ _id: objectId, status: 'published' }),
    Series.exists({ _id: objectId, status: 'published' }),
  ]);

  if (!movieExists && !seriesExists) {
    throw new ApiError(404, 'Movie or Series not found or not published');
  }

  user.myList.push(objectId);
  await user.save();

  res.json({
    success: true,
    message: 'Item added to watchlist successfully',
  });
});

/**
 * Remove an item from the watchlist
 */
export const removeFromMyList = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { itemId } = req.params;
  if (!itemId) throw new ApiError(400, 'itemId is required');

  const user = await User.findById(req.user!.userId);
  if (!user) throw new ApiError(404, 'User not found');

  const existsInList = user.myList.some((id) => id.toString() === itemId);
  if (!existsInList) {
    throw new ApiError(404, 'Item not found in watchlist');
  }

  user.myList = user.myList.filter((id) => id.toString() !== itemId);
  await user.save();

  res.json({
    success: true,
    message: 'Item removed from watchlist successfully',
  });
});
