import { useState, useEffect } from 'react';
import { Movie, Series, Episode } from '../types';
import { fetchEpisodesForSeries } from '../api/contentApi';
import { X, Play, Plus, Check, Film, Clock, Calendar, Users, Award } from 'lucide-react';
import toast from 'react-hot-toast';

interface DetailsModalProps {
  item: Movie | Series | null;
  onClose: () => void;
  onPlay: (item: Movie | Series | Episode, seriesContext?: Series) => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (item: Movie | Series) => void;
}

export function DetailsModal({ item, onClose, onPlay, isInWatchlist, onToggleWatchlist }: DetailsModalProps) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

  const isMovie = item ? 'duration' in item : false;

  useEffect(() => {
    if (!item || isMovie) {
      setEpisodes([]);
      return;
    }

    const loadEpisodes = async () => {
      setIsLoadingEpisodes(true);
      try {
        const data = await fetchEpisodesForSeries(item._id);
        // Ensure episodes are sorted by season then episodeNumber
        const sorted = data.sort((a, b) => {
          if (a.season !== b.season) return a.season - b.season;
          return a.episodeNumber - b.episodeNumber;
        });
        setEpisodes(sorted);
      } catch (err) {
        console.error('Error fetching episodes:', err);
        toast.error('Failed to load series episodes');
      } finally {
        setIsLoadingEpisodes(false);
      }
    };

    loadEpisodes();
    setSelectedSeason(1);
  }, [item, isMovie]);

  if (!item) return null;

  // Group episodes by season
  const uniqueSeasons = Array.from(new Set(episodes.map((ep) => ep.season))).sort((a, b) => a - b);
  const filteredEpisodes = episodes.filter((ep) => ep.season === selectedSeason);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 md:p-6 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-bg border border-border/80 rounded-2xl overflow-hidden shadow-2xl animate-fade-in my-8 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-40 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full border border-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1 no-scrollbar">
          {/* Hero Banner Area */}
          <div className="relative h-[250px] sm:h-[350px] md:h-[400px] bg-black">
            {item.banner ? (
              <img src={item.banner} alt={item.title} className="w-full h-full object-cover opacity-60" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-accent-dim/30 to-surface3 flex items-center justify-center">
                <Film className="w-16 h-16 text-muted" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent"></div>

            {/* Float Info Box */}
            <div className="absolute bottom-6 left-6 right-6 md:left-10 md:right-10 flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-accent text-white text-[9px] md:text-xs font-bold px-2 py-0.5 rounded uppercase">
                  {isMovie ? 'Movie' : 'TV Series'}
                </span>
                <span className="text-xs md:text-sm font-semibold">{item.releaseYear}</span>
                <span className="text-xs md:text-sm border border-muted/50 text-muted px-1.5 py-0.1 rounded text-[9px] md:text-xs font-bold">
                  {item.ageRating}
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase text-text drop-shadow">
                {item.title}
              </h2>
            </div>
          </div>

          {/* Details Content Area */}
          <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left/Middle: Synopsis and Episode Selector */}
            <div className="md:col-span-2 space-y-6">
              {/* Play / Watchlist Quick Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onPlay(item)}
                  className="flex items-center gap-2 bg-white hover:bg-white/90 text-black font-bold px-6 py-2.5 rounded-lg shadow-lg transition-transform hover:scale-102 text-sm sm:text-base"
                >
                  <Play className="w-4.5 h-4.5 fill-black" />
                  Play
                </button>

                <button
                  onClick={() => onToggleWatchlist(item)}
                  className={`flex items-center gap-2 font-semibold px-4 py-2.5 rounded-lg border shadow-md transition-all text-sm sm:text-base ${
                    isInWatchlist
                      ? 'bg-accent/15 border-accent text-accent'
                      : 'bg-surface/50 hover:bg-surface/80 border-border/80 text-white'
                  }`}
                >
                  {isInWatchlist ? (
                    <>
                      <Check className="w-4 h-4 text-accent" />
                      In Watchlist
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add to List
                    </>
                  )}
                </button>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-muted uppercase tracking-wider">Synopsis</h3>
                <p className="text-text/90 text-sm md:text-base leading-relaxed">{item.description}</p>
              </div>

              {/* TV Series Season & Episode Section */}
              {!isMovie && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-base font-bold text-text">Episodes</h3>

                    {/* Season Dropdown */}
                    {uniqueSeasons.length > 0 && (
                      <select
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(Number(e.target.value))}
                        className="bg-surface2 border border-border text-text text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent font-semibold transition-colors cursor-pointer"
                      >
                        {uniqueSeasons.map((seasonNum) => (
                          <option key={seasonNum} value={seasonNum}>
                            Season {seasonNum}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {isLoadingEpisodes ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-4 border-accent-dim border-t-accent rounded-full animate-spin"></div>
                    </div>
                  ) : filteredEpisodes.length === 0 ? (
                    <p className="text-xs text-muted py-6 text-center">No episodes uploaded yet.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {filteredEpisodes.map((ep) => (
                        <div
                          key={ep._id}
                          className="flex items-center gap-4 bg-surface2/40 hover:bg-surface2/70 border border-border/30 rounded-xl p-3 transition-colors group cursor-pointer"
                          onClick={() => onPlay(ep, item as Series)}
                        >
                          {/* Thumbnail */}
                          <div className="relative w-28 sm:w-36 aspect-video bg-black rounded-lg overflow-hidden flex-shrink-0">
                            {ep.thumbnail ? (
                              <img src={ep.thumbnail} alt={ep.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-surface">
                                <Film className="w-6 h-6 text-muted" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                              <Play className="w-6 h-6 text-white fill-white scale-90 group-hover:scale-100 transition-transform" />
                            </div>
                          </div>

                          {/* Episode Meta */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-xs sm:text-sm font-bold text-text truncate group-hover:text-accent transition-colors">
                                {ep.episodeNumber}. {ep.title}
                              </h4>
                              <span className="text-[10px] text-muted flex-shrink-0 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {ep.duration}m
                              </span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-muted line-clamp-2 leading-relaxed">
                              {ep.description || 'No description available.'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Meta Details (cast, director, genres) */}
            <div className="space-y-5 bg-surface2/25 border border-border/40 p-5 rounded-xl text-xs sm:text-sm">
              {/* Director (for movies) */}
              {isMovie && (item as Movie).director && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted font-bold uppercase text-[10px] tracking-wider">
                    <Award className="w-3.5 h-3.5" />
                    Director
                  </div>
                  <span className="text-text font-medium">{(item as Movie).director}</span>
                </div>
              )}

              {/* Cast */}
              {item.cast && item.cast.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted font-bold uppercase text-[10px] tracking-wider">
                    <Users className="w-3.5 h-3.5" />
                    Cast members
                  </div>
                  <p className="text-text font-medium leading-relaxed">{item.cast.join(', ')}</p>
                </div>
              )}

              {/* Genres */}
              {item.genres && item.genres.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted font-bold uppercase text-[10px] tracking-wider">
                    <Film className="w-3.5 h-3.5" />
                    Genres
                  </div>
                  <p className="text-text font-medium leading-relaxed">
                    {item.genres.map((g) => g.name).join(', ')}
                  </p>
                </div>
              )}

              {/* Categories */}
              {item.categories && item.categories.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted font-bold uppercase text-[10px] tracking-wider">
                    <Calendar className="w-3.5 h-3.5" />
                    Categories
                  </div>
                  <p className="text-text font-medium leading-relaxed">
                    {item.categories.map((c) => c.name).join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
