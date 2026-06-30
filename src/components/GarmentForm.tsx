import React, { useState, useEffect } from 'react';
import { Garment } from '../types';
import { X, Plus, Trash2, Tag, Layers, HelpCircle } from 'lucide-react';

interface GarmentFormProps {
  garment?: Garment | null; // If passed, we are editing
  onSave: (garment: Omit<Garment, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) => void;
  onCancel: () => void;
  categories: string[];
}

// Fallback default placeholder image if no image is uploaded
const DEFAULT_PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=600&h=800';
const MAX_IMAGE_EDGE = 1280;
const IMAGE_QUALITY = 0.82;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Failed to load image'));
      image.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Canvas is not available'));
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', IMAGE_QUALITY));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function GarmentForm({ garment, onSave, onCancel, categories }: GarmentFormProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<Garment['category']>('无');
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [status, setStatus] = useState<'Active' | 'Archived'>('Active');
  const [location, setLocation] = useState('');
  const [materials, setMaterials] = useState('');
  const [details, setDetails] = useState('');
  const [weight, setWeight] = useState('');
  const [functionality, setFunctionality] = useState<string[]>([]);
  const [newFunc, setNewFunc] = useState('');
  const [videoLogs, setVideoLogs] = useState<string[]>([]);
  const [newVideo, setNewVideo] = useState('');

  // Load existing garment details if editing
  useEffect(() => {
    if (garment) {
      setName(garment.name);
      setCode(garment.code);
      setCategory(garment.category || '无');
      setStatus(garment.status);
      setLocation(garment.location);
      setMaterials(garment.materials);
      setDetails(garment.details);
      setWeight(garment.weight);
      setFunctionality([...garment.functionality]);
      setVideoLogs([...garment.videoLogs]);
      setCustomImages(garment.images || (garment.image ? [garment.image] : []));
    } else {
      // Default placeholder values for adding a new item
      setName('');
      setCode(`0${Math.floor(Math.random() * 90 + 10)}`);
      setCategory('无');
      setCustomImages([]);
      setUrlInput('');
      setStatus('Active');
      setLocation('1号挂架 / C-01分区');
      setMaterials('Ultralight 2L Technical Composite Fabric');
      setDetails('这是一件经过精心挑选和技术规格登记的时尚服装，设计完美契合时尚美学与日常功能。');
      setWeight('320g');
      setFunctionality(['防泼水涂层', '超轻量化设计', '高周转适配']);
      setVideoLogs([]);
    }
  }, [garment]);

  const handleFiles = async (files: FileList) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    try {
      const loadedImages = await Promise.all(imageFiles.map(file => compressImage(file)));
      setCustomImages(prev => [...prev, ...loadedImages]);
    } catch (error) {
      console.error('Image upload failed', error);
      alert('图片处理失败，请换一张图片再试。');
    }
  };

  const handleAddUrlImage = () => {
    const trimmed = urlInput.trim();
    if (trimmed && trimmed.startsWith('http')) {
      setCustomImages(prev => [...prev, trimmed]);
      setUrlInput('');
    }
  };

  const handleRemoveCustomImage = (indexToRemove: number) => {
    setCustomImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const finalImages = customImages.length > 0 ? customImages : [DEFAULT_PLACEHOLDER_IMAGE];
    const finalMainImage = finalImages[0];

    onSave({
      id: garment?.id,
      code: code.trim(),
      name: code.trim(),
      category,
      image: finalMainImage,
      images: finalImages,
      status,
      location: location.trim() || 'UNASSIGNED',
      materials: materials.trim() || 'Composite Synthetics',
      details: details.trim() || 'No description provided.',
      weight: weight.trim() || 'N/A',
      functionality: functionality.length > 0 ? functionality : ['Modular'],
      videoLogs,
      createdAt: garment?.createdAt
    });
  };

  const handleAddFunc = () => {
    if (newFunc.trim() && !functionality.includes(newFunc.trim())) {
      setFunctionality([...functionality, newFunc.trim()]);
      setNewFunc('');
    }
  };

  const handleRemoveFunc = (index: number) => {
    setFunctionality(functionality.filter((_, i) => i !== index));
  };

  const handleAddVideo = () => {
    if (newVideo.trim() && !videoLogs.includes(newVideo.trim())) {
      setVideoLogs([...videoLogs, newVideo.trim()]);
      setNewVideo('');
    }
  };

  const handleRemoveVideo = (index: number) => {
    setVideoLogs(videoLogs.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-xs overflow-hidden">
      <div className="relative w-full max-w-2xl bg-white border border-[#EAE6DF] rounded-2xl overflow-hidden my-0 sm:my-8 shadow-xl max-h-[calc(100dvh-1rem)] flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 pb-3 border-b border-[#EAE6DF] shrink-0">
          <div>
            <span className="font-mono text-[9px] text-[#8C867E] tracking-widest uppercase">衣橱电子规格登记表</span>
            <h2 className="font-display text-xl font-medium text-[#2A2724] mt-0.5">
              {garment ? `编辑服装规格 // ${garment.code}` : '新服装数据入库登记 //'}
            </h2>
          </div>
          <button 
            type="button"
            onClick={onCancel}
            className="p-1.5 text-[#8C867E] hover:text-[#2A2724] hover:bg-[#FAF8F5] rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-[#2A2724] overflow-y-auto px-4 sm:px-6 py-4 pb-0 min-h-0">
          
          {/* Main Grid: Code, Category */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block font-mono text-[9px] text-[#8C867E] tracking-wider uppercase mb-1.5">服装共享编码 *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg px-3 py-2 text-sm font-mono text-[#2A2724] focus:outline-none focus:border-[#B3A596] uppercase placeholder-zinc-400"
                placeholder="例如: 001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[9px] text-[#8C867E] tracking-wider uppercase mb-1.5">衣物类别</label>
              <select
                value={category || '无'}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg px-3 py-2 text-sm text-[#2A2724] focus:outline-none focus:border-[#B3A596]"
              >
                <option value="无">无</option>
                {categories.filter(c => c !== '无' && c !== 'All').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono text-[9px] text-[#8C867E] tracking-wider uppercase mb-1.5">使用状态</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('Active')}
                  className={`flex-1 font-mono text-xs py-2 rounded-lg border transition-colors ${
                    status === 'Active'
                      ? 'bg-[#2A2724] border-[#2A2724] text-white font-bold'
                      : 'bg-[#FAF8F5] border-[#EAE6DF] text-[#8C867E] hover:text-[#2A2724]'
                  }`}
                >
                  已启用
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('Archived')}
                  className={`flex-1 font-mono text-xs py-2 rounded-lg border transition-colors ${
                    status === 'Archived'
                      ? 'bg-[#2A2724] border-[#2A2724] text-white font-bold'
                      : 'bg-[#FAF8F5] border-[#EAE6DF] text-[#8C867E] hover:text-[#2A2724]'
                  }`}
                >
                  已归档
                </button>
              </div>
            </div>
          </div>

          {/* Image Selector */}
          <div>
            <label className="block font-mono text-[9px] text-[#8C867E] tracking-wider uppercase mb-1.5">外观形象图片</label>
            
            <div className="bg-[#FAF8F5] p-4 border border-[#EAE6DF] rounded-lg space-y-3.5">
              {/* Drag and Drop Upload Zone */}
              <div 
                className="border-2 border-dashed border-[#EAE6DF] hover:border-[#B3A596] rounded-xl p-5 text-center cursor-pointer bg-white transition-colors flex flex-col items-center justify-center min-h-[110px]"
                onClick={() => document.getElementById('file-upload-input')?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files) {
                    handleFiles(e.dataTransfer.files);
                  }
                }}
              >
                <input 
                  id="file-upload-input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFiles(e.target.files);
                      e.target.value = '';
                    }
                  }}
                />
                <Plus className="text-[#8C867E] mb-1" size={18} />
                <p className="text-[10px] font-sans text-[#2A2724] font-medium">点击此处 或 拖拽图片上传 (支持选择多张)</p>
                <p className="text-[8px] text-[#8C867E] mt-0.5">支持 PNG, JPG, GIF 格式，支持手机相册多选</p>
              </div>

              {/* List of uploaded custom images */}
              {customImages.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block font-mono text-[9px] text-[#8C867E] tracking-wider uppercase">已上传的图片 ({customImages.length}张，首张图为主形象图)</label>
                  <div className="grid grid-cols-4 gap-2 bg-white p-2 border border-[#EAE6DF] rounded-xl max-h-[220px] overflow-y-auto">
                    {customImages.map((imgSrc, idx) => (
                      <div key={idx} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-[#EAE6DF]">
                        <img src={imgSrc} alt={`Uploaded ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCustomImage(idx);
                          }}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md transition-colors"
                        >
                          <X size={10} />
                        </button>
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white py-0.5 text-center font-mono truncate">
                          {idx === 0 ? '主图' : `图 ${idx + 1}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block font-mono text-[8px] text-[#8C867E] tracking-wider uppercase">或者添加网络图片 URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="输入 https:// 网址..."
                    className="flex-grow bg-white border border-[#EAE6DF] rounded-lg px-2.5 py-1.5 text-xs text-[#2A2724] focus:outline-none focus:border-[#B3A596] font-sans"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddUrlImage();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddUrlImage}
                    className="bg-white hover:bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg px-3 py-1 text-xs text-[#2A2724] font-mono transition-colors"
                  >
                    添加
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Functional tags builder */}
          <div>
            <label className="block font-mono text-[9px] text-[#8C867E] tracking-wider uppercase mb-1.5">功能性能标签特征</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newFunc}
                onChange={(e) => setNewFunc(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFunc();
                  }
                }}
                className="flex-grow bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg px-3 py-1.5 text-sm text-[#2A2724] focus:outline-none focus:border-[#B3A596]"
                placeholder="例如: 磁吸速开扣, 3D裁剪"
              />
              <button
                type="button"
                onClick={handleAddFunc}
                className="px-3 py-1.5 bg-white border border-[#EAE6DF] hover:border-[#B3A596] text-[#2A2724] rounded-lg text-xs font-mono flex items-center gap-1 transition-colors"
              >
                <Plus size={12} />
                添加
              </button>
            </div>

            {functionality.length > 0 && (
              <div className="flex flex-wrap gap-1.5 bg-[#FAF8F5] p-2 border border-[#EAE6DF] rounded-lg">
                {functionality.map((func, idx) => (
                  <span
                    key={func}
                    className="font-mono text-[10px] px-2.5 py-1 bg-white border border-[#EAE6DF] text-[#2A2724] rounded-full flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>{func}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFunc(idx)}
                      className="text-[#8C867E] hover:text-red-600 font-bold ml-1 text-xs"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Video logs checklists */}
          <div>
            <label className="block font-mono text-[9px] text-[#8C867E] tracking-wider uppercase mb-1.5">🎬 出镜视频关联记录 (手动输入添加，无需勾选一堆预设)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newVideo}
                onChange={(e) => setNewVideo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddVideo();
                  }
                }}
                className="flex-grow bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg px-3 py-1.5 text-sm text-[#2A2724] focus:outline-none focus:border-[#B3A596]"
                placeholder="例如: 第52期, 2026/06/25大片"
              />
              <button
                type="button"
                onClick={handleAddVideo}
                className="px-3 py-1.5 bg-white border border-[#EAE6DF] hover:border-[#B3A596] text-[#2A2724] rounded-lg text-xs font-mono flex items-center gap-1 transition-colors"
              >
                <Plus size={12} />
                添加
              </button>
            </div>

            {videoLogs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 bg-[#FAF8F5] p-2 border border-[#EAE6DF] rounded-lg">
                {videoLogs.map((log, idx) => (
                  <span
                    key={log}
                    className="font-mono text-[10px] px-2.5 py-1 bg-white border border-[#EAE6DF] text-[#2A2724] rounded-full flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>{log}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVideo(idx)}
                      className="text-[#8C867E] hover:text-red-600 font-bold ml-1 text-xs"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div
            className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 flex items-center justify-end gap-3 border-t border-[#EAE6DF] pt-4 mt-4 bg-white/95 backdrop-blur-md"
            style={{ paddingBottom: 'calc(1rem + max(env(safe-area-inset-bottom), 24px))' }}
          >
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-transparent border border-[#EAE6DF] hover:border-[#B3A596] text-[#8C867E] hover:text-[#2A2724] rounded-full text-xs font-mono uppercase tracking-widest transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-none px-5 py-2.5 bg-[#2A2724] hover:bg-[#4E4237] text-white rounded-full text-xs font-mono font-medium uppercase tracking-widest transition-all shadow-sm active:scale-95"
            >
              {garment ? '保存更新' : '完成登记'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
