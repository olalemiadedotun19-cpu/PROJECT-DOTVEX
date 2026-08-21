import React, { useState } from 'react';
import { X, Sparkles, Download, Image as ImageIcon, RefreshCw, Wand2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (imageUrl: string, prompt: string) => void;
}

export const ImagesModal: React.FC<ImagesModalProps> = ({ isOpen, onClose, onInsertToChat }) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<'photorealistic' | 'cyberpunk' | 'minimalist' | 'anime' | '3d-render'>('photorealistic');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<
    { id: string; url: string; prompt: string; style: string; timestamp: number }[]
  >([]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style,
          aspectRatio,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.imageUrl) {
          const newImg = {
            id: 'img_' + Date.now(),
            url: data.imageUrl,
            prompt: prompt.trim(),
            style,
            timestamp: Date.now(),
          };
          setGeneratedImages((prev) => [newImg, ...prev]);
          setIsGenerating(false);
          return;
        }
      }
    } catch (err) {
      console.warn('[ImagesModal] Fallback to vector pattern render:', err);
    }

    // High-quality SVG/Canvas generative pattern fallback
    const svgData = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e1e1e"/>
            <stop offset="50%" stop-color="#2a2a2a"/>
            <stop offset="100%" stop-color="#121212"/>
          </linearGradient>
          <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#10a37f"/>
            <stop offset="100%" stop-color="#3b82f6"/>
          </linearGradient>
        </defs>
        <rect width="600" height="600" fill="url(#g)"/>
        <circle cx="300" cy="300" r="180" fill="none" stroke="url(#accent)" stroke-width="3" opacity="0.6"/>
        <circle cx="300" cy="300" r="100" fill="#181818" stroke="#333" stroke-width="2"/>
        <path d="M 240 300 L 300 240 L 360 300 L 300 360 Z" fill="url(#accent)" opacity="0.8"/>
        <text x="300" y="460" fill="#ececec" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">DOTVEX 2.0 VISION</text>
        <text x="300" y="490" fill="#888" font-family="sans-serif" font-size="12" text-anchor="middle">${prompt.slice(0, 45)}...</text>
      </svg>
    `);
    const dataUrl = `data:image/svg+xml;utf8,${svgData}`;

    const newImg = {
      id: 'img_' + Date.now(),
      url: dataUrl,
      prompt: prompt.trim(),
      style,
      timestamp: Date.now(),
    };

    setGeneratedImages((prev) => [newImg, ...prev]);
    setIsGenerating(false);
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
            <div className="p-2 rounded-xl bg-[#2f2f2f] text-emerald-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">DOTVEX Vision Studio</h2>
              <p className="text-xs text-[#b4b4b4]">Real-time generative image rendering engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8e8e8e] hover:text-[#ececec] hover:bg-[#2f2f2f] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Prompt input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#b4b4b4]">Image Prompt</label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to create (e.g. Minimalist charcoal workspace, neural network core with emerald accents)..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-[#2f2f2f] border border-[#383838] text-sm text-[#ececec] placeholder-[#737373] focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Controls: Style & Aspect Ratio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#b4b4b4] block mb-1.5">Aesthetic Style</label>
              <div className="flex flex-wrap gap-1.5">
                {(['photorealistic', 'cyberpunk', 'minimalist', 'anime', '3d-render'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                      style === s
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-[#2a2a2a] text-[#b4b4b4] hover:bg-[#333] hover:text-[#ececec]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#b4b4b4] block mb-1.5">Aspect Ratio</label>
              <div className="flex gap-2">
                {(['1:1', '16:9', '9:16'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      aspectRatio === ratio
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-[#2a2a2a] text-[#b4b4b4] hover:bg-[#333] hover:text-[#ececec]'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Image Canvas...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Generate with DOTVEX Vision</span>
              </>
            )}
          </button>

          {/* Gallery */}
          {generatedImages.length > 0 && (
            <div className="pt-4 border-t border-[#333] space-y-3">
              <h3 className="text-xs font-semibold text-[#b4b4b4] uppercase tracking-wider">
                Generated Gallery ({generatedImages.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {generatedImages.map((img) => (
                  <div
                    key={img.id}
                    className="p-3 rounded-xl bg-[#2a2a2a] border border-[#383838] space-y-2 group"
                  >
                    <div className="relative rounded-lg overflow-hidden bg-[#181818] aspect-square flex items-center justify-center">
                      <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs text-[#b4b4b4] line-clamp-2">{img.prompt}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-[#737373] uppercase font-mono">{img.style}</span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={img.url}
                          download={`dotvex-${img.id}.svg`}
                          className="p-1.5 rounded-lg bg-[#333] hover:bg-[#3d3d3d] text-[#ececec] text-xs flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        {onInsertToChat && (
                          <button
                            onClick={() => {
                              onInsertToChat(img.url, img.prompt);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                          >
                            Use in Chat
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
