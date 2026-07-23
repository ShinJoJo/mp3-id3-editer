import React, { useRef, useEffect, useState } from 'react';
import { ID3Metadata, LyricLine, PlaybackSpeed } from '../types';
import { formatTimeShort } from '../utils/lrcParser';
import { Play, Pause, SkipBack, SkipForward, Smartphone, Disc, Edit3, Volume2, Repeat, Zap } from 'lucide-react';

interface Props {
  metadata: ID3Metadata;
  lyrics: LyricLine[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onMetadataChange: (updated: ID3Metadata) => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
}

export const MobilePlayer: React.FC<Props> = ({
  metadata,
  lyrics,
  currentTime,
  duration,
  isPlaying,
  playbackSpeed,
  onTogglePlay,
  onSeek,
  onMetadataChange,
  onSpeedChange,
}) => {
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const [editingField, setEditingField] = useState<'title' | 'artist' | 'album' | null>(null);

  // Find currently active lyric line
  const activeLyricIndex = lyrics.findIndex((line, idx) => {
    const nextLine = lyrics[idx + 1];
    return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
  });

  // Smooth scroll active lyric into center view
  useEffect(() => {
    if (activeLyricIndex !== -1 && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const activeElement = container.children[activeLyricIndex] as HTMLElement;
      if (activeElement) {
        const topPos = activeElement.offsetTop - container.clientHeight / 2 + activeElement.clientHeight / 2;
        container.scrollTo({
          top: Math.max(0, topPos),
          behavior: 'smooth',
        });
      }
    }
  }, [activeLyricIndex, currentTime]);

  const speeds: PlaybackSpeed[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const handleSkipPrev = () => {
    if (activeLyricIndex > 0) {
      onSeek(lyrics[activeLyricIndex - 1].time);
    } else {
      onSeek(0);
    }
  };

  const handleSkipNext = () => {
    if (activeLyricIndex !== -1 && activeLyricIndex < lyrics.length - 1) {
      onSeek(lyrics[activeLyricIndex + 1].time);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 h-full shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-sky-400" />
          模拟手机播放器 (播放器区)
        </h2>
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <Edit3 className="w-3 h-3 text-sky-400" /> 点击文字直接修改
        </span>
      </div>

      {/* Mobile Frame */}
      <div className="flex-1 flex justify-center items-center py-1 overflow-hidden">
        <div className="relative w-full max-w-[310px] h-[520px] bg-slate-950 rounded-[38px] p-3 shadow-2xl border-[6px] border-slate-800 flex flex-col justify-between overflow-hidden select-none">
          {/* Top Speaker / Dynamic Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-20 flex items-center justify-center gap-2">
            <div className="w-2.5 h-2.5 bg-slate-950 rounded-full border border-slate-800" />
            <div className="w-8 h-1 bg-slate-800 rounded-full" />
          </div>

          {/* Ambient Blurred Background Art */}
          {metadata.coverUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-25 blur-xl pointer-events-none scale-125"
              style={{ backgroundImage: `url(${metadata.coverUrl})` }}
            />
          )}

          {/* Mobile Screen Header */}
          <div className="pt-4 px-2 z-10 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono text-slate-300">09:41</span>
            <div className="flex items-center gap-1 text-[10px] bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800">
              <Disc className={`w-3 h-3 text-sky-400 ${isPlaying ? 'animate-spin' : ''}`} />
              <span>MP3 ID3 Engine</span>
            </div>
          </div>

          {/* Album Cover & Interactive Editable Title Area */}
          <div className="z-10 flex flex-col items-center text-center gap-2 mt-2">
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-xl border border-white/10 group">
              {metadata.coverUrl ? (
                <img src={metadata.coverUrl} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                  <Disc className="w-12 h-12" />
                </div>
              )}
            </div>

            {/* Editable Song Title & Artist Directly on Mobile Screen */}
            <div className="w-full px-2 space-y-1">
              {editingField === 'title' ? (
                <input
                  type="text"
                  autoFocus
                  value={metadata.title}
                  onBlur={() => setEditingField(null)}
                  onChange={(e) => onMetadataChange({ ...metadata, title: e.target.value })}
                  className="w-full bg-slate-900/90 text-center font-bold text-sm text-sky-300 border border-sky-500 rounded px-1 py-0.5 outline-none"
                />
              ) : (
                <div
                  onClick={() => setEditingField('title')}
                  title="点击直接修改歌名"
                  className="font-bold text-sm text-slate-100 truncate cursor-pointer hover:text-sky-300 transition flex items-center justify-center gap-1 group/item"
                >
                  <span>{metadata.title || '点击设置歌名'}</span>
                  <Edit3 className="w-3 h-3 text-slate-500 group-hover/item:text-sky-400 opacity-0 group-hover/item:opacity-100 transition" />
                </div>
              )}

              {editingField === 'artist' ? (
                <input
                  type="text"
                  autoFocus
                  value={metadata.artist}
                  onBlur={() => setEditingField(null)}
                  onChange={(e) => onMetadataChange({ ...metadata, artist: e.target.value })}
                  className="w-full bg-slate-900/90 text-center text-xs text-sky-300 border border-sky-500 rounded px-1 py-0.5 outline-none"
                />
              ) : (
                <div
                  onClick={() => setEditingField('artist')}
                  title="点击直接修改歌手名"
                  className="text-xs text-slate-300 truncate cursor-pointer hover:text-sky-300 transition flex items-center justify-center gap-1 group/item"
                >
                  <span>{metadata.artist || '点击设置歌手'}</span>
                  <Edit3 className="w-2.5 h-2.5 text-slate-500 group-hover/item:text-sky-400 opacity-0 group-hover/item:opacity-100 transition" />
                </div>
              )}
            </div>
          </div>

          {/* Smooth Scrolling Lyrics Container */}
          <div
            ref={lyricsContainerRef}
            className="z-10 flex-1 my-2 overflow-y-auto px-3 py-4 space-y-3 text-center scrollbar-none border-y border-white/5 bg-slate-950/40 rounded-xl"
          >
            {lyrics.length === 0 ? (
              <p className="text-xs text-slate-500 pt-8">暂无显示歌词</p>
            ) : (
              lyrics.map((line, idx) => {
                const isActive = idx === activeLyricIndex;
                return (
                  <p
                    key={line.id}
                    onClick={() => onSeek(line.time)}
                    className={`text-xs transition-all duration-300 cursor-pointer font-medium leading-relaxed ${
                      isActive
                        ? 'text-sky-300 text-sm font-bold scale-105 drop-shadow-[0_2px_8px_rgba(56,189,248,0.5)]'
                        : 'text-slate-400/80 hover:text-slate-200 text-xs'
                    }`}
                  >
                    {line.text}
                  </p>
                );
              })
            )}
          </div>

          {/* Mobile Player Bottom Controls */}
          <div className="z-10 space-y-2 pb-1">
            {/* Progress Slider */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 accent-sky-400 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{formatTimeShort(currentTime)}</span>
                <span>{formatTimeShort(duration)}</span>
              </div>
            </div>

            {/* Transport Control Buttons */}
            <div className="flex items-center justify-between px-2">
              <button
                type="button"
                onClick={() => {
                  const nextIdx = speeds.indexOf(playbackSpeed) + 1;
                  onSpeedChange(speeds[nextIdx % speeds.length]);
                }}
                className="text-[10px] font-mono text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 px-2 py-0.5 rounded border border-sky-500/30 font-bold transition"
              >
                {playbackSpeed}x
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSkipPrev}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 transition"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onTogglePlay}
                  className="p-2.5 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/30 transition transform active:scale-95"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={handleSkipNext}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 transition"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              <div className="w-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
