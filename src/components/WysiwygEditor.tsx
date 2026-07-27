import { useRef, useEffect, useCallback } from 'react';
import { Bold, Italic, Underline, Link2, List, ListOrdered, Table } from 'lucide-react';

interface WysiwygEditorProps {
  value: string;
  onChange: (html: string) => void;
  variables?: string[];
  minHeight?: number;
}

export default function WysiwygEditor({ value, onChange, variables = [], minHeight = 300 }: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      editorRef.current.innerHTML = value;
    }
    isInternalChange.current = false;
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const exec = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    handleInput();
  };

  const insertVariable = (variable: string) => {
    const varText = `{{${variable}}}`;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.className = 'inline-block px-1.5 py-0.5 bg-[#DBE7E4] text-[#1B2D3C] text-xs font-mono rounded';
      span.contentEditable = 'false';
      span.textContent = varText;
      range.insertNode(span);
      // Add a space after
      const space = document.createTextNode('\u00A0');
      span.parentNode?.insertBefore(space, span.nextSibling);
    } else {
      exec('insertHTML', `<span class="inline-block px-1.5 py-0.5 bg-[#DBE7E4] text-[#1B2D3C] text-xs font-mono rounded" contentEditable="false">${varText}</span>&nbsp;`);
    }
    editorRef.current?.focus();
    handleInput();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) exec('createLink', url);
  };

  const insertTable = () => {
    const rows = parseInt(prompt('Number of rows:', '4') || '4', 10);
    const cols = parseInt(prompt('Number of columns:', '2') || '2', 10);
    if (!rows || !cols) return;
    let html = '<table style="width:100%;border-collapse:collapse;margin:16px 0;">';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        const tag = r === 0 ? 'th' : 'td';
        html += `<${tag} style="padding:8px;border:1px solid #DBE7E4;">${r === 0 ? 'Header' : ''}</${tag}>`;
      }
      html += '</tr>';
    }
    html += '</table>';
    exec('insertHTML', html);
  };

  const toolbarBtn = (onClick: () => void, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={label}
      className="p-1.5 rounded hover:bg-[#DBE7E4] text-[#1B2D3C] transition-colors cursor-pointer"
    >
      {icon}
    </button>
  );

  return (
    <div className="border border-[#1B2D3C]/20 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[#1B2D3C]/10 bg-[#F8F9FA] flex-wrap">
        {toolbarBtn(() => exec('bold'), <Bold className="w-4 h-4" />, 'Bold')}
        {toolbarBtn(() => exec('italic'), <Italic className="w-4 h-4" />, 'Italic')}
        {toolbarBtn(() => exec('underline'), <Underline className="w-4 h-4" />, 'Underline')}
        <div className="w-px h-5 bg-[#1B2D3C]/10 mx-1" />
        {toolbarBtn(() => exec('formatBlock', '<h2>'), <span className="text-xs font-black">H2</span>, 'Heading 2')}
        {toolbarBtn(() => exec('formatBlock', '<p>'), <span className="text-xs font-bold">P</span>, 'Paragraph')}
        <div className="w-px h-5 bg-[#1B2D3C]/10 mx-1" />
        {toolbarBtn(() => exec('insertUnorderedList'), <List className="w-4 h-4" />, 'Bullet List')}
        {toolbarBtn(() => exec('insertOrderedList'), <ListOrdered className="w-4 h-4" />, 'Numbered List')}
        <div className="w-px h-5 bg-[#1B2D3C]/10 mx-1" />
        {toolbarBtn(insertLink, <Link2 className="w-4 h-4" />, 'Insert Link')}
        {toolbarBtn(insertTable, <Table className="w-4 h-4" />, 'Insert Table')}
        <div className="w-px h-5 bg-[#1B2D3C]/10 mx-1" />
        {toolbarBtn(() => exec('justifyLeft'), <span className="text-xs">⬅</span>, 'Align Left')}
        {toolbarBtn(() => exec('justifyCenter'), <span className="text-xs">⬌</span>, 'Align Center')}
        {toolbarBtn(() => exec('justifyRight'), <span className="text-xs">➡</span>, 'Align Right')}

        {variables.length > 0 && (
          <>
            <div className="w-px h-5 bg-[#1B2D3C]/10 mx-1" />
            <select
              onChange={(e) => {
                if (e.target.value) {
                  insertVariable(e.target.value);
                  e.target.value = '';
                }
              }}
              className="text-xs px-2 py-1 border border-[#1B2D3C]/20 rounded bg-white text-[#1B2D3C] cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>Insert variable...</option>
              {variables.map((v) => (
                <option key={v} value={v}>{`{{${v}}}`}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        suppressContentEditableWarning
        className="p-4 outline-none text-sm text-[#1B2D3C] prose prose-sm max-w-none"
        style={{ minHeight, fontFamily: 'Arial, sans-serif' }}
      />

      {/* Variable chips for reference */}
      {variables.length > 0 && (
        <div className="px-3 py-2 border-t border-[#1B2D3C]/10 bg-[#F8F9FA] flex flex-wrap gap-1">
          <span className="text-[10px] text-[#1B2D3C]/50 font-bold uppercase tracking-wider mr-1">Variables:</span>
          {variables.map((v) => (
            <button
              key={v}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertVariable(v)}
              className="inline-block px-1.5 py-0.5 bg-[#DBE7E4] text-[#1B2D3C] text-[10px] font-mono rounded hover:bg-[#D6E2E9] cursor-pointer transition-colors"
            >
              {`{{${v}}}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
