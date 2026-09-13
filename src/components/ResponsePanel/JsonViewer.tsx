import React, { useState, useMemo } from 'react';
import { Copy, Check, Search, X, KeyRound } from 'lucide-react';

interface JsonViewerProps {
  jsonString: string;
  onSetBearerToken?: (token: string) => void;
}

interface FormattedLine {
  lineNum: number;
  html: string;
  isMatch: boolean;
  extractedValue: string | null;
  keyName?: string;
  isTokenLike: boolean;
}

/**
 * Syntax highlighters and value extractor for JSON tokens
 */
function formatAndHighlightJson(jsonStr: string, searchFilter: string): FormattedLine[] {
  let formatted = jsonStr;
  try {
    const obj = JSON.parse(jsonStr);
    formatted = JSON.stringify(obj, null, 2);
  } catch {
    // Keep as is if not valid JSON
  }

  // Tokenize lines
  const lines = formatted.split('\n');

  return lines.map((line, idx) => {
    // Check if line matches search filter
    const isMatch = searchFilter ? line.toLowerCase().includes(searchFilter.toLowerCase()) : false;

    // Syntax highlight regex
    const highlighted = line.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      match => {
        let cls = 'color: #38bdf8;'; // number/cyan default
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'color: #fb923c; font-weight: 600;'; // Key: warm orange
          } else {
            cls = 'color: #34d399;'; // String: emerald
          }
        } else if (/true|false/.test(match)) {
          cls = 'color: #f59e0b; font-weight: 600;'; // Boolean: amber
        } else if (/null/.test(match)) {
          cls = 'color: #f43f5e; font-weight: 600;'; // Null: red
        }
        return `<span style="${cls}">${match}</span>`;
      }
    );

    // Extract value and key for quick copy actions
    const kvMatch = line.match(/^\s*(?:"([^"]+)"\s*:\s*)?(.*)$/);
    let keyName: string | undefined = undefined;
    let extractedValue: string | null = null;
    let isTokenLike = false;

    if (kvMatch) {
      keyName = kvMatch[1];
      let valPart = kvMatch[2].trim();
      if (valPart.endsWith(',')) valPart = valPart.slice(0, -1).trim();

      if (valPart.startsWith('"') && valPart.endsWith('"')) {
        try {
          extractedValue = JSON.parse(valPart);
        } catch {
          extractedValue = valPart.slice(1, -1);
        }
      } else if (/^(true|false|null|-?\d+(?:\.\d+)?)$/.test(valPart)) {
        extractedValue = valPart;
      }

      if (extractedValue !== null && typeof extractedValue === 'string') {
        const keyLower = (keyName || '').toLowerCase();
        isTokenLike =
          keyLower.includes('token') ||
          keyLower.includes('jwt') ||
          keyLower.includes('bearer') ||
          keyLower.includes('auth') ||
          keyLower.includes('secret') ||
          keyLower.includes('key') ||
          extractedValue.startsWith('eyJ') ||
          (extractedValue.length >= 30 && /^[a-zA-Z0-9_\-\.]+$/.test(extractedValue));
      }
    }

    return {
      lineNum: idx + 1,
      html: highlighted,
      isMatch,
      extractedValue,
      keyName,
      isTokenLike
    };
  });
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ jsonString, onSetBearerToken }) => {
  const [copiedBody, setCopiedBody] = useState(false);
  const [copiedLineNum, setCopiedLineNum] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [toast, setToast] = useState<{ message: string; tokenValue: string | null } | null>(null);

  const formattedLines = useMemo(() => {
    return formatAndHighlightJson(jsonString, search);
  }, [jsonString, search]);

  const handleCopyBody = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopiedBody(true);
      setToast({ message: 'Full response copied to clipboard!', tokenValue: null });
      setTimeout(() => setCopiedBody(false), 2000);
      setTimeout(() => setToast(null), 3000);
    } catch {
      // Fallback
    }
  };

  const handleCopyValue = async (val: string, lineNum: number, keyName?: string, isToken?: boolean) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedLineNum(lineNum);
      setTimeout(() => setCopiedLineNum(null), 1800);

      const label = keyName ? `"${keyName}"` : 'value';
      setToast({
        message: `Copied ${label} to clipboard!`,
        tokenValue: isToken ? val : null
      });
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Search & Copy Mini Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        gap: '8px'
      }}>
        {showSearch ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flex: 1,
            backgroundColor: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px 8px'
          }}>
            <Search size={13} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Find in response..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '11px',
                outline: 'none',
                width: '100%',
                fontFamily: 'var(--font-mono)'
              }}
              autoFocus
            />
            {search && (
              <button
                type="button"
                className="icon-btn"
                style={{ width: '18px', height: '18px' }}
                onClick={() => setSearch('')}
              >
                <X size={12} />
              </button>
            )}
            <button
              type="button"
              className="icon-btn"
              style={{ width: '18px', height: '18px' }}
              onClick={() => { setShowSearch(false); setSearch(''); }}
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="icon-btn"
            style={{ width: '28px', height: '28px' }}
            onClick={() => setShowSearch(true)}
            title="Search in response"
          >
            <Search size={14} />
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {formattedLines.length} lines
          </span>
          <button
            type="button"
            className="icon-btn"
            style={{ width: '28px', height: '28px' }}
            onClick={handleCopyBody}
            title="Copy Full Response Body"
          >
            {copiedBody ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Code viewer with line numbers and 1-click token/value copy */}
      <div className="json-viewer-container">
        <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'auto' }}>
          <tbody>
            {formattedLines.map(line => (
              <tr
                key={line.lineNum}
                className="json-line-row"
                style={{
                  backgroundColor: line.isMatch ? 'rgba(234, 179, 8, 0.18)' : undefined
                }}
              >
                <td
                  className="json-line-num"
                  style={{
                    width: '32px',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '10px',
                    verticalAlign: 'top',
                    paddingRight: '10px',
                    textAlign: 'right',
                    opacity: 0.6
                  }}
                >
                  {line.lineNum}
                </td>
                <td
                  className="json-line-code"
                  style={{
                    verticalAlign: 'top',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    wordBreak: 'break-all'
                  }}
                  dangerouslySetInnerHTML={{ __html: line.html }}
                />
                <td
                  className="json-line-action"
                  style={{
                    width: '26px',
                    verticalAlign: 'top',
                    textAlign: 'right',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    paddingLeft: '6px'
                  }}
                >
                  {line.extractedValue !== null && (
                    <button
                      type="button"
                      className={`json-copy-btn ${line.isTokenLike ? 'token-btn' : ''}`}
                      onClick={() => handleCopyValue(line.extractedValue!, line.lineNum, line.keyName, line.isTokenLike)}
                      title={line.keyName ? `Copy ${line.keyName}` : 'Copy value'}
                    >
                      {copiedLineNum === line.lineNum ? (
                        <Check size={11} color="var(--color-success)" />
                      ) : (
                        <Copy size={11} />
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Floating Action Toast for Copied Values & Bearer Token Setting */}
      {toast && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 40,
          fontSize: '12px',
          maxWidth: '92%',
          animation: 'slideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <Check size={14} color="var(--color-success)" style={{ flexShrink: 0 }} />
          <span style={{
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '180px'
          }}>
            {toast.message}
          </span>
          {toast.tokenValue && onSetBearerToken && (
            <button
              type="button"
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              onClick={() => {
                onSetBearerToken(toast.tokenValue!);
                setToast({ message: 'Set as Bearer Token for request!', tokenValue: null });
                setTimeout(() => setToast(null), 2500);
              }}
            >
              <KeyRound size={12} />
              <span>Use as Bearer Token</span>
            </button>
          )}
          <button
            type="button"
            className="icon-btn"
            style={{ width: '18px', height: '18px', marginLeft: 'auto', flexShrink: 0 }}
            onClick={() => setToast(null)}
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
};
