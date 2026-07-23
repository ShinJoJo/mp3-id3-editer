import React, { useRef } from 'react';
import { ID3Metadata } from '../types';
import { Music, User, Disc, Calendar, Tag, Hash, FileCode, Upload, Trash2, Image as ImageIcon, Sparkles } from 'lucide-react';

interface Props {
  metadata: ID3Metadata;
  onChange: (updated: ID3Metadata) => void;
}

export const MetadataEditor: React.FC<Props> = ({ metadata, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFieldChange = (field: keyof ID3Metadata, value: string) => {
    onChange({
      ...metadata,
      [field]: value,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      const blob = new Blob([buffer], { type: file.type });
      const coverUrl = URL.createObjectURL(blob);

      onChange({
        ...metadata,
        coverUrl,
        coverBuffer: buffer,
        coverMime: file.type || 'image/jpeg',
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const handleRemoveCover = () => {
    onChange({
      ...metadata,
      coverUrl: undefined,
      coverBuffer: undefined,
      coverMime: undefined,
    });
  };

  const handleGenerateCover = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate stylish gradient cover
    const colors = [
      ['#0284c7', '#6366f1'],
      ['#ec4899', '#8b5cf6'],
      ['#059669', '#10b981'],
      ['#f59e0b', '#d97706'],
    ];
    const pair = colors[Math.floor(Math.random() * colors.length)];

    const grad = ctx.createLinearGradient(0, 0, 400, 400);
    grad.addColorStop(0, pair[0]);
    grad.addColorStop(1, pair[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 400);

    // Add geometric overlay
    ctx.beginPath();
    ctx.arc(200, 200, 120, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fill();

    // Text overlay
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(metadata.title || 'Music Track', 200, 190);
    ctx.font = '20px sans-serif';
    ctx.fillText(metadata.artist || 'Artist Name', 200, 230);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    fetch(dataUrl)
      .then((res) => res.blob())
      .then((blob) => blob.arrayBuffer())
      .then((buffer) => {
        onChange({
          ...metadata,
          coverUrl: dataUrl,
          coverBuffer: buffer,
          coverMime: 'image/jpeg',
        });
      });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 h-full shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Music className="w-4 h-4 text-sky-400" />
          ID3 v2.3 元数据编辑 (元数据区)
        </h2>
        <span className="text-[11px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded font-mono">
          Unicode (UTF-8/16)
        </span>
      </div>

      {/* Cover Art Box */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
        <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-slate-800 border border-slate-700/80 shrink-0 group shadow-md">
          {metadata.coverUrl ? (
            <img src={metadata.coverUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-1">
              <ImageIcon className="w-8 h-8" />
              <span className="text-[10px]">无专辑封面</span>
            </div>
          )}

          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs rounded transition flex items-center gap-1"
            >
              <Upload className="w-3 h-3" /> 更换封面
            </button>
            {metadata.coverUrl && (
              <button
                type="button"
                onClick={handleRemoveCover}
                className="px-2 py-1 bg-rose-600/80 hover:bg-rose-600 text-white text-xs rounded transition flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> 移除
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleImageUpload}
        />

        <div className="flex-1 space-y-2 text-xs">
          <div className="text-slate-300 font-medium">专辑封面图像 (`APIC`)</div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            支持导入 JPG/PNG 封面。内嵌至 ID3v2.3 标签后，主流播放器与车载设备均可读取。
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition border border-slate-700 flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-sky-400" /> 选择图片文件
            </button>
            <button
              type="button"
              onClick={handleGenerateCover}
              className="px-2.5 py-1.5 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs transition border border-indigo-500/30 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> 智能生成封面
            </button>
          </div>
        </div>
      </div>

      {/* Form Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto pr-1">
        {/* Song Title (TIT2) */}
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-sky-400" /> 歌曲名称 (`TIT2`):
          </label>
          <input
            type="text"
            value={metadata.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="例如: 星海飞驰"
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg px-3 py-2 text-xs text-slate-100 transition outline-none"
          />
        </div>

        {/* Artist (TPE1) */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-sky-400" /> 歌手 / 艺术家 (`TPE1`):
          </label>
          <input
            type="text"
            value={metadata.artist}
            onChange={(e) => handleFieldChange('artist', e.target.value)}
            placeholder="例如: 声波乐团"
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg px-3 py-2 text-xs text-slate-100 transition outline-none"
          />
        </div>

        {/* Album (TALB) */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Disc className="w-3.5 h-3.5 text-sky-400" /> 所属专辑 (`TALB`):
          </label>
          <input
            type="text"
            value={metadata.album}
            onChange={(e) => handleFieldChange('album', e.target.value)}
            placeholder="例如: 未来音轨 Vol.1"
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg px-3 py-2 text-xs text-slate-100 transition outline-none"
          />
        </div>

        {/* Release Year (TYER) */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-sky-400" /> 发行年份 (`TYER`):
          </label>
          <input
            type="text"
            value={metadata.year}
            onChange={(e) => handleFieldChange('year', e.target.value)}
            placeholder="例如: 2026"
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg px-3 py-2 text-xs text-slate-100 transition outline-none"
          />
        </div>

        {/* Genre (TCON) */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-sky-400" /> 流派 (`TCON`):
          </label>
          <input
            type="text"
            value={metadata.genre}
            onChange={(e) => handleFieldChange('genre', e.target.value)}
            placeholder="例如: Pop / Synthwave"
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg px-3 py-2 text-xs text-slate-100 transition outline-none"
          />
        </div>

        {/* Track Number (TRCK) */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-sky-400" /> 音轨序号 (`TRCK`):
          </label>
          <input
            type="text"
            value={metadata.trackNumber}
            onChange={(e) => handleFieldChange('trackNumber', e.target.value)}
            placeholder="例如: 1"
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg px-3 py-2 text-xs text-slate-100 transition outline-none"
          />
        </div>

        {/* Composer (TCOM) */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-sky-400" /> 作曲家 (`TCOM`):
          </label>
          <input
            type="text"
            value={metadata.composer}
            onChange={(e) => handleFieldChange('composer', e.target.value)}
            placeholder="例如: 作曲家姓名"
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg px-3 py-2 text-xs text-slate-100 transition outline-none"
          />
        </div>
      </div>
    </div>
  );
};
