import React from 'react';
import { Cpu, HelpCircle, HardDrive, ShieldAlert, CpuIcon, CheckCircle2, Wrench } from 'lucide-react';

export const CompilerGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Answer Box */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 text-amber-200">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold text-amber-300 text-base">
              关于能否直接提供预编译可执行文件 (.exe) 下载的说明：
            </h3>
            <p className="text-sm text-amber-200/90 leading-relaxed">
              根据 Web 沙盒安全限制与跨平台二进制规范，AI 无法直接在云端容器内为你编译生成可疑的二进制 Windows 可执行文件并提供给浏览器直接下载运行。
            </p>
            <p className="text-sm text-amber-200/90 leading-relaxed">
              <strong>不过请不用担心！</strong> 我们已为你准备好了完整且支持静态编译的 <strong>C++ 原生源代码、CMake 项目文件 以及 一键编译脚本 (.bat)</strong>。你只需在一台联网的 Windows 电脑上双击该脚本，即可在 3 秒内本地生成纯静态链接、绝无依赖的单个 <code className="bg-amber-950/60 px-1.5 py-0.5 rounded text-amber-300">.exe</code>，随后用 U 盘拷贝至离线 Win7 64 位机器上直接双击运行！
            </p>
          </div>
        </div>
      </div>

      {/* Compiler Step Workflow */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-sky-400" />
          Windows 7 离线 C++ 静态编译 3 步走路线图
        </h3>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-2">
            <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-sm border border-sky-500/30">
              1
            </div>
            <h4 className="font-semibold text-slate-200 text-sm">下载源码与批处理脚本</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              在左侧选择你需要的 C++ 模板（如 Win32 原生 GUI 或 控制台批处理），点击“打包源码与脚本”按钮，下载包含 <code className="text-sky-300">main.cpp</code> 与 <code className="text-sky-300">build.bat</code> 的压缩文件。
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-2">
            <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-sm border border-sky-500/30">
              2
            </div>
            <h4 className="font-semibold text-slate-200 text-sm">在一台 Windows 电脑上静态编译</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              双击 <code className="text-sky-300">build.bat</code>，MinGW-w64 编译器将自动进行静态打包链接，将 C/C++ 运行库嵌入到软件内部，生成独立 <code className="text-sky-300">Win7OfflineApp.exe</code>。
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-2">
            <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-sm border border-sky-500/30">
              3
            </div>
            <h4 className="font-semibold text-slate-200 text-sm">U盘拷贝至 Win7 离线机</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              将生成的单个 <code className="text-sky-300">.exe</code> 拷入 U 盘，插到离线 Windows 7 64位机器上，无须安装 VC++ 运行库或 .NET，即可毫秒级双击启动！
            </p>
          </div>
        </div>
      </div>

      {/* Compiler Software Requirement Detail */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-sky-400" />
          编译时所用电脑需要安装的特定软件 (二选一即可)
        </h3>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Option 1: MinGW-w64 */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-bold text-sky-400 text-base">方案一：MinGW-w64 (推荐，最轻量)</h4>
              <span className="text-[11px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20 font-medium">体积约 50MB</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              只需安装 MinGW-w64 (GCC for Windows)，支持一键解压并配置环境变量。
            </p>
            <div className="space-y-2 text-xs text-slate-400">
              <p><strong>1. 下载：</strong>可在 SourceForge / GitHub 搜索 <code className="text-slate-200 bg-slate-900 px-1 py-0.5 rounded">x86_64-w64-mingw32</code> 或使用 w64devkit。</p>
              <p><strong>2. 配置 PATH：</strong>把 MinGW 的 <code className="text-slate-200 bg-slate-900 px-1 py-0.5 rounded">bin</code> 目录（内含 <code className="text-slate-200 bg-slate-900 px-1 py-0.5 rounded">g++.exe</code>）添加到系统环境变量 PATH 中。</p>
              <p><strong>3. 使用：</strong>直接双击我们为你下载的 <code className="text-sky-300">build.bat</code>，即刻完成编译打包！</p>
            </div>
          </div>

          {/* Option 2: Visual Studio */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-bold text-emerald-400 text-base">方案二：Visual Studio (全功能 IDE)</h4>
              <span className="text-[11px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">适合 VS 开发者</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              如果编译机上安装了 Visual Studio 2015 / 2017 / 2019 / 2022：
            </p>
            <div className="space-y-2 text-xs text-slate-400">
              <p><strong>1. 工作区组件：</strong>安装时只需勾选 <strong>“使用 C++ 的桌面开发” (Desktop development with C++)</strong>。</p>
              <p><strong>2. 关键属性设置：</strong>在 VS 项目属性 -&gt; C/C++ -&gt; 代码生成 (Code Generation) 中，将“运行库”改为 <strong>多线程 /MT (Multi-threaded /MT)</strong>。</p>
              <p><strong>3. 生成：</strong>选择 Release x64，编译出的 <code className="text-emerald-300">.exe</code> 即为纯静态可执行文件。</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compiler Flag Deep Dive */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-emerald-400" />
          为什么 C++ 是离线 Win7 的最优选？
        </h3>
        <ul className="space-y-3 text-sm text-slate-300">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>零运行时依赖：</strong> Python 需要安装 Python 解释器环境，C# 需要安装特定版本的 .NET Framework，而 C++ 经过静态编译（Static Link）后，直接翻译为底层 CPU 指令集，离线 Win7 上没有任何附加包要求。
            </div>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>兼容性极强：</strong> Win32 API 从 Windows 95 一直沿用至 Windows 11，API 调用在 Win7 SP1 上完美无缝运行。
            </div>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>占用资源微乎其微：</strong> 程序文件往往只有 100KB~2MB，RAM 占用几兆到几十兆，适合老旧离线工控机或办公电脑。
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};
