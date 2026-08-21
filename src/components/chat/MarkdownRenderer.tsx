import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="text-[15px] leading-relaxed text-gray-900 dark:text-gray-100 break-words space-y-3 font-normal">
      <Markdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mt-4 mb-2 first:mt-0 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mt-3.5 mb-1.5 first:mt-0 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-3 mb-1 first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-2 leading-relaxed text-gray-800 dark:text-gray-200">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-2 space-y-1 text-gray-800 dark:text-gray-200">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1 text-gray-800 dark:text-gray-200">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500/60 dark:border-blue-400/50 pl-3.5 py-0.5 my-2.5 text-gray-600 dark:text-gray-400 italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 border border-gray-200 dark:border-gray-800 rounded-lg">
              <table className="min-w-full text-left text-sm divide-y divide-gray-200 dark:divide-gray-800">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50 dark:bg-gray-900/60 font-semibold">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-xs border-t border-gray-100 dark:border-gray-800/60 text-gray-800 dark:text-gray-300">
              {children}
            </td>
          ),
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 text-xs font-mono rounded bg-gray-100 dark:bg-gray-800/80 text-blue-600 dark:text-blue-300 border border-gray-200/60 dark:border-gray-700/60"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const codeString = String(children).replace(/\n$/, '');
            const language = match ? match[1] : 'text';

            return <CodeBlock language={language} code={codeString} />;
          },
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="relative my-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-[#12141a] text-gray-100 font-mono text-xs shadow-sm">
      {/* Code block header bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#1a1d26] border-b border-gray-800/80 text-gray-400">
        <span className="text-[11px] font-medium tracking-wide uppercase">{language}</span>
        <button
          id={`copy-code-${language}`}
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] hover:text-gray-200 hover:bg-gray-800/60 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="p-3.5 overflow-x-auto">
        <pre className="m-0 leading-relaxed font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
