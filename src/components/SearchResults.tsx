import React, { useState, useRef } from 'react';
import { Play, Pause, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface SearchResultsProps {
  results: Array<{
    id: string;
    name: string;
    artist: string;
    image: string;
  }>;
  onAddToPlaylist: (track: any) => void;
}

export function SearchResults({ results, onAddToPlaylist }: SearchResultsProps) {
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackRef = useRef<string | null>(null);

  const handlePlay = async (trackId: string) => {
    try {
      if (playingTrack === trackId) {
        // Toggle play/pause for current track
        if (audioRef.current?.paused) {
          await audioRef.current.play();
          setIsPlaying(true);
        } else {
          audioRef.current?.pause();
          setIsPlaying(false);
        }
      } else {
        // Stop current track if playing
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
        
        // Start new track
        setIsLoading(true);
        setPlayingTrack(trackId);
        currentTrackRef.current = trackId;
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
      toast.error('Failed to play track');
      handleReset();
    }
  };

  const handleReset = () => {
    setPlayingTrack(null);
    setIsPlaying(false);
    setIsLoading(false);
    currentTrackRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleAudioLoaded = () => {
    setIsLoading(false);
    if (isPlaying && audioRef.current) {
      audioRef.current.play()
        .catch(error => {
          console.error('Autoplay failed:', error);
          setIsPlaying(false);
        });
    }
  };

  const handleAudioError = () => {
    toast.error('Failed to load audio');
    handleReset();
  };

  const handleAudioEnded = () => {
    handleReset();
  };

  const handleAudioPlay = () => {
    setIsPlaying(true);
  };

  const handleAudioPause = () => {
    setIsPlaying(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {results.map((track) => {
        const isCurrentTrack = playingTrack === track.id;
        
        return (
          <div
            key={track.id}
            className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="relative group">
              <img
                src={track.image || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'}
                alt={track.name}
                className="w-full h-48 object-cover transition-opacity group-hover:opacity-75"
              />
              {isCurrentTrack && isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                </div>
              )}
              <button
                onClick={() => handlePlay(track.id)}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity opacity-0 group-hover:opacity-100"
              >
                {isCurrentTrack && isPlaying ? (
                  <Pause className="h-12 w-12 text-white" />
                ) : (
                  <Play className="h-12 w-12 text-white" />
                )}
              </button>
            </div>

            <div className="p-4">
              <h3 className="text-lg font-semibold truncate">{track.name}</h3>
              <p className="text-gray-400 truncate">{track.artist}</p>

              {isCurrentTrack && (
                <div className="mt-4">
                  <audio
                    ref={audioRef}
                    className="w-full"
                    src={`/api/stream/${track.id}`}
                    onLoadedData={handleAudioLoaded}
                    onError={handleAudioError}
                    onEnded={handleAudioEnded}
                    onPlay={handleAudioPlay}
                    onPause={handleAudioPause}
                    controls
                  />
                </div>
              )}

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handlePlay(track.id)}
                  disabled={isLoading}
                  className={`flex-1 ${
                    isCurrentTrack && isPlaying ? 'bg-emerald-600' : 'bg-emerald-500'
                  } text-white py-2 px-4 rounded-md hover:bg-emerald-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isCurrentTrack && isPlaying ? (
                    <>
                      <Pause className="h-5 w-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Play
                    </>
                  )}
                </button>
                <button
                  onClick={() => onAddToPlaylist(track)}
                  className="flex-1 bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors flex items-center justify-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}