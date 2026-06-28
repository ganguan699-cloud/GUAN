export interface Garment {
  id: string;
  code: string; // e.g. "001"
  name: string;
  category?: string;
  image: string;
  images?: string[]; // Multiple images support
  status: 'Active' | 'Archived';
  location: string; // e.g. "Rack A-04"
  videoLogs: string[]; // e.g. ["🎬 第3期漫剧", "🎬 第5期整蛊"]
  materials: string; // e.g. "Gore-Tex Pro 3L"
  details: string; // Key details
  functionality: string[]; // e.g. ["Waterproof", "Windproof", "Modular"]
  weight: string; // e.g. "450g"
  createdAt: string;
  matchedGarmentIds?: string[];
}

export type GarmentCategory = string; // 'All' or custom category
export type FilterStatus = 'All' | 'Active' | 'Archived';
