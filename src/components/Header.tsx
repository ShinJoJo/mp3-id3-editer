import React, { useRef, useState } from 'react';
import { Music, Download, Upload, Undo2, Redo2, Sparkles, HelpCircle, FileAudio, FileText, CheckCircle2, FileCode } from 'lucide-react';
import { CppExportModal } from './CppExportModal';

interface Props {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenMp3: (file: File) => void;
  onExportMp3: () => void;
  onExportLrc: () => void;
  onLoadDemo: () => void;
}

export const Header: React.FC<Props> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenMp3,
  onExportMp3,
  onExportLrc,
  onLoadDemo,
}) => {
  const mp3InputRef = useRef<HTMLInputElement>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showCppModal, setShowCppModal] = useState(false);

  const handleMp3Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpenMp3(file);
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & App Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 leading-none">
                MP3 ID3 Editer
              </h1>
              <span className="bg-sky-500/15 text-sky-400 border border-sky-500/30 font-mono text-[10px] px-1.5 py-0.2 rounded font-bold">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              专业 MP3 ID3v2.3 标签、专辑封面、同步歌词与音频波形频谱编辑器
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Desktop Export Script Button */}
          <button
            type="button"
            onClick={() => setShowCppModal(true)}
            className="px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-medium transition flex items-center gap-1.5 shadow-xs"
          >
            <FileCode className="w-3.5 h-3.5 text-sky-400" />
            <span>打包 Win7 桌面版 (.exe)</span>
          </button>

          {/* Undo / Redo */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              disabled={!canUndo}
              onClick={onUndo}
              title="撤销更改 (Ctrl+Z)"
              className="px-2 py-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 text-xs font-medium transition flex items-center gap-1"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">撤销</span>
            </button>
            <button
              type="button"
              disabled={!canRedo}
              onClick={onRedo}
              title="重做更改 (Ctrl+Y)"
              className="px-2 py-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 text-xs font-medium transition flex items-center gap-1"
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">重做</span>
            </button>
          </div>

          {/* Open MP3 */}
          <button
            type="button"
            onClick={() => mp3InputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1.5 border border-slate-700"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>打开 MP3</span>
          </button>
          <input
            ref={mp3InputRef}
            type="file"
            accept="audio/mp3,audio/mpeg,.mp3"
            className="hidden"
            onChange={handleMp3Change}
          />

          {/* Load Demo */}
          <button
            type="button"
            onClick={onLoadDemo}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">加载示例歌曲</span>
          </button>

          {/* Export LRC */}
          <button
            type="button"
            onClick={onExportLrc}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1.5 border border-slate-700"
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">导出 .lrc</span>
          </button>

          {/* Export MP3 */}
          <button
            type="button"
            onClick={onExportMp3}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-md shadow-sky-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>保存/导出 MP3</span>
          </button>

          {/* Help Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition border border-slate-700"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* C++ Export Modal */}
      <CppExportModal isOpen={showCppModal} onClose={() => setShowCppModal(false)} />

      {/* Help Instructions Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Music className="w-5 h-5 text-sky-400" />
                MP3 ID3 Editer v1.0 使用指南
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <p className="font-bold text-sky-400">1. 四大功能区域说明</p>
                <p>• <strong>左侧元数据区：</strong>编辑 ID3v2.3 标签 (歌名, 歌手, 专辑, 年份, 封面等)，支持中文多国语言 UTF-8/16 Encoding。</p>
                <p>• <strong>中间歌词区：</strong>显示/修改内嵌带时间戳歌词 `[mm:ss.xx]`，可导入纯文本并自动打标。</p>
                <p>• <strong>右侧模拟手机区：</strong>直观预览手机播放界面，可直接点击文字编辑信息，歌词随播放自然流畅滚动。</p>
                <p>• <strong>下方频谱区：</strong>高精度音量波形，支持滚轮以鼠标为中心缩放，鼠标拖拽紫色标记直接修改歌词时间戳！</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <p className="font-bold text-amber-400">2. 快捷键与操作技巧</p>
                <p>• <strong>鼠标悬停频谱 + 空格键：</strong>快捷播放/暂停音频。</p>
                <p>• <strong>点击“打打标”按钮：</strong>把当前播放进度精准写入选中的歌词行，并自动跳至下一行。</p>
                <p>• <strong>直接拖拽文件：</strong>支持把 MP3/LRC/TXT 文件拖入页面任意区域打开。</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg transition"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
