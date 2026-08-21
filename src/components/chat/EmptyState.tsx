import React from 'react';
import { DotvexLogo } from '../brand/DotvexLogo';
import {
  Code,
  Sparkles,
  Lightbulb,
  Compass,
} from 'lucide-react';
import { motion } from 'motion/react';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectPrompt }) => {
  const suggestions = [
    {
      title: 'Analyze Architecture',
      subtitle: 'Evaluate memory retention & local quantization pipelines',
      prompt: 'Compare local edge inference architectures against cloud proxy models in terms of latency, privacy, and token cost.',
      icon: <Code className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />,
    },
    {
      title: 'Build Autonomous Loop',
      subtitle: 'Design step-by-step reasoning and self-healing code',
      prompt: 'Write a robust TypeScript async execution pipeline with error recovery and performance telemetry.',
      icon: <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" />,
    },
    {
      title: 'Cognition Graph Audit',
      subtitle: 'Organize persistent project concepts and parameters',
      prompt: 'How does DOTVEX 2.0 maintain persistent memory in the Cognition Lab across sessions?',
      icon: <Compass className="w-4 h-4 text-blue-500 dark:text-cyan-400" />,
    },
    {
      title: 'Executive Summary',
      subtitle: 'Synthesize complex papers or data tables',
      prompt: 'Generate an executive summary of modern reasoning paradigms with mathematical step complexity.',
      icon: <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400" />,
    },
  ];

  return (
    <div
      id="dotvex-empty-state"
      className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-3xl mx-auto w-full select-none text-[#0d0d0d] dark:text-[#ececec]"
    >
      {/* Centered Minimal Brand Greeting */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center text-center mb-8"
      >
        <div className="mb-4">
          <DotvexLogo size="lg" showBadge={false} />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0d0d0d] dark:text-[#ececec]">
          What can I help with today?
        </h2>
        <p className="text-xs text-[#737373] dark:text-[#8e8e8e] mt-1">
          DOTVEX 2.0 • Created by Dotman (Olalemi Michael Adedotun)
        </p>
      </motion.div>

      {/* Suggestion Cards Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {suggestions.map((item, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            onClick={() => onSelectPrompt(item.prompt)}
            className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#f7f7f8] hover:bg-[#f0f0f1] dark:bg-[#282828] dark:hover:bg-[#303030] border border-[#e5e5e5] hover:border-[#d4d4d8] dark:border-[#333] dark:hover:border-[#444] text-left transition-all group cursor-pointer shadow-xs"
          >
            <div className="p-2 rounded-xl bg-white dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] flex-shrink-0 group-hover:border-[#ccc] dark:group-hover:border-[#4f4f4f] transition-colors">
              {item.icon}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#0d0d0d] dark:text-[#ececec] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {item.title}
              </div>
              <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e] mt-0.5 truncate">
                {item.subtitle}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
