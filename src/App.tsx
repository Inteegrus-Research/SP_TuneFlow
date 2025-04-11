import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthModal } from './components/AuthModal';
import { PlaylistModal } from './components/PlaylistModal';
import { Header } from './components/Header';
import { SearchResults } from './components/SearchResults';
import { PlaylistView } from './components/PlaylistView';
import { useAuthStore } from './store/authStore';
import { usePlaylistStore } from './store/playlistStore';
import { supabase } from './lib/supabase';
import toast from 'react-hot-toast';

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const { user, setUser } = useAuthStore();
  const { fetchPlaylists } = usePlaylistStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPlaylists();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPlaylists();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Initiating search for:', query);
      const response = await fetch(`/api/search?query=${encodeURIComponent(query.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Search failed');
      }

      if (!Array.isArray(data) || data.length === 0) {
        setSearchResults([]);
        toast.error('No results found');
        return;
      }

      console.log(`Found ${data.length} results`);
      setSearchResults(data);
      setShowPlaylists(false);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      toast.error(error instanceof Error ? error.message : 'Failed to search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToPlaylist = (track: any) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setSelectedTrack(track);
    setShowPlaylistModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Toaster position="top-center" />
      
      <Header
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenPlaylist={() => setShowPlaylistModal(true)}
        onTogglePlaylists={() => setShowPlaylists(!showPlaylists)}
        showPlaylists={showPlaylists}
        query={query}
        setQuery={setQuery}
        handleSearch={handleSearch}
      />

      <main className="max-w-7xl mx-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
          </div>
        ) : showPlaylists ? (
          <PlaylistView />
        ) : searchResults.length > 0 ? (
          <SearchResults results={searchResults} onAddToPlaylist={handleAddToPlaylist} />
        ) : query.trim() ? (
          <div className="text-center py-20">
            <p className="text-gray-400">No results found for "{query}"</p>
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-emerald-500 mb-4">Welcome to TuneFlow</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Search for your favorite music, create playlists, and enjoy high-quality audio streaming.
            </p>
          </div>
        )}
      </main>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <PlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => {
          setShowPlaylistModal(false);
          setSelectedTrack(null);
        }}
        track={selectedTrack}
      />
    </div>
  );
}

export default App;