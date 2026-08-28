import React, { useEffect, useState } from 'react';
import { CanvasViewport } from '../types/canvas';
import { playSpatialClick, playConnectChord } from '../services/soundSynth';

interface AutoTourProps {
  isActive: boolean;
  onStop: () => void;
  onLoadTemplate: () => void;
  onExecuteCode: (sourceId: string, payload: any) => void;
  onExportObsidian: () => void;
  onUpdateViewport: React.Dispatch<React.SetStateAction<CanvasViewport>>;
}

export const AutoTour: React.FC<AutoTourProps> = ({
  isActive,
  onStop,
  onLoadTemplate,
  onExecuteCode,
  onExportObsidian,
  onUpdateViewport,
}) => {
  const [cursorPos, setCursorPos] = useState({ x: window.innerWidth - 200, y: window.innerHeight - 200 });
  const [isClicking, setIsClicking] = useState(false);
  const [stepLabel, setStepLabel] = useState('Starting Demo Tour...');

  useEffect(() => {
    if (!isActive) return;

    let isMounted = true;
    let animFrame: number;

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

    const animateCursor = (
      startX: number,
      startY: number,
      targetX: number,
      targetY: number,
      durationMs: number
    ): Promise<void> => {
      return new Promise((resolve) => {
        const startTime = performance.now();

        const tick = (now: number) => {
          if (!isMounted) return;
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / durationMs);
          const eased = easeInOutCubic(progress);

          setCursorPos({
            x: startX + (targetX - startX) * eased,
            y: startY + (targetY - startY) * eased,
          });

          if (progress < 1) {
            animFrame = requestAnimationFrame(tick);
          } else {
            resolve();
          }
        };

        animFrame = requestAnimationFrame(tick);
      });
    };

    const triggerClick = async (soundFreq = 1000) => {
      playSpatialClick(soundFreq, 0.05);
      setIsClicking(true);
      await new Promise((r) => setTimeout(r, 180));
      if (isMounted) setIsClicking(false);
      await new Promise((r) => setTimeout(r, 100));
    };

    const runSequence = async () => {
      try {
        // Step 1: Center Empty State -> Load Template (0s - 3s)
        setStepLabel('01 / Clean Slate Onboarding');
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        await new Promise((r) => setTimeout(r, 600));
        await animateCursor(cursorPos.x, cursorPos.y, centerX, centerY + 38, 1400);
        await triggerClick(800);
        onLoadTemplate();
        playConnectChord();

        // Step 2: Move to TypeScript REPL card -> Click Run (3s - 7s)
        await new Promise((r) => setTimeout(r, 800));
        setStepLabel('02 / In-Browser TypeScript Transpile (Sucrase)');

        // Smooth zoom into code area
        onUpdateViewport((v) => ({ ...v, zoom: 1.1, x: 40, y: 40 }));

        // Target Run button in code card (approx coordinates)
        const replRunX = window.innerWidth > 1400 ? 500 : 440;
        const replRunY = 190;
        await animateCursor(centerX, centerY + 38, replRunX, replRunY, 1500);
        await triggerClick(1200);

        // Execute code and emit reactive signal
        const codeNodeId = 'node_code_signal';
        const payload = {
          frequency: 528,
          waveform: 'triangle',
          barcode: '8710400012345',
          timestamp: new Date().toISOString(),
        };
        onExecuteCode(codeNodeId, payload);

        // Step 3: Pan to Reactive Audio & Barcode nodes (7s - 11s)
        await new Promise((r) => setTimeout(r, 1200));
        setStepLabel('03 / Reactive Graph Data Flow');
        onUpdateViewport((v) => ({ ...v, zoom: 1.05, x: -180, y: 20 }));

        const audioCardX = window.innerWidth > 1400 ? 980 : 860;
        const audioCardY = 280;
        await animateCursor(replRunX, replRunY, audioCardX, audioCardY, 1600);

        // Hover down to barcode
        await new Promise((r) => setTimeout(r, 800));
        await animateCursor(audioCardX, audioCardY, audioCardX, audioCardY + 340, 1400);

        // Step 4: Zoom out to full canvas + Export (11s - 15s)
        await new Promise((r) => setTimeout(r, 1000));
        setStepLabel('04 / Lossless Obsidian .canvas Export');
        onUpdateViewport({ x: 80, y: 80, zoom: 0.9 });

        const exportBtnX = window.innerWidth - 120;
        const exportBtnY = 28;
        await animateCursor(audioCardX, audioCardY + 340, exportBtnX, exportBtnY, 1500);
        await triggerClick(900);
        onExportObsidian();

        // Finish Tour
        await new Promise((r) => setTimeout(r, 1500));
        setStepLabel('✨ Demo Tour Completed');
        await new Promise((r) => setTimeout(r, 1000));
        onStop();
      } catch (_) {}
    };

    runSequence();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animFrame);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden select-none">
      {/* Live Tour Indicator Pill */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#0C0C0E]/90 border border-white/15 backdrop-blur-2xl text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in">
        <span className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse" />
        <span className="text-xs font-mono text-zinc-300 font-semibold">{stepLabel}</span>
        <span className="text-[10px] font-mono text-zinc-500 border-l border-white/10 pl-2">
          Press ESC to exit
        </span>
      </div>

      {/* Simulated Virtual Cursor */}
      <div
        style={{
          transform: `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)`,
          transition: 'transform 0.016s linear',
        }}
        className="absolute top-0 left-0"
      >
        {/* Click Ripple */}
        {isClicking && (
          <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-white/40 animate-ping" />
        )}

        {/* Apple Pointer Cursor */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          style={{
            transform: isClicking ? 'scale(0.82)' : 'scale(1)',
            transition: 'transform 0.1s ease',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))',
          }}
        >
          <path
            d="M3 2L9 21L12.5 13.5L20 10L3 2Z"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};
