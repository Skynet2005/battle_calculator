import { useEffect } from 'react';

interface KeyboardShortcutCallbacks {
  /** Called when digit keys 1-5 are pressed (index is 0-based: key "1" -> 0) */
  onTabChange?: (index: number) => void;
  /** Called on Ctrl+S (default browser save is prevented) */
  onSave?: () => void;
  /** Called on Ctrl+Enter */
  onSimulate?: () => void;
}

/**
 * Hook that registers global keyboard shortcuts for the battle calculator.
 *
 * - Digits 1-5: switch tabs via `onTabChange(index)` (0-based)
 * - Ctrl+S: trigger save (prevents default browser save dialog)
 * - Ctrl+Enter: trigger simulation
 *
 * Shortcuts are ignored when focus is inside an input, textarea, or
 * contenteditable element so they don't interfere with data entry.
 */
export function useKeyboardShortcuts({ onTabChange, onSave, onSimulate }: KeyboardShortcutCallbacks) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase() ?? '';
      const isEditable = tagName === 'input' || tagName === 'textarea' || target?.isContentEditable;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          onSave?.();
          return;
        }

        if (e.key === 'Enter') {
          e.preventDefault();
          onSimulate?.();
          return;
        }
      }

      if (isEditable) return;

      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const digit = parseInt(e.key, 10);
        if (digit >= 1 && digit <= 5) {
          onTabChange?.(digit - 1);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTabChange, onSave, onSimulate]);
}
