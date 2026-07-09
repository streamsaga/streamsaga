import { Request, Response } from 'express';
import { Movie } from '../models/Movie';
import { Series } from '../models/Series';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const [totalMovies, totalSeries, totalUsers, publishedMovies, draftMovies, processingMovies] = await Promise.all([
    Movie.countDocuments(),
    Series.countDocuments(),
    User.countDocuments(),
    Movie.countDocuments({ status: 'published' }),
    Movie.countDocuments({ status: 'draft' }),
    Movie.countDocuments({ status: 'processing' }),
  ]);

  const topMovies = await Movie.find({ status: 'published' }).sort({ views: -1 }).limit(5).select('title views poster');

  // Signups per day for the last 14 days, used to power the admin dashboard chart.
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const signupTrend = await User.aggregate([
    { $match: { createdAt: { $gte: fourteenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: {
      totals: { totalMovies, totalSeries, totalUsers, publishedMovies, draftMovies, processingMovies },
      topMovies,
      signupTrend: signupTrend.map((d) => ({ date: d._id, count: d.count })),
    },
  });
});
