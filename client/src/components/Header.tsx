import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Play, Search, LogOut, User as UserIcon, Menu, X, LayoutDashboard, ChevronDown } from 'lucide-react';
import { EditProfileModal } from './EditProfileModal';

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function Header({ searchQuery = '', onSearchChange }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Ref for the dropdown container – used to detect outside clicks
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Movies', path: '/movies' },
    { name: 'TV Series', path: '/series' },
    { name: 'My List', path: '/my-list' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-bg/95 shadow-lg border-b border-border/40 backdrop-blur-md py-3'
          : 'bg-gradient-to-b from-black/80 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
        {/* Left Section: Logo & Nav Links */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-1.5 select-none">
            <div className="bg-accent text-white p-1.5 rounded-md flex items-center justify-center">
              <Play className="w-4 h-4 fill-white" />
            </div>
            <span className="text-xl font-black tracking-wider text-accent uppercase font-display">
              Stream<span className="text-white">Saga</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-accent ${
                    isActive ? 'text-accent font-semibold' : 'text-text/80'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Search & User Menu */}
        <div className="flex items-center gap-4">
          {/* Search bar */}
          {onSearchChange && (
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Titles, people, genres..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-surface2/60 border border-border/50 text-text rounded-full pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-accent focus:bg-surface2 w-48 sm:w-64 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          )}

          {/* User profile dropdown */}
          {user && (
            <div className="flex items-center gap-3 border-l border-border/40 pl-4">
              {/* Name + role (large screens) */}
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-semibold text-text">{user.name}</span>
                <span className="text-[10px] text-muted capitalize">{user.role}</span>
              </div>

              {/* Click-toggle dropdown */}
              <div ref={profileMenuRef} className="relative">
                {/* Avatar button */}
                <button
                  id="profile-menu-btn"
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className={`flex items-center gap-1.5 bg-surface2/80 hover:bg-surface3 border transition-colors p-1.5 pr-2.5 rounded-full ${
                    isProfileMenuOpen
                      ? 'border-accent/70 text-accent'
                      : 'border-border/50 text-text'
                  }`}
                  aria-haspopup="true"
                  aria-expanded={isProfileMenuOpen}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-text/80" />
                  )}
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${
                      isProfileMenuOpen ? 'rotate-180 text-accent' : 'text-text/60'
                    }`}
                  />
                </button>

                {/* Dropdown panel – stays open until outside click */}
                {isProfileMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-surface shadow-2xl overflow-hidden animate-fade-in z-50"
                    style={{ animation: 'fadeSlideDown 0.15s ease-out' }}
                  >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-border/60 bg-surface2/50">
                      <div className="flex items-center gap-2.5">
                        {user.avatar ? (
                          <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-accent/40" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-accent" />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-text truncate">{user.name}</span>
                          <span className="text-[10px] text-muted capitalize">{user.email || user.role}</span>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      {user.role !== 'user' && (
                        <a
                          href="http://localhost:5174"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-text hover:bg-surface2 hover:text-accent transition-colors cursor-pointer"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-accent/80" />
                          Admin Dashboard
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsEditProfileOpen(true);
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs text-text hover:bg-surface2 hover:text-accent transition-colors cursor-pointer"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-accent/80" />
                        Edit Profile
                      </button>

                      <div className="mx-3 my-1 border-t border-border/50" />

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center bg-surface2 border border-border/50 p-1.5 rounded-md text-text/80 hover:text-white"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-bg border-b border-border/50 px-4 py-4 animate-fade-in space-y-4">
          {onSearchChange && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-surface2 border border-border text-text rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent"
              />
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          )}
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-sm font-medium py-1.5 transition-colors hover:text-accent ${
                    isActive ? 'text-accent font-semibold' : 'text-text/80'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />

      {/* Dropdown animation keyframe */}
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
}
