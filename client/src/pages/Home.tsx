import { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { HeroBanner } from '../components/HeroBanner';
import { ContentSlider } from '../components/ContentSlider';
import { DetailsModal } from '../components/DetailsModal';
import { VideoPlayer } from '../components/VideoPlayer';
import { fetchMovies, fetchSeriesList } from '../api/contentApi';
import { addToWatchlist, removeFromWatchlist } from '../api/watchlistApi';
import { useAuth } from '../context/AuthContext';
import { Movie, Series, Episode } from '../types';
import toast from 'react-hot-toast';

export function Home() {
  const { user, refreshUser } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search query state
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item for details modal
  const [selectedItem, setSelectedItem] = useState<Movie | Series | null>(null);

  // Active playing item for video player
  const [playingItem, setPlayingItem] = useState<Movie | Episode | null>(null);
  const [playingSeries, setPlayingSeries] = useState<Series | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const [moviesData, seriesData] = await Promise.all([
          fetchMovies({ limit: 40 }),
          fetchSeriesList({ limit: 40 }),
        ]);
        setMovies(moviesData.movies);
        setSeriesList(seriesData.series);
      } catch (err) {
        console.error('Failed to fetch home content:', err);
        toast.error('Failed to load content feed');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, []);

  const handleToggleWatchlist = async (item: Movie | Series) => {
    const isFav = user?.myList.includes(item._id);
    try {
      if (isFav) {
        await removeFromWatchlist(item._id);
        toast.success('Removed from watchlist');
      } else {
        await addToWatchlist(item._id);
        toast.success('Added to watchlist');
      }
      await refreshUser();
    } catch (err) {
      toast.error('Watchlist action failed');
    }
  };

  const handlePlay = (item: Movie | Series | Episode, seriesContext?: Series) => {
    if (!('duration' in item) && !('episodeNumber' in item)) {
      setSelectedItem(item as Series);
      return;
    }
    setPlayingItem(item as Movie | Episode);
    setPlayingSeries(seriesContext || null);
  };

  if (playingItem) {
    return (
      <VideoPlayer
        item={playingItem}
        seriesContext={playingSeries}
        onBack={() => {
          setPlayingItem(null);
          setPlayingSeries(null);
        }}
      />
    );
  }

  // Combine movies and series for searching if needed, or filter them separately
  const searchLower = searchQuery.toLowerCase();
  const searchedMovies = movies.filter(
    (m) =>
      m.title.toLowerCase().includes(searchLower) ||
      m.description.toLowerCase().includes(searchLower)
  );
  const searchedSeries = seriesList.filter(
    (s) =>
      s.title.toLowerCase().includes(searchLower) ||
      s.description.toLowerCase().includes(searchLower)
  );

  // Select a featured hero title
  // Prefer items flagged as isFeatured. If none, fall back to trending, or just first movie.
  const featuredList = [...movies, ...seriesList].filter((x) => x.isFeatured);
  const trendingList = [...movies, ...seriesList].filter((x) => x.isTrending);
  const heroItem = featuredList[0] || trendingList[0] || movies[0] || seriesList[0] || null;

  const isInWatchlist = heroItem ? user?.myList.includes(heroItem._id) || false : false;

  return (
    <div className="min-h-screen bg-bg text-text pb-24">
      {/* Navbar Header */}
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-accent-dim border-t-accent rounded-full animate-spin"></div>
        </div>
      ) : searchQuery ? (
        // Search Results Feed
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-28 space-y-8 animate-fade-in">
          <h1 className="text-xl md:text-3xl font-extrabold text-text/90">
            Search Results for <span className="text-accent">"{searchQuery}"</span>
          </h1>

          {searchedMovies.length === 0 && searchedSeries.length === 0 ? (
            <p className="text-muted text-sm py-12">No movies or TV series matched your search.</p>
          ) : (
            <div className="space-y-12">
              {searchedMovies.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider text-muted">
                    Movies
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {searchedMovies.map((movie) => (
                      <div
                        key={movie._id}
                        className="group relative bg-surface2 border border-border/40 rounded-xl overflow-hidden cursor-pointer shadow-md hover:border-accent/40 transition-colors"
                        onClick={() => setSelectedItem(movie)}
                      >
                        <div className="aspect-[2/3] bg-black">
                          {movie.poster ? (
                            <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted">
                              No Poster
                            </div>
                          )}
                        </div>
                        <div className="p-3 bg-surface text-xs font-bold text-text truncate border-t border-border/50">
                          {movie.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchedSeries.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider text-muted">
                    TV Series
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {searchedSeries.map((series) => (
                      <div
                        key={series._id}
                        className="group relative bg-surface2 border border-border/40 rounded-xl overflow-hidden cursor-pointer shadow-md hover:border-accent/40 transition-colors"
                        onClick={() => setSelectedItem(series)}
                      >
                        <div className="aspect-[2/3] bg-black">
                          {series.poster ? (
                            <img src={series.poster} alt={series.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted">
                              No Poster
                            </div>
                          )}
                        </div>
                        <div className="p-3 bg-surface text-xs font-bold text-text truncate border-t border-border/50">
                          {series.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Standard Home Feed
        <div className="space-y-10">
          {/* Large Hero Banner */}
          {heroItem && (
            <HeroBanner
              item={heroItem}
              onPlay={handlePlay}
              onInfo={setSelectedItem}
              isInWatchlist={isInWatchlist}
              onToggleWatchlist={handleToggleWatchlist}
            />
          )}

          {/* Rows of carousels */}
          <div className="space-y-8 -mt-20 relative z-20">
            <ContentSlider
              title="Trending Now"
              items={trendingList.length > 0 ? trendingList : [...movies, ...seriesList].slice(0, 10)}
              onCardClick={setSelectedItem}
              onPlayClick={handlePlay}
            />

            <ContentSlider
              title="Popular Movies"
              items={movies.slice(0, 15)}
              onCardClick={setSelectedItem}
              onPlayClick={handlePlay}
            />

            <ContentSlider
              title="Recommended TV Shows"
              items={seriesList.slice(0, 15)}
              onCardClick={setSelectedItem}
              onPlayClick={handlePlay}
            />
          </div>
        </div>
      )}

      {/* Title Details Drawer/Modal */}
      {selectedItem && (
        <DetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onPlay={handlePlay}
          isInWatchlist={user?.myList.includes(selectedItem._id) || false}
          onToggleWatchlist={handleToggleWatchlist}
        />
      )}
    </div>
  );
}
