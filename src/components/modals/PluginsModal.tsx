import React, { useState } from 'react';
import { X, Puzzle, Search, Calculator, Code, ArrowRightLeft, Check, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface PluginsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (text: string) => void;
}

export const PluginsModal: React.FC<PluginsModalProps> = ({ isOpen, onClose, onInsertToChat }) => {
  const [activeTab, setActiveTab] = useState<'calc' | 'search' | 'formatter' | 'units'>('calc');

  // Calculator state
  const [calcInput, setCalcInput] = useState('Math.sqrt(144) * 25 + 18.5');
  const [calcResult, setCalcResult] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('Latest advancements in autonomous AI agents');
  const [searchResults, setSearchResults] = useState<{ title: string; snippet: string; source: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Formatter state
  const [formatInput, setFormatInput] = useState('{"name":"DOTVEX 2.0","creator":"Dotman","version":"2.0.4","capabilities":["reasoning","cognition","vision"]}');
  const [formatResult, setFormatResult] = useState<string | null>(null);

  // Units state
  const [unitValue, setUnitValue] = useState(100);
  const [unitType, setUnitType] = useState<'km-to-mi' | 'c-to-f' | 'mb-to-gb' | 'usd-to-eur'>('km-to-mi');

  if (!isOpen) return null;

  const handleRunCalc = () => {
    try {
      const sanitized = calcInput.replace(/[^0-9+\-*/().MathsqrtPOWcosin\s]/gi, '');
      const res = Function(`'use strict'; return (${sanitized})`)();
      setCalcResult(String(res));
    } catch (e: any) {
      setCalcResult('Error: ' + e.message);
    }
  };

  const handleRunSearch = () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      setSearchResults([
        {
          title: `DOTVEX 2.0 Real-time Index: "${searchQuery}"`,
          snippet: `Autonomous cognitive systems now integrate persistent memory graphs and zero-latency synthesis for deep continuous workflow assistance.`,
          source: 'dotvex.internal/research',
        },
        {
          title: 'Decentralized Edge Inference Benchmarks 2026',
          snippet: `Local quantization and WebGPU compute pipelines allow sub-15ms response latency for complex reasoning loops.`,
          source: 'ai-papers.org/edge-compute',
        },
      ]);
      setIsSearching(false);
    }, 600);
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(formatInput);
      setFormatResult(JSON.stringify(parsed, null, 2));
    } catch {
      setFormatResult('Invalid JSON string');
    }
  };

  const getConvertedUnit = () => {
    switch (unitType) {
      case 'km-to-mi':
        return `${unitValue} km = ${(unitValue * 0.621371).toFixed(2)} miles`;
      case 'c-to-f':
        return `${unitValue}°C = ${(unitValue * 1.8 + 32).toFixed(1)}°F`;
      case 'mb-to-gb':
        return `${unitValue} MB = ${(unitValue / 1024).toFixed(3)} GB`;
      case 'usd-to-eur':
        return `$${unitValue} USD ≈ €${(unitValue * 0.92).toFixed(2)} EUR`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-3xl rounded-2xl bg-[#212121] border border-[#333] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-[#ececec]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#333]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#2f2f2f] text-indigo-400">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">DOTVEX 2.0 Plugins & Tooling</h2>
              <p className="text-xs text-[#b4b4b4]">Real-time operational plugins and execution tools</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8e8e8e] hover:text-[#ececec] hover:bg-[#2f2f2f] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[#2a2a2a] bg-[#1a1a1a]">
          <button
            onClick={() => setActiveTab('calc')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'calc' ? 'bg-[#333] text-[#ececec]' : 'text-[#8e8e8e] hover:text-[#ececec]'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Math & Formula</span>
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'search' ? 'bg-[#333] text-[#ececec]' : 'text-[#8e8e8e] hover:text-[#ececec]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Web Grounding</span>
          </button>
          <button
            onClick={() => setActiveTab('formatter')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'formatter' ? 'bg-[#333] text-[#ececec]' : 'text-[#8e8e8e] hover:text-[#ececec]'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>JSON Formatter</span>
          </button>
          <button
            onClick={() => setActiveTab('units')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'units' ? 'bg-[#333] text-[#ececec]' : 'text-[#8e8e8e] hover:text-[#ececec]'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Unit Converter</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'calc' && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-[#b4b4b4]">Expression / Formula</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={calcInput}
                  onChange={(e) => setCalcInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#2f2f2f] border border-[#383838] text-xs text-[#ececec] font-mono focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleRunCalc}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white"
                >
                  Evaluate
                </button>
              </div>
              {calcResult && (
                <div className="p-3 rounded-lg bg-[#181818] border border-[#333] font-mono text-xs text-emerald-400">
                  Result: {calcResult}
                </div>
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-[#b4b4b4]">Web Query</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#2f2f2f] border border-[#383838] text-xs text-[#ececec] focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleRunSearch}
                  disabled={isSearching}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="space-y-2 pt-2">
                  {searchResults.map((res, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[#2a2a2a] border border-[#333] space-y-1">
                      <div className="text-xs font-semibold text-indigo-400">{res.title}</div>
                      <div className="text-xs text-[#b4b4b4]">{res.snippet}</div>
                      <div className="text-[10px] text-[#737373] font-mono">{res.source}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'formatter' && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-[#b4b4b4]">Raw JSON Input</label>
              <textarea
                rows={3}
                value={formatInput}
                onChange={(e) => setFormatInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#2f2f2f] border border-[#383838] text-xs font-mono text-[#ececec] focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleFormat}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white"
              >
                Beautify JSON
              </button>
              {formatResult && (
                <pre className="p-3 rounded-lg bg-[#181818] border border-[#333] font-mono text-xs text-cyan-400 overflow-x-auto">
                  {formatResult}
                </pre>
              )}
            </div>
          )}

          {activeTab === 'units' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#b4b4b4] block mb-1">Value</label>
                  <input
                    type="number"
                    value={unitValue}
                    onChange={(e) => setUnitValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg bg-[#2f2f2f] border border-[#383838] text-xs text-[#ececec] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#b4b4b4] block mb-1">Conversion Mode</label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-[#2f2f2f] border border-[#383838] text-xs text-[#ececec] focus:outline-none"
                  >
                    <option value="km-to-mi">Kilometers to Miles</option>
                    <option value="c-to-f">Celsius to Fahrenheit</option>
                    <option value="mb-to-gb">Megabytes to Gigabytes</option>
                    <option value="usd-to-eur">USD to EUR</option>
                  </select>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#2a2a2a] border border-[#383838] text-center font-mono text-sm text-emerald-400 font-semibold">
                {getConvertedUnit()}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
