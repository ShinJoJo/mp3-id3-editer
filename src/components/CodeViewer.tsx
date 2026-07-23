import React, { useState } from 'react';
import { CppTemplate } from '../types';
import { Copy, Download, Check, Code, FileText, Terminal } from 'lucide-react';

interface Props {
  template: CppTemplate;
}

export const CodeViewer: React.FC<Props> = ({ template }) => {
  const [activeTab, setActiveTab] = useState<'cpp' | 'cmake' | 'mingw' | 'msvc'>('cpp');
  const [copied, setCopied] = useState(false);

  const getCurrentText = () => {
    switch (activeTab) {
      case 'cpp':
        return template.cppCode;
      case 'cmake':
        return template.cmakeCode;
      case 'mingw':
        return template.mingwCommand;
      case 'msvc':
        return template.msvcInstructions.join('\n');
      default:
        return '';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPackage = () => {
    // 1. Download main.cpp
    handleDownload(template.cppCode, 'main.cpp');
    
    // 2. Download build.bat
    const batContent = `@echo off
echo ===========================================
echo Windows 7 Offline C++ Static Build Script
echo ===========================================
echo Building ${template.name}...
${template.mingwCommand}
if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Build succeeded! Output: Win7OfflineApp.exe
    echo You can copy this .exe file to your offline Win7 64-bit PC directly.
) else (
    echo.
    echo [ERROR] Compilation failed. Please check if MinGW-w64 is installed.
)
pause
`;
    setTimeout(() => {
      handleDownload(batContent, 'build_static_win7.bat');
    }, 300);

    // 3. Download CMakeLists.txt
    setTimeout(() => {
      handleDownload(template.cmakeCode, 'CMakeLists.txt');
    }, 600);
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Code Viewer Header */}
      <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('cpp')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'cpp'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Code className="w-4 h-4" />
            main.cpp (源代码)
          </button>

          <button
            onClick={() => setActiveTab('cmake')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'cmake'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            CMakeLists.txt
          </button>

          <button
            onClick={() => setActiveTab('mingw')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'mingw'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            MinGW 静态编译命令
          </button>

          <button
            onClick={() => setActiveTab('msvc')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'msvc'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Visual Studio /MT 配置
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1.5 border border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">已复制!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                复制代码
              </>
            )}
          </button>

          <button
            onClick={handleDownloadPackage}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-md shadow-sky-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            打包打包源码与脚本 (.bat / .cpp)
          </button>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="p-4 overflow-x-auto max-h-[500px]">
        {activeTab === 'msvc' ? (
          <div className="space-y-3 p-2">
            <h4 className="text-sm font-semibold text-sky-400">Visual Studio 静态编译 (/MT) 配置指南:</h4>
            <ol className="space-y-2 list-decimal list-inside text-sm text-slate-300 leading-relaxed">
              {template.msvcInstructions.map((step, idx) => (
                <li key={idx} className="bg-slate-800/60 p-2.5 rounded border border-slate-800">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <pre className="font-mono text-xs sm:text-sm text-emerald-300/90 leading-relaxed whitespace-pre">
            {getCurrentText()}
          </pre>
        )}
      </div>
    </div>
  );
};
