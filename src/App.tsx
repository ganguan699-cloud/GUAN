import { useState, useMemo, useEffect, FormEvent } from 'react';
import { Garment, GarmentCategory, FilterStatus } from './types';
import { INITIAL_GARMENTS, VIDEO_SHOW_OPTIONS } from './data';
import ArchiveStats from './components/ArchiveStats';
import GarmentCard from './components/GarmentCard';
import GarmentDetailModal from './components/GarmentDetailModal';
import GarmentForm from './components/GarmentForm';
import BarcodeScanner from './components/BarcodeScanner';
import AuthScreen from './components/AuthScreen';
import { loadCloudState, saveCloudState, subscribeToCloudState, supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';
import { 
  Plus, 
  RotateCcw, 
  Smartphone, 
  Laptop, 
  Search, 
  Database, 
  Tag, 
  Filter, 
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  X,
  Edit3,
  Trash2,
  Download,
  Upload,
  Wifi,
  Copy,
  Check,
  FileJson,
  Info
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // --- Persistent State & Role Management ---
  const [deviceRole, setDeviceRole] = useState<'master' | 'display'>(() => {
    return (localStorage.getItem('techwear_device_role') as 'master' | 'display') || 'master';
  });

  const [garments, setGarments] = useState<Garment[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);

  const fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url;
    const url = rawUrl.startsWith('http') ? new URL(rawUrl).pathname : rawUrl;
    const method = (init?.method || 'GET').toUpperCase();

    if (!url.startsWith('/api/')) {
      return window.fetch(input, init);
    }

    try {
      const state = await loadCloudState();

      if (url === '/api/garments' && method === 'GET') {
        return Response.json(state.garments);
      }

      if (url === '/api/categories' && method === 'GET') {
        return Response.json(state.categories);
      }

      if (url === '/api/garments' && method === 'POST') {
        const garment = JSON.parse(String(init?.body || '{}'));
        const nextGarment = {
          ...garment,
          id: garment.id || `g-${Date.now()}`,
          createdAt: garment.createdAt || new Date().toISOString().split('T')[0],
        } as Garment;
        const nextGarments = garment.id
          ? state.garments.map(g => g.id === garment.id ? { ...g, ...nextGarment } : g)
          : [nextGarment, ...state.garments];
        await saveCloudState({ garments: nextGarments, categories: state.categories });
        setGarments(nextGarments);
        setCategories(state.categories);
        return Response.json({ success: true, garments: nextGarments });
      }

      if (url.startsWith('/api/garments/') && method === 'DELETE') {
        const id = decodeURIComponent(url.split('/').pop() || '');
        const nextGarments = state.garments.filter(g => g.id !== id);
        await saveCloudState({ garments: nextGarments, categories: state.categories });
        setGarments(nextGarments);
        setCategories(state.categories);
        return Response.json({ success: true, garments: nextGarments });
      }

      if (url === '/api/categories' && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        const nextCategories = Array.isArray(body.categories) ? body.categories : state.categories;
        await saveCloudState({ garments: state.garments, categories: nextCategories });
        setGarments(state.garments);
        setCategories(nextCategories);
        return Response.json({ success: true, categories: nextCategories });
      }

      if (url === '/api/sync/overwrite' && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        if (!Array.isArray(body.garments) || !Array.isArray(body.categories)) {
          return Response.json({ error: 'Invalid sync payload' }, { status: 400 });
        }
        await saveCloudState({ garments: body.garments, categories: body.categories });
        setGarments(body.garments);
        setCategories(body.categories);
        return Response.json({ success: true, garments: body.garments, categories: body.categories });
      }

      return Response.json({ error: 'Not found' }, { status: 404 });
    } catch (error) {
      console.error('Supabase API adapter failed', error);
      return Response.json({ error: 'Supabase request failed' }, { status: 500 });
    }
  };

  // Fetch from server API
  const fetchData = async () => {
    try {
      const gRes = await fetch('/api/garments');
      const gData = await gRes.json();
      setGarments(gData);

      const cRes = await fetch('/api/categories');
      const cData = await cRes.json();
      setCategories(cData);
    } catch (e) {
      console.error('Failed to load data from server', e);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setGarments([]);
        setCategories([]);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    fetchData();
    return subscribeToCloudState(fetchData);
  }, [session]);

  const handleRenameCategory = async (oldName: string, newName: string): Promise<string | null> => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === 'All' || trimmed === '无') return '名称无效';
    if (categories.includes(trimmed)) {
      return '该品类名称已存在';
    }
    const updatedCategories = categories.map(c => c === oldName ? trimmed : c);
    const updatedGarments = garments.map(g => g.category === oldName ? { ...g, category: trimmed } : g);
    
    try {
      const res = await fetch('/api/sync/overwrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ garments: updatedGarments, categories: updatedCategories })
      });
      if (!res.ok) return '同步服务端失败';
      if (selectedCategory === oldName) {
        setSelectedCategory(trimmed);
      }
    } catch (e) {
      return '同步服务端失败';
    }
    return null;
  };

  const handleDeleteCategory = async (catName: string) => {
    const updatedCategories = categories.filter(c => c !== catName);
    const updatedGarments = garments.map(g => g.category === catName ? { ...g, category: '无' } : g);
    
    try {
      await fetch('/api/sync/overwrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ garments: updatedGarments, categories: updatedCategories })
      });
      if (selectedCategory === catName) {
        setSelectedCategory('All');
      }
    } catch (e) {
      console.error('Failed to sync deleted category', e);
    }
  };

  const handleAddCategory = async (name: string): Promise<string | null> => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === 'All' || trimmed === '无') return '名称无效';
    if (categories.includes(trimmed)) {
      return '该品类名称已存在';
    }
    const updatedCategories = [...categories, trimmed];
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: updatedCategories })
      });
      if (!res.ok) return '同步失败';
    } catch (e) {
      return '同步失败';
    }
    return null;
  };

  // --- Filtering & Selection State ---
  const [selectedCategory, setSelectedCategory] = useState<GarmentCategory>('All');
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideoLog, setSelectedVideoLog] = useState<string | null>(null);

  // --- Dynamic Layout & Sizing Adjustments derived from a single zoom slider ---
  const [zoomLevel, setZoomLevel] = useState<number>(50); // 0 to 100
  const layoutMode = 'grid';
  
  const gridColumns = useMemo(() => {
    if (zoomLevel <= 25) return 5;
    if (zoomLevel <= 50) return 4;
    if (zoomLevel <= 75) return 3;
    return 2;
  }, [zoomLevel]);

  const imageFit = 'cover';
  const imagePadding = 0;

  // --- Core Business Simulator State ---
  const [simulatorTab, setSimulatorTab] = useState<'reuse' | 'many-to-many' | 'json'>('reuse');
  const [simulationLogs, setSimulationLogs] = useState<string[]>([
    '系统处于监听就绪状态。等待执行 001 编码“号码不变，内容换新”复用模拟。'
  ]);

  // --- UI Layout Toggles ---
  const [viewMode, setViewMode] = useState<'hybrid' | 'mobile-only'>('mobile-only');
  const [isRealMobile, setIsRealMobile] = useState(false);

  // --- PWA Installation & Status State ---
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      const isSmallScreen = window.innerWidth < 768;
      setIsRealMobile(isStandalone || isSmallScreen);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsPwaInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsPwaInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) {
      alert("提示：当前环境暂无法调用一键安装。\n\n请参考下方的【手动添加指南】操作：\n\n• 苹果 iOS 端：点击 Safari 浏览器底部的“分享”按钮，在弹出的菜单中选择“添加到主屏幕”。\n• 安卓/Windows/Mac 端：点击浏览器地址栏右侧的“安装/+”图标，或打开浏览器菜单选择“安装”或“添加到主屏幕”。");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsPwaInstalled(true);
      setDeferredPrompt(null);
    }
  };

  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGarment, setEditingGarment] = useState<Garment | null>(null);

  // --- Date & Time HUD ---
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      // Render in elegant format
      setCurrentTime(d.toLocaleString('zh-CN', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- LAN Sync & Backup State & Handlers ---
  const [syncCode, setSyncCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleExportData = () => {
    try {
      const dataStr = JSON.stringify({
        version: 'techwear_v1_sync',
        timestamp: new Date().toISOString(),
        categories,
        garments
      }, null, 2);
      
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `techwear_archive_sync_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('导出数据备份失败：' + e);
    }
  };

  const handleImportData = (file: File, mode: 'overwrite' | 'merge') => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') return;
        const parsed = JSON.parse(result);
        
        if (!parsed.garments || !Array.isArray(parsed.garments)) {
          alert('导入失败：无效的备份文件结构');
          return;
        }

        let newGarments = [...garments];
        let newCategories = [...categories];

        if (mode === 'overwrite') {
          newGarments = parsed.garments;
          if (parsed.categories && Array.isArray(parsed.categories)) {
            newCategories = parsed.categories;
          }
        } else {
          // Merge
          const existingIds = new Set(garments.map(g => g.id));
          parsed.garments.forEach((g: Garment) => {
            if (!existingIds.has(g.id)) {
              newGarments.push(g);
            }
          });
          if (parsed.categories && Array.isArray(parsed.categories)) {
            parsed.categories.forEach((cat: string) => {
              if (!newCategories.includes(cat)) {
                newCategories.push(cat);
              }
            });
          }
        }

        // Push to server!
        const res = await fetch('/api/sync/overwrite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ garments: newGarments, categories: newCategories })
        });
        if (res.ok) {
          alert(`数据导入并同步成功！已成功加载/合并 ${parsed.garments.length} 件服装档案与品类配置到所有局域网设备。`);
        } else {
          alert('导入数据同步到服务端失败');
        }
      } catch (err) {
        alert('导入解析失败：无效的 JSON 格式或损坏的文件');
      }
    };
    reader.readAsText(file);
  };

  const handleCopySyncCode = () => {
    try {
      const payload = {
        categories,
        garments
      };
      const rawText = JSON.stringify(payload);
      const utf8Bytes = new TextEncoder().encode(rawText);
      let binary = '';
      const len = utf8Bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(utf8Bytes[i]);
      }
      const base64 = btoa(binary);
      navigator.clipboard.writeText(base64);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('生成同步码失败。若您的衣橱包含大体积的自定义上传图片，请优先使用【1. 导出备份文件】方法同步，它完美支持超大容量。');
    }
  };

  const handlePasteSyncCode = async (codeText: string, mode: 'overwrite' | 'merge') => {
    if (!codeText.trim()) {
      alert('请先输入有效的同步代码');
      return;
    }
    try {
      const binaryString = atob(codeText.trim());
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const rawText = new TextDecoder().decode(bytes);
      const parsed = JSON.parse(rawText);

      if (!parsed.garments || !Array.isArray(parsed.garments)) {
        alert('解析失败：无效的同步代码结构');
        return;
      }

      let newGarments = [...garments];
      let newCategories = [...categories];

      if (mode === 'overwrite') {
        newGarments = parsed.garments;
        if (parsed.categories && Array.isArray(parsed.categories)) {
          newCategories = parsed.categories;
        }
      } else {
        const existingIds = new Set(garments.map(g => g.id));
        parsed.garments.forEach((g: Garment) => {
          if (!existingIds.has(g.id)) {
            newGarments.push(g);
          }
        });
        if (parsed.categories && Array.isArray(parsed.categories)) {
          parsed.categories.forEach((cat: string) => {
            if (!newCategories.includes(cat)) {
              newCategories.push(cat);
            }
          });
        }
      }

      const res = await fetch('/api/sync/overwrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ garments: newGarments, categories: newCategories })
      });
      if (res.ok) {
        setSyncCode('');
        alert(`局域网同步码应用并同步成功！已成功加载/合并 ${parsed.garments.length} 件服装档案。`);
      } else {
        alert('同步到服务端失败');
      }
    } catch (err) {
      alert('解析同步代码失败。如果您的同步数据量极大，建议使用【文件导出与导入】方式进行同步。');
    }
  };  // --- Handlers ---
  const handleSaveGarment = async (data: Omit<Garment, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) => {
    try {
      const res = await fetch('/api/garments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setIsFormOpen(false);
        setEditingGarment(null);
        if (selectedGarment && selectedGarment.id === data.id) {
          setSelectedGarment({
            ...selectedGarment,
            ...data,
            id: data.id,
            createdAt: data.createdAt || new Date().toISOString().split('T')[0]
          } as Garment);
        }
      } else {
        alert('保存失败：服务端返回错误');
      }
    } catch (e) {
      alert('保存失败：网络连接异常');
    }
  };

  const handleDeleteGarment = async (id: string) => {
    try {
      const res = await fetch(`/api/garments/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (selectedGarment && selectedGarment.id === id) {
          setSelectedGarment(null);
        }
      } else {
        alert('删除失败：服务端返回错误');
      }
    } catch (e) {
      alert('删除失败：网络连接异常');
    }
  };

  const handleUpdateGarment = async (updated: Garment) => {
    try {
      const res = await fetch('/api/garments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setSelectedGarment(updated);
      }
    } catch (e) {
      console.error('Update failed', e);
    }
  };

  const handleToggleStatus = async (id: string) => {
    const target = garments.find(g => g.id === id);
    if (!target) return;
    const nextStatus = target.status === 'Active' ? 'Archived' : 'Active';
    const updated = { ...target, status: nextStatus };
    try {
      const res = await fetch('/api/garments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        if (selectedGarment && selectedGarment.id === id) {
          setSelectedGarment(prev => prev ? { ...prev, status: nextStatus } : null);
        }
      }
    } catch (e) {
      console.error('Toggle status failed', e);
    }
  };

  const handleResetDatabase = async () => {
    if (confirm('确认要将数据库还原为系统默认预设吗？所有用户添加的自定义服装数据都将被覆盖。')) {
      try {
        const res = await fetch('/api/sync/overwrite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            garments: INITIAL_GARMENTS,
            categories: ['All', '无', '外套 Shell', '战术马甲 Vest', '机能长裤 Pants', '重型战术靴 Boots', '机能挂包 Bags']
          })
        });
        if (res.ok) {
          setSelectedCategory('All');
          setSelectedStatus('All');
          setSelectedVideoLog(null);
          setSearchQuery('');
          setSelectedGarment(null);
          setSimulationLogs(['系统已由主端远程复位。等待执行 001 编码“号码不变，内容换新”复用模拟。']);
        }
      } catch (e) {
        alert('重置失败：服务端无响应');
      }
    }
  };

  const handleSimulateCodeReuse = async () => {
    const active001 = garments.find(g => g.code === '001' && g.status === 'Active');
    
    if (active001) {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      
      const archivedPrev = garments.map(g => {
        if (g.id === active001.id) {
          return {
            ...g,
            status: 'Archived' as const,
            location: '归档储藏箱 / CO-02'
          };
        }
        return g;
      });

      const newId = `g-001-reuse-${Date.now().toString().slice(-4)}`;
      const newGarment: Garment = {
        id: newId,
        code: '001',
        name: 'GORE-TEX PACLITE 高能轻量罩衣 (新复用)',
        category: '外套 Shell',
        image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=600&h=800',
        images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=600&h=800'],
        status: 'Active',
        location: '1号挂架 / C-01分区',
        videoLogs: [],
        materials: 'Paclite 2L Ultralight Composite (防泼水科技涂膜)',
        details: '这是通过编码复用系统全新登记入库的服装！共享编码“001”，实现“号码不变，内容换新”，历史老版本数据已自动安全归档冻结。',
        functionality: ['超轻量防风雨', '高压缩性', '磁吸速开扣'],
        weight: '270g',
        createdAt: now.toISOString().split('T')[0]
      };

      try {
        const res = await fetch('/api/sync/overwrite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ garments: [newGarment, ...archivedPrev], categories })
        });
        if (res.ok) {
          setSimulationLogs(prev => [
            `[${timeStr}] 🟢 成功: 全新服装 "${active001.name}" 被创建，继承共享编码 "001"，状态 [Active]。历史视频出镜次数重置为 0。`,
            `[${timeStr}] ⚠️ 冻结: 原 001 服装 ID: ${active001.id} "${active001.name}" 更改为 [Archived] 已归档，历史视频记录被永久冻结保留。`,
            `[${timeStr}] ⚡ 提示: 启动 001 服装编码复用序列...`,
            ...prev
          ]);
        }
      } catch (e) {
        alert('模拟编码复用失败：网络连接异常');
      }
    } else {
      alert('未在数据库中检测到激活状态下的 001 编码服装。您可以先点击页面下方的“重设为系统默认预设”按钮重置数据库状态。');
    }
  };

  // --- Filter Logic ---
  const filteredGarments = useMemo(() => {
    return garments.filter(g => {
      const matchesCategory = selectedCategory === 'All' || g.category === selectedCategory;
      const matchesStatus = selectedStatus === 'All' || g.status === selectedStatus;
      const matchesVideo = !selectedVideoLog || g.videoLogs.includes(selectedVideoLog);
      
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        g.name.toLowerCase().includes(q) ||
        g.code.toLowerCase().includes(q) ||
        g.materials.toLowerCase().includes(q) ||
        g.location.toLowerCase().includes(q) ||
        g.functionality.some(f => f.toLowerCase().includes(q));

      return matchesCategory && matchesStatus && matchesVideo && matchesSearch;
    });
  }, [garments, selectedCategory, selectedStatus, selectedVideoLog, searchQuery]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center text-sm text-[#8C867E]">
        正在检查登录状态...
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (isRealMobile) {
    return (
      <div className="w-full min-h-screen bg-[#FAF8F5] text-[#2A2724] flex flex-col font-sans overflow-x-hidden p-4 relative selection:bg-[#B3A596] selection:text-white pb-36">
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="absolute top-2 right-2 z-50 text-[10px] font-mono text-[#8C867E] bg-white border border-[#EAE6DF] rounded-full px-3 py-1 shadow-xs"
        >
          退出
        </button>
        
        {/* Mobile Header */}
        <header className="flex justify-between items-center pb-3 border-b border-[#EAE6DF] mb-4 gap-4">
          <div>
            <span className="text-[8px] tracking-[0.2em] font-mono text-[#8C867E] uppercase block">Digital Wardrobe // App</span>
            <h1 className="text-lg font-display font-medium text-[#2A2724] uppercase">
              数字化服装管理系统
            </h1>
          </div>
          <div className="text-right font-mono text-[9px] text-[#8C867E] shrink-0">
            <div>件数: {garments.length} 件</div>
            <div className="text-[7px] text-zinc-400">PWA 极速就绪</div>
          </div>
        </header>

        {/* SEARCH INPUT BAR */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#8C867E]">
            <Search size={13} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索名称、共享编码、材质标签..."
            className="w-full bg-white border border-[#EAE6DF] rounded-full pl-9 pr-8 py-1.5 text-xs text-[#2A2724] font-sans focus:outline-none focus:border-[#B3A596] placeholder-[#8C867E] transition-all shadow-2xs"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-3 flex items-center text-[#8C867E] hover:text-[#2A2724] font-mono text-[9px]"
            >
              清空
            </button>
          )}
        </div>

        {/* FILTER CATEGORY SCROLL BAR (Pills layout) */}
        <div className="mb-3">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <div className="flex items-center gap-1">
              <span className="font-mono text-[8px] text-[#8C867E] tracking-wider uppercase">服装类别检索</span>
            </div>
            <button
              onClick={() => setIsManageCategoriesOpen(true)}
              className="text-[11px] font-mono text-[#8C867E] hover:text-[#2A2724] border border-[#EAE6DF] bg-white rounded-md px-2.5 py-1 flex items-center gap-1.5 transition-all shadow-3xs"
            >
              <SlidersHorizontal size={11} />
              管理品类
            </button>
          </div>
          <div className="overflow-x-auto custom-scrollbar-horizontal scroll-smooth flex gap-1.5 pb-1">
            {([ 'All', ...categories.filter(c => c !== 'All' && c !== '无') ] as GarmentCategory[]).map((cat) => {
              const catNameMap: Record<string, string> = {
                All: '全部',
                上装: '上装',
                下装: '下装',
                套装: '套装',
                丝袜: '丝袜',
                鞋子: '鞋子',
                已搭配好服装: '搭配好'
              };
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-wider transition-all whitespace-nowrap flex-shrink-0 border ${
                    selectedCategory === cat
                      ? 'bg-[#2A2724] border-[#2A2724] text-white font-medium shadow-2xs'
                      : 'bg-white border-[#EAE6DF] text-[#8C867E] hover:text-[#2A2724] hover:border-[#B3A596]'
                  }`}
                >
                  {catNameMap[cat] || cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* FILTER STATUS ACCORDION (Active versus Archived toggle) */}
        <div className="flex items-center justify-between gap-4 mb-3 bg-white p-2 rounded-xl border border-[#EAE6DF]">
          <div className="flex items-center gap-1.5">
            <Database size={10} className="text-[#8C867E]" />
            <span className="font-mono text-[8px] text-[#8C867E] tracking-wider uppercase">库位状态</span>
          </div>
          <div className="flex gap-1">
            {(['All', 'Active', 'Archived'] as FilterStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2 py-0.5 rounded-full text-[8px] font-mono tracking-wider transition-colors border ${
                  selectedStatus === st
                    ? 'bg-[#FAF8F5] border-[#B3A596] text-[#2A2724] font-semibold'
                    : 'bg-transparent border-transparent text-[#8C867E] hover:text-[#2A2724]'
                }`}
              >
                {st === 'All' ? '全部' : st === 'Active' ? '仅使用' : '仅归档'}
              </button>
            ))}
          </div>
        </div>

        {/* ACTIVE BROADCAST INTERLINK FILTER CHIP */}
        {selectedVideoLog && (
          <div className="mb-3 bg-[#FAF8F5] border border-[#B3A596] p-2 rounded-xl flex items-center justify-between text-xs font-mono animate-fade-in shadow-2xs">
            <div className="flex items-center gap-1.5 text-[#2A2724] overflow-hidden">
              <Tag size={11} className="flex-shrink-0 text-[#B3A596]" />
              <span className="text-[10px] font-semibold truncate">出镜视频: {selectedVideoLog}</span>
            </div>
            <button
              onClick={() => setSelectedVideoLog(null)}
              className="text-[8px] text-[#8C867E] hover:text-[#2A2724] px-2 py-0.5 bg-white border border-[#EAE6DF] rounded-full uppercase tracking-wider"
            >
              取消 ×
            </button>
          </div>
        )}

        {/* APP LIST VIEW */}
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {filteredGarments.length > 0 ? (
            <div className={`grid ${
              gridColumns === 5
                ? 'grid-cols-5 gap-1.5'
                : gridColumns === 4 
                  ? 'grid-cols-4 gap-2' 
                  : gridColumns === 3 
                    ? 'grid-cols-3 gap-2.5' 
                    : 'grid-cols-2 gap-3'
            } pb-4`}>
              {filteredGarments.map((item) => (
                <GarmentCard
                  key={item.id}
                  garment={item}
                  onSelect={(g) => setSelectedGarment(g)}
                  selectedVideoLog={selectedVideoLog}
                  onSelectVideoLog={setSelectedVideoLog}
                  layoutMode={layoutMode}
                  imageFit={imageFit}
                  imagePadding={imagePadding}
                />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-[#EAE6DF] rounded-xl p-8 text-center bg-white">
              <span className="font-mono text-[9px] text-[#8C867E] block mb-2 uppercase">未检索到服装档案</span>
              <p className="text-[11px] text-[#8C867E] font-light">当前条件筛选下未找到任何衣物记录。</p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedStatus('All');
                  setSelectedVideoLog(null);
                  setSearchQuery('');
                }}
                className="mt-3 font-mono text-[9px] px-3 py-1 bg-[#FAF8F5] border border-[#EAE6DF] rounded-full text-[#2A2724] hover:border-[#B3A596] uppercase tracking-wider transition-colors"
              >
                清除所有筛选
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM FIXED APP BAR */}
        <div className="fixed bottom-0 inset-x-0 p-4 bg-white/95 border-t border-[#EAE6DF] z-30 backdrop-blur-md flex flex-col gap-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {/* Sizing Controller */}
          <div className="bg-[#FAF8F5] px-3 py-2 rounded-xl border border-[#EAE6DF]/70 shadow-3xs flex items-center gap-2">
            <SlidersHorizontal size={11} className="text-[#B3A596] shrink-0" />
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="w-full accent-[#B3A596] h-1 bg-[#EAE6DF] rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingGarment(null);
                setIsFormOpen(true);
              }}
              className="w-full py-2.5 bg-[#2A2724] hover:bg-[#4E4237] rounded-full flex items-center justify-center gap-1.5 text-xs font-mono tracking-wider text-white transition-all shadow-sm active:scale-98"
            >
              <Plus size={13} />
              录入规格
            </button>
          </div>
        </div>

        {/* --- FLOATING OVERLAY MODALS --- */}
        {selectedGarment && (
          <GarmentDetailModal
            garment={selectedGarment}
            allGarments={garments}
            onUpdateGarment={handleUpdateGarment}
            onSelectGarment={(g) => setSelectedGarment(g)}
            onClose={() => setSelectedGarment(null)}
            onToggleStatus={handleToggleStatus}
            onDelete={(id) => {
              handleDeleteGarment(id);
              setSelectedGarment(null);
            }}
            onEdit={(g) => {
              setEditingGarment(g);
              setIsFormOpen(true);
            }}
            selectedVideoLog={selectedVideoLog}
            onSelectVideoLog={setSelectedVideoLog}
            categories={categories}
            isReadOnly={deviceRole === 'display'}
          />
        )}

        {isFormOpen && (
          <GarmentForm
            garment={editingGarment}
            onSave={handleSaveGarment}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingGarment(null);
            }}
            categories={categories}
          />
        )}

        {/* 3. CATEGORY MANAGEMENT OVERLAY DIALOG */}
        {isManageCategoriesOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans animate-fade-in" id="manage-categories-modal">
            <div className="bg-white rounded-2xl border border-[#EAE6DF] w-full max-w-md shadow-xl flex flex-col overflow-hidden max-h-[85vh] animate-scale-up">
              
              {/* Header */}
              <div className="p-4 border-b border-[#EAE6DF] flex justify-between items-center bg-[#FAF8F5]">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-[#B3A596]" />
                  <h3 className="text-sm font-semibold text-[#2A2724]">管理品类 (服装类别)</h3>
                </div>
                <button
                  onClick={() => setIsManageCategoriesOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 overflow-y-auto space-y-4">
                {/* Add New Category form */}
                <CategoryAddForm onAdd={handleAddCategory} />

                {/* List of categories */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-[#8C867E] tracking-wider uppercase mb-1">
                    现有品类 ({categories.length})
                  </div>
                  <div className="divide-y divide-[#FAF8F5] max-h-[40vh] overflow-y-auto pr-1">
                    {categories.map((cat) => (
                      <CategoryRow 
                        key={cat} 
                        name={cat} 
                        onRename={(newName) => handleRenameCategory(cat, newName)}
                        onDelete={() => handleDeleteCategory(cat)}
                        isSystem={['All', '无'].includes(cat)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#EAE6DF] bg-[#FAF8F5] flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsManageCategoriesOpen(false)}
                  className="bg-[#2A2724] hover:bg-[#1f1d1b] text-white text-xs px-4 py-2 rounded-lg transition-colors font-medium shadow-xs"
                >
                  完成
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. MOBILE SETTINGS & SYNC & PWA OVERLAY DIALOG */}
        {isMobileSettingsOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans animate-fade-in" id="mobile-settings-modal">
            <div className="bg-[#FAF8F5] rounded-2xl border border-[#EAE6DF] w-full max-w-md shadow-xl flex flex-col overflow-hidden max-h-[85vh] animate-scale-up">
              
              {/* Header */}
              <div className="p-4 border-b border-[#EAE6DF] flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-[#B3A596]" />
                  <h3 className="text-sm font-semibold text-[#2A2724] uppercase font-mono">同步与 PWA 客户端配置</h3>
                </div>
                <button
                  onClick={() => setIsMobileSettingsOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 overflow-y-auto space-y-5">
                
                {/* 1. PWA Installation Section */}
                <div className="bg-white border border-[#EAE6DF] rounded-xl p-4 shadow-3xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#FAF8F5] pb-2">
                    <h4 className="font-mono text-[10px] text-[#2A2724] tracking-wider uppercase font-bold flex items-center gap-1.5">
                      <Smartphone size={12} className="text-[#B3A596]" />
                      PWA 独立客户端
                    </h4>
                    <span className={`font-mono text-[8px] px-2 py-0.5 border rounded-full ${isPwaInstalled ? 'bg-green-50 border-green-200 text-green-700' : 'bg-[#FAF8F5] border-[#EAE6DF] text-[#8C867E]'}`}>
                      {isPwaInstalled ? '✓ 已添加' : '就绪'}
                    </span>
                  </div>

                  <p className="text-[10px] text-[#8C867E] leading-relaxed">
                    将此系统添加至桌面或手机主屏幕，可作为独立的独立 App 客户端运行，享受更流畅无边框的全屏极速体验。
                  </p>

                  {deferredPrompt ? (
                    <button
                      onClick={handleInstallPwa}
                      className="w-full py-2 bg-[#2A2724] hover:bg-[#4E4237] text-white font-mono text-[10px] tracking-widest uppercase font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download size={11} />
                      立即一键安装到手机
                    </button>
                  ) : (
                    <div className="bg-[#FAF8F5] p-2.5 rounded-lg space-y-2 text-[10px]">
                      <div className="flex items-center gap-1 font-bold text-[#2A2724]">
                        <Info size={11} className="text-[#B3A596]" />
                        <span>手动添加到桌面指南</span>
                      </div>
                      <div className="space-y-1.5 pl-1.5 border-l border-[#EAE6DF] text-[#8C867E]">
                        <div>
                          <strong className="text-[#2A2724]">苹果 iOS 用户 (Safari)：</strong><br />
                          点击浏览器底部的“分享”按钮（带上箭头的方框），滑到下方选择<strong className="text-[#2A2724]">“添加到主屏幕”</strong>即可。
                        </div>
                        <div>
                          <strong className="text-[#2A2724]">安卓用户 (Chrome/内置)：</strong><br />
                          点击浏览器菜单 “...” 选项，选择<strong className="text-[#2A2724]">“添加至主屏幕”</strong>或“安装应用”。
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Sync Section */}
                <div className="bg-white border border-[#EAE6DF] rounded-xl p-4 shadow-3xs space-y-3">
                  <h4 className="font-mono text-[10px] text-[#2A2724] tracking-wider uppercase font-bold flex items-center gap-1.5 border-b border-[#FAF8F5] pb-2">
                    <Wifi size={12} className="text-[#B3A596]" />
                    多端数据局域网同步
                  </h4>

                  <p className="text-[10px] text-[#8C867E] leading-relaxed">
                    局域网内任意手机、电脑直接访问控制台，即可开始实时联动。可通过下方进行手动覆盖备份或合并。
                  </p>

                  <div className="space-y-3 pt-1">
                    {/* Method 1: Export/Import file */}
                    <div className="space-y-2">
                      <span className="font-mono text-[9px] text-[#2A2724] font-bold block">方法 1：数据备份文件</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleExportData}
                          className="py-1.5 bg-[#FAF8F5] hover:bg-[#EAE6DF] border border-[#EAE6DF] text-[#2A2724] font-mono text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Download size={11} />
                          导出 JSON 备份
                        </button>
                        <div className="border border-[#EAE6DF] rounded-lg bg-[#FAF8F5] hover:bg-[#EAE6DF] relative overflow-hidden transition-colors flex items-center justify-center py-1.5">
                          <input
                            type="file"
                            accept=".json"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const mode = window.confirm("请选择导入模式：\n\n【确定】为 覆盖导入 (替换全部数据)\n【取消】为 增量合并 (仅合并非重复数据)") ? 'overwrite' : 'merge';
                                handleImportData(file, mode);
                                e.target.value = '';
                              }
                            }}
                          />
                          <span className="font-mono text-[10px] text-[#2A2724] flex items-center gap-1">
                            <Upload size={11} />
                            导入备份
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Method 2: Sync Code */}
                    <div className="space-y-2 border-t border-[#FAF8F5] pt-2.5">
                      <span className="font-mono text-[9px] text-[#2A2724] font-bold block">方法 2：极速复制同步码</span>
                      <button
                        onClick={handleCopySyncCode}
                        className="w-full py-1.5 bg-[#2A2724] text-white font-mono text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1 shadow-3xs"
                      >
                        {copied ? <Check size={11} className="text-green-300" /> : <Copy size={11} />}
                        {copied ? '已复制同步码！' : '复制同步码'}
                      </button>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={syncCode}
                          onChange={(e) => setSyncCode(e.target.value)}
                          placeholder="在此粘贴同步码..."
                          className="flex-grow bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg px-2 py-1 text-[10px] text-[#2A2724] focus:outline-none focus:border-[#B3A596]"
                        />
                        <button
                          onClick={() => {
                            if (!syncCode.trim()) return;
                            const mode = window.confirm("请选择导入模式：\n\n【确定】为 覆盖导入 (替换全部数据)\n【取消】为 增量合并 (仅合并非重复数据)") ? 'overwrite' : 'merge';
                            handlePasteSyncCode(syncCode, mode);
                          }}
                          className="bg-zinc-800 text-white rounded-lg px-3 py-1 text-[10px] font-mono tracking-wider transition-colors"
                        >
                          导入
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#EAE6DF] bg-white flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsMobileSettingsOpen(false)}
                  className="bg-[#2A2724] hover:bg-[#1f1d1b] text-white text-xs px-4 py-2 rounded-lg transition-colors font-medium shadow-xs font-mono"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] text-[#2A2724] flex flex-col font-sans overflow-hidden p-4 md:p-8 selection:bg-[#B3A596] selection:text-white">
      <button
        type="button"
        onClick={() => supabase.auth.signOut()}
        className="fixed top-3 right-3 z-50 text-[10px] font-mono text-[#8C867E] bg-white border border-[#EAE6DF] rounded-full px-3 py-1 shadow-xs"
      >
        退出登录
      </button>
      
      {/* TOP HEADER STATUS LINE */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-[#EAE6DF] mb-8 gap-6 z-40 sticky top-0 bg-[#FAF8F5]/90 backdrop-blur-md pt-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] tracking-[0.3em] font-medium text-[#8C867E] uppercase flex items-center gap-2">
            <span>Digital Wardrobe // 系统核心</span>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-mono tracking-normal uppercase ${
              deviceRole === 'master' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
            }`}>
              {deviceRole === 'master' ? '● 主控端 Master' : '📡 局域网副屏 Display'}
            </span>
          </span>
          <div className="flex items-center flex-wrap gap-3">
            <h1 className="text-3xl md:text-4xl font-display font-medium tracking-tight text-[#2A2724] uppercase">
              数字化服装管理系统 <span className="text-[#8C867E] font-mono text-sm font-normal">v2.4</span>
            </h1>
            
            {/* Role switcher toggle */}
            <div className="flex items-center bg-white border border-[#EAE6DF] rounded-full p-0.5 text-[9px] font-mono shadow-xs">
              <button
                onClick={() => {
                  setDeviceRole('master');
                  localStorage.setItem('techwear_device_role', 'master');
                }}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  deviceRole === 'master'
                    ? 'bg-[#2A2724] text-white font-medium'
                    : 'text-zinc-500 hover:text-[#2A2724]'
                }`}
              >
                主控端
              </button>
              <button
                onClick={() => {
                  setDeviceRole('display');
                  localStorage.setItem('techwear_device_role', 'display');
                }}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  deviceRole === 'display'
                    ? 'bg-amber-600 text-white font-medium'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                副屏端
              </button>
            </div>
          </div>
        </div>
        
        {/* Telemetry metrics and live action controls in a responsive layout */}
        <div className="flex flex-wrap items-end gap-6 md:gap-8 text-[10px] tracking-widest uppercase font-mono">
          <div className="flex flex-col">
            <span className="text-[#8C867E] mb-1">服装总数</span>
            <span className="text-[#2A2724] font-semibold">[ {garments.length} 件 ]</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8C867E] mb-1">库存启用率</span>
            <span className="text-[#2A2724] font-semibold">
              {garments.length > 0 ? Math.round((garments.filter(g => g.status === 'Active').length / garments.length) * 100) : 100}%
            </span>
          </div>
          <div className="flex flex-col text-[#8C867E]">
            <span className="opacity-80 mb-1">当前时间</span>
            <span className="font-semibold text-[#2A2724]">{currentTime}</span>
          </div>

          {/* Action buttons embedded seamlessly */}
          <div className="flex items-center gap-2.5 pb-0.5">
            {/* Layout Toggler (Desktop Only) */}
            <div className="hidden md:flex items-center bg-white p-1 border border-[#EAE6DF] rounded-full">
              <button
                onClick={() => setViewMode('hybrid')}
                className={`px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  viewMode === 'hybrid'
                    ? 'bg-[#FAF8F5] text-[#2A2724] border border-[#EAE6DF] font-semibold'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
                title="双控制面板"
              >
                <Laptop size={11} />
                双控面板
              </button>
              <button
                onClick={() => setViewMode('mobile-only')}
                className={`px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  viewMode === 'mobile-only'
                    ? 'bg-[#FAF8F5] text-[#2A2724] border border-[#EAE6DF] font-semibold'
                    : 'text-zinc-400 hover:text-[#2A2724]'
                }`}
                title="手机视图"
              >
                <Smartphone size={11} />
                模拟手机端
              </button>
            </div>

            {/* Reset DB Button */}
            {deviceRole === 'master' && (
              <button
                onClick={handleResetDatabase}
                className="p-2 border border-[#EAE6DF] hover:border-[#B3A596] hover:bg-white text-[#8C867E] hover:text-[#2A2724] rounded-full transition-all bg-white"
                title="重置数据库为系统出厂默认"
              >
                <RotateCcw size={12} />
              </button>
            )}

            {/* Quick Register Trigger */}
            {deviceRole === 'master' && (
              <button
                onClick={() => {
                  setEditingGarment(null);
                  setIsFormOpen(true);
                }}
                className="flex items-center gap-1 px-4 py-2 bg-[#2A2724] text-white font-mono font-medium text-[10px] tracking-wider uppercase rounded-full hover:bg-[#4E4237] transition-all"
              >
                <Plus size={11} />
                录入登记新服装
              </button>
            )}
          </div>
        </div>
      </header>

      {/* DUAL WORKSPACE PANEL */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* VIEW 1: COCKPIT CONTROLS & MONITORING TELEMETRY (7 Cols / Left panel) */}
        {viewMode === 'hybrid' && (
          <section className="lg:col-span-7 flex flex-col gap-6 order-2 lg:order-1">
            
            {/* INDUSTRIAL SYSTEM GUIDELINES */}
            <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5 relative overflow-hidden shadow-xs">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Sparkles size={80} className="text-[#B3A596]" />
              </div>
              <h2 className="font-display font-medium text-base text-[#2A2724] flex items-center gap-2 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 bg-[#B3A596] rounded-full" />
                后台数据库控制中心
              </h2>
              <p className="text-xs text-[#8C867E] font-light mt-1.5 leading-relaxed font-sans">
                本数字化管理终端提供 <span className="text-[#2A2724] font-medium">移动端服装管理App</span> 核心逻辑演示及实体数据的后台管理。两侧通过状态机实时联动，支持一键式代码复用模拟。
              </p>
              
              <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono text-[#8C867E] border-t border-[#FAF8F5] pt-4">
                <li className="flex items-start gap-2">
                  <ChevronRight size={11} className="text-[#B3A596] mt-0.5 flex-shrink-0" />
                  <span>点击右侧模拟App上的 <strong className="text-[#2A2724]">技术规格</strong> 即可调取极其详尽的服装材质技术属性。</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={11} className="text-[#B3A596] mt-0.5 flex-shrink-0" />
                  <span>点击卡片下方的 <strong className="text-[#2A2724]">🎬 播送出镜记录</strong> 标签，可多对多筛选当前所选出镜款。</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={11} className="text-[#B3A596] mt-0.5 flex-shrink-0" />
                  <span>启用下面的 <strong className="text-[#2A2724]">RFID 芯片传感器</strong> 模拟电磁天线对实体架衣物的检索。</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={11} className="text-[#B3A596] mt-0.5 flex-shrink-0" />
                  <span>添加、编辑或删除衣服。状态设为“已归档”时，系统将冻结历史并允许编码复用。</span>
                </li>
              </ul>
            </div>

            {/* SYSTEM STATS HUD */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <SlidersHorizontal size={12} className="text-[#B3A596]" />
                <span className="font-mono text-[9px] text-[#8C867E] tracking-widest uppercase">库区智能遥测与诊断指标</span>
              </div>
              <ArchiveStats garments={garments} />
            </div>

            {/* CORE BUSINESS SIMULATOR & SCHEMA TERMINAL */}
            <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5 relative overflow-hidden shadow-xs">
              <div className="flex items-center justify-between border-b border-[#FAF8F5] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Database size={12} className="text-[#B3A596]" />
                  <span className="font-mono text-[10px] text-[#2A2724] tracking-wider uppercase">核心业务仿真 & 关系型数据结构</span>
                </div>
                <div className="flex gap-1">
                  {(['reuse', 'many-to-many', 'json'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSimulatorTab(tab)}
                      className={`px-3 py-1 rounded-full text-[9px] font-mono tracking-wider transition-colors border ${
                        simulatorTab === tab
                          ? 'bg-[#2A2724] border-[#2A2724] text-white font-medium'
                          : 'bg-transparent border-transparent text-[#8C867E] hover:text-[#2A2724]'
                      }`}
                    >
                      {tab === 'reuse' ? '001 编码复用' : tab === 'many-to-many' ? '多对多关联' : 'JSON 结构'}
                    </button>
                  ))}
                </div>
              </div>

              {simulatorTab === 'reuse' && (
                <div className="space-y-4">
                  <p className="text-[11px] text-[#8C867E] leading-relaxed">
                    每件衣服有唯一编码（如 <code className="text-[#2A2724] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#EAE6DF] font-mono font-semibold">001</code>）。当旧衣服不适合拍摄时，更改为 <span className="text-amber-600 font-semibold">“Archived (已归档)”</span> 状态。该编码的历史出镜数据（保留在历史节目记录中）将被安全冻结。系统允许在此编码（001）下全新录入一件 <span className="text-[#B3A596] font-semibold">启用 (Active)</span> 的服装，完美实现<strong className="text-[#2A2724]">“号码不变，内容换新”</strong>核心需求。
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSimulateCodeReuse}
                      disabled={deviceRole === 'display'}
                      className={`flex-1 py-2.5 font-mono font-medium text-xs uppercase tracking-wider transition-all rounded-xl shadow-xs ${
                        deviceRole === 'display'
                          ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
                          : 'bg-[#B3A596] hover:bg-[#4E4237] text-white'
                      }`}
                    >
                      {deviceRole === 'display' 
                        ? '🔒 副屏模式只读中 // 请在主控端点击触发' 
                        : '⚡ 触发 001 编码 “号码不变，内容换新” 复用模拟'}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="font-mono text-[8px] text-[#8C867E] uppercase tracking-wider">复用过程审计日志:</div>
                    <div className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl p-2.5 max-h-[110px] overflow-y-auto custom-scrollbar font-mono text-[10px] text-[#2A2724] space-y-1.5">
                      {simulationLogs.map((log, i) => (
                        <div key={i} className="leading-normal">{log}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {simulatorTab === 'many-to-many' && (
                <div className="space-y-4">
                  <div className="text-[11px] text-[#8C867E] space-y-2 leading-relaxed">
                    <p>
                      系统建立<strong className="text-[#2A2724]">【服装款式表】</strong>和<strong className="text-[#2A2724]">【视频节目期数表】</strong>，二者通过多对多交叉引用的方式实现高周转映射：
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 text-[#8C867E]">
                      <li><strong>视频节目表</strong>：记录出镜期数（如“第3期漫剧”）及本期使用的服装编码列表（如 <code className="text-[#2A2724] bg-[#FAF8F5] px-1 font-mono">["001", "005"]</code>）。</li>
                      <li><strong>服装规格表</strong>：通过 <code className="text-[#2A2724] bg-[#FAF8F5] px-1 font-mono">videoLogs</code> 直接反向索引曾经登场该款衣服的全部视频节目期数。</li>
                    </ol>
                  </div>

                  {/* Code box exhibiting the TypeScript linking logic */}
                  <div className="space-y-1">
                    <div className="font-mono text-[8px] text-[#8C867E] uppercase tracking-wider">多对多反向定位 TypeScript 核心实现:</div>
                    <pre className="p-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-[9px] text-[#2A2724] font-mono overflow-x-auto leading-relaxed">
{`// 1. 视频节目规格定义
interface VideoShow {
  id: string;
  episode: string;       // 视频期数
  garment_codes: string[]; // 出镜衣服编码列表 (如: ["001", "005"])
}

// 2. 服装多对多反向索引定位器
function getEpisodesForGarment(garmentCode: string, shows: VideoShow[]): string[] {
  return shows
    .filter(show => show.garment_codes.includes(garmentCode))
    .map(show => show.episode);
}`}
                    </pre>
                  </div>
                </div>
              )}

              {simulatorTab === 'json' && (
                <div className="space-y-4">
                  <p className="text-[11px] text-[#8C867E] leading-relaxed">
                    当共享编码 <code className="text-[#2A2724] bg-[#FAF8F5] px-1 font-mono">001</code> 旧衣服归档，并登记新购买的新衣服时，同一编码存在两个服装档案记录（旧件 archived，新件 active），历史视频记录安全追溯：
                  </p>

                  <div className="space-y-1">
                    <div className="font-mono text-[8px] text-[#8C867E] uppercase">
                      关系型 JSON 数据结构 (GARMENTS & SHOWS SCHEMA):
                    </div>
                    <pre className="p-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-[9.5px] text-[#2A2724] font-mono overflow-x-auto leading-normal select-text max-h-[180px] overflow-y-auto custom-scrollbar">
{JSON.stringify({
  "garments_table": [
    {
      "id": "g-001-archived",
      "code": "001",
      "name": "GORE-TEX PRO 3L 重工防水冲锋衣 (老版本)",
      "category": "上装",
      "status": "Archived",
      "location": "归档储藏箱 / CO-02",
      "videoLogs": ["🎬 第3期漫剧", "🎬 第5期整蛊"]
    },
    {
      "id": "g-001-active-new",
      "code": "001",
      "name": "GORE-TEX PACLITE 高能轻量罩衣 (新复用)",
      "category": "上装",
      "status": "Active",
      "location": "1号挂架 / C-01分区",
      "videoLogs": []
    }
  ],
  "video_shows_table": [
    {
      "id": "show-003",
      "episode": "🎬 第3期漫剧",
      "garment_codes": ["001", "005"]
    },
    {
      "id": "show-005",
      "episode": "🎬 第5期整蛊",
      "garment_codes": ["001", "002"]
    }
  ]
}, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* RFID HARDWARE SCANNING SIMULATOR */}
            <BarcodeScanner 
              garments={garments} 
              onScanResult={(scannedItem) => {
                // Automatically open this item's detail view on scan
                setSelectedGarment(scannedItem);
              }}
            />

            {/* QUICK STATS & REQUISITION MAPS */}
            <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#FAF8F5] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-3 bg-[#B3A596] rounded-full" />
                  <span className="font-mono text-[10px] text-[#2A2724] tracking-wider uppercase">储物理位置库分布矩阵</span>
                </div>
                <span className="font-mono text-[8px] text-[#8C867E]">存储网络_02_GRID</span>
              </div>

              <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
                {['RACK A', 'RACK B', 'RACK C', 'RACK D', 'CABINET X'].map((rack, i) => {
                  const rackItems = garments.filter(g => g.location.toUpperCase().includes(rack.toUpperCase()));
                  const count = rackItems.length;
                  return (
                    <div 
                      key={rack} 
                      className={`p-3 rounded-xl border transition-colors ${
                        count > 0 
                          ? 'bg-[#FAF8F5] border-[#EAE6DF] text-[#2A2724]' 
                          : 'bg-transparent border-[#FAF8F5]/60 text-zinc-300'
                      }`}
                    >
                      <div className="text-[9px] font-bold text-[#8C867E]">{rack === 'CABINET X' ? '安全箱 X' : rack.replace('RACK', '挂架')}</div>
                      <div className={`text-lg font-bold mt-1 font-display ${count > 0 ? 'text-[#B3A596]' : 'text-zinc-300'}`}>
                        {String(count).padStart(2, '0')}
                      </div>
                      <div className="text-[8px] text-[#8C867E] mt-0.5 uppercase">件数</div>
                    </div>
                  );
                })}
              </div>

              {/* Live active feeds list */}
              <div className="mt-4 pt-3.5 border-t border-[#FAF8F5]">
                <div className="font-mono text-[9px] text-[#8C867E] tracking-wider uppercase mb-2">系统实时审计流及遥测日志</div>
                <div className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl p-2.5 max-h-[100px] overflow-y-auto custom-scrollbar font-mono text-[10px] text-[#8C867E] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">[23:05:42]</span>
                    <span className="text-[#2A2724]">正常 // RFID 网格盘点系统就绪</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">[23:04:11]</span>
                    <span>日志 // 本地持久化分类账目已同步</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">[23:00:03]</span>
                    <span>日志 // 核心系统引导装载完成</span>
                  </div>
                </div>
              </div>

            </div>

            {/* 局域网同步与多端备份控制中心 */}
            <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <Wifi size={15} className="text-emerald-700" />
                  </div>
                  <div>
                    <div className="font-mono text-[10px] text-[#2A2724] tracking-wider uppercase">Cloud sync enabled</div>
                    <div className="text-xs text-[#8C867E] mt-0.5">Signed-in account data syncs through Supabase automatically.</div>
                  </div>
                </div>
                <span className="font-mono text-[9px] px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full shrink-0">Online</span>
              </div>
            </div>

            {false && <>
            <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#FAF8F5] pb-3">
                <div className="flex items-center gap-2">
                  <Wifi size={14} className="text-[#B3A596]" />
                  <span className="font-mono text-[10px] text-[#2A2724] tracking-wider uppercase">局域网同步与多端备份</span>
                </div>
                <span className="font-mono text-[8.5px] px-2 py-0.5 bg-[#FAF8F5] border border-[#EAE6DF] text-[#8C867E] rounded-full">
                  100% 本地局域网
                </span>
              </div>

              {/* Guide block */}
              <div className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl p-3.5 text-xs text-[#8C867E] leading-relaxed space-y-1.5">
                <h4 className="font-bold text-[#2A2724] flex items-center gap-1.5">
                  <Info size={12} className="text-[#B3A596]" />
                  如何在局域网内的其他设备上使用？
                </h4>
                <ol className="list-decimal pl-4 space-y-1 font-sans text-[11px]">
                  <li>
                    <strong>极速多端访问</strong>：本系统在局域网内全面开放。打开电脑终端运行 <code className="bg-white border border-[#EAE6DF] px-1 rounded font-mono text-[10px] text-[#2A2724]">ipconfig</code> / <code className="bg-white border border-[#EAE6DF] px-1 rounded font-mono text-[10px] text-[#2A2724]">ifconfig</code> 找到您的局域网 IP (例如 <code className="text-[#2A2724] font-mono">192.168.x.x</code>)。
                  </li>
                  <li>
                    在同 Wi-Fi/局域网下的手机或另一台电脑上，直接用浏览器访问 <code className="text-[#B3A596] font-mono font-bold select-all bg-white border border-[#EAE6DF] px-1 rounded">http://&lt;主机局域网IP&gt;:3000</code>。
                  </li>
                  <li>
                    <strong>一键同步数据</strong>：您可以通过下方提供的方法在两端同步数据。
                  </li>
                </ol>
              </div>

              {/* Sync controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Mode 1: File based */}
                <div className="border border-[#EAE6DF] rounded-xl p-3 bg-[#FAF8F5]/30 flex flex-col justify-between space-y-3">
                  <div>
                    <h5 className="font-mono text-[9px] text-[#2A2724] tracking-wider uppercase font-bold flex items-center gap-1">
                      <FileJson size={11} className="text-[#B3A596]" />
                      方法一：本地文件备份/同步
                    </h5>
                    <p className="text-[10px] text-[#8C867E] mt-1 leading-normal">
                      导出包含全部高清图片(Base64格式)与分类的完整数据包文件，体积无上限，适合全量备份与局域网文件流转。
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={handleExportData}
                      className="w-full py-2 bg-[#2A2724] hover:bg-[#4E4237] text-white font-mono text-[10px] tracking-widest uppercase font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-3xs"
                    >
                      <Download size={11} />
                      1. 导出备份 JSON 文件
                    </button>

                    <div className="border border-[#EAE6DF] rounded-lg bg-white p-2 text-center relative overflow-hidden">
                      <input
                        type="file"
                        accept=".json"
                        id="sync-file-input"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const mode = window.confirm("请选择导入模式：\n\n【确定】为 覆盖导入 (替换全部数据)\n【取消】为 增量合并 (仅合并非重复数据)") ? 'overwrite' : 'merge';
                            handleImportData(file, mode);
                            e.target.value = ''; // Reset
                          }
                        }}
                      />
                      <div className="flex items-center justify-center gap-1.5 text-[#8C867E] hover:text-[#2A2724] transition-colors">
                        <Upload size={11} className="text-[#B3A596]" />
                        <span className="font-mono text-[10px] font-medium uppercase tracking-wider">2. 选择备份文件导入</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mode 2: Clipboard based sync */}
                <div className="border border-[#EAE6DF] rounded-xl p-3 bg-[#FAF8F5]/30 flex flex-col justify-between space-y-3">
                  <div>
                    <h5 className="font-mono text-[9px] text-[#2A2724] tracking-wider uppercase font-bold flex items-center gap-1">
                      <Copy size={11} className="text-[#B3A596]" />
                      方法二：极速文本同步码
                    </h5>
                    <p className="text-[10px] text-[#8C867E] mt-1 leading-normal">
                      将衣橱数据编码为一段文本，方便通过微信、AirDrop 等直接复制。仅适用于文本 URL 型图片的多端快速对调。
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={handleCopySyncCode}
                      className="w-full py-2 bg-white hover:bg-[#FAF8F5] border border-[#EAE6DF] text-[#2A2724] font-mono text-[10px] tracking-widest uppercase font-medium rounded-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} className="text-[#B3A596]" />}
                      {copied ? '已复制同步码！' : '1. 复制全量同步码'}
                    </button>

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={syncCode}
                        onChange={(e) => setSyncCode(e.target.value)}
                        placeholder="在此粘贴同步码进行同步..."
                        className="flex-grow bg-white border border-[#EAE6DF] rounded-lg px-2 py-1.5 text-[10px] text-[#2A2724] focus:outline-none focus:border-[#B3A596] font-sans"
                      />
                      <button
                        onClick={() => {
                          if (!syncCode.trim()) return;
                          const mode = window.confirm("请选择导入模式：\n\n【确定】为 覆盖导入 (替换全部数据)\n【取消】为 增量合并 (仅合并非重复数据)") ? 'overwrite' : 'merge';
                          handlePasteSyncCode(syncCode, mode);
                        }}
                        className="bg-[#2A2724] hover:bg-[#4E4237] text-white rounded-lg px-2.5 py-1.5 text-[10px] font-mono tracking-wider uppercase transition-colors"
                      >
                        导入
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PWA 极速安装与独立客户端控制中心 */}
            <div className="bg-white border border-[#EAE6DF] rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#FAF8F5] pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone size={14} className="text-[#B3A596]" />
                  <span className="font-mono text-[10px] text-[#2A2724] tracking-wider uppercase">PWA 极速独立应用配置</span>
                </div>
                <span className={`font-mono text-[8.5px] px-2 py-0.5 border rounded-full transition-all ${isPwaInstalled ? 'bg-green-50 border-green-200 text-green-700' : 'bg-[#FAF8F5] border-[#EAE6DF] text-[#8C867E]'}`}>
                  {isPwaInstalled ? '✓ 已添加独立应用' : '离线极速引擎就绪'}
                </span>
              </div>

              {/* Summary description */}
              <div className="text-xs text-[#8C867E] leading-relaxed space-y-2">
                <p>
                  本系统已原生配置 <strong>Progressive Web App (PWA)</strong> 支持。您可以将系统添加为手机主屏幕应用或电脑桌面独立客户端，享受原生级别的无边框极致顺畅触觉体验。
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-[#FAF8F5] border border-[#EAE6DF] p-2.5 rounded-xl space-y-1">
                    <span className="font-bold text-[10px] text-[#2A2724] flex items-center gap-1 font-mono uppercase">
                      <Laptop size={11} className="text-[#B3A596]" /> 
                      PC 端/电脑桌面
                    </span>
                    <p className="text-[10px] text-[#8C867E]">
                      支持 Windows & Mac。拥有独立的无边框应用视窗，免去浏览器网址繁琐输入，运行极为顺滑。
                    </p>
                  </div>
                  <div className="bg-[#FAF8F5] border border-[#EAE6DF] p-2.5 rounded-xl space-y-1">
                    <span className="font-bold text-[10px] text-[#2A2724] flex items-center gap-1 font-mono uppercase">
                      <Smartphone size={11} className="text-[#B3A596]" /> 
                      移动端/手机主屏幕
                    </span>
                    <p className="text-[10px] text-[#8C867E]">
                      完美兼容 安卓 & 苹果 iOS。像原生 APP 一样支持全屏触控与防误触，无任何浏览器工具栏干扰。
                    </p>
                  </div>
                </div>
              </div>

              {/* Install trigger button */}
              <div className="pt-1">
                {deferredPrompt ? (
                  <button
                    onClick={handleInstallPwa}
                    className="w-full py-2.5 bg-[#2A2724] hover:bg-[#4E4237] text-white font-mono text-[10px] tracking-widest uppercase font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-3xs"
                  >
                    <Download size={11} />
                    立即一键安装到当前设备 (推荐)
                  </button>
                ) : (
                  <div className="space-y-3 bg-[#FAF8F5]/50 border border-[#EAE6DF] p-3 rounded-xl">
                    <div className="flex items-start gap-2">
                      <Info size={12} className="text-[#B3A596] mt-0.5 shrink-0" />
                      <div>
                        <h6 className="font-sans text-[11px] font-bold text-[#2A2724]">如何手动添加系统至桌面/手机？</h6>
                        <p className="text-[10px] text-[#8C867E] leading-normal mt-0.5">
                          若一键安装未自动触发（部分浏览器或代理环境安全限制），您随时可以按以下指南手动安装，效果完全一致：
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] border-t border-[#EAE6DF]/60 pt-2.5">
                      <div className="space-y-1">
                        <span className="font-bold text-[#2A2724]">📱 苹果 iOS 手机 / iPad 端：</span>
                        <p className="text-[#8C867E] pl-1 leading-relaxed">
                          1. 使用系统自带的 <strong className="text-[#2A2724]">Safari 浏览器</strong> 打开当前网页。<br />
                          2. 点击浏览器底部正下方的 <strong className="text-[#2A2724]">“分享”</strong> 图标（向上箭头的方框）。<br />
                          3. 往下滑动并选择 <strong className="text-[#2A2724]">“添加到主屏幕”</strong> 并点击“添加”即可！
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-[#2A2724]">🤖 安卓手机 / PC / Mac 端：</span>
                        <p className="text-[#8C867E] pl-1 leading-relaxed">
                          1. 推荐使用谷歌 <strong className="text-[#2A2724]">Chrome 浏览器</strong>。<br />
                          2. 手机端：点击浏览器右上角菜单，选择 <strong className="text-[#2A2724]">“安装应用”</strong> 或 “添加到主屏幕”。<br />
                          3. 电脑端：直接点击浏览器地址栏右侧出现的 <strong className="text-[#2A2724]">“安装” 电脑图标</strong> 进行一键安装。
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </>}

          </section>
        )}

        {/* VIEW 2: SIMULATED SMARTPHONE FRAME CONTAINER (5 Cols / Right or Center panel) */}
        <section className={`flex flex-col items-center justify-center ${viewMode === 'hybrid' ? 'lg:col-span-5 order-1 lg:order-2' : 'lg:col-span-12'}`}>
          
          {/* PHONE FRAME CHASSIS (Exquisite Warm Charcoal/Sand Minimalist smartphone mockup) */}
          <div className="relative w-full max-w-[390px] aspect-[9/18.5] bg-[#2A2724] border-[10px] border-[#2A2724] rounded-[48px] shadow-2xl overflow-hidden ring-1 ring-[#EAE6DF] flex flex-col justify-between">
            
            {/* PHONE SPEAKER & CAMERA DOCK NOTCH */}
            <div className="absolute top-0 inset-x-0 h-6 bg-[#2A2724] rounded-b-xl z-50 flex items-center justify-center">
              <div className="w-20 h-3 bg-black rounded-full flex items-center justify-between px-3">
                <div className="w-10 h-0.5 bg-zinc-800 rounded-full" />
                <div className="w-1 h-1 bg-zinc-900 rounded-full" />
              </div>
            </div>

            {/* PHONE UPPER CORNER LIGHT SHADOWS */}
            <div className="absolute top-6 inset-x-0 h-4 bg-gradient-to-b from-black/10 to-transparent pointer-events-none z-40" />

            {/* INTERNAL PHONE SCREEN CONTAINER */}
            <div className="flex-grow flex flex-col justify-between h-full bg-[#FAF8F5] text-[#2A2724] select-none overflow-hidden relative pt-6">
              
              {/* PHONE VIRTUAL STATUS BAR */}
              <div className="px-6 pt-1.5 pb-2 flex justify-between items-center text-[10px] font-mono text-[#8C867E] bg-[#FAF8F5] z-30 select-none">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-[#2A2724]">09:41</span>
                  <span className="text-[8px] px-1 bg-white border border-[#EAE6DF] rounded text-zinc-500">5G</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] text-[#8C867E]">安全链路加密</span>
                  <div className="w-5 h-2.5 border border-[#B3A596] rounded-xs p-0.5 flex items-center">
                    <div className="bg-[#B3A596] w-3 h-full rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* APP PHONE VIEW SCROLLABLE WINDOW */}
              <div className="flex-grow flex flex-col justify-between overflow-y-auto custom-scrollbar relative px-4 pb-48">
                
                {/* SEARCH INPUT BAR */}
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#8C867E]">
                    <Search size={14} />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索名称、共享编码、材质标签..."
                    className="w-full bg-white border border-[#EAE6DF] rounded-full pl-9 pr-8 py-2 text-xs text-[#2A2724] font-sans focus:outline-none focus:border-[#B3A596] placeholder-[#8C867E] transition-all shadow-2xs"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-3 flex items-center text-[#8C867E] hover:text-[#2A2724] font-mono text-[9px]"
                    >
                      清空
                    </button>
                  )}
                </div>

                {/* FILTER CATEGORY SCROLL BAR (Pills layout) */}
                <div className="mb-4">
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Filter size={10} className="text-[#8C867E]" />
                      <span className="font-mono text-[8px] text-[#8C867E] tracking-wider uppercase">服装类别检索</span>
                    </div>
                    <button
                      onClick={() => setIsManageCategoriesOpen(true)}
                      className="text-[11px] font-mono text-[#8C867E] hover:text-[#2A2724] border border-[#EAE6DF] bg-white rounded-md px-2.5 py-1 flex items-center gap-1.5 transition-all shadow-3xs"
                    >
                      <SlidersHorizontal size={11} />
                      管理品类
                    </button>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar-horizontal scroll-smooth">
                    {([ 'All', ...categories.filter(c => c !== 'All' && c !== '无') ] as GarmentCategory[]).map((cat) => {
                      const catNameMap: Record<string, string> = {
                        All: '全部',
                        上装: '上装',
                        下装: '下装',
                        套装: '套装',
                        丝袜: '丝袜',
                        鞋子: '鞋子',
                        已搭配好服装: '搭配好'
                      };
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-mono tracking-wider transition-all whitespace-nowrap flex-shrink-0 border ${
                            selectedCategory === cat
                              ? 'bg-[#2A2724] border-[#2A2724] text-white font-medium shadow-xs'
                              : 'bg-white border-[#EAE6DF] text-[#8C867E] hover:text-[#2A2724] hover:border-[#B3A596]'
                          }`}
                        >
                          {catNameMap[cat] || cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* FILTER STATUS ACCORDION (Active versus Archived toggle) */}
                <div className="flex items-center justify-between gap-4 mb-4 bg-white p-2.5 rounded-xl border border-[#EAE6DF]">
                  <div className="flex items-center gap-1.5">
                    <Database size={10} className="text-[#8C867E]" />
                    <span className="font-mono text-[8px] text-[#8C867E] tracking-wider uppercase">库位状态筛选</span>
                  </div>
                  <div className="flex gap-1">
                    {(['All', 'Active', 'Archived'] as FilterStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => setSelectedStatus(st)}
                        className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-mono tracking-wider transition-colors border ${
                          selectedStatus === st
                            ? 'bg-[#FAF8F5] border-[#B3A596] text-[#2A2724] font-semibold'
                            : 'bg-transparent border-transparent text-[#8C867E] hover:text-[#2A2724]'
                        }`}
                      >
                        {st === 'All' ? '全部' : st === 'Active' ? '仅使用' : '仅归档'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ACTIVE BROADCAST INTERLINK FILTER CHIP */}
                {selectedVideoLog && (
                  <div className="mb-4 bg-[#FAF8F5] border border-[#B3A596] p-2 rounded-xl flex items-center justify-between text-xs font-mono animate-fade-in shadow-2xs">
                    <div className="flex items-center gap-1.5 text-[#2A2724] overflow-hidden">
                      <Tag size={11} className="flex-shrink-0 text-[#B3A596]" />
                      <span className="text-[10px] font-semibold truncate">出镜视频: {selectedVideoLog}</span>
                    </div>
                    <button
                      onClick={() => setSelectedVideoLog(null)}
                      className="text-[8px] text-[#8C867E] hover:text-[#2A2724] px-2 py-0.5 bg-white border border-[#EAE6DF] rounded-full uppercase tracking-wider"
                    >
                      取消 ×
                    </button>
                  </div>
                )}

                {/* APP LIST VIEW */}
                <div>
                  {filteredGarments.length > 0 ? (
                    <div className={`grid ${
                      gridColumns === 5
                        ? 'grid-cols-5 gap-1.5'
                        : gridColumns === 4 
                          ? 'grid-cols-4 gap-2' 
                          : gridColumns === 3 
                            ? 'grid-cols-3 gap-2.5' 
                            : 'grid-cols-2 gap-3'
                    }`}>
                      {filteredGarments.map((item) => (
                        <GarmentCard
                          key={item.id}
                          garment={item}
                          onSelect={(g) => setSelectedGarment(g)}
                          selectedVideoLog={selectedVideoLog}
                          onSelectVideoLog={setSelectedVideoLog}
                          layoutMode={layoutMode}
                          imageFit={imageFit}
                          imagePadding={imagePadding}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed border-[#EAE6DF] rounded-xl p-8 text-center bg-white">
                      <span className="font-mono text-[10px] text-[#8C867E] block mb-2 uppercase">未检索到服装档案</span>
                      <p className="text-xs text-[#8C867E] font-light">当前条件筛选下未找到任何衣物记录。</p>
                      <button
                        onClick={() => {
                          setSelectedCategory('All');
                          setSelectedStatus('All');
                          setSelectedVideoLog(null);
                          setSearchQuery('');
                        }}
                        className="mt-3 font-mono text-[9px] px-3 py-1 bg-[#FAF8F5] border border-[#EAE6DF] rounded-full text-[#2A2724] hover:border-[#B3A596] uppercase tracking-wider transition-all"
                      >
                        清除所有筛选
                      </button>
                    </div>
                  )}
                </div>

                {/* Micro padding helper */}
                <div className="h-6" />

              </div>

              {/* PHONE FOOTER FLOATING APP BAR */}
              <div className="absolute bottom-0 inset-x-0 p-4 bg-white/95 border-t border-[#EAE6DF] z-30 backdrop-blur-md flex flex-col gap-2.5">
                {/* Fixed Dynamic Zoom Slider driving column counts and padding concurrently */}
                <div className="bg-[#FAF8F5] px-3 py-2.5 rounded-xl border border-[#EAE6DF]/70 shadow-3xs flex items-center gap-2">
                  <SlidersHorizontal size={12} className="text-[#B3A596] shrink-0" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(Number(e.target.value))}
                    className="w-full accent-[#B3A596] h-1 bg-[#EAE6DF] rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingGarment(null);
                    setIsFormOpen(true);
                  }}
                  className="w-full py-2.5 bg-[#2A2724] hover:bg-[#4E4237] rounded-full flex items-center justify-center gap-1.5 text-xs font-mono tracking-widest text-white transition-all shadow-sm active:scale-98"
                >
                  <Plus size={14} />
                  登记录入服装规格档案
                </button>
              </div>

            </div>

            {/* VIRTUAL HOME BUTTON SCREEN BAR */}
            <div className="absolute bottom-1 inset-x-0 h-1.5 flex items-center justify-center z-50">
              <div className="w-32 h-1 bg-zinc-800 rounded-full" />
            </div>

          </div>

          {/* VIBRANT DISPLAY CAPTIONS UNDER PHONE */}
          <div className="mt-4 text-center font-mono text-[10px] text-[#8C867E] tracking-wider uppercase">
            ◄ 点击或操作右侧手机画面来模拟测试移动端 App 交互 ►
          </div>

        </section>

      </main>

      {/* FOOTER METRIC BRAND */}
      <footer className="border-t border-[#EAE6DF] bg-[#FAF8F5] py-6 px-6 relative z-10 text-center font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8C867E]">
          <div>
            系统 // 数据库在线同步就绪
          </div>
          <div>
            数字化服装智能管理系统 © 2026 // 简约艺术衣橱工作台控制设备
          </div>
        </div>
      </footer>

      {/* --- FLOATING OVERLAY MODALS --- */}

      {/* 1. ARCHIVE SPEC SHEET INSPECT OVERLAY (Garment detail sheet) */}
      {selectedGarment && (
        <GarmentDetailModal
          garment={selectedGarment}
          allGarments={garments}
          onUpdateGarment={handleUpdateGarment}
          onSelectGarment={(g) => setSelectedGarment(g)}
          onClose={() => setSelectedGarment(null)}
          onToggleStatus={handleToggleStatus}
          onDelete={(id) => {
            handleDeleteGarment(id);
            setSelectedGarment(null);
          }}
          onEdit={(g) => {
            setEditingGarment(g);
            setIsFormOpen(true);
          }}
          selectedVideoLog={selectedVideoLog}
          onSelectVideoLog={setSelectedVideoLog}
          categories={categories}
        />
      )}

      {/* 2. REGISTRY / EDITOR EDITOR WINDOW */}
      {isFormOpen && (
        <GarmentForm
          garment={editingGarment}
          onSave={handleSaveGarment}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingGarment(null);
          }}
          categories={categories}
        />
      )}

      {/* 3. CATEGORY MANAGEMENT OVERLAY DIALOG */}
      {isManageCategoriesOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans animate-fade-in" id="manage-categories-modal">
          <div className="bg-white rounded-2xl border border-[#EAE6DF] w-full max-w-md shadow-xl flex flex-col overflow-hidden max-h-[85vh] animate-scale-up">
            
            {/* Header */}
            <div className="p-4 border-b border-[#EAE6DF] flex justify-between items-center bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-[#B3A596]" />
                <h3 className="text-base font-semibold text-[#2A2724]">管理品类 (服装类别)</h3>
              </div>
              <button
                onClick={() => setIsManageCategoriesOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-5">
              {/* Add New Category form */}
              <CategoryAddForm onAdd={handleAddCategory} />

              {/* List of categories */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-[#8C867E] tracking-wider uppercase mb-1.5">
                  现有品类 ({categories.length})
                </div>
                <div className="divide-y divide-[#FAF8F5] max-h-[40vh] overflow-y-auto pr-1">
                  {categories.map((cat) => (
                    <CategoryRow 
                      key={cat} 
                      name={cat} 
                      onRename={(newName) => handleRenameCategory(cat, newName)}
                      onDelete={() => handleDeleteCategory(cat)}
                      isSystem={['All', '无'].includes(cat)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#EAE6DF] bg-[#FAF8F5] flex justify-end">
              <button
                type="button"
                onClick={() => setIsManageCategoriesOpen(false)}
                className="bg-[#2A2724] hover:bg-[#1f1d1b] text-white text-sm px-6 py-2.5 rounded-xl transition-colors font-medium shadow-xs"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// --- Dynamic Category Management Helper Sub-Components ---

function CategoryAddForm({ onAdd }: { onAdd: (name: string) => string | null | Promise<string | null> }) {
  const [newCat, setNewCat] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newCat.trim();
    if (!trimmed) return;
    const errMsg = await onAdd(trimmed);
    if (errMsg) {
      setError(errMsg);
    } else {
      setNewCat('');
      setError('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 bg-[#FAF8F5] p-4 rounded-xl border border-[#EAE6DF]">
      <label className="block text-xs font-mono text-[#8C867E] tracking-wider uppercase font-semibold">新增品类</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={newCat}
          onChange={(e) => {
            setNewCat(e.target.value);
            if (error) setError('');
          }}
          placeholder="例如：配饰、包袋、背心"
          className="flex-grow bg-white border border-[#EAE6DF] rounded-xl px-3.5 py-2.5 text-sm text-[#2A2724] focus:outline-none focus:border-[#B3A596]"
          maxLength={15}
        />
        <button
          type="submit"
          className="bg-[#B3A596] hover:bg-[#a39484] text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1 shadow-2xs"
        >
          <Plus size={14} />
          添加
        </button>
      </div>
      {error && <p className="text-xs text-red-500 font-sans">{error}</p>}
    </form>
  );
}

function CategoryRow({ 
  name, 
  onRename, 
  onDelete, 
  isSystem 
}: { 
  name: string; 
  onRename: (newName: string) => string | null | Promise<string | null>; 
  onDelete: () => void; 
  isSystem: boolean; 
  key?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === name) {
      setIsEditing(false);
      return;
    }
    const errMsg = await onRename(trimmed);
    if (errMsg) {
      setError(errMsg);
    } else {
      setIsEditing(false);
      setError('');
    }
  };

  if (isSystem) return null;

  if (confirmDelete) {
    return (
      <div className="py-3.5 flex items-center justify-between gap-3 bg-red-50/50 px-3.5 rounded-xl border border-red-100 animate-pulse">
        <span className="text-xs text-red-600 font-sans">确认删除 "{name}"？相关服装类别将归类为 "无"</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              onDelete();
              setConfirmDelete(false);
            }}
            className="bg-red-500 hover:bg-red-600 text-white text-[11px] px-3 py-1 rounded-md"
          >
            删除
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="bg-white hover:bg-[#FAF8F5] text-zinc-500 border border-[#EAE6DF] text-[11px] px-3 py-1 rounded-md"
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-3 flex items-center justify-between gap-3">
      {isEditing ? (
        <div className="flex-grow flex flex-col gap-1.5">
          <div className="flex gap-1.5 items-center">
            <input
              type="text"
              value={editName}
              onChange={(e) => {
                setEditName(e.target.value);
                if (error) setError('');
              }}
              className="flex-grow bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg px-3 py-1.5 text-sm text-[#2A2724] focus:outline-none focus:border-[#B3A596]"
              autoFocus
              maxLength={15}
            />
            <button
              onClick={handleSave}
              className="bg-[#2A2724] hover:bg-black text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              保存
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditName(name);
                setError('');
              }}
              className="bg-[#FAF8F5] hover:bg-[#EAE6DF] border border-[#EAE6DF] text-zinc-500 text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              取消
            </button>
          </div>
          {error && <span className="text-[10px] text-red-500">{error}</span>}
        </div>
      ) : (
        <>
          <span className="text-sm text-[#2A2724] font-medium">{name}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsEditing(true)}
              className="text-[#8C867E] hover:text-[#2A2724] p-1.5 transition-colors hover:bg-zinc-100 rounded-lg"
              title="重命名"
            >
              <Edit3 size={13} />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-[#8C867E] hover:text-red-500 p-1.5 transition-colors hover:bg-red-50 rounded-lg"
              title="删除"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
