import React, { useState, useEffect, useRef } from 'react';
import { CanvasNode } from '../../types/canvas';
import { Play, Square, Activity, Radio } from 'lucide-react';
import { SpatialAudioPlayer } from '../../services/soundSynth';

interface Props {
  node: CanvasNode;
  onUpdate: (id: string, updates: Partial<CanvasNode>) => void;
  onDelete: (id: string) => void;
}

export const AudioNode: React.FC<Props> = ({ node, onUpdate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [freq, setFreq] = useState(node.data.audioFreq || 440);
  const [waveType, setWaveType] = useState<OscillatorType>((node.data.audioWaveType as any) || 'sawtooth');
  const playerRef = useRef<SpatialAudioPlayer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    playerRef.current = new SpatialAudioPlayer();
    return () => {
      playerRef.current?.stop();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.stop();
      setIsPlaying(false);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    } else {
      playerRef.current.start(freq, waveType, node.data.volume || 0.15);
      setIsPlaying(true);
      drawVisualizer();
    }
  };

  const handleFreqChange = (newFreq: number) => {
    setFreq(newFreq);
    playerRef.current?.setFrequency(newFreq);
    onUpdate(node.id, { data: { ...node.data, audioFreq: newFreq } });
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !playerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = playerRef.current.getFrequencyData();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / data.length) * 1.6;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const barHeight = (data[i] / 255) * canvas.height;
      // Monochrome Apple Visualizer with subtle highlight
      ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#A1A1AA';
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 1.5, barHeight);
      x += barWidth;
    }

    animFrameRef.current = requestAnimationFrame(drawVisualizer);
  };

  return (
    <div className="flex flex-col h-full bg-[#0C0C0E]/95 backdrop-blur-2xl rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden group hover:border-white/20 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-black/60 border-b border-white/[0.06] handle cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <Radio className={`w-3.5 h-3.5 ${isPlaying ? 'text-[#30D158] animate-pulse' : 'text-zinc-300'}`} />
          <span className="text-xs font-semibold text-white tracking-tight truncate max-w-[170px]">{node.title}</span>
        </div>
        <button
          onClick={togglePlay}
          className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all active:scale-[0.97] ${
            isPlaying ? 'bg-white text-black' : 'bg-white/[0.08] text-zinc-200 hover:text-white hover:bg-white/15'
          }`}
        >
          {isPlaying ? <Square className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current" />}
          <span>{isPlaying ? 'Mute' : 'Play'}</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5">
        {/* Spectrum Canvas */}
        <div className="h-16 bg-black/60 rounded-xl border border-white/[0.06] relative overflow-hidden flex items-center justify-center">
          <canvas ref={canvasRef} width={300} height={64} className="w-full h-full" />
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center gap-1.5 text-[11px] text-zinc-600 font-mono">
              <Activity className="w-3.5 h-3.5" />
              <span>Spectrum Inactive</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-2.5 bg-black/40 p-3 rounded-xl border border-white/[0.05]">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>Frequency:</span>
            <span className="text-white font-semibold">{freq} Hz</span>
          </div>
          <input
            type="range"
            min={110}
            max={880}
            step={1}
            value={freq}
            onChange={(e) => handleFreqChange(Number(e.target.value))}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-zinc-400 font-mono">Wave:</span>
            <div className="flex gap-1">
              {(['sawtooth', 'triangle', 'square', 'sine'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setWaveType(type);
                    if (isPlaying) {
                      playerRef.current?.start(freq, type, 0.15);
                    }
                  }}
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-md capitalize transition-all ${
                    waveType === type ? 'bg-white text-black font-semibold' : 'bg-white/[0.06] text-zinc-400 hover:text-white'
                  }`}
                >
                  {type.slice(0, 4)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
