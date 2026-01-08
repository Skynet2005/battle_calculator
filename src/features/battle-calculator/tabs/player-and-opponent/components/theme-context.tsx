'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const THEME_STORAGE_KEY = 'expedition_battle_calculator_theme';
const DEFAULT_THEME: Theme = 'dark';

// ============================================================================
// Context
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  // --------------------------------------------------------------------------
  // Initialize Theme
  // --------------------------------------------------------------------------

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
    const initialTheme = savedTheme && (savedTheme === 'light' || savedTheme === 'dark')
      ? savedTheme
      : DEFAULT_THEME;

    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  // --------------------------------------------------------------------------
  // Theme Helpers
  // --------------------------------------------------------------------------

  const applyTheme = (newTheme: Theme) => {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
