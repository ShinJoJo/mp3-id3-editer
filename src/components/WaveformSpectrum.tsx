import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LyricLine } from '../types';
import { formatLrcTime } from '../utils/lrcParser';
import { Activity, ZoomIn, ZoomOut, RotateCcw, Play, Pause, Volume2, MoveHorizontal, HelpCircle } from 'lucide-react';

interface Props {
  audioBuffer: AudioBuffer | null;
  lyrics: LyricLine[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onLyricsChange: (updated: LyricLine[]) => void;
  onVolumeChange: (vol: number) => void;
}

export const WaveformSpectrum: React.FC<Props> = ({
  audioBuffer,
  lyrics,
  currentTime,
  duration,
  isPlaying,
  volume,
  onTogglePlay,
  onSeek,
  onLyricsChange,
  onVolumeChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Zoom & Pan Viewport state
  const [zoom, setZoom] = useState<number>(1); // 1x to 25x zoom
  const [scrollLeft, setScrollLeft] = useState<number>(0); // in pixels
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [mouseCanvasPos, setMouseCanvasPos] = useState<{ x: number; time: number } | null>(null);

  // Dragging Marker State
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);

  const canvasWidth = containerRef.current?.clientWidth || 800;
  const canvasHeight = 140;

  // Convert time in seconds to canvas X coordinate
  const timeToX = useCallback(
    (time: number): number => {
      if (!duration || duration <= 0) return 0;
      const totalPixels = canvasWidth * zoom;
      return (time / duration) * totalPixels - scrollLeft;
    },
    [duration, canvasWidth, zoom, scrollLeft]
  );

  // Convert canvas X coordinate to time in seconds
  const xToTime = useCallback(
    (x: number): number => {
      if (!duration || duration <= 0) return 0;
      const totalPixels = canvasWidth * zoom;
      const absoluteX = x + scrollLeft;
      const calculatedTime = (absoluteX / totalPixels) * duration;
      return Math.max(0, Math.min(duration, calculatedTime));
    },
    [duration, canvasWidth, zoom, scrollLeft]
  );

  // Spacebar hotkey listener for play/pause when hovering over waveform area
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isHovered && e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHovered, onTogglePlay]);

  // Mouse wheel zoom centered at mouse pointer X position
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!duration || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left; // Mouse X relative to visible canvas

    // Determine target zoom level
    const zoomFactor = e.deltaY < 0 ? 1.25 : 0.8;
    const newZoom = Math.max(1, Math.min(30, zoom * zoomFactor));

    if (newZoom === zoom) return;

    // Time at mouse position before zoom
    const targetTime = xToTime(mouseX);

    // Calculate new scrollLeft so that targetTime stays under the mouse pointer
    const totalPixelsNew = canvasWidth * newZoom;
    const newScrollLeft = (targetTime / duration) * totalPixelsNew - mouseX;

    setZoom(newZoom);
    setScrollLeft(Math.max(0, Math.min(totalPixelsNew - canvasWidth, newScrollLeft)));
  };

  // Render Volume Spectrum Waveform & Lyric Markers on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);

    // Clear Canvas
    ctx.fillStyle = '#020617'; // slate-950
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw Grid Lines
    ctx.strokeStyle = '#1e293b'; // slate-800
    ctx.lineWidth = 1;
    const totalPixels = canvasWidth * zoom;
    const numTicks = 20 * zoom;
    for (let i = 0; i <= numTicks; i++) {
      const t = (i / numTicks) * (duration || 60);
      const x = timeToX(t);
      if (x >= 0 && x <= canvasWidth) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();

        // Time labels
        ctx.fillStyle = '#64748b';
        ctx.font = '9px monospace';
        ctx.fillText(formatLrcTime(t).replace('[', '').replace(']', ''), x + 3, 12);
      }
    }

    // Draw Volume Waveform Spectrum Bars
    if (audioBuffer) {
      const channelData = audioBuffer.getChannelData(0);
      const step = Math.max(1, Math.floor(channelData.length / totalPixels));
      const barWidth = Math.max(1, Math.floor(totalPixels / (channelData.length / step)));

      const curX = timeToX(currentTime);

      for (let xPx = 0; xPx < canvasWidth; xPx++) {
        const absoluteX = xPx + scrollLeft;
        const sampleIndex = Math.floor((absoluteX / totalPixels) * channelData.length);

        if (sampleIndex >= 0 && sampleIndex < channelData.length) {
          // Average peak amplitude
          let maxVal = 0;
          for (let j = 0; j < step; j += 4) {
            const val = Math.abs(channelData[sampleIndex + j] || 0);
            if (val > maxVal) maxVal = val;
          }

          const h = maxVal * (canvasHeight * 0.75);
          const topY = (canvasHeight - h) / 2;

          const isPlayed = xPx <= curX;
          ctx.fillStyle = isPlayed ? '#38bdf8' : '#334155'; // sky-400 : slate-700
          ctx.fillRect(xPx, topY, barWidth, Math.max(2, h));
        }
      }
    } else {
      // Placeholder Waveform Spectrum if audio not loaded
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, canvasHeight / 2 - 1, canvasWidth, 2);
    }

    // Draw Draggable Lyric Timestamp Flags / Markers
    lyrics.forEach((line, idx) => {
      const x = timeToX(line.time);
      if (x >= -20 && x <= canvasWidth + 20) {
        const isDragging = line.id === draggingMarkerId;

        // Marker Line
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.strokeStyle = isDragging ? '#f59e0b' : '#a855f7'; // amber-500 : purple-500
        ctx.lineWidth = isDragging ? 2.5 : 1.5;
        ctx.setLineDash(isDragging ? [] : [4, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Marker Flag Head
        ctx.fillStyle = isDragging ? '#f59e0b' : '#a855f7';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 12, 0);
        ctx.lineTo(x + 12, 18);
        ctx.lineTo(x, 12);
        ctx.closePath();
        ctx.fill();

        // Line Index Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(`${idx + 1}`, x + 2, 10);

        // Lyric text label preview on marker hover/drag
        if (isDragging || (mouseCanvasPos && Math.abs(mouseCanvasPos.x - x) < 8)) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.fillRect(x + 4, canvasHeight - 24, 180, 18);
          ctx.strokeStyle = '#a855f7';
          ctx.strokeRect(x + 4, canvasHeight - 24, 180, 18);

          ctx.fillStyle = '#f3e8ff';
          ctx.font = '10px sans-serif';
          ctx.fillText(
            `${formatLrcTime(line.time)} ${line.text}`,
            x + 8,
            canvasHeight - 12
          );
        }
      }
    });

    // Draw Current Playhead Line
    const curX = timeToX(currentTime);
    if (curX >= 0 && curX <= canvasWidth) {
      ctx.beginPath();
      ctx.moveTo(curX, 0);
      ctx.lineTo(curX, canvasHeight);
      ctx.strokeStyle = '#ef4444'; // red-500
      ctx.lineWidth = 2;
      ctx.stroke();

      // Playhead triangle top
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(curX - 6, 0);
      ctx.lineTo(curX + 6, 0);
      ctx.lineTo(curX, 8);
      ctx.closePath();
      ctx.fill();
    }

    // Draw Hover Time Guideline
    if (mouseCanvasPos) {
      ctx.beginPath();
      ctx.moveTo(mouseCanvasPos.x, 0);
      ctx.lineTo(mouseCanvasPos.x, canvasHeight);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [
    audioBuffer,
    lyrics,
    currentTime,
    duration,
    zoom,
    scrollLeft,
    canvasWidth,
    draggingMarkerId,
    mouseCanvasPos,
    timeToX,
  ]);

  // Handle Mouse Down on Canvas (Start marker drag or audio seek)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Check if clicked near a lyric marker flag (within 10px)
    const clickedMarker = lyrics.find((line) => {
      const markerX = timeToX(line.time);
      return Math.abs(markerX - x) <= 10;
    });

    if (clickedMarker) {
      setDraggingMarkerId(clickedMarker.id);
    } else {
      // Seek playback position
      setIsScrubbing(true);
      const clickedTime = xToTime(x);
      onSeek(clickedTime);
    }
  };

  // Handle Mouse Move over Canvas (Drag marker, scrub, update hover tooltip)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(canvasWidth, e.clientX - rect.left));
    const hoverTime = xToTime(x);

    setMouseCanvasPos({ x, time: hoverTime });

    // Dragging marker to update timestamp in real-time
    if (draggingMarkerId) {
      const updated = lyrics.map((line) =>
        line.id === draggingMarkerId ? { ...line, time: hoverTime } : line
      );
      updated.sort((a, b) => a.time - b.time);
      onLyricsChange(updated);
    } else if (isScrubbing) {
      onSeek(hoverTime);
    }
  };

  const handleMouseUp = () => {
    setDraggingMarkerId(null);
    setIsScrubbing(false);
  };

  return (
    <div
      ref={containerRef}
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMouseCanvasPos(null);
        setDraggingMarkerId(null);
        setIsScrubbing(false);
      }}
    >
      {/* Waveform Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold text-slate-100">
            音频音量频谱 & 歌词时间戳拖拽标记 (频谱区)
          </h2>
          {isHovered && (
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
              [空格键] 播放/暂停
            </span>
          )}
        </div>

        {/* Controls: Zoom, Volume, Reset */}
        <div className="flex items-center gap-3">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              title="缩小 (滚轮向上)"
              onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 transition"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono text-sky-400 px-1 font-bold">{zoom.toFixed(1)}x</span>
            <button
              type="button"
              title="放大 (滚轮向下)"
              onClick={() => setZoom((z) => Math.min(30, z + 0.5))}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 transition"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="重置缩放"
              onClick={() => {
                setZoom(1);
                setScrollLeft(0);
              }}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Master Volume */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-950 p-1 px-2.5 rounded-lg border border-slate-800">
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-800 accent-sky-400 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Interactive Waveform Canvas Container */}
      <div
        className="relative bg-slate-950 rounded-lg overflow-hidden border border-slate-800/80 cursor-crosshair select-none"
        onWheel={handleWheel}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-[140px] block"
        />

        {/* Hover Time Overlay Badge */}
        {mouseCanvasPos && (
          <div
            className="absolute top-2 pointer-events-none text-[10px] font-mono bg-slate-900/90 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded shadow-lg backdrop-blur-xs"
            style={{ left: Math.min(canvasWidth - 80, mouseCanvasPos.x + 10) }}
          >
            {formatLrcTime(mouseCanvasPos.time)}
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-purple-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
            紫色旗帜: 歌词时间标记 (可左右拖拽)
          </span>
          <span className="flex items-center gap-1 text-sky-400 font-medium">
            <MoveHorizontal className="w-3 h-3" />
            滚轮以鼠标为中心缩放频谱
          </span>
        </div>

        <div className="text-slate-500 font-mono">
          音量频谱精度: 高解析 44.1kHz | 支持全局拖拽 MP3 / LRC 文件
        </div>
      </div>
    </div>
  );
};
