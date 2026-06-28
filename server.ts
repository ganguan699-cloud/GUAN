import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set up body parser with high size limits for custom image base64 strings
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  const STORE_PATH = path.join(process.cwd(), 'data-store.json');

  // Default data configuration
  let currentData = {
    garments: [] as any[],
    categories: ['All', '无', '外套 Shell', '战术马甲 Vest', '机能长裤 Pants', '重型战术靴 Boots', '机能挂包 Bags']
  };

  // Seed default data if store file doesn't exist
  if (fs.existsSync(STORE_PATH)) {
    try {
      currentData = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
    } catch (e) {
      console.error('Failed to parse data-store.json', e);
    }
  } else {
    // Populate with original garments from src/data.ts
    currentData.garments = [
      {
        id: 'g-001',
        code: '001',
        name: 'GORE-TEX PRO 3L 重工防水冲锋衣',
        category: '外套 Shell',
        image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=600&h=800',
        images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=600&h=800'],
        status: 'Active',
        location: '1号挂架 / A-04分区',
        videoLogs: ['🎬 第3期漫剧', '🎬 第5期整蛊', '🎬 第12期机能指南'],
        materials: 'Nylon 100% (Gore-Tex Pro 三层压胶面料)',
        details: '配备 YKK AquaGuard 密合防水拉链，3D立体剪裁肘部关节，磁吸式快速开合防风风帽。',
        functionality: ['28,000mm强效防水', '极度防风', '透气耐磨', '模块化兜帽'],
        weight: '520g',
        createdAt: '2026-02-14',
      },
      {
        id: 'g-002',
        code: '002',
        name: 'M-65 模块化战术胸挂背心',
        category: '战术马甲 Vest',
        image: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=600&h=800',
        images: ['https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=600&h=800'],
        status: 'Active',
        location: '1号挂架 / B-01分区',
        videoLogs: ['🎬 第2期穿搭', '🎬 第5期整蛊', '🎬 第10期荒野生存'],
        materials: 'Cordura® 1000D 弹道尼龙 / 3D 蜂窝透气网格',
        details: '重型战术胸挂，配备激光切割 MOLLE 挂载系统、德国 Fidlock® 磁吸快开扣及双侧饮水管通道。',
        functionality: ['MOLLE系统扩充', '超强防磨', '高负重承托', 'Fidlock磁吸扣'],
        weight: '380g',
        createdAt: '2026-03-22',
      },
      {
        id: 'g-003',
        code: '003',
        name: '不对称多口袋战术工装裤',
        category: '机能长裤 Pants',
        image: 'https://images.unsplash.com/photo-1517423568366-8b83523034fd?auto=format&fit=crop&q=80&w=600&h=800',
        images: ['https://images.unsplash.com/photo-1517423568366-8b83523034fd?auto=format&fit=crop&q=80&w=600&h=800'],
        status: 'Archived',
        location: '2号挂架 / C-02分区',
        videoLogs: ['🎬 第1期极限测评', '🎬 第3期漫剧'],
        materials: '棉涤耐磨抗撕裂格子布 (DWR防泼水涂层)',
        details: '设计有双向快取超大工装口袋、180度攀爬膝部裁片，脚踝部弹力抽绳抽褶可收紧裤脚。',
        functionality: ['高效防泼水', '十口袋收纳', '180°跨步剪裁', '双层耐磨膝盖'],
        weight: '640g',
        createdAt: '2026-01-10',
      },
      {
        id: 'g-004',
        code: '004',
        name: '暗黑系全天候中帮战术靴',
        category: '重型战术靴 Boots',
        image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&q=80&w=600&h=800',
        images: ['https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&q=80&w=600&h=800'],
        status: 'Active',
        location: '2号挂架 / D-02分区',
        videoLogs: ['🎬 第3期漫剧', '🎬 第7期雨林生存', '🎬 第15期暗黑鞋评'],
        materials: '哑光科技合成皮革 / Kevlar® 凯夫拉防刺护板',
        details: '高性能全天候鞋履，配备 Vibram® 黄金大底、Boa 双轴旋钮快速系带以及防水透气微孔内衬。',
        functionality: ['Vibram防滑大底', '凯夫拉防刺穿', 'Boa旋钮快速系带', '超强抗寒保暖'],
        weight: '820g',
        createdAt: '2026-04-05',
      },
      {
        id: 'g-005',
        code: '005',
        name: '模块化 X-Pac 防水轻量胸包',
        category: '机能挂包 Bags',
        image: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&q=80&w=600&h=800',
        images: ['https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&q=80&w=600&h=800'],
        status: 'Active',
        location: '安全箱柜 X / SLOT 09',
        videoLogs: ['🎬 第8期EDC翻包', '🎬 第12期机能指南'],
        materials: 'Dimension-Polyant® X-Pac VX21 / YKK AquaGuard防水拉链',
        details: '超轻量化全天候防水胸包，带三点式减负背带系统。集成平板电脑夹层，正面带磁吸挂件锁点。',
        functionality: ['X-Pac顶级防水', '三点减负背带', 'Fidlock秒开快扣', '多层多格网'],
        weight: '290g',
        createdAt: '2026-05-18',
      }
    ];
    fs.writeFileSync(STORE_PATH, JSON.stringify(currentData, null, 2), 'utf-8');
  }

  // Real-time synchronization stream clients
  let clients: { id: number; res: any }[] = [];

  function broadcast(eventData: any) {
    clients.forEach(client => {
      client.res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    });
  }

  function saveData() {
    fs.writeFileSync(STORE_PATH, JSON.stringify(currentData, null, 2), 'utf-8');
  }

  // SSE stream endpoint
  app.get('/api/sync/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);

    // Keep connection alive with periodic heartbeats
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      clients = clients.filter(c => c.id !== clientId);
    });
  });

  // REST APIs
  app.get('/api/garments', (req, res) => {
    res.json(currentData.garments);
  });

  app.post('/api/garments', (req, res) => {
    const garment = req.body;
    if (!garment.code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    if (garment.id) {
      // Update
      currentData.garments = currentData.garments.map(g => g.id === garment.id ? { ...g, ...garment } : g);
    } else {
      // Create
      const newGarment = {
        ...garment,
        id: `g-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      currentData.garments.unshift(newGarment);
    }

    saveData();
    broadcast({ type: 'update', source: 'garments' });
    res.json({ success: true, garments: currentData.garments });
  });

  app.delete('/api/garments/:id', (req, res) => {
    const { id } = req.params;
    currentData.garments = currentData.garments.filter(g => g.id !== id);
    saveData();
    broadcast({ type: 'update', source: 'garments' });
    res.json({ success: true, garments: currentData.garments });
  });

  app.get('/api/categories', (req, res) => {
    res.json(currentData.categories);
  });

  app.post('/api/categories', (req, res) => {
    const { categories } = req.body;
    if (Array.isArray(categories)) {
      currentData.categories = categories;
      saveData();
      broadcast({ type: 'update', source: 'categories' });
      res.json({ success: true, categories: currentData.categories });
    } else {
      res.status(400).json({ error: 'Invalid categories format' });
    }
  });

  // Full overwrite (e.g. from local restore/backup)
  app.post('/api/sync/overwrite', (req, res) => {
    const { garments, categories } = req.body;
    if (Array.isArray(garments) && Array.isArray(categories)) {
      currentData.garments = garments;
      currentData.categories = categories;
      saveData();
      broadcast({ type: 'update', source: 'all' });
      res.json({ success: true, garments: currentData.garments, categories: currentData.categories });
    } else {
      res.status(400).json({ error: 'Invalid sync payload' });
    }
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
