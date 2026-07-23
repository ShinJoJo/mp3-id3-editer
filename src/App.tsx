import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { MetadataEditor } from './components/MetadataEditor';
import { LyricsEditor } from './components/LyricsEditor';
import { MobilePlayer } from './components/MobilePlayer';
import { WaveformSpectrum } from './components/WaveformSpectrum';
import { DropZone } from './components/DropZone';
import { ID3Metadata, LyricLine, HistoryState, PlaybackSpeed } from './types';
import { parseID3Tags, buildTaggedMp3Blob } from './utils/id3Parser';
import { parseLrcText, stringifyLrc } from './utils/lrcParser';
import { createDemoAudio } from './utils/audioSynthesizer';
import { Music, FileText, Smartphone, Activity, Sparkles, RefreshCw } from 'lucide-react';

export default function App() {
  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [rawMp3ArrayBuffer, setRawMp3ArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [audioFileName, setAudioFileName] = useState<string>('demo_track.mp3');

  // Metadata & Lyrics state
  const [metadata, setMetadata] = useState<ID3Metadata>({
    title: '未命名歌曲',
    artist: '未知歌手',
    album: '未知专辑',
    year: '2026',
    genre: 'Pop',
    trackNumber: '1',
    composer: '',
  });

  const [lyrics, setLyrics] = useState<LyricLine[]>([]);

  // Undo / Redo History Engine
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Push state to undo history
  const pushHistory = useCallback((newMeta: ID3Metadata, newLyrics: LyricLine[]) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, { metadata: { ...newMeta }, lyrics: [...newLyrics] }];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Keyboard Ctrl+Z (Undo) and Ctrl+Y (Redo) listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setMetadata(prev.metadata);
      setLyrics(prev.lyrics);
      setHistoryIndex(historyIndex - 1);
      showToast('已撤销上一步修改');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setMetadata(next.metadata);
      setLyrics(next.lyrics);
      setHistoryIndex(historyIndex + 1);
      showToast('已重做修改');
    }
  };

  // Initialize Audio Element & Web Audio API Context
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    // Initialize Demo Track on startup
    loadDemoSong();

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);

  // Update volume & speed on audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [volume, playbackSpeed]);

  // Load Demo Song
  const loadDemoSong = async () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const { audioBuffer, arrayBuffer, metadata: demoMeta, lyrics: demoLyrics } =
        await createDemoAudio(audioCtxRef.current);

      setAudioBuffer(audioBuffer);
      setRawMp3ArrayBuffer(arrayBuffer);
      setAudioFileName('demo_track.mp3');

      // Create Blob URL for audio element playback
      const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.src = url;
      }

      setMetadata(demoMeta);
      setLyrics(demoLyrics);

      // Reset Undo History with initial state
      setHistory([{ metadata: demoMeta, lyrics: demoLyrics }]);
      setHistoryIndex(0);

      showToast('已加载内置示例歌曲');
    } catch (err) {
      console.error('Failed to load demo song:', err);
    }
  };

  // Process uploaded MP3 file
  const handleOpenMp3 = async (file: File) => {
    try {
      setAudioFileName(file.name);
      const arrayBuffer = await file.arrayBuffer();
      setRawMp3ArrayBuffer(arrayBuffer);

      // Parse ID3v2.3 tags
      const { metadata: parsedMeta, lyrics: parsedLyrics } = parseID3Tags(arrayBuffer);

      // Fallback title to filename if empty
      if (!parsedMeta.title || parsedMeta.title === '未命名歌曲') {
        parsedMeta.title = file.name.replace(/\.[^/.]+$/, '');
      }

      setMetadata(parsedMeta);
      setLyrics(parsedLyrics);

      // Reset Undo History
      setHistory([{ metadata: parsedMeta, lyrics: parsedLyrics }]);
      setHistoryIndex(0);

      // Decode audio for Waveform Canvas rendering
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      audioCtxRef.current.decodeAudioData(
        arrayBuffer.slice(0),
        (decoded) => {
          setAudioBuffer(decoded);
          setDuration(decoded.duration);
        },
        (err) => console.warn('Waveform decode error:', err)
      );

      // Set audio element source
      const url = URL.createObjectURL(file);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      }

      showToast(`已成功打开文件: ${file.name}`);
    } catch (err) {
      console.error('Error opening MP3:', err);
      showToast('开文件失败，请检查是否为有效的 MP3 音频');
    }
  };

  // Process imported LRC/TXT lyrics
  const handleDropLyrics = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseLrcText(text);
      setLyrics(parsed);
      pushHistory(metadata, parsed);
      showToast(`已导入歌词文件: ${file.name}`);
    } catch (err) {
      showToast('导入歌词失败');
    }
  };

  // Metadata change handler
  const handleMetadataChange = (updated: ID3Metadata) => {
    setMetadata(updated);
    pushHistory(updated, lyrics);
  };

  // Lyrics change handler
  const handleLyricsChange = (updated: LyricLine[]) => {
    setLyrics(updated);
    pushHistory(metadata, updated);
  };

  // Play / Pause toggle
  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  // Seek position
  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Export tagged MP3 file
  const handleExportMp3 = () => {
    if (!rawMp3ArrayBuffer) {
      showToast('暂无可用的 MP3 音频数据');
      return;
    }

    const taggedBlob = buildTaggedMp3Blob(rawMp3ArrayBuffer, metadata, lyrics);
    const fileName = `${metadata.artist || 'Artist'} - ${metadata.title || 'Track'}.mp3`;

    const url = URL.createObjectURL(taggedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`已导出带 ID3v2.3 标签的 MP3: ${fileName}`);
  };

  // Export LRC file
  const handleExportLrc = () => {
    const lrcText = stringifyLrc(lyrics, metadata.title, metadata.artist, metadata.album);
    const fileName = `${metadata.artist || 'Artist'} - ${metadata.title || 'Track'}.lrc`;

    const blob = new Blob([lrcText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`已导出 LRC 同步歌词: ${fileName}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Global Drag and Drop Overlay */}
      <DropZone onDropMp3={handleOpenMp3} onDropLyrics={handleDropLyrics} />

      {/* Header Bar */}
      <Header
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenMp3={handleOpenMp3}
        onExportMp3={handleExportMp3}
        onExportLrc={handleExportLrc}
        onLoadDemo={loadDemoSong}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-sky-500 text-slate-950 px-4 py-2 rounded-xl font-medium text-xs shadow-xl animate-fade-in flex items-center gap-2 border border-sky-300">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main 4 Regions Layout Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-5 py-4 flex flex-col gap-4">
        {/* Top Section: 3 Columns Grid (Region 1, Region 2, Region 3) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-h-[580px]">
          {/* Region 1: ID3 Metadata Editor (Left - 3.5 cols) */}
          <div className="lg:col-span-4 xl:col-span-3 h-full">
            <MetadataEditor metadata={metadata} onChange={handleMetadataChange} />
          </div>

          {/* Region 2: Lyrics & Timestamps Editor (Middle - 4.5 cols) */}
          <div className="lg:col-span-8 xl:col-span-5 h-full">
            <LyricsEditor
              lyrics={lyrics}
              currentTime={currentTime}
              duration={duration}
              onChange={handleLyricsChange}
              onSeek={handleSeek}
            />
          </div>

          {/* Region 3: Simulated Mobile Music Player (Right - 4 cols) */}
          <div className="lg:col-span-12 xl:col-span-4 h-full">
            <MobilePlayer
              metadata={metadata}
              lyrics={lyrics}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
              onTogglePlay={handleTogglePlay}
              onSeek={handleSeek}
              onMetadataChange={handleMetadataChange}
              onSpeedChange={setPlaybackSpeed}
            />
          </div>
        </div>

        {/* Bottom Section: Region 4 (Waveform & Volume Spectrum Canvas) */}
        <div className="w-full">
          <WaveformSpectrum
            audioBuffer={audioBuffer}
            lyrics={lyrics}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            volume={volume}
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            onLyricsChange={handleLyricsChange}
            onVolumeChange={setVolume}
          />
        </div>
      </main>
    </div>
  );
}
