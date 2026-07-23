import React, { useState, useRef } from 'react';
import { LyricLine } from '../types';
import { formatLrcTime, parsePlainTextLyrics, parseLrcText, stringifyLrc } from '../utils/lrcParser';
import { FileText, Plus, Trash2, Clock, Upload, ArrowUp, ArrowDown, Play, Sparkles, Sliders, Copy, Check } from 'lucide-react';

interface Props {
  lyrics: LyricLine[];
  currentTime: number;
  duration: number;
  onChange: (updated: LyricLine[]) => void;
  onSeek: (time: number) => void;
}

export const LyricsEditor: React.FC<Props> = ({
  lyrics,
  currentTime,
  duration,
  onChange,
  onSeek,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(lyrics[0]?.id || null);
  const [activeTab, setActiveTab] = useState<'editor' | 'import_txt' | 'lrc_raw'>('editor');
  const [plainTextInput, setPlainTextInput] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const lrcFileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (id: string, newText: string) => {
    const updated = lyrics.map((item) =>
      item.id === id ? { ...item, text: newText } : item
    );
    onChange(updated);
  };

  const handleTimeChange = (id: string, newTime: number) => {
    const validTime = Math.max(0, Math.round(newTime * 100) / 100);
    const updated = lyrics.map((item) =>
      item.id === id ? { ...item, time: validTime } : item
    );
    updated.sort((a, b) => a.time - b.time);
    onChange(updated);
  };

  const handleStampCurrentTime = (id: string) => {
    const updated = lyrics.map((item) =>
      item.id === id ? { ...item, time: Math.round(currentTime * 100) / 100 } : item
    );
    updated.sort((a, b) => a.time - b.time);
    onChange(updated);

    // Auto select next lyric line for rapid tapping
    const currentIndex = lyrics.findIndex((l) => l.id === id);
    if (currentIndex !== -1 && currentIndex < lyrics.length - 1) {
      setSelectedId(lyrics[currentIndex + 1].id);
    }
  };

  const handleAddLine = () => {
    const newLine: LyricLine = {
      id: `lyric_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      time: Math.round(currentTime * 100) / 100,
      text: '新歌词行...',
    };
    const updated = [...lyrics, newLine].sort((a, b) => a.time - b.time);
    onChange(updated);
    setSelectedId(newLine.id);
  };

  const handleDeleteLine = (id: string) => {
    const updated = lyrics.filter((item) => item.id !== id);
    onChange(updated);
    if (selectedId === id) {
      setSelectedId(updated[0]?.id || null);
    }
  };

  const handleImportLrcFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseLrcText(content);
        onChange(parsed);
        if (parsed.length > 0) setSelectedId(parsed[0].id);
      }
    };
    reader.readAsText(file);
  };

  const handleConvertPlainText = () => {
    if (!plainTextInput.trim()) return;
    const generated = parsePlainTextLyrics(plainTextInput, duration || 180);
    onChange(generated);
    setActiveTab('editor');
    if (generated.length > 0) setSelectedId(generated[0].id);
  };

  const handleCopyLrcRaw = () => {
    const lrcRaw = stringifyLrc(lyrics);
    navigator.clipboard.writeText(lrcRaw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 h-full shadow-lg">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold text-slate-100">歌词与时间标签编辑器 (歌词区)</h2>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition ${
              activeTab === 'editor'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            逐句编辑 ({lyrics.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import_txt')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition ${
              activeTab === 'import_txt'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            导入纯歌词
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lrc_raw')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition ${
              activeTab === 'lrc_raw'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            LRC 原文
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'editor' && (
        <div className="flex flex-col flex-1 gap-2 min-h-0">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleAddLine}
                className="px-2.5 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> 添加歌词行
              </button>

              <button
                type="button"
                onClick={() => lrcFileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1 border border-slate-700"
              >
                <Upload className="w-3.5 h-3.5 text-sky-400" /> 导入 .lrc / .txt
              </button>
              <input
                ref={lrcFileInputRef}
                type="file"
                accept=".lrc,.txt"
                className="hidden"
                onChange={handleImportLrcFile}
              />
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              当前播放: <span className="text-sky-300 font-bold">{formatLrcTime(currentTime)}</span>
            </div>
          </div>

          {/* Lyrics Items Scroll List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
            {lyrics.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-500 gap-2 border border-dashed border-slate-800 rounded-lg">
                <FileText className="w-8 h-8 opacity-40" />
                <p className="text-xs">暂无歌词信息，请点击“添加歌词行”或“导入 .lrc / .txt”</p>
              </div>
            ) : (
              lyrics.map((item, idx) => {
                const isSelected = item.id === selectedId;
                const isCurrentPlaying =
                  currentTime >= item.time &&
                  (idx === lyrics.length - 1 || currentTime < lyrics[idx + 1].time);

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`p-2.5 rounded-lg border transition-all flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ${
                      isCurrentPlaying
                        ? 'bg-sky-500/15 border-sky-500/60 ring-1 ring-sky-500/30'
                        : isSelected
                        ? 'bg-slate-800/80 border-slate-700'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Timestamp Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        title="跳转播放至此时间点"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSeek(item.time);
                        }}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 transition"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>

                      <div className="font-mono text-xs text-sky-300 font-bold bg-slate-900 border border-slate-800 px-2 py-1 rounded min-w-[76px] text-center">
                        {formatLrcTime(item.time)}
                      </div>

                      <button
                        type="button"
                        title="点击把当前音频播放时间直接写入该句"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStampCurrentTime(item.id);
                        }}
                        className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-medium transition flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3" /> 打打标
                      </button>
                    </div>

                    {/* Lyric Text Input */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => handleTextChange(item.id, e.target.value)}
                        placeholder="输入歌词文本..."
                        className="w-full bg-slate-900/80 border border-slate-800 focus:border-sky-500 rounded px-2.5 py-1.5 text-xs text-slate-100 transition outline-none"
                      />
                    </div>

                    {/* Fine-tune Timestamp & Delete */}
                    <div className="flex items-center gap-1 shrink-0 justify-end">
                      <button
                        type="button"
                        title="微调时间 -0.2s"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTimeChange(item.id, item.time - 0.2);
                        }}
                        className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-slate-700"
                      >
                        -0.2s
                      </button>
                      <button
                        type="button"
                        title="微调时间 +0.2s"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTimeChange(item.id, item.time + 0.2);
                        }}
                        className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-slate-700"
                      >
                        +0.2s
                      </button>
                      <button
                        type="button"
                        title="删除此句歌词"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLine(item.id);
                        }}
                        className="p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab: Import Plain Text */}
      {activeTab === 'import_txt' && (
        <div className="flex flex-col flex-1 gap-3">
          <div className="text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-sky-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 无时间标签纯歌词导入 & 自动生成时间戳
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              请在下方粘贴纯文本歌词（每行一句）。系统将根据歌曲总时长自动平均分配时间戳，生成后你可以在“逐句编辑”或下方“音频波形”中拖拽标打标精准调整！
            </p>
          </div>

          <textarea
            value={plainTextInput}
            onChange={(e) => setPlainTextInput(e.target.value)}
            placeholder={`粘贴无时间戳的歌词内容，例如:\n夜幕降临 星光闪烁\n穿过浩瀚宇宙的每一个角落\n节拍在心中跳动 旋律不息...`}
            className="flex-1 w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg p-3 text-xs font-mono text-slate-200 resize-none outline-none leading-relaxed min-h-[180px]"
          />

          <button
            type="button"
            onClick={handleConvertPlainText}
            disabled={!plainTextInput.trim()}
            className="w-full py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-medium rounded-lg transition flex items-center justify-center gap-2 shadow-md shadow-sky-600/20"
          >
            <Sparkles className="w-3.5 h-3.5" /> 智能生成时间戳并导入歌词
          </button>
        </div>
      )}

      {/* Tab: LRC Raw View */}
      {activeTab === 'lrc_raw' && (
        <div className="flex flex-col flex-1 gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">完整 LRC 格式导出文本:</span>
            <button
              type="button"
              onClick={handleCopyLrcRaw}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition flex items-center gap-1 border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">已复制 LRC</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  复制 LRC 内容
                </>
              )}
            </button>
          </div>

          <textarea
            readOnly
            value={stringifyLrc(lyrics)}
            className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-400/90 resize-none outline-none leading-relaxed min-h-[200px]"
          />
        </div>
      )}
    </div>
  );
};
