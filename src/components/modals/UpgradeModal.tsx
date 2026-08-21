import React from 'react';
import { X, Sparkles, Check, Zap, Brain, Shield, Cpu } from 'lucide-react';
import { motion } from 'motion/react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-2xl rounded-2xl bg-[#212121] border border-[#333] shadow-2xl overflow-hidden flex flex-col text-[#ececec]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#333]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Upgrade to DOTVEX 2.0 Pro</h2>
              <p className="text-xs text-[#b4b4b4]">Supercharge your intelligence workflows with unlimited compute</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8e8e8e] hover:text-[#ececec] hover:bg-[#2f2f2f] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Free Tier */}
            <div className="p-5 rounded-xl bg-[#262626] border border-[#333] space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#8e8e8e]">Current Plan</div>
                <div className="text-xl font-bold mt-1">DOTVEX Standard</div>
                <div className="text-xs text-[#b4b4b4] mt-0.5">Free forever for personal exploration</div>
              </div>
              <ul className="space-y-2 text-xs text-[#b4b4b4]">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>DOTVEX 2.0 Pro access</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cognition Lab local memory</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Code Sandbox & Plugins</span>
                </li>
              </ul>
            </div>

            {/* Pro Tier */}
            <div className="p-5 rounded-xl bg-[#2a2a2a] border-2 border-emerald-500/80 space-y-4 relative">
              <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wide">
                RECOMMENDED
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Unlimited Tier</div>
                <div className="text-xl font-bold mt-1">DOTVEX Pro / Ultra</div>
                <div className="text-xs text-[#b4b4b4] mt-0.5">$20 / month</div>
              </div>
              <ul className="space-y-2 text-xs text-[#ececec]">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Unlimited <strong>DOTVEX 2.0 Ultra</strong> deep reasoning</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>5x larger context window for full repo analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Priority server-side GPU execution</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Persistent multi-device cognition sync</span>
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => {
              alert('Pro tier subscription simulated! You have full access to all DOTVEX 2.0 features.');
              onClose();
            }}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Upgrade to DOTVEX 2.0 Pro</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
