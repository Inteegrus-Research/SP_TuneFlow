import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Music, Search, Library, LogOut, Plus } from 'lucide-react';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenPlaylist: () => void;
  onTogglePlaylists: () => void;
  showPlaylists: boolean;
  query: string;
  setQuery: (query: string) => void;
  handleSearch: () => void;
}

export function Header({
  onOpenAuth,
  onOpenPlaylist,
  onTogglePlaylists,
  showPlaylists,
  query,
  setQuery,
  handleSearch
}: HeaderProps) {
  const { user, signOut } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Music className="h-8 w-8 text-emerald-500" />
          <h1 className="text-2xl font-bold text-emerald-500 ml-2">TuneFlow</h1>
        </div>

        <div className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for music..."
              className="w-full py-2 px-4 pr-12 rounded-full bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-emerald-500 hover:text-emerald-400"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="relative flex items-center space-x-4">
          {user && (
            <button
              onClick={onTogglePlaylists}
              className={`flex items-center space-x-2 ${
                showPlaylists ? 'text-emerald-500' : 'text-white'
              } hover:text-emerald-400`}
            >
              <Library className="h-6 w-6" />
            </button>
          )}
          
          {user ? (
            <>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 bg-gray-800 rounded-full px-4 py-2 text-white hover:bg-gray-700"
              >
                <span className="h-8 w-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  {user.email?.[0].toUpperCase()}
                </span>
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1">
                  <button
                    onClick={() => {
                      onOpenPlaylist();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center px-4 py-2 text-sm text-white hover:bg-gray-700 w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Playlist
                  </button>
                  <button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700 w-full"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-emerald-500 text-white px-4 py-2 rounded-full hover:bg-emerald-600"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}