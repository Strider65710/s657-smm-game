/**
 * @license
 * All Rights Reserved.
 *
 * Strider657's Milkshake Mania - Music Player Component
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Rewind,
  FastForward,
} from "lucide-react";
import songAfternoon from "../assets/music/song1-afternoon.wav?url";
import songMilkshakes from "../assets/music/song2-milkshakes.wav?url";
import songBeginning from "../assets/music/song3-beginning.wav?url";
import songEmpire from "../assets/music/song4-empire.wav?url";

interface MusicTrack {
  id: string;
  name: string;
  file: string;
}

const MUSIC_TRACKS: MusicTrack[] = [
  { id: "song1", name: "Afternoon", file: songAfternoon },
  { id: "song2", name: "Milkshakes", file: songMilkshakes },
  { id: "song3", name: "Beginning", file: songBeginning },
  { id: "song4", name: "Empire", file: songEmpire },
];

export default function MusicPlayer() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = MUSIC_TRACKS[currentTrackIndex];

  // Sync volume level with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle continuous playback when track index changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio
        .play()
        .catch((e) =>
          console.error("Audio playback blocked or interrupted:", e),
        );
    }
  }, [currentTrackIndex, isPlaying]);

  // Scoped track shifting functions using functional state updates to keep references completely stable
  const nextTrack = useCallback(() => {
    setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % MUSIC_TRACKS.length);
    setCurrentTime(0);
  }, []);

  const prevTrack = useCallback(() => {
    setCurrentTrackIndex((prevIndex) =>
      prevIndex === 0 ? MUSIC_TRACKS.length - 1 : prevIndex - 1,
    );
    setCurrentTime(0);
  }, []);

  // Scoped skip controls with stable dependencies
  const skipBack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        audioRef.current.currentTime - 10,
      );
    }
  }, []);

  const skipForward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        duration,
        audioRef.current.currentTime + 10,
      );
    }
  }, [duration]);

  // Unified audio event listener scope
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleError = (e: any) => {
      console.error("Audio error:", e);
      console.error("Current track file:", currentTrack.file);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", nextTrack); // Safely triggers stable nextTrack reference
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", nextTrack);
      audio.removeEventListener("error", handleError);
    };
  }, [currentTrack.file, nextTrack]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.error("Playback failed to start:", e));
    }
  };

  const handleSeek = (e: { target: { value: string } }) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: { target: { value: string } }) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="glass-panel p-3 space-y-2">
      <audio
        ref={audioRef}
        src={currentTrack.file}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-neutral-400" />
          <span className="text-xs font-bold text-neutral-300 truncate max-w-[100px]">
            {currentTrack.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-500 font-mono">
            {currentTrackIndex + 1}/{MUSIC_TRACKS.length}
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      <input
        type="range"
        min="0"
        max={duration || 0}
        value={currentTime}
        onChange={handleSeek}
        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
      />

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={prevTrack}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          title="Previous track"
        >
          <SkipBack className="w-4 h-4 text-neutral-400" />
        </button>
        <button
          onClick={skipBack}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          title="Rewind 10s"
        >
          <Rewind className="w-4 h-4 text-neutral-400" />
        </button>
        <button
          onClick={togglePlay}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white" />
          )}
        </button>
        <button
          onClick={skipForward}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          title="Forward 10s"
        >
          <FastForward className="w-4 h-4 text-neutral-400" />
        </button>
        <button
          onClick={nextTrack}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          title="Next track"
        >
          <SkipForward className="w-4 h-4 text-neutral-400" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Volume2 className="w-3 h-3 text-neutral-400" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <span className="text-[10px] text-neutral-500 font-mono w-8">
          {Math.round(volume * 100)}%
        </span>
      </div>

      <div className="space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
          Select Track
        </div>
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(75px, 1fr))",
          }}
        >
          {MUSIC_TRACKS.map((track, index) => (
            <button
              key={track.id}
              onClick={() => {
                setCurrentTrackIndex(index);
                setCurrentTime(0);
              }}
              className={`w-full p-2 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wider ${
                currentTrackIndex === index
                  ? "bg-white/10 border-white/30 text-white"
                  : "bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              {track.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
