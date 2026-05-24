/**
 * @license
 * All Rights Reserved.
 */

import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import songAfternoon from "../assets/music/song1-afternoon.wav?url";
import songMilkshakes from "../assets/music/song2-milkshakes.wav?url";
import songBeginning from "../assets/music/song3-beginning.wav?url";

interface MusicTrack {
  id: string;
  name: string;
  file: string;
}

const MUSIC_TRACKS: MusicTrack[] = [
  { id: "song1", name: "Afternoon", file: songAfternoon },
  { id: "song2", name: "Milkshakes", file: songMilkshakes },
  { id: "song3", name: "Beginning", file: songBeginning },
];

export default function MusicPlayer() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = MUSIC_TRACKS[currentTrackIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleError = (e: any) => {
      console.error("Audio error:", e);
      console.error("Current track file:", currentTrack.file);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [currentTrackIndex, currentTrack.file]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: any) => {
    const audio = audioRef.current;
    if (!audio) return;

    const target = e.target as HTMLInputElement;
    const newTime = parseFloat(target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: any) => {
    const target = e.target as HTMLInputElement;
    const newVolume = parseFloat(target.value);
    setVolume(newVolume);
  };

  const skipBack = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, audio.currentTime - 10);
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.min(duration, audio.currentTime + 10);
  };

  const nextTrack = () => {
    const newIndex = (currentTrackIndex + 1) % MUSIC_TRACKS.length;
    setCurrentTrackIndex(newIndex);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const prevTrack = () => {
    const newIndex =
      currentTrackIndex === 0 ? MUSIC_TRACKS.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(newIndex);
    setCurrentTime(0);
    setIsPlaying(false);
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
          <SkipBack className="w-4 h-4 text-neutral-400" />
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
          <SkipForward className="w-4 h-4 text-neutral-400" />
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
                setIsPlaying(false);
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
