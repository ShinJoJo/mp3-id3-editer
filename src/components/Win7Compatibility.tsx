import React from 'react';
import { win7CompatibilityChecks } from '../data/cppTemplates';
import { ShieldCheck, AlertTriangle, Info, Wrench } from 'lucide-react';

export const Win7Compatibility: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Windows 7 64位 离线系统 C++ 部署避坑清单
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            针对离线无网络、无补丁更新的特殊环境，静态编译需要注意以下关键因素：
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {win7CompatibilityChecks.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 transition hover:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.status === 'critical' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : item.status === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                ) : (
                  <Info className="w-4 h-4 text-sky-400" />
                )}
                <h4 className="text-sm font-semibold text-slate-200">{item.title}</h4>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                  item.status === 'critical'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : item.status === 'warning'
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                }`}
              >
                {item.status === 'critical'
                  ? '核心要点'
                  : item.status === 'warning'
                  ? '注意排查'
                  : '配置建议'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>

            <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2 text-xs text-emerald-300/90">
              <Wrench className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong>解决方案：</strong> {item.solution}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
