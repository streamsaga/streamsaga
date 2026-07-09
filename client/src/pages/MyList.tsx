import { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { fetchWatchlist, removeFromWatchlist, addToWatchlist } from '../api/watchlistApi';
import { Movie, Series, Episode } from '../types';
import { DetailsModal } from '../components/DetailsModal';
import { VideoPlayer } from '../components/VideoPlayer';
import { useAuth } from '../context/AuthContext';
import { Play, Trash2, Heart, Film } from 'lucide-react';
import toast from 'react-hot-toast';

export function MyList() {
  const { user, refreshUser } = useAuth();
  const [watchlist, setWatchlist] = useState<{ movies: Movie[]; series: Series[] }>({ movies: [], series: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Player and details modal states
  const [selectedItem, setSelectedItem] = useState<Movie | Series | null>(null);
  const [playingItem, setPlayingItem] = useState<Movie | Episode | null>(null);
  const [playingSeries, setPlayingSeries] = useState<Series | null>(null);

  const loadWatchlist = async () => {
    setIsLoading(true);
    try {
      const data = await fetchWatchlist();
      setWatchlist(data);
    } catch (err) {
      console.error('Failed to load watchlist:', err);
      toast.error('Could not load watchlist');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
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
      // Reload watchlist data
      loadWatchlist();
      // If modal is open, update modal bookmark state
      if (selectedItem && selectedItem._id === item._id) {
        setSelectedItem(null);
      }
    } catch (err) {
      toast.error('Action failed');
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

  // Filter items based on search query
  const filteredMovies = watchlist.movies.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredSeries = watchlist.series.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isEmpty = filteredMovies.length === 0 && filteredSeries.length === 0;

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

  return (
    <div className="min-h-screen bg-bg text-text pb-20">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-28 space-y-8">
        <div className="flex flex-col gap-2 border-b border-border/40 pb-5">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-text flex items-center gap-2 uppercase tracking-wide">
            <Heart className="w-6 h-6 text-accent fill-accent" />
            My Watchlist
          </h1>
          <p className="text-xs sm:text-sm text-muted">Your bookmarks and saved titles to watch later.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-12 h-12 border-4 border-accent-dim border-t-accent rounded-full animate-spin"></div>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto space-y-4">
            <div className="bg-surface2 p-6 rounded-full border border-border/80 text-muted">
              <Film className="w-12 h-12" />
            </div>
            <h3 className="text-lg font-bold text-text">Your list is empty</h3>
            <p className="text-sm text-muted leading-relaxed">
              Explore our collection of movies and series. Click the "Add to List" button on any title to save it here.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Movies Group */}
            {filteredMovies.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg md:text-xl font-bold tracking-wider text-text/80 uppercase">
                  Movies ({filteredMovies.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {filteredMovies.map((movie) => (
                    <div
                      key={movie._id}
                      className="group relative bg-surface2 rounded-xl border border-border/40 overflow-hidden cursor-pointer shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-accent/40"
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
                      <div className="p-3 bg-surface text-xs font-semibold flex items-center justify-between gap-2 border-t border-border/50">
                        <span className="truncate flex-1 text-text">{movie.title}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlay(movie);
                            }}
                            className="bg-accent/15 hover:bg-accent text-accent hover:text-white p-1 rounded-md transition-colors"
                            title="Play"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWatchlist(movie);
                            }}
                            className="bg-surface2 hover:bg-accent/10 border border-border hover:border-accent text-muted hover:text-accent p-1 rounded-md transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Series Group */}
            {filteredSeries.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg md:text-xl font-bold tracking-wider text-text/80 uppercase">
                  TV Series ({filteredSeries.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {filteredSeries.map((series) => (
                    <div
                      key={series._id}
                      className="group relative bg-surface2 rounded-xl border border-border/40 overflow-hidden cursor-pointer shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-accent/40"
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
                      <div className="p-3 bg-surface text-xs font-semibold flex items-center justify-between gap-2 border-t border-border/50">
                        <span className="truncate flex-1 text-text">{series.title}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(series);
                            }}
                            className="bg-accent/15 hover:bg-accent text-accent hover:text-white p-1 rounded-md transition-colors"
                            title="View Episodes"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWatchlist(series);
                            }}
                            className="bg-surface2 hover:bg-accent/10 border border-border hover:border-accent text-muted hover:text-accent p-1 rounded-md transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details Modal overlay */}
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
