import { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { DetailsModal } from '../components/DetailsModal';
import { VideoPlayer } from '../components/VideoPlayer';
import { fetchMovies, fetchCategories, fetchGenres } from '../api/contentApi';
import { addToWatchlist, removeFromWatchlist } from '../api/watchlistApi';
import { useAuth } from '../context/AuthContext';
import { Movie, Series, Episode, Category, Genre } from '../types';
import { Play, Grid, ListFilter } from 'lucide-react';
import toast from 'react-hot-toast';

export function Movies() {
  const { user, refreshUser } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal and player states
  const [selectedItem, setSelectedItem] = useState<Movie | Series | null>(null);
  const [playingItem, setPlayingItem] = useState<Movie | Episode | null>(null);
  const [playingSeries, setPlayingSeries] = useState<Series | null>(null);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [cats, gens] = await Promise.all([fetchCategories(), fetchGenres()]);
        setCategories(cats);
        setGenres(gens);
      } catch (err) {
        console.error('Failed to load page metadata:', err);
      }
    };
    loadMetadata();
  }, []);

  const loadMovies = async () => {
    setIsLoading(true);
    try {
      const filters: any = { limit: 100 };
      if (selectedCategory) filters.category = selectedCategory;
      if (selectedGenre) filters.genre = selectedGenre;
      
      const data = await fetchMovies(filters);
      setMovies(data.movies);
    } catch (err) {
      console.error('Failed to fetch movies list:', err);
      toast.error('Failed to load movies');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMovies();
  }, [selectedCategory, selectedGenre]);

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

  // Filter movies by search locally if typed
  const searchedMovies = movies.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="min-h-screen bg-bg text-text pb-24">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-28 space-y-8">
        {/* Filter Controls Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-wide flex items-center gap-2">
              <Grid className="w-6 h-6 text-accent" />
              Explore Movies
            </h1>
            <p className="text-xs sm:text-sm text-muted">Browse our full index of movies, sorted by genre and category.</p>
          </div>

          {/* Selector Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-surface2 border border-border px-3 py-1.5 rounded-lg text-xs font-semibold text-muted">
              <ListFilter className="w-3.5 h-3.5" />
              Filters
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-surface2 border border-border text-text text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent font-semibold transition-colors cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Genre Dropdown */}
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-surface2 border border-border text-text text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent font-semibold transition-colors cursor-pointer"
            >
              <option value="">All Genres</option>
              {genres.map((gen) => (
                <option key={gen._id} value={gen._id}>
                  {gen.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Movies Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-12 h-12 border-4 border-accent-dim border-t-accent rounded-full animate-spin"></div>
          </div>
        ) : searchedMovies.length === 0 ? (
          <div className="text-center py-24 text-muted text-sm max-w-sm mx-auto">
            No movies match the selected filters or search keyword. Try broadening your criteria!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {searchedMovies.map((movie) => (
              <div
                key={movie._id}
                className="group relative bg-surface2 border border-border/40 rounded-xl overflow-hidden cursor-pointer shadow-md hover:border-accent/40 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
                onClick={() => setSelectedItem(movie)}
              >
                {/* Poster Box */}
                <div className="aspect-[2/3] bg-black relative">
                  {movie.poster ? (
                    <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted">
                      No Poster
                    </div>
                  )}
                  {/* Play Action Float Hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlay(movie);
                      }}
                      className="bg-accent text-white p-3 rounded-full hover:bg-accent-hover transition-colors shadow-lg"
                    >
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </button>
                  </div>
                </div>

                {/* Footer Info Box */}
                <div className="p-3 bg-surface text-xs font-bold text-text truncate border-t border-border/50">
                  {movie.title}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details modal overlay */}
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
