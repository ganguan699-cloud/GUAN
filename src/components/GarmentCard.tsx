import React from 'react';
import { Garment } from '../types';
import { Eye, ShieldAlert, Video } from 'lucide-react';

interface GarmentCardProps {
  key?: string;
  garment: Garment;
  onSelect: (garment: Garment) => void;
  selectedVideoLog: string | null;
  onSelectVideoLog: (videoLog: string | null) => void;
  layoutMode?: 'list' | 'grid';
  imageFit?: 'cover' | 'contain';
  imagePadding?: number;
}

export default function GarmentCard({
  garment,
  onSelect,
  selectedVideoLog,
  onSelectVideoLog,
  layoutMode = 'list',
  imageFit = 'cover',
  imagePadding = 0,
}: GarmentCardProps) {
  const isActive = garment.status === 'Active';

  if (layoutMode === 'grid') {
    return (
      <div 
        onClick={() => onSelect(garment)}
        className="group bg-white border border-[#EAE6DF] rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-[#B3A596] hover:shadow-xs cursor-pointer"
        id={`garment-card-${garment.id}`}
      >
        {/* Thumbnail Area with dynamic padding matching user adjustments */}
        <div 
          className="relative aspect-square w-full overflow-hidden bg-[#FAF8F5] flex items-center justify-center transition-all duration-300"
          style={{ padding: `${imagePadding}px` }}
        >
          <img
            src={garment.image}
            alt={garment.name}
            className={`w-full h-full transition-transform duration-500 group-hover:scale-103 ${
              imageFit === 'contain' ? 'object-contain' : 'object-cover'
            }`}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = `https://picsum.photos/seed/${garment.code}/600/800`;
            }}
          />
        </div>

        {/* Mini Label underneath to retain functional catalog clarity */}
        <div className="px-2 py-1.5 text-center bg-white border-t border-[#FAF8F5] flex flex-col gap-0.5">
          <span className="text-[8px] font-mono text-[#8C867E] tracking-wider uppercase">
            {garment.category}
          </span>
          <p className="text-[10px] font-mono font-bold text-[#2A2724] truncate tracking-tight uppercase" title={garment.code}>
            {garment.code}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="group bg-white border border-[#EAE6DF] rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-[#B3A596] hover:shadow-sm"
      id={`garment-card-${garment.id}`}
    >
      {/* High-fidelity Image Gallery Area */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#FAF8F5] flex items-center justify-center">
        {/* Subtle Warm Gradient on Card */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2A2724]/5 via-transparent to-transparent opacity-60 z-10 pointer-events-none" />

        {/* Full Image */}
        <img
          src={garment.image}
          alt={garment.name}
          className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-103"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Fallback if image fails to load
            e.currentTarget.src = `https://picsum.photos/seed/${garment.code}/600/800`;
          }}
        />

        {/* Hover View specs overlay */}
        <div 
          onClick={() => onSelect(garment)}
          className="absolute inset-0 bg-[#2A2724]/20 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-20 cursor-pointer"
        >
          <button className="flex items-center gap-2 px-4 py-2 bg-white text-[#2A2724] font-sans font-medium text-xs tracking-tight rounded-full hover:bg-[#FAF8F5] transition-all duration-200 shadow-md">
            <Eye size={12} className="text-[#8C867E]" />
            查看服装规格
          </button>
        </div>
      </div>

      {/* Card Information Area */}
      <div className="p-4 flex-grow flex flex-col justify-between bg-white">
        <div className="mb-2">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="font-sans text-[10px] font-medium text-[#8C867E]">
              {garment.category && garment.category !== '无' ? garment.category : ''}
            </span>
            <span className="font-mono text-[9px] text-[#8C867E]">
              {garment.weight}
            </span>
          </div>
          
          <h3 
            onClick={() => onSelect(garment)}
            className="font-mono font-bold text-sm text-[#2A2724] hover:text-[#B3A596] transition-colors cursor-pointer truncate tracking-tight"
            title={garment.code}
          >
            {garment.code}
          </h3>
          
          <p className="text-[11px] text-[#8C867E] line-clamp-2 mt-1 font-sans leading-relaxed font-light">
            {garment.details}
          </p>
        </div>

        {/* 视频联动看板 (Interlinking Video Dashboard) */}
        <div className="border-t border-[#FAF8F5] pt-3 mt-1.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-medium text-[#8C867E] flex items-center gap-1">
              <Video size={10} className="text-[#B3A596]" />
              出镜历史节目 ({garment.videoLogs.length})
            </span>
            {selectedVideoLog && garment.videoLogs.includes(selectedVideoLog) && (
              <span className="font-mono text-[8px] text-[#B3A596] font-bold">
                MATCHED
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1 max-h-[58px] overflow-y-auto custom-scrollbar">
            {garment.videoLogs.map((log) => {
              const isHighlighted = selectedVideoLog === log;
              return (
                <button
                  key={log}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectVideoLog(isHighlighted ? null : log);
                  }}
                  className={`text-[9px] px-2.5 py-1 rounded-full transition-all duration-200 text-left flex items-center gap-1 ${
                    isHighlighted
                      ? 'bg-[#2A2724] text-white font-medium border border-[#2A2724]'
                      : 'bg-[#FAF8F5] text-[#8C867E] border border-[#EAE6DF] hover:border-[#B3A596] hover:text-[#2A2724]'
                  }`}
                  title="点击以此播送剧集过滤服装"
                >
                  <span>{log}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
