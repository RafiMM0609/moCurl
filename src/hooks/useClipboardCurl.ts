import { useState, useEffect, useCallback } from 'react';
import { isCurlCommand, parseCurl } from '../utils/curlParser';
import type { HttpRequest } from '../types';

interface UseClipboardCurlProps {
  onCurlDetected?: (curlString: string) => void;
  onRequestImported: (partialReq: Partial<HttpRequest>) => void;
}

export function useClipboardCurl({ onRequestImported }: UseClipboardCurlProps) {
  const [detectedCurl, setDetectedCurl] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Check clipboard content safely
  const checkClipboard = useCallback(async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        return;
      }
      // Query permission if available to avoid unnecessary prompts
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
          if (result.state === 'denied') return;
        } catch {
          // Permissions API might not support 'clipboard-read' on all browsers, continue
        }
      }

      const text = await navigator.clipboard.readText();
      if (text && isCurlCommand(text)) {
        if (text !== detectedCurl) {
          setDetectedCurl(text);
          setShowToast(true);
        }
      }
    } catch {
      // Permission denied or clipboard empty
    }
  }, [detectedCurl]);

  // Check on window focus / app resume
  useEffect(() => {
    const onFocus = () => {
      checkClipboard();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkClipboard();
      }
    });

    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, [checkClipboard]);

  // Action to apply the detected cURL
  const applyDetectedCurl = useCallback(() => {
    if (!detectedCurl) return;
    const parsed = parseCurl(detectedCurl);
    onRequestImported(parsed);
    setShowToast(false);
    setDetectedCurl(null);
  }, [detectedCurl, onRequestImported]);

  const dismissToast = useCallback(() => {
    setShowToast(false);
  }, []);

  // Explicit user-triggered paste (e.g. tapping "Paste cURL" button)
  const manualPasteFromClipboard = useCallback(async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        alert('Clipboard API is not supported by your browser or requires HTTPS.');
        return false;
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        alert('Clipboard is empty.');
        return false;
      }

      if (isCurlCommand(text)) {
        const parsed = parseCurl(text);
        onRequestImported(parsed);
        setShowToast(false);
        setDetectedCurl(null);
        return true;
      } else if (text.startsWith('http://') || text.startsWith('https://') || text.includes('/')) {
        // Plain URL pasted
        onRequestImported({ url: text.trim() });
        return true;
      } else {
        alert('Clipboard text does not look like a cURL command or URL.');
        return false;
      }
    } catch (e) {
      console.warn('Clipboard read error:', e);
      alert('Unable to read clipboard. Please check browser permissions or paste manually.');
      return false;
    }
  }, [onRequestImported]);

  return {
    detectedCurl,
    showToast,
    applyDetectedCurl,
    dismissToast,
    manualPasteFromClipboard
  };
}
