import { Garment } from '../types';
import { Shield, Box, Tv, Activity, Percent } from 'lucide-react';

interface ArchiveStatsProps {
  garments: Garment[];
}

export default function ArchiveStats({ garments }: ArchiveStatsProps) {
  const total = garments.length;
  const activeCount = garments.filter((g) => g.status === 'Active').length;
  const archivedCount = garments.filter((g) => g.status === 'Archived').length;
  const activePercent = total > 0 ? Math.round((activeCount / total) * 100) : 0;

  // Unique video logs
  const totalVideoAppearances = garments.reduce((acc, g) => acc + g.videoLogs.length, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Total Inventory */}
      <div className="bg-white border border-[#EAE6DF] p-4 rounded-xl relative overflow-hidden group hover:border-[#B3A596] transition-all duration-300 shadow-xs">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-[#8C867E]">
          <Box size={36} />
        </div>
        <div className="font-mono text-[9px] text-[#8C867E] tracking-widest uppercase mb-1">
          智能库 // 服装总数
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold text-[#2A2724] tracking-tight">
            {String(total).padStart(3, '0')}
          </span>
          <span className="font-mono text-[9px] text-[#2A2724] px-1.5 py-0.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded">
            正常同步
          </span>
        </div>
        <div className="mt-2 font-mono text-[10px] text-[#8C867E] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B3A596]" />
          本地货架数据已在线
        </div>
      </div>

      {/* Active Ratio */}
      <div className="bg-white border border-[#EAE6DF] p-4 rounded-xl relative overflow-hidden group hover:border-[#B3A596] transition-all duration-300 shadow-xs">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-[#8C867E]">
          <Percent size={36} />
        </div>
        <div className="font-mono text-[9px] text-[#8C867E] tracking-widest uppercase mb-1">
          智能库 // 启用比例
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold text-[#2A2724] tracking-tight">
            {activePercent}%
          </span>
          <span className="font-mono text-[9px] text-[#8C867E]">
            ({activeCount}/{total})
          </span>
        </div>
        <div className="mt-2 font-mono text-[10px] text-[#8C867E] flex items-center gap-1">
          <Activity size={10} className="text-[#8C867E]" />
          货区衣服周转正常
        </div>
      </div>

      {/* Video Appearances */}
      <div className="bg-white border border-[#EAE6DF] p-4 rounded-xl relative overflow-hidden group hover:border-[#B3A596] transition-all duration-300 shadow-xs">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-[#8C867E]">
          <Tv size={36} />
        </div>
        <div className="font-mono text-[9px] text-[#8C867E] tracking-widest uppercase mb-1">
          智能库 // 联动播送
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold text-[#2A2724] tracking-tight">
            {String(totalVideoAppearances).padStart(3, '0')}
          </span>
          <span className="font-mono text-[9px] text-[#8C867E]">
            登场次数
          </span>
        </div>
        <div className="mt-2 font-mono text-[10px] text-[#8C867E] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-[#B3A596] rounded-full animate-pulse" />
          多对多反索引就绪
        </div>
      </div>

      {/* Archived / Locked */}
      <div className="bg-white border border-[#EAE6DF] p-4 rounded-xl relative overflow-hidden group hover:border-[#B3A596] transition-all duration-300 shadow-xs">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-[#8C867E]">
          <Shield size={36} />
        </div>
        <div className="font-mono text-[9px] text-[#8C867E] tracking-widest uppercase mb-1">
          智能库 // 归档数量
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold text-[#8C867E] tracking-tight">
            {String(archivedCount).padStart(3, '0')}
          </span>
          <span className="font-mono text-[9px] text-[#8C867E] px-1.5 py-0.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded">
            冻结保留
          </span>
        </div>
        <div className="mt-2 font-mono text-[10px] text-[#8C867E] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EAE6DF]" />
          历史纪录防窜写
        </div>
      </div>
    </div>
  );
}
