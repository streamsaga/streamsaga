import { Movie, Series } from '../types';
import { Play, Info, Plus, Check } from 'lucide-react';

interface HeroBannerProps {
  item: Movie | Series;
  onPlay: (item: Movie | Series) => void;
  onInfo: (item: Movie | Series) => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (item: Movie | Series) => void;
}

export function HeroBanner({ item, onPlay, onInfo, isInWatchlist, onToggleWatchlist }: HeroBannerProps) {
  const isMovie = 'duration' in item;

  return (
    <div className="relative w-full h-[70vh] sm:h-[80vh] md:h-[90vh] bg-black select-none overflow-hidden">
      {/* Background Banner Image */}
      {item.banner ? (
        <img
          src={item.banner}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover object-top opacity-60 transition-transform duration-[10s] ease-out hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-tr from-accent-dim/30 to-surface-3 flex items-center justify-center">
          <span className="text-muted text-lg">No Banner Available</span>
        </div>
      )}

      {/* Gradients Overlay for Legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-black/30 to-black/50"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-bg/90 via-transparent to-transparent hidden md:block"></div>

      {/* Hero Content */}
      <div className="absolute bottom-12 md:bottom-24 left-4 md:left-12 max-w-2xl px-2 z-10 flex flex-col items-start gap-4">
        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[10px] md:text-xs font-bold uppercase bg-accent text-white px-2 py-0.5 rounded">
            Featured
          </span>
          <span className="text-xs md:text-sm font-semibold text-text/90">
            {item.releaseYear}
          </span>
          <span className="text-xs md:text-sm border border-muted/50 text-muted px-1.5 py-0.1 rounded text-[10px] md:text-xs font-bold">
            {item.ageRating}
          </span>
          <span className="text-xs md:text-sm text-text/80 font-medium">
            {isMovie ? `${(item as Movie).duration} min` : `${(item as Series).totalSeasons} Season${(item as Series).totalSeasons > 1 ? 's' : ''}`}
          </span>
          {item.genres && item.genres.length > 0 && (
            <span className="text-xs text-muted font-medium truncate max-w-[150px] md:max-w-none">
              • {item.genres.map((g) => g.name).join(', ')}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-text leading-tight tracking-tight uppercase drop-shadow-md">
          {item.title}
        </h1>

        {/* Synopsis Description */}
        <p className="text-sm md:text-base text-text/80 line-clamp-3 leading-relaxed drop-shadow max-w-xl font-normal">
          {item.description}
        </p>

        {/* Buttons Row */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            onClick={() => onPlay(item)}
            className="flex items-center gap-2 bg-white hover:bg-white/90 text-black font-bold text-sm md:text-base px-6 md:px-8 py-2.5 md:py-3 rounded-lg shadow-lg hover:shadow-white/10 transition-all hover:scale-105"
          >
            <Play className="w-4 h-4 md:w-5 md:h-5 fill-black" />
            Play Now
          </button>

          <button
            onClick={() => onInfo(item)}
            className="flex items-center gap-2 bg-surface/60 hover:bg-surface/80 text-white border border-border/80 font-semibold text-sm md:text-base px-5 md:px-6 py-2.5 md:py-3 rounded-lg backdrop-blur-sm transition-all hover:scale-105"
          >
            <Info className="w-4 h-4 md:w-5 md:h-5" />
            More Info
          </button>

          <button
            onClick={() => onToggleWatchlist(item)}
            className={`flex items-center justify-center p-2.5 md:p-3 rounded-full border shadow-md transition-all hover:scale-115 ${
              isInWatchlist
                ? 'bg-accent/20 border-accent text-accent'
                : 'bg-surface/40 hover:bg-surface/60 border-border/80 text-white'
            }`}
            title={isInWatchlist ? 'Remove from My List' : 'Add to My List'}
          >
            {isInWatchlist ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : <Plus className="w-4 h-4 md:w-5 md:h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
