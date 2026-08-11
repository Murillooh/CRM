"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Substitui `next-themes`: a versão instalada (0.4.6, sem fix pra isso ainda) injeta o
 * script anti-flash renderizando um <script> cru dentro de um Client Component, o que
 * dispara o aviso do React/Next: "Encountered a script tag while rendering React
 * component." Tentei resolver com `next/script` (`beforeInteractive`) só que ainda aninhado
 * aqui dentro do ThemeProvider — mesmo aviso, porque não tá direto no root layout. O
 * `<Script>` de verdade foi movido pra `app/layout.tsx` (só o texto do script, `ANTI_FLASH_SCRIPT`,
 * é exportado daqui). Esse componente agora só cuida do estado (useTheme/setTheme).
 *
 * Ninguém no app usa `useTheme()` hoje (sem toggle de tema na UI ainda) — dark mode
 * segue só a preferência do SO. O hook fica aqui pronto pra quando alguém adicionar o toggle.
 */

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "system", setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

const STORAGE_KEY = "theme";

// Exportado pro layout.tsx renderizar via next/script direto no root layout (ver comentário acima).
export const ANTI_FLASH_SCRIPT = `(function(){try{var s=localStorage.getItem('${STORAGE_KEY}');var t=s||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})();`;

function applyThemeClass(theme: Theme) {
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = "system" }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored) setThemeState(stored);
    } catch {
      // localStorage indisponível (modo privado etc) — segue com o defaultTheme
    }
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyThemeClass("system");
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, [theme]);

  function setTheme(next: Theme) {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage indisponível — tema ainda aplica na sessão atual, só não persiste
    }
    applyThemeClass(next);
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
