var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "100mb" }));
  app.use(import_express.default.urlencoded({ limit: "100mb", extended: true }));
  const STORE_PATH = import_path.default.join(process.cwd(), "data-store.json");
  let currentData = {
    garments: [],
    categories: ["All", "\u65E0", "\u5916\u5957 Shell", "\u6218\u672F\u9A6C\u7532 Vest", "\u673A\u80FD\u957F\u88E4 Pants", "\u91CD\u578B\u6218\u672F\u9774 Boots", "\u673A\u80FD\u6302\u5305 Bags"]
  };
  if (import_fs.default.existsSync(STORE_PATH)) {
    try {
      currentData = JSON.parse(import_fs.default.readFileSync(STORE_PATH, "utf-8"));
    } catch (e) {
      console.error("Failed to parse data-store.json", e);
    }
  } else {
    currentData.garments = [
      {
        id: "g-001",
        code: "001",
        name: "GORE-TEX PRO 3L \u91CD\u5DE5\u9632\u6C34\u51B2\u950B\u8863",
        category: "\u5916\u5957 Shell",
        image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=600&h=800",
        images: ["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=600&h=800"],
        status: "Active",
        location: "1\u53F7\u6302\u67B6 / A-04\u5206\u533A",
        videoLogs: ["\u{1F3AC} \u7B2C3\u671F\u6F2B\u5267", "\u{1F3AC} \u7B2C5\u671F\u6574\u86CA", "\u{1F3AC} \u7B2C12\u671F\u673A\u80FD\u6307\u5357"],
        materials: "Nylon 100% (Gore-Tex Pro \u4E09\u5C42\u538B\u80F6\u9762\u6599)",
        details: "\u914D\u5907 YKK AquaGuard \u5BC6\u5408\u9632\u6C34\u62C9\u94FE\uFF0C3D\u7ACB\u4F53\u526A\u88C1\u8098\u90E8\u5173\u8282\uFF0C\u78C1\u5438\u5F0F\u5FEB\u901F\u5F00\u5408\u9632\u98CE\u98CE\u5E3D\u3002",
        functionality: ["28,000mm\u5F3A\u6548\u9632\u6C34", "\u6781\u5EA6\u9632\u98CE", "\u900F\u6C14\u8010\u78E8", "\u6A21\u5757\u5316\u515C\u5E3D"],
        weight: "520g",
        createdAt: "2026-02-14"
      },
      {
        id: "g-002",
        code: "002",
        name: "M-65 \u6A21\u5757\u5316\u6218\u672F\u80F8\u6302\u80CC\u5FC3",
        category: "\u6218\u672F\u9A6C\u7532 Vest",
        image: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=600&h=800",
        images: ["https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=600&h=800"],
        status: "Active",
        location: "1\u53F7\u6302\u67B6 / B-01\u5206\u533A",
        videoLogs: ["\u{1F3AC} \u7B2C2\u671F\u7A7F\u642D", "\u{1F3AC} \u7B2C5\u671F\u6574\u86CA", "\u{1F3AC} \u7B2C10\u671F\u8352\u91CE\u751F\u5B58"],
        materials: "Cordura\xAE 1000D \u5F39\u9053\u5C3C\u9F99 / 3D \u8702\u7A9D\u900F\u6C14\u7F51\u683C",
        details: "\u91CD\u578B\u6218\u672F\u80F8\u6302\uFF0C\u914D\u5907\u6FC0\u5149\u5207\u5272 MOLLE \u6302\u8F7D\u7CFB\u7EDF\u3001\u5FB7\u56FD Fidlock\xAE \u78C1\u5438\u5FEB\u5F00\u6263\u53CA\u53CC\u4FA7\u996E\u6C34\u7BA1\u901A\u9053\u3002",
        functionality: ["MOLLE\u7CFB\u7EDF\u6269\u5145", "\u8D85\u5F3A\u9632\u78E8", "\u9AD8\u8D1F\u91CD\u627F\u6258", "Fidlock\u78C1\u5438\u6263"],
        weight: "380g",
        createdAt: "2026-03-22"
      },
      {
        id: "g-003",
        code: "003",
        name: "\u4E0D\u5BF9\u79F0\u591A\u53E3\u888B\u6218\u672F\u5DE5\u88C5\u88E4",
        category: "\u673A\u80FD\u957F\u88E4 Pants",
        image: "https://images.unsplash.com/photo-1517423568366-8b83523034fd?auto=format&fit=crop&q=80&w=600&h=800",
        images: ["https://images.unsplash.com/photo-1517423568366-8b83523034fd?auto=format&fit=crop&q=80&w=600&h=800"],
        status: "Archived",
        location: "2\u53F7\u6302\u67B6 / C-02\u5206\u533A",
        videoLogs: ["\u{1F3AC} \u7B2C1\u671F\u6781\u9650\u6D4B\u8BC4", "\u{1F3AC} \u7B2C3\u671F\u6F2B\u5267"],
        materials: "\u68C9\u6DA4\u8010\u78E8\u6297\u6495\u88C2\u683C\u5B50\u5E03 (DWR\u9632\u6CFC\u6C34\u6D82\u5C42)",
        details: "\u8BBE\u8BA1\u6709\u53CC\u5411\u5FEB\u53D6\u8D85\u5927\u5DE5\u88C5\u53E3\u888B\u3001180\u5EA6\u6500\u722C\u819D\u90E8\u88C1\u7247\uFF0C\u811A\u8E1D\u90E8\u5F39\u529B\u62BD\u7EF3\u62BD\u8936\u53EF\u6536\u7D27\u88E4\u811A\u3002",
        functionality: ["\u9AD8\u6548\u9632\u6CFC\u6C34", "\u5341\u53E3\u888B\u6536\u7EB3", "180\xB0\u8DE8\u6B65\u526A\u88C1", "\u53CC\u5C42\u8010\u78E8\u819D\u76D6"],
        weight: "640g",
        createdAt: "2026-01-10"
      },
      {
        id: "g-004",
        code: "004",
        name: "\u6697\u9ED1\u7CFB\u5168\u5929\u5019\u4E2D\u5E2E\u6218\u672F\u9774",
        category: "\u91CD\u578B\u6218\u672F\u9774 Boots",
        image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&q=80&w=600&h=800",
        images: ["https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&q=80&w=600&h=800"],
        status: "Active",
        location: "2\u53F7\u6302\u67B6 / D-02\u5206\u533A",
        videoLogs: ["\u{1F3AC} \u7B2C3\u671F\u6F2B\u5267", "\u{1F3AC} \u7B2C7\u671F\u96E8\u6797\u751F\u5B58", "\u{1F3AC} \u7B2C15\u671F\u6697\u9ED1\u978B\u8BC4"],
        materials: "\u54D1\u5149\u79D1\u6280\u5408\u6210\u76AE\u9769 / Kevlar\xAE \u51EF\u592B\u62C9\u9632\u523A\u62A4\u677F",
        details: "\u9AD8\u6027\u80FD\u5168\u5929\u5019\u978B\u5C65\uFF0C\u914D\u5907 Vibram\xAE \u9EC4\u91D1\u5927\u5E95\u3001Boa \u53CC\u8F74\u65CB\u94AE\u5FEB\u901F\u7CFB\u5E26\u4EE5\u53CA\u9632\u6C34\u900F\u6C14\u5FAE\u5B54\u5185\u886C\u3002",
        functionality: ["Vibram\u9632\u6ED1\u5927\u5E95", "\u51EF\u592B\u62C9\u9632\u523A\u7A7F", "Boa\u65CB\u94AE\u5FEB\u901F\u7CFB\u5E26", "\u8D85\u5F3A\u6297\u5BD2\u4FDD\u6696"],
        weight: "820g",
        createdAt: "2026-04-05"
      },
      {
        id: "g-005",
        code: "005",
        name: "\u6A21\u5757\u5316 X-Pac \u9632\u6C34\u8F7B\u91CF\u80F8\u5305",
        category: "\u673A\u80FD\u6302\u5305 Bags",
        image: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&q=80&w=600&h=800",
        images: ["https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&q=80&w=600&h=800"],
        status: "Active",
        location: "\u5B89\u5168\u7BB1\u67DC X / SLOT 09",
        videoLogs: ["\u{1F3AC} \u7B2C8\u671FEDC\u7FFB\u5305", "\u{1F3AC} \u7B2C12\u671F\u673A\u80FD\u6307\u5357"],
        materials: "Dimension-Polyant\xAE X-Pac VX21 / YKK AquaGuard\u9632\u6C34\u62C9\u94FE",
        details: "\u8D85\u8F7B\u91CF\u5316\u5168\u5929\u5019\u9632\u6C34\u80F8\u5305\uFF0C\u5E26\u4E09\u70B9\u5F0F\u51CF\u8D1F\u80CC\u5E26\u7CFB\u7EDF\u3002\u96C6\u6210\u5E73\u677F\u7535\u8111\u5939\u5C42\uFF0C\u6B63\u9762\u5E26\u78C1\u5438\u6302\u4EF6\u9501\u70B9\u3002",
        functionality: ["X-Pac\u9876\u7EA7\u9632\u6C34", "\u4E09\u70B9\u51CF\u8D1F\u80CC\u5E26", "Fidlock\u79D2\u5F00\u5FEB\u6263", "\u591A\u5C42\u591A\u683C\u7F51"],
        weight: "290g",
        createdAt: "2026-05-18"
      }
    ];
    import_fs.default.writeFileSync(STORE_PATH, JSON.stringify(currentData, null, 2), "utf-8");
  }
  let clients = [];
  function broadcast(eventData) {
    clients.forEach((client) => {
      client.res.write(`data: ${JSON.stringify(eventData)}

`);
    });
  }
  function saveData() {
    import_fs.default.writeFileSync(STORE_PATH, JSON.stringify(currentData, null, 2), "utf-8");
  }
  app.get("/api/sync/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);
    const heartbeat = setInterval(() => {
      res.write(": heartbeat\n\n");
    }, 15e3);
    req.on("close", () => {
      clearInterval(heartbeat);
      clients = clients.filter((c) => c.id !== clientId);
    });
  });
  app.get("/api/garments", (req, res) => {
    res.json(currentData.garments);
  });
  app.post("/api/garments", (req, res) => {
    const garment = req.body;
    if (!garment.code) {
      return res.status(400).json({ error: "Code is required" });
    }
    if (garment.id) {
      currentData.garments = currentData.garments.map((g) => g.id === garment.id ? { ...g, ...garment } : g);
    } else {
      const newGarment = {
        ...garment,
        id: `g-${Date.now()}`,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      currentData.garments.unshift(newGarment);
    }
    saveData();
    broadcast({ type: "update", source: "garments" });
    res.json({ success: true, garments: currentData.garments });
  });
  app.delete("/api/garments/:id", (req, res) => {
    const { id } = req.params;
    currentData.garments = currentData.garments.filter((g) => g.id !== id);
    saveData();
    broadcast({ type: "update", source: "garments" });
    res.json({ success: true, garments: currentData.garments });
  });
  app.get("/api/categories", (req, res) => {
    res.json(currentData.categories);
  });
  app.post("/api/categories", (req, res) => {
    const { categories } = req.body;
    if (Array.isArray(categories)) {
      currentData.categories = categories;
      saveData();
      broadcast({ type: "update", source: "categories" });
      res.json({ success: true, categories: currentData.categories });
    } else {
      res.status(400).json({ error: "Invalid categories format" });
    }
  });
  app.post("/api/sync/overwrite", (req, res) => {
    const { garments, categories } = req.body;
    if (Array.isArray(garments) && Array.isArray(categories)) {
      currentData.garments = garments;
      currentData.categories = categories;
      saveData();
      broadcast({ type: "update", source: "all" });
      res.json({ success: true, garments: currentData.garments, categories: currentData.categories });
    } else {
      res.status(400).json({ error: "Invalid sync payload" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
