import { Garment } from '../types';
import { 
  X, 
  CheckSquare, 
  Edit3, 
  Trash2, 
  Plus, 
  Sparkles,
  Link2,
  Tv,
} from 'lucide-react';
import { useEffect, useRef, useState, useMemo, FormEvent } from 'react';

interface GarmentDetailModalProps {
  garment: Garment;
  allGarments: Garment[];
  onUpdateGarment: (updated: Garment) => void;
  onSelectGarment: (garment: Garment) => void;
  onClose: () => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (garment: Garment) => void;
  selectedVideoLog: string | null;
  onSelectVideoLog: (videoLog: string | null) => void;
  categories: string[];
  isReadOnly?: boolean;
}

export default function GarmentDetailModal({
  garment,
  allGarments,
  onUpdateGarment,
  onSelectGarment,
  onClose,
  onToggleStatus,
  onDelete,
  onEdit,
  selectedVideoLog,
  onSelectVideoLog,
  categories,
  isReadOnly = false,
}: GarmentDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // States for self-editing features
  const [newTag, setNewTag] = useState('');
  const [newVideoInput, setNewVideoInput] = useState('');
  const [isMatchingSelectorOpen, setIsMatchingSelectorOpen] = useState(false);
  const [matchingSearchQuery, setMatchingSearchQuery] = useState('');
  const [selectedModalImage, setSelectedModalImage] = useState(garment.image);

  // Sync selected modal image when garment changes
  useEffect(() => {
    setSelectedModalImage(garment.image);
  }, [garment]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isActive = garment.status === 'Active';

  // Find currently matched/recommended garments
  const matchedGarments = useMemo(() => {
    const ids = garment.matchedGarmentIds || [];
    return allGarments.filter(g => ids.includes(g.id));
  }, [garment.matchedGarmentIds, allGarments]);

  // Candidates for outfit recommendations (excluding current garment itself)
  const matchingCandidates = useMemo(() => {
    return allGarments.filter(g => g.id !== garment.id);
  }, [allGarments, garment.id]);

  // Filter candidates by search query
  const filteredCandidates = useMemo(() => {
    if (!matchingSearchQuery) return matchingCandidates;
    const query = matchingSearchQuery.toLowerCase();
    return matchingCandidates.filter(g => 
      g.name.toLowerCase().includes(query) || 
      g.code.toLowerCase().includes(query) ||
      g.category.toLowerCase().includes(query)
    );
  }, [matchingCandidates, matchingSearchQuery]);

  // --- Handlers for Custom Self-Adding/Editing ---

  // 1. Add functional tag
  const handleAddTag = (e: FormEvent) => {
    e.preventDefault();
    const tag = newTag.trim();
    if (!tag) return;
    
    if (!garment.functionality.includes(tag)) {
      const updated: Garment = {
        ...garment,
        functionality: [...garment.functionality, tag]
      };
      onUpdateGarment(updated);
    }
    setNewTag('');
  };

  // 2. Remove functional tag
  const handleRemoveTag = (tagToRemove: string) => {
    const updated: Garment = {
      ...garment,
      functionality: garment.functionality.filter(t => t !== tagToRemove)
    };
    onUpdateGarment(updated);
  };

  // 3. Add video log association (custom manual entry)
  const handleAddVideo = (e: FormEvent) => {
    e.preventDefault();
    const video = newVideoInput.trim();
    if (!video) return;

    const formattedVideo = video.startsWith('🎬') ? video : `🎬 ${video}`;

    if (!garment.videoLogs.includes(formattedVideo)) {
      const updated: Garment = {
        ...garment,
        videoLogs: [...garment.videoLogs, formattedVideo]
      };
      onUpdateGarment(updated);
    }
    setNewVideoInput('');
  };

  // 4. Remove video log association
  const handleRemoveVideo = (videoToRemove: string) => {
    const updated: Garment = {
      ...garment,
      videoLogs: garment.videoLogs.filter(v => v !== videoToRemove)
    };
    onUpdateGarment(updated);
  };

  // 5. Toggle garment association for recommendations
  const handleToggleAssociation = (targetId: string) => {
    const currentIds = garment.matchedGarmentIds || [];
    let updatedIds: string[];
    
    if (currentIds.includes(targetId)) {
      updatedIds = currentIds.filter(id => id !== targetId);
    } else {
      updatedIds = [...currentIds, targetId];
    }

    const updated: Garment = {
      ...garment,
      matchedGarmentIds: updatedIds
    };
    onUpdateGarment(updated);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs overflow-hidden cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Centered clean modal block */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-2xl h-[calc(100dvh-1rem)] md:h-auto bg-white border border-[#EAE6DF] rounded-2xl overflow-hidden my-0 md:my-8 shadow-2xl text-[#2A2724] animate-fade-in flex flex-col max-h-[calc(100dvh-1rem)] md:max-h-[85vh] cursor-default"
        id={`garment-detail-modal-${garment.id}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE6DF] bg-white sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#8C867E] tracking-wider uppercase">
              规格书
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#EAE6DF]">
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#B3A596]' : 'bg-[#EAE6DF]'}`} />
              <span className="font-mono text-[9px] font-semibold text-[#2A2724] tracking-wider">
                {garment.status === 'Active' ? '使用中' : '已归档'}
              </span>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="text-[#8C867E] hover:text-[#2A2724] p-1.5 hover:bg-[#FAF8F5] rounded-full transition-colors flex items-center justify-center border border-[#EAE6DF]/40"
            title="关闭规格表"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden min-h-0">
          
          {/* LEFT COLUMN: Image Showcase (Sticky on desktop, top on mobile) */}
          <div className="w-full h-[32dvh] md:h-auto md:w-[240px] lg:w-[280px] shrink-0 border-b md:border-b-0 md:border-r border-[#EAE6DF] bg-[#FAF8F5]/30 p-4 md:p-5 flex flex-col items-center justify-start gap-3 md:gap-4 overflow-hidden md:overflow-y-auto">
            <div className="relative w-full h-full md:h-auto md:aspect-[3/4] rounded-xl overflow-hidden border border-[#EAE6DF] bg-white shadow-3xs flex items-center justify-center p-2">
              <img 
                src={selectedModalImage} 
                alt={garment.code} 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = `https://picsum.photos/seed/${garment.code}/600/800`;
                }}
              />
            </div>
            
            {/* Multiple Images Thumbnails Indicator */}
            {garment.images && garment.images.length > 1 && (
              <div className="w-full text-center">
                <span className="block font-mono text-[8px] text-[#8C867E] tracking-widest uppercase mb-1.5 font-bold">外观多图切换 ({garment.images.length})</span>
                <div className="flex flex-wrap justify-center gap-1.5 max-h-[80px] overflow-y-auto pr-1">
                  {garment.images.map((imgSrc, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedModalImage(imgSrc)}
                      className={`relative w-10 h-13 rounded-md overflow-hidden border transition-all ${
                        selectedModalImage === imgSrc ? 'border-[#B3A596] ring-1 ring-[#B3A596] scale-102 shadow-3xs' : 'border-[#EAE6DF] opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={imgSrc} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Info, Specs, Actions (Scrollable) */}
          <div className="flex-grow overflow-y-auto flex flex-col justify-between min-h-0">
            <div>
              {/* Header Title Block */}
              <div className="p-5 border-b border-[#EAE6DF] bg-[#FAF8F5]/50 flex justify-between items-center gap-4">
                <div>
                  <span className="font-mono text-[9px] text-[#B3A596] tracking-widest uppercase font-bold block mb-0.5">
                    TECHNOLOGY & OUTFIT SPECIFICATION
                  </span>
                  <h1 className="font-display text-xl font-semibold text-[#2A2724] tracking-tight">
                    {garment.code}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#8C867E] font-mono">
                    <span>类别:</span>
                    <select
                      value={garment.category || '无'}
                      onChange={(e) => {
                        const updated: Garment = {
                          ...garment,
                          category: e.target.value
                        };
                        onUpdateGarment(updated);
                      }}
                      className="bg-[#FAF8F5] hover:bg-[#FAF8F5]/80 border border-[#EAE6DF] hover:border-[#B3A596] text-[#2A2724] rounded-md px-2 py-0.5 text-[11px] font-sans focus:outline-hidden transition-colors cursor-pointer"
                    >
                      <option value="无">无</option>
                      {categories.filter(c => c !== '无' && c !== 'All').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Core Content: Only Tags, Videos, and Outfit Pairings */}
              <div className="p-5 space-y-6 bg-white flex-grow">
            
            {/* 1. 特征标签 */}
            <div className="space-y-3">
              <h3 className="font-mono text-xs font-bold text-[#2A2724] tracking-widest uppercase border-b border-[#EAE6DF] pb-2 flex items-center gap-2">
                <Sparkles size={14} className="text-[#B3A596]" />
                1. 特征性能标签
              </h3>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {garment.functionality.map((func) => (
                  <span 
                    key={func}
                    className="font-mono text-[10px] px-2.5 py-1.5 rounded-full bg-[#FAF8F5] border border-[#EAE6DF] text-[#2A2724] flex items-center gap-1.5 animate-fade-in"
                  >
                    <CheckSquare size={10} className="text-[#B3A596] shrink-0" />
                    <span>{func}</span>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(func)}
                        className="ml-1 text-zinc-400 hover:text-red-500 scale-95 p-0.5 transition-colors shrink-0"
                        title="删除标签"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </span>
                ))}
                {/* Inline tag creator */}
                {!isReadOnly && (
                  <form onSubmit={handleAddTag} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="＋ 新增标签"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="font-sans text-[10px] px-3 py-1.5 rounded-full bg-white border border-dashed border-[#EAE6DF] hover:border-[#B3A596] focus:border-[#B3A596] focus:outline-hidden text-[#2A2724] w-[95px] transition-all"
                    />
                    {newTag.trim() && (
                      <button
                        type="submit"
                        className="p-1 rounded-full bg-[#2A2724] text-white hover:bg-[#4E4237]"
                      >
                        <Plus size={10} />
                      </button>
                    )}
                  </form>
                )}
              </div>
            </div>

            {/* 2. 出镜记录 */}
            <div className="space-y-3">
              <h3 className="font-mono text-xs font-bold text-[#2A2724] tracking-widest uppercase border-b border-[#EAE6DF] pb-2 flex items-center gap-2">
                <Tv size={14} className="text-[#B3A596]" />
                2. 出镜视频记录 ({garment.videoLogs.length})
              </h3>
              
              {garment.videoLogs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {garment.videoLogs.map((log) => {
                    const isHighlighted = selectedVideoLog === log;
                    return (
                      <div
                        key={log}
                        className={`flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 font-mono text-[11px] uppercase border ${
                          isHighlighted 
                            ? 'bg-[#2A2724] border-[#2A2724] text-white font-bold shadow-xs' 
                            : 'bg-[#FAF8F5] border-[#EAE6DF] text-[#8C867E] hover:border-[#B3A596] hover:text-[#2A2724]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onSelectVideoLog(isHighlighted ? null : log);
                          }}
                          className="flex-grow text-left truncate font-mono text-[10px]"
                          title="在主面板高亮筛选关联此视频的所有服装"
                        >
                          {log}
                        </button>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVideo(log)}
                            className="text-zinc-400 hover:text-red-500 p-1 transition-colors rounded ml-1 shrink-0"
                            title="解除视频关联"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="font-mono text-[10px] text-[#8C867E] italic bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE6DF]/40">暂无与此服装链接的视频播送记录。</p>
              )}

              {!isReadOnly && (
                <form onSubmit={handleAddVideo} className="bg-[#FAF8F5] p-2 rounded-xl border border-[#EAE6DF] flex gap-2 items-center max-w-md">
                  <input
                    type="text"
                    placeholder="手动输入关联播送期数 (例如: 第52期)"
                    value={newVideoInput}
                    onChange={(e) => setNewVideoInput(e.target.value)}
                    className="bg-white border border-[#EAE6DF] rounded-lg text-[10px] px-2.5 py-1.5 focus:outline-hidden focus:border-[#B3A596] text-[#2A2724] flex-1 font-sans"
                  />
                  <button
                    type="submit"
                    disabled={!newVideoInput.trim()}
                    className="py-1.5 px-3.5 bg-[#2A2724] text-white hover:bg-[#4E4237] disabled:bg-zinc-300 disabled:text-zinc-400 text-[10px] font-mono tracking-wider font-semibold rounded-lg transition-colors shrink-0"
                  >
                    ＋ 关联
                  </button>
                </form>
              )}
            </div>

            {/* 3. 服装搭配 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-2">
                <h3 className="font-mono text-xs font-bold text-[#2A2724] tracking-widest uppercase flex items-center gap-2">
                  <Sparkles size={14} className="text-[#B3A596]" />
                  3. 搭配推荐款式 ({matchedGarments.length})
                </h3>
                
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setIsMatchingSelectorOpen(!isMatchingSelectorOpen)}
                    className="text-[10px] font-mono text-[#B3A596] hover:text-[#2A2724] flex items-center gap-1 border-b border-[#B3A596]/30 hover:border-[#2A2724] transition-all pb-0.5"
                  >
                    {isMatchingSelectorOpen ? '收起关联面板' : '＋ 自由关联推荐搭配'}
                  </button>
                )}
              </div>

              {/* Match recommendation cards with pictures */}
              {matchedGarments.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {matchedGarments.map((matchedItem) => (
                    <div 
                      key={matchedItem.id}
                      className="group relative bg-white border border-[#EAE6DF] rounded-xl overflow-hidden shadow-3xs hover:border-[#B3A596] hover:shadow-2xs transition-all duration-200 cursor-pointer flex flex-col"
                      onClick={() => onSelectGarment(matchedItem)}
                      title={`点击切换查看: ${matchedItem.name}`}
                    >
                      <div className="aspect-square bg-[#FAF8F5] overflow-hidden relative">
                        <img 
                          src={matchedItem.image} 
                          alt={matchedItem.name} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = `https://picsum.photos/seed/${matchedItem.code}/600/800`;
                          }}
                        />
                        <div className="absolute top-1 left-1 font-mono text-[8px] bg-white/95 px-1 rounded border border-[#EAE6DF] scale-90 font-bold">
                          {matchedItem.code}
                        </div>
                      </div>
                      <div className="p-2 flex-grow flex flex-col justify-between">
                        <div className="text-[10px] font-medium text-[#2A2724] line-clamp-1 leading-tight">
                          {matchedItem.name}
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          {matchedItem.category && matchedItem.category !== '无' && (
                            <span className="text-[8px] text-[#8C867E] bg-[#FAF8F5] px-1 rounded border border-[#EAE6DF] font-mono">
                              {matchedItem.category}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation(); // Avoid card click
                              handleToggleAssociation(matchedItem.id);
                            }}
                            className="text-[10px] text-[#8C867E] hover:text-red-500 font-mono transition-colors px-1 py-0.5 border border-[#EAE6DF]/60 hover:border-red-200 rounded bg-[#FAF8F5]"
                            title="解除搭配关联"
                          >
                            解除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 bg-[#FAF8F5]/50 rounded-xl border border-dashed border-[#EAE6DF]">
                  <p className="text-[11px] font-sans text-[#8C867E] italic">暂未关联搭配推荐衣物。</p>
                  <button
                    type="button"
                    onClick={() => setIsMatchingSelectorOpen(true)}
                    className="mt-1.5 inline-flex items-center gap-1.5 text-[9px] font-mono font-medium text-[#B3A596] hover:text-[#2A2724] bg-white border border-[#EAE6DF] px-2.5 py-1 rounded-full shadow-3xs"
                  >
                    <Link2 size={10} />
                    立即添加推荐搭配
                  </button>
                </div>
              )}

              {/* Expandable Association Selector inside the Spec Sheet */}
              {isMatchingSelectorOpen && (
                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#EAE6DF] space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-[#EAE6DF]/50 pb-2">
                    <span className="text-[9px] font-mono text-[#8C867E] tracking-wider uppercase font-semibold">
                      双向搭配推荐管理后台
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsMatchingSelectorOpen(false)}
                      className="text-[#8C867E] hover:text-[#2A2724]"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="输入款号(Code)或名称快速搜索过滤服装..."
                      value={matchingSearchQuery}
                      onChange={(e) => setMatchingSearchQuery(e.target.value)}
                      className="w-full pl-2.5 pr-8 py-1.5 bg-white border border-[#EAE6DF] rounded-lg text-[10px] focus:outline-hidden focus:border-[#B3A596] font-sans"
                    />
                  </div>

                  {/* Candidates selection items as neat labels with images */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                    {filteredCandidates.length > 0 ? (
                      filteredCandidates.map((candidate) => {
                        const isAssociated = (garment.matchedGarmentIds || []).includes(candidate.id);
                        return (
                          <label
                            key={candidate.id}
                            className={`flex items-center justify-between p-1.5 rounded-lg border text-[10px] cursor-pointer transition-all ${
                              isAssociated 
                                ? 'bg-white border-[#B3A596] shadow-3xs' 
                                : 'bg-[#FAF8F5]/50 border-[#EAE6DF]/60 hover:bg-[#FAF8F5]'
                            }`}
                          >
                            <div className="truncate font-sans flex items-center gap-2">
                              <img 
                                src={candidate.image} 
                                alt={candidate.name} 
                                className="w-6 h-6 rounded object-cover border border-[#EAE6DF]"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.src = `https://picsum.photos/seed/${candidate.code}/600/800`;
                                }}
                              />
                              <div className="truncate">
                                <span className="font-mono text-[9px] font-bold text-[#B3A596] mr-1">{candidate.code}</span>
                                <span className="text-[#2A2724] font-medium truncate">{candidate.name}</span>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={isAssociated}
                              onChange={() => handleToggleAssociation(candidate.id)}
                              className="accent-[#B3A596] w-3.5 h-3.5 rounded shrink-0 ml-1"
                            />
                          </label>
                        );
                      })
                    ) : (
                      <p className="text-[10px] font-sans text-zinc-400 text-center col-span-full py-2">没有找到其他服装候选对象。</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

          {/* Bottom Sticky Action Panel - Clean Buttons */}
          <div
            className="border-t border-[#EAE6DF] p-3 md:p-6 bg-[#FAF8F5]/95 flex items-center justify-end gap-2 sticky bottom-0 z-30 backdrop-blur-md flex-wrap"
            style={{ paddingBottom: 'calc(0.75rem + max(env(safe-area-inset-bottom), 24px))' }}
          >
            {isReadOnly ? (
              <span className="font-mono text-[9px] tracking-widest text-[#B3A596] uppercase bg-white border border-[#EAE6DF] px-4 py-2 rounded-full shadow-3xs animate-pulse flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                📡 局域网副屏只读看板 // 实时同步中
              </span>
            ) : (
              <>
                <button
                  onClick={() => onEdit(garment)}
                  className="flex-1 sm:flex-none min-w-[120px] flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-[#EAE6DF] hover:border-[#B3A596] text-[#2A2724] rounded-full font-mono text-xs uppercase tracking-wider transition-colors animate-fade-in"
                >
                  <Edit3 size={11} />
                  编辑 Spec
                </button>
                
                <button
                  onClick={() => onToggleStatus(garment.id)}
                  className={`flex-1 sm:flex-none min-w-[120px] flex items-center justify-center gap-1.5 px-4 py-2 border rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-200 ${
                    isActive 
                      ? 'border-[#EAE6DF] text-[#8C867E] hover:bg-[#FAF8F5] hover:text-[#2A2724]' 
                      : 'border-[#B3A596] text-white bg-[#B3A596] hover:bg-[#4E4237]'
                  }`}
                >
                  {isActive ? '归档档案' : '启用此项'}
                </button>

                <button
                  onClick={() => {
                    if (confirm('您确定要彻底删除此项服装档案吗？此操作无法撤销。')) {
                      onDelete(garment.id);
                    }
                  }}
                  className="p-2 border border-[#EAE6DF] hover:border-red-200 rounded-full hover:bg-red-50 text-[#8C867E] hover:text-red-600 transition-all"
                  title="删除服装档案记录"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  </div>
);
}
