import React, { useState } from 'react';
import { Code2, Check, Copy } from 'lucide-react';

interface CodeViewerProps {
  fileName: string | null;
  content: string | null;
}

// Tokenizes a line of code for distinct high-contrast syntax highlighting
const renderTokenizedLine = (code: string) => {
  // Matches comments, object/JSON keys, strings, booleans/nulls, numbers, keywords, and punctuation
  const tokenRegex = /(\/\/.*$|#.*$|"(?:\\.|[^"\\])*"\s*:|'(?:\\.|[^'\\])*'\s*:|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:true|false|null|undefined|None|True|False)\b|\b\d+(?:\.\d+)?\b|\b(?:const|let|var|function|return|import|export|from|default|class|extends|if|else|for|while|try|catch|def|elif|async|await|with|as|in|is|not|and|or)\b|[{}[\](),;:]|[^\s"'#\/{}()[\],;:]+|\s+)/g;

  const tokens = code.match(tokenRegex) || [code];

  return tokens.map((token, idx) => {
    // Comment
    if (token.startsWith('//') || token.startsWith('#')) {
      return (
        <span key={idx} className="text-slate-500 italic">
          {token}
        </span>
      );
    }
    // JSON / Object key (e.g., "name":)
    if (/^["'].*?["']\s*:$/.test(token)) {
      const colonIdx = token.lastIndexOf(':');
      const keyStr = token.substring(0, colonIdx);
      return (
        <span key={idx}>
          <span className="text-sky-300 font-semibold">{keyStr}</span>
          <span className="text-slate-400 font-bold">:</span>
        </span>
      );
    }
    // String value
    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
      return (
        <span key={idx} className="text-emerald-300">
          {token}
        </span>
      );
    }
    // Booleans and null / None
    if (/^(true|false|null|undefined|None|True|False)$/.test(token)) {
      return (
        <span key={idx} className="text-purple-400 font-bold">
          {token}
        </span>
      );
    }
    // Numeric constants
    if (/^\d+(?:\.\d+)?$/.test(token)) {
      return (
        <span key={idx} className="text-amber-300 font-semibold">
          {token}
        </span>
      );
    }
    // Reserved language keywords
    if (
      /^(const|let|var|function|return|import|export|from|default|class|extends|if|else|for|while|try|catch|def|elif|async|await|with|as|in|is|not|and|or)$/.test(
        token
      )
    ) {
      return (
        <span key={idx} className="text-rose-400 font-semibold">
          {token}
        </span>
      );
    }
    // Structural punctuation
    if (/^[{}[\](),;:]$/.test(token)) {
      return (
        <span key={idx} className="text-slate-400 font-bold">
          {token}
        </span>
      );
    }
    // Default text token
    return (
      <span key={idx} className="text-slate-200">
        {token}
      </span>
    );
  });
};

export const CodeViewer: React.FC<CodeViewerProps> = ({ fileName, content }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rawLines = content ? content.split('\n') : [];

  return (
    <div className="flex flex-col h-full bg-[#000000] text-[#cccccc] overflow-hidden select-text">
      <div className="flex-1 overflow-auto bg-[#000000] p-2 font-terminal text-[13px] leading-6">
        {content ? (
          <div className="whitespace-pre font-terminal select-text">
            {rawLines.map((line, idx) => {
              // Check if line contains a line number prefix (e.g. "   1 | ")
              const match = line.match(/^(\s*\d+\s*\|)(.*)$/);
              if (match) {
                const [, prefix, code] = match;
                return (
                  <div key={idx} className="flex hover:bg-[#0c1527] py-[1px] px-1 group rounded-[2px]">
                    <span className="text-[#555555] group-hover:text-[#999999] select-none pr-4 font-mono text-[12px] text-right min-w-[44px] shrink-0">
                      {prefix.replace('|', '').trim()}
                    </span>
                    <span className="pl-3 overflow-x-visible">
                      {renderTokenizedLine(code)}
                    </span>
                  </div>
                );
              }

              // Fallback for raw lines without pipe numbering
              return (
                <div key={idx} className="hover:bg-[#0c1527] py-[1px] px-1 rounded-[2px]">
                  {renderTokenizedLine(line)}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-[#555555] text-xs font-sans">
            Select a file from the Explorer to view code.
          </div>
        )}
      </div>
    </div>
  );
};


