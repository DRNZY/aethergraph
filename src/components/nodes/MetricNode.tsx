import React, { useState, useEffect } from 'react';
import { CanvasNode } from '../../types/canvas';
import { ScanLine, Check, Copy, ArrowDownLeft } from 'lucide-react';
import { playSpatialClick } from '../../services/soundSynth';

interface Props {
  node: CanvasNode;
  onUpdate: (id: string, updates: Partial<CanvasNode>) => void;
  onDelete: (id: string) => void;
}

// Algorithmic Code-128 (Set B) Generator
function encodeCode128B(text: string): boolean[] {
  const CODE128_PATTERNS: Record<number, string> = {
    0: '11011001100', 1: '11001101100', 2: '11001100110', 3: '10010011000', 4: '10010001100',
    5: '10001001100', 6: '10011001000', 7: '10011000100', 8: '10001100100', 9: '11001001000',
    10: '11001000100', 11: '11000100100', 12: '10110011100', 13: '10011011100', 14: '10011001110',
    15: '10111001100', 16: '10011101100', 17: '10011100110', 18: '11001110010', 19: '11001011100',
    20: '11001001110', 21: '11011100100', 22: '11001110100', 23: '11101101110', 24: '11101001100',
    25: '11100101100', 26: '11100100110', 27: '11101100100', 28: '11100110100', 29: '11100110010',
    30: '11011011000', 31: '11011000110', 32: '11000110110', 33: '10100011000', 34: '10001011000',
    35: '10001000110', 36: '10110001000', 37: '10001101000', 38: '10001100010', 39: '11010001000',
    40: '11000101000', 41: '11000100010', 42: '10110111000', 43: '10110001110', 44: '10001101110',
    45: '10111011000', 46: '10111000110', 47: '10001110110', 48: '11101110110', 49: '11010001110',
    50: '11000101110', 51: '11011101000', 52: '11011100010', 53: '11011101110', 54: '11101011000',
    55: '11101000110', 56: '11100010110', 57: '11101101000', 58: '11101100010', 59: '11100011010',
    60: '11101111010', 61: '11001000010', 62: '11110001010', 63: '10100110000', 64: '10100001100',
    65: '10010110000', 66: '10010000110', 67: '10000101100', 68: '10000100110', 69: '10110010000',
    70: '10110000100', 71: '10011010000', 72: '10011000010', 73: '10000110100', 74: '10000110010',
    75: '11000010010', 76: '11001010000', 77: '11110111010', 78: '11000010100', 79: '10001111010',
    80: '10100111100', 81: '10010111100', 82: '10010011110', 83: '10111100100', 84: '10011110100',
    85: '10011110010', 86: '11110100100', 87: '11110010100', 88: '11110010010', 89: '11011011110',
    90: '11011110110', 91: '11110110110', 92: '10101111000', 93: '10100011110', 94: '10001011110',
    95: '10111101000', 96: '10111100010', 97: '11110101000', 98: '11110100010', 99: '10111011110',
    100: '10111101110', 101: '11101011110', 102: '11110101110', 103: '11010000100', 104: '11010010000',
    105: '11010011100', 106: '1100011101011',
  };

  const START_B = 104;
  const STOP = 106;

  const values: number[] = [START_B];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32;
    if (code >= 0 && code <= 95) values.push(code);
  }

  let checksum = values[0];
  for (let i = 1; i < values.length; i++) {
    checksum += values[i] * i;
  }
  values.push(checksum % 103);
  values.push(STOP);

  const bitstream: boolean[] = [false, false, false, false, false, false, false, false, false, false];
  for (const val of values) {
    const pattern = CODE128_PATTERNS[val] || '11011001100';
    for (const char of pattern) {
      bitstream.push(char === '1');
    }
  }
  return bitstream.concat([false, false, false, false, false, false, false, false, false, false]);
}

export const MetricNode: React.FC<Props> = ({ node, onUpdate }) => {
  const [value, setValue] = useState(node.data.barcodeValue || '262094810293');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (node.data.barcodeValue && node.data.barcodeValue !== value) {
      setValue(node.data.barcodeValue);
    }
  }, [node.data.barcodeValue, value]);

  const bars = encodeCode128B(value || '0');

  const handleValueChange = (newVal: string) => {
    setValue(newVal);
    onUpdate(node.id, {
      data: {
        ...node.data,
        barcodeValue: newVal,
        metricValue: newVal,
      },
    });
  };

  const copyToClipboard = () => {
    playSpatialClick(1000, 0.04);
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0C0C0E]/95 backdrop-blur-2xl rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden group hover:border-white/20 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-black/60 border-b border-white/[0.06] handle cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <ScanLine className="w-3.5 h-3.5 text-zinc-300" />
          <span className="text-xs font-semibold text-white tracking-tight truncate max-w-[170px]">{node.title}</span>
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 hover:text-white bg-white/[0.06] px-2 py-0.5 rounded-lg border border-white/[0.04] transition-colors"
        >
          {copied ? <Check className="w-2.5 h-2.5 text-[#30D158]" /> : <Copy className="w-2.5 h-2.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Upstream Reactive Input Banner */}
      {node.data.lastReceivedInput !== undefined && (
        <div className="bg-[#30D158]/10 border-b border-[#30D158]/20 px-3 py-1 flex items-center justify-between text-[10px] font-mono text-[#30D158]">
          <span className="flex items-center gap-1">
            <ArrowDownLeft className="w-3 h-3" />
            <span>Reactive value bound from code</span>
          </span>
          <span className="text-zinc-400 font-bold truncate max-w-[100px]">{value}</span>
        </div>
      )}

      {/* Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5">
        <div>
          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
            Algorithmic Code-128 Generator
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            className="w-full bg-black/60 text-white font-mono text-xs px-2.5 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-white/30"
            placeholder="Type barcode digits or text..."
          />
        </div>

        {/* Real Bit-Exact Barcode Output */}
        <div className="bg-white p-3 rounded-xl flex flex-col items-center justify-center shadow-lg">
          <div className="flex items-stretch justify-center h-12 w-full overflow-hidden">
            {bars.map((isBlack, idx) => (
              <div
                key={idx}
                className={`flex-1 ${isBlack ? 'bg-black' : 'bg-white'}`}
              />
            ))}
          </div>
          <span className="font-mono text-[10px] text-black font-semibold tracking-[0.2em] mt-1.5">
            {value}
          </span>
        </div>
      </div>
    </div>
  );
};
