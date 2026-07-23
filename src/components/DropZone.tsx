import React, { useState, useEffect } from 'react';
import { Upload, Music, FileText } from 'lucide-react';

interface Props {
  onDropMp3: (file: File) => void;
  onDropLyrics: (file: File) => void;
}

export const DropZone: React.FC<Props> = ({ onDropMp3, onDropLyrics }) => {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      dragCounter = 0;

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (ext === 'mp3' || file.type.includes('audio')) {
          onDropMp3(file);
        } else if (ext === 'lrc' || ext === 'txt') {
          onDropLyrics(file);
        } else {
          onDropMp3(file); // Default try opening
        }
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onDropMp3, onDropLyrics]);

  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 bg-sky-950/80 backdrop-blur-sm border-4 border-dashed border-sky-400 flex flex-col items-center justify-center text-slate-100 gap-4 pointer-events-none transition-all">
      <div className="p-4 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-400 animate-bounce">
        <Upload className="w-12 h-12" />
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-sky-300">松开鼠标以导入文件</h3>
        <p className="text-sm text-slate-300">
          支持拖拽 <code className="text-sky-300">.mp3</code> 音频文件，或 <code className="text-purple-300">.lrc / .txt</code> 歌词文件
        </p>
      </div>

      <div className="flex gap-4 pt-2 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Music className="w-4 h-4 text-sky-400" /> MP3 音频与 ID3 元数据
        </span>
        <span className="flex items-center gap-1">
          <FileText className="w-4 h-4 text-purple-400" /> 同步歌词 / LRC 文本
        </span>
      </div>
    </div>
  );
};
