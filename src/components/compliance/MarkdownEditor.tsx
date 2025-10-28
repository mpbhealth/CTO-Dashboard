import React, { useState, useEffect } from 'react';
import { FileText, Eye } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  autoSave?: boolean;
  onSave?: (value: string) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter markdown content...',
  height = '400px',
  autoSave = false,
  onSave,
}) => {
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [localValue, setLocalValue] = useState(value);
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    // Calculate word count
    const words = localValue.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
  }, [localValue]);

  useEffect(() => {
    // Auto-save logic
    if (autoSave && onSave) {
      const timer = setTimeout(() => {
        if (localValue !== value) {
          onSave(localValue);
          setLastSaved(new Date());
        }
      }, 2000); // Save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [localValue, autoSave, onSave, value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const renderMarkdownPreview = (markdown: string) => {
    // Simple markdown rendering for preview
    return markdown
      .split('\n')
      .map((line, i) => {
        // Headers
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.substring(4)}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-semibold mt-4 mb-2">{line.substring(3)}</h2>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-2xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
        }

        // Bold
        const boldRegex = /\*\*(.*?)\*\*/g;
        const italicRegex = /\*(.*?)\*/g;
        const codeRegex = /`(.*?)`/g;

        let processedLine = line;
        processedLine = processedLine.replace(boldRegex, '<strong>$1</strong>');
        processedLine = processedLine.replace(italicRegex, '<em>$1</em>');
        processedLine = processedLine.replace(codeRegex, '<code class="bg-gray-100 px-1 rounded">$1</code>');

        // List items
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <li key={i} className="ml-4" dangerouslySetInnerHTML={{ __html: processedLine.substring(2) }} />
          );
        }

        // Empty lines
        if (line.trim() === '') {
          return <br key={i} />;
        }

        // Regular paragraph
        return (
          <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: processedLine }} />
        );
      });
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 px-4 py-2 flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setMode('write')}
            className={`px-3 py-1 rounded flex items-center space-x-1 ${
              mode === 'write'
                ? 'bg-pink-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Write</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`px-3 py-1 rounded flex items-center space-x-1 ${
              mode === 'preview'
                ? 'bg-pink-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>{wordCount} words</span>
          {lastSaved && (
            <span className="text-green-600">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div style={{ height }}>
        {mode === 'write' ? (
          <textarea
            value={localValue}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full h-full p-4 resize-none focus:outline-none font-mono text-sm"
          />
        ) : (
          <div className="p-4 h-full overflow-y-auto prose max-w-none">
            {localValue ? (
              renderMarkdownPreview(localValue)
            ) : (
              <p className="text-gray-400 italic">Nothing to preview</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

