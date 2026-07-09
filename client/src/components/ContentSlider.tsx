import { useRef, useState } from 'react';
import { Movie, Series } from '../types';
import { ChevronLeft, ChevronRight, Play, Info } from 'lucide-react';

interface ContentSliderProps {
  title: string;
  items: Array<Movie | Series>;
  onCardClick: (item: Movie | Series) => void;
  onPlayClick: (item: Movie | Series) => void;
}

export function ContentSlider({ title, items, onCardClick, onPlayClick }: ContentSliderProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);

  if (!items || items.length === 0) return null;

  const handleScroll = () => {
    if (rowRef.current) {
      setShowLeftArrow(rowRef.current.scrollLeft > 0);
    }
  };

  const slide = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      rowRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative space-y-2 md:space-y-4 px-4 md:px-8 select-none group">
      {/* Slider Title */}
      <h2 className="text-lg md:text-2xl font-bold tracking-wide text-text/90 hover:text-white transition-colors duration-200">
        {title}
      </h2>

      {/* Slider Wrapper */}
      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => slide('left')}
            className="absolute left-0 top-0 bottom-0 z-30 w-12 bg-black/60 hover:bg-black/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-r border-white/5 rounded-l-lg"
          >
            <ChevronLeft className="w-8 h-8 hover:scale-115 transition-transform" />
          </button>
        )}

        {/* Card Container */}
        <div
          ref={rowRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto overflow-y-hidden py-4 px-1 no-scrollbar"
        >
          {items.map((item) => {
            const isMovie = 'duration' in item;
            return (
              <div
                key={item._id}
                className="relative flex-shrink-0 w-[140px] sm:w-[180px] md:w-[220px] aspect-[2/3] bg-surface2 rounded-lg overflow-hidden shadow-md cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-accent/10 hover:border hover:border-accent/40 group/card"
              >
                {/* Poster Image */}
                {item.poster ? (
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="w-full h-full object-cover rounded-lg group-hover/card:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center border border-border rounded-lg bg-surface/50">
                    <span className="text-[10px] md:text-xs font-bold text-text truncate max-w-full">
                      {item.title}
                    </span>
                    <span className="text-[9px] text-muted mt-1">No Poster</span>
                  </div>
                )}

                {/* Card Hover Action Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 opacity-0 group-hover/card:opacity-100 flex flex-col justify-end p-3 transition-opacity duration-300">
                  <span className="text-xs sm:text-sm font-bold text-white mb-1 truncate">
                    {item.title}
                  </span>

                  {/* Badges info */}
                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-semibold text-text/80 mb-3">
                    <span className="text-accent font-bold">{item.releaseYear}</span>
                    <span className="border border-border/80 px-1 rounded text-[8px]">
                      {item.ageRating}
                    </span>
                    <span>
                      {isMovie ? `${(item as Movie).duration}m` : `${(item as Series).totalSeasons}S`}
                    </span>
                  </div>

                  {/* Actions overlay buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayClick(item);
                      }}
                      className="bg-accent text-white p-1.5 rounded-full hover:bg-accent-hover transition-colors flex items-center justify-center"
                      title="Play"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCardClick(item);
                      }}
                      className="bg-surface border border-border/80 text-white p-1.5 rounded-full hover:bg-surface3 transition-colors flex items-center justify-center"
                      title="More Info"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => slide('right')}
          className="absolute right-0 top-0 bottom-0 z-30 w-12 bg-black/60 hover:bg-black/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-l border-white/5 rounded-r-lg"
        >
          <ChevronRight className="w-8 h-8 hover:scale-115 transition-transform" />
        </button>
      </div>
    </div>
  );
}
