import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';
import toast from 'react-hot-toast';

type Playlist = Database['public']['Tables']['playlists']['Row'];
type PlaylistTrack = Database['public']['Tables']['playlist_tracks']['Row'];

interface PlaylistState {
  playlists: (Playlist & { tracks?: PlaylistTrack[] })[];
  currentPlaylist: (Playlist & { tracks: PlaylistTrack[] }) | null;
  loading: boolean;
  setPlaylists: (playlists: Playlist[]) => void;
  setCurrentPlaylist: (playlist: (Playlist & { tracks: PlaylistTrack[] }) | null) => void;
  setLoading: (loading: boolean) => void;
  fetchPlaylists: () => Promise<void>;
  createPlaylist: (name: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, track: { id: string; name: string; artist: string; image?: string }) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;

}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  currentPlaylist: null,
  loading: false,
  setPlaylists: (playlists) => set({ playlists }),
  setCurrentPlaylist: (playlist) => set({ currentPlaylist: playlist }),
  setLoading: (loading) => set({ loading }),
  
  fetchPlaylists: async () => {
    set({ loading: true });
    try {
      const { data: playlists, error: playlistsError } = await supabase
        .from('playlists')
        .select('*')
        .order('created_at', { ascending: false });

      if (playlistsError) throw playlistsError;

      // Fetch tracks for each playlist
      const playlistsWithTracks = await Promise.all(
        (playlists || []).map(async (playlist) => {
          const { data: tracks, error: tracksError } = await supabase
            .from('playlist_tracks')
            .select('*')
            .eq('playlist_id', playlist.id)
            .order('added_at', { ascending: true });

          if (tracksError) throw tracksError;

          return {
            ...playlist,
            tracks: tracks || []
          };
        })
      );

      set({ playlists: playlistsWithTracks });
    } catch (error) {
      console.error('Error fetching playlists:', error);
      toast.error('Failed to load playlists');
    } finally {
      set({ loading: false });
    }
  },

  createPlaylist: async (name) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: playlist, error } = await supabase
        .from('playlists')
        .insert([{ name, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      const { playlists } = get();
      set({ playlists: [{ ...playlist, tracks: [] }, ...playlists] });
      toast.success('Playlist created successfully');
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast.error('Failed to create playlist');
      throw error;
    }
  },

  addTrackToPlaylist: async (playlistId, track) => {
    try {
      const { error } = await supabase
        .from('playlist_tracks')
        .insert([{
          playlist_id: playlistId,
          track_id: track.id,
          track_name: track.name,
          artist_name: track.artist,
          image_url: track.image || ''   // ✅ add fallback
        }]);
  
      if (error) throw error;
  
      // Update local state
      const { playlists } = get();
      const updatedPlaylists = playlists.map(playlist => {
        if (playlist.id === playlistId) {
          return {
            ...playlist,
            tracks: [...(playlist.tracks || []), {
              id: crypto.randomUUID(),
              playlist_id: playlistId,
              track_id: track.id,
              track_name: track.name,
              artist_name: track.artist,
              image_url: track.image || '',
              added_at: new Date().toISOString()
            }]
          };
        }
        return playlist;
      });
  
      set({ playlists: updatedPlaylists });
      toast.success('Track added to playlist');
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      toast.error('Failed to add track to playlist');
      throw error;
    }
  },

  deletePlaylist: async (playlistId: string) => {
    try {
      // First delete tracks in the playlist (to avoid foreign key conflict)
      await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId);
  
      // Then delete the playlist itself
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId);
  
      if (error) throw error;
  
      // Update state
      const { playlists } = get();
      set({ playlists: playlists.filter(p => p.id !== playlistId) });
  
      toast.success('Playlist deleted');
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast.error('Failed to delete playlist');
    }
  },  

  removeTrackFromPlaylist: async (playlistId, trackId) => {
    try {
      const { error } = await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('track_id', trackId);

      if (error) throw error;

      // Update local state
      const { playlists } = get();
      const updatedPlaylists = playlists.map(playlist => {
        if (playlist.id === playlistId) {
          return {
            ...playlist,
            tracks: (playlist.tracks || []).filter(track => track.track_id !== trackId)
          };
        }
        return playlist;
      });

      set({ playlists: updatedPlaylists });
      toast.success('Track removed from playlist');
    } catch (error) {
      console.error('Error removing track from playlist:', error);
      toast.error('Failed to remove track from playlist');
      throw error;
    }
  }
}));