import React, { useState } from 'react';
import { usePlaylistStore } from '../store/playlistStore';
import toast from 'react-hot-toast';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track?: {
    id: string;
    name: string;
    artist: string;
    image?: string;
  };
}

export function PlaylistModal({ isOpen, onClose, track }: PlaylistModalProps) {
  const [name, setName] = useState('');
  const { createPlaylist, addTrackToPlaylist, playlists } = usePlaylistStore();

  if (!isOpen) return null;

  const handleCreatePlaylist = async () => {
    try {
      await createPlaylist(name);
      if (track) {
        const newPlaylist = playlists[0];
        await addTrackToPlaylist(newPlaylist.id, track);
      }
      toast.success('Playlist created successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to create playlist');
    }
  };

  const handleAddToExisting = async (playlistId: string) => {
    if (!track) return;
    try {
      await addTrackToPlaylist(playlistId, track);
      toast.success('Track added to playlist!');
      onClose();
    } catch (error) {
      toast.error('Failed to add track to playlist');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full">
        <h2 className="text-2xl font-bold mb-4 text-white">
          {track ? 'Add to Playlist' : 'Create New Playlist'}
        </h2>

        {track && playlists.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-300">Add to existing playlist</h3>
            <div className="space-y-2">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handleAddToExisting(playlist.id)}
                  className="w-full text-left px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 text-white transition-colors"
                >
                  {playlist.name}
                </button>
              ))}
            </div>
            <div className="my-4 border-t border-gray-700"></div>
            <h3 className="text-lg font-semibold mb-2 text-gray-300">Or create new playlist</h3>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
              Playlist Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-emerald-500 focus:ring-0 text-white"
              required
            />
          </div>
          <button
            onClick={handleCreatePlaylist}
            disabled={!name.trim()}
            className="w-full bg-emerald-500 text-white py-2 px-4 rounded-md hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Playlist
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
