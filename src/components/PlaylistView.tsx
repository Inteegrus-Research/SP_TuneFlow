import React, { useEffect, useState, useRef } from 'react';
import { usePlaylistStore } from '../store/playlistStore';
import { Trash2, Play, Pause, Download, Shuffle, SkipForward } from 'lucide-react';
import toast from 'react-hot-toast';

export function PlaylistView() {
  const {
    playlists,
    fetchPlaylists,
    removeTrackFromPlaylist
  } = usePlaylistStore();

  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlaylistTracks, setCurrentPlaylistTracks] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.load();
      audioRef.current.oncanplay = () => {
        audioRef.current?.play();
        setIsPlaying(true);
      };
      audioRef.current.onerror = () => {
        toast.error("Failed to load audio.");
      };
    }
  }, [audioUrl]);

  const handlePlayTrack = (track: any, tracks: any[]) => {
    const index = tracks.findIndex(t => t.track_id === track.track_id);
    setCurrentPlaylistTracks(tracks);
    setCurrentIndex(index);
    setCurrentTrack(track);
    setAudioUrl(`http://localhost:8000/stream/${track.track_id}`);
  };

  const handleNextTrack = () => {
    if (!currentPlaylistTracks.length) return;
    let nextIndex;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * currentPlaylistTracks.length);
    } else {
      nextIndex = (currentIndex + 1) % currentPlaylistTracks.length;
    }
    const nextTrack = currentPlaylistTracks[nextIndex];
    setCurrentIndex(nextIndex);
    setCurrentTrack(nextTrack);
    setAudioUrl(`/stream/${nextTrack.track_id}`);
  };

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleRemoveTrack = async (playlistId: string, trackId: string) => {
    try {
      await removeTrackFromPlaylist(playlistId, trackId);
      toast.success('Track removed from playlist');
    } catch (error) {
      toast.error('Failed to remove track');
    }
  };

  return (
    <div className="space-y-8">
      {playlists.map((playlist) => (
        <div key={playlist.id} className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-emerald-500 mb-4 flex justify-between items-center">
            {playlist.name}
            <button
              onClick={() => setShuffle(!shuffle)}
              className={`p-2 rounded-full ${shuffle ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Shuffle className="h-5 w-5" />
            </button>
          </h2>
          <div className="space-y-4">
            {playlist.tracks?.map((track) => (
              
              <div
                key={track.id}
                className="flex items-center justify-between bg-gray-700 p-4 rounded-lg"
              >
                <div className="flex items-center flex-1">
                  {track.image_url && (
                    <img
                      src={track.image_url}
                      alt={track.track_name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="ml-4">
                    <h3 className="font-semibold">{track.track_name}</h3>
                    <p className="text-gray-400">{track.artist_name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePlayTrack(track, playlist.tracks)}
                    className="p-2 text-emerald-500 hover:text-emerald-400"
                  >
                    <Play className="h-5 w-5" />
                  </button>
                  <a
                    href={`/download?videoId=${track.track_id}&title=${encodeURIComponent(track.track_name)}`}
                    className="p-2 text-blue-500 hover:text-blue-400"
                  >
                    <Download className="h-5 w-5" />
                  </a>
                  <button
                    onClick={() => handleRemoveTrack(playlist.id, track.track_id)}
                    className="p-2 text-red-500 hover:text-red-400"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {currentTrack && (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white p-4 rounded-lg shadow-lg w-[90%] max-w-xl flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-2">
          <div>
            <h4 className="font-bold">{currentTrack?.track_name}</h4>
            <p className="text-sm text-gray-400">{currentTrack?.artist_name}</p>
          </div>
          <button
            onClick={handleTogglePlay}
            className="ml-4 text-emerald-500 hover:text-emerald-400"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </button>
        </div>
      
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          onEnded={handleNextTrack}
          controls
          className="w-full"
        />
      </div>
      )}
    </div>
  );
}
