import { useState, useEffect } from 'react';
import { Garment } from '../types';
import { Scan, ShieldAlert, Cpu, Check, Play, Square } from 'lucide-react';

interface BarcodeScannerProps {
  garments: Garment[];
  onScanResult: (garment: Garment) => void;
}

export default function BarcodeScanner({ garments, onScanResult }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'searching' | 'success' | 'error'>('idle');
  const [scannedCode, setScannedCode] = useState('');
  const [foundGarment, setFoundGarment] = useState<Garment | null>(null);

  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;

    if (isScanning) {
      setScanStatus('searching');
      setFoundGarment(null);
      setScannedCode('');

      // Step 1: Simulate searching/sweeping
      timer1 = setTimeout(() => {
        if (garments.length === 0) {
          setScanStatus('error');
          setIsScanning(false);
          return;
        }

        // Randomly pick one garment
        const randomIndex = Math.floor(Math.random() * garments.length);
        const selected = garments[randomIndex];
        setFoundGarment(selected);
        setScannedCode(selected.code);
        setScanStatus('success');

        // Step 2: Fire scan success outcome
        timer2 = setTimeout(() => {
          onScanResult(selected);
          setIsScanning(false);
          setScanStatus('idle');
        }, 1200);

      }, 2500);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isScanning, garments, onScanResult]);

  return (
    <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 relative overflow-hidden shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Scan size={14} className="text-[#8C867E]" />
            <span className="font-mono text-[9px] text-[#8C867E] tracking-widest uppercase">智能识别 // RFID 扫描仪</span>
          </div>
          <h3 className="font-display text-lg font-medium text-[#2A2724] tracking-tight">
            无线网格 RFID 衣物快速检索盘点
          </h3>
          <p className="text-xs text-[#8C867E] font-light mt-1 max-w-lg leading-relaxed">
            模拟使用高频 RFID 环路雷达无感扫描本地衣架芯片，自动在终端打开对应服装的数字规格面板。
          </p>
        </div>

        <div>
          {!isScanning ? (
            <button
              onClick={() => setIsScanning(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#2A2724] hover:bg-[#4E4237] text-white font-mono text-xs tracking-wider uppercase rounded-full transition-all shadow-sm active:scale-95"
            >
              <Play size={10} fill="currentColor" />
              启动雷达扫描
            </button>
          ) : (
            <button
              onClick={() => {
                setIsScanning(false);
                setScanStatus('idle');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#FAF8F5] border border-[#EAE6DF] hover:bg-[#F5F2EB] text-[#2A2724] font-mono text-xs tracking-wider uppercase rounded-full transition-all"
            >
              <Square size={10} fill="currentColor" />
              停止扫描
            </button>
          )}
        </div>
      </div>

      {/* Interactive HUD Overlay Panel */}
      {isScanning && (
        <div className="mt-4 border border-[#EAE6DF] bg-[#FAF8F5] rounded-lg p-4 relative overflow-hidden transition-all duration-300">
          
          {/* Scan laser effect with warm tan shade */}
          {scanStatus === 'searching' && (
            <div className="absolute inset-x-0 h-[2px] bg-[#B3A596] shadow-[0_0_8px_#B3A596] opacity-60 left-0 right-0 animate-[bounce_2s_infinite] z-20 pointer-events-none" />
          )}

          {/* Glowing corners for target */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#B3A596]/40" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#B3A596]/40" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#B3A596]/40" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#B3A596]/40" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4 px-2">
            
            {/* Viewfinder Target graphic */}
            <div className="relative w-24 h-24 border border-[#EAE6DF] rounded-full flex items-center justify-center bg-white shadow-inner">
              {/* Spinning compass ticks */}
              <div className={`absolute inset-1.5 border border-dashed border-[#EAE6DF] rounded-full ${scanStatus === 'searching' ? 'animate-[spin_12s_linear_infinite]' : ''}`} />
              <div className={`absolute inset-4 border border-[#B3A596]/10 rounded-full ${scanStatus === 'searching' ? 'animate-pulse' : ''}`} />
              
              {/* Status Graphic */}
              {scanStatus === 'searching' ? (
                <div className="text-[#8C867E] animate-pulse flex flex-col items-center">
                  <Cpu size={20} className="animate-spin text-[#B3A596]" style={{ animationDuration: '4s' }} />
                  <span className="font-mono text-[8px] text-[#8C867E] mt-1.5 tracking-wider">配对中...</span>
                </div>
              ) : (
                <div className="text-[#B3A596] flex flex-col items-center">
                  <Check size={24} className="animate-bounce text-[#B3A596]" />
                  <span className="font-mono text-[8px] text-[#8C867E] tracking-wider uppercase font-semibold">SUCCESS</span>
                </div>
              )}
            </div>

            {/* Scanning HUD Text telemetry */}
            <div className="flex-1 font-mono text-[11px] text-[#2A2724] space-y-1.5 w-full">
              <div className="flex justify-between border-b border-[#EAE6DF] pb-1">
                <span className="text-[#8C867E]">载波频道:</span>
                <span className="font-medium">UHF_SENS_865_MHZ</span>
              </div>
              <div className="flex justify-between border-b border-[#EAE6DF] pb-1">
                <span className="text-[#8C867E]">无线电强度:</span>
                <span className="font-medium">92.4 dBuV (安全稳定)</span>
              </div>
              <div className="flex justify-between border-b border-[#EAE6DF] pb-1">
                <span className="text-[#8C867E]">解码状态:</span>
                {scanStatus === 'searching' ? (
                  <span className="text-[#B3A596] animate-pulse">正在侦测无线芯片波频...</span>
                ) : (
                  <span className="text-[#8C867E] font-bold">100% 同步加载成功</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C867E]">检索结果编码:</span>
                {scanStatus === 'searching' ? (
                  <span className="text-zinc-400">---</span>
                ) : (
                  <span className="text-[#2A2724] font-bold font-mono">[{scannedCode}]</span>
                )}
              </div>
            </div>

            {/* Found Item Mini Panel */}
            {scanStatus === 'success' && foundGarment && (
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-[#EAE6DF] shadow-xs w-full md:w-60 animate-fade-in">
                <img 
                  src={foundGarment.image} 
                  alt={foundGarment.name} 
                  className="w-10 h-14 object-cover rounded bg-[#FAF8F5] border border-[#EAE6DF]"
                  referrerPolicy="no-referrer"
                />
                <div className="overflow-hidden">
                  <div className="font-mono text-[8px] text-[#8C867E]">编码 {foundGarment.code}</div>
                  <div className="text-xs text-[#2A2724] truncate font-medium uppercase tracking-tight">{foundGarment.name}</div>
                  <div className="font-mono text-[8px] text-[#B3A596] mt-0.5">正在打开对应规格档案...</div>
                </div>
              </div>
            )}

            {scanStatus === 'error' && (
              <div className="flex items-center gap-3 bg-red-50 p-2.5 rounded-lg border border-red-100 text-red-600 w-full md:w-60">
                <ShieldAlert size={16} />
                <div>
                  <div className="font-mono text-[8px] uppercase tracking-wider font-semibold">无响应信号</div>
                  <div className="text-xs">未找到任何有效的服装数据。</div>
                </div>
              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
}
