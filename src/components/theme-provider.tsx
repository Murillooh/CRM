"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Sem toggle de tema na UI hoje — dark mode segue só `prefers-color-scheme`
 * via CSS puro (ver globals.css), sem classe, sem script anti-flash, sem
 * localStorage. Isso eliminou o warning do React/Next 16 "Encountered a
 * script tag while rendering React component" que o script anti-flash
 * antigo disparava (next-themes 0.4.6 tinha o mesmo problema).
 *
 * O contexto/hook ficam aqui só de fachada, prontos pro dia que alguém
 * adicionar um toggle manual de tema — nesse dia, volta a costurar:
 * cookie (setTheme grava) lido no RootLayout (Server Component, já dá pra
 * ler direto) pra decidir a classe/atributo do <html> sem flash, e
 * globals.css volta a ter `.dark`/`[data-theme=dark]` além do @media.
 */

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => {
    console.warn("setTheme chamado, mas não há toggle de tema implementado ainda — dark mode segue o SO.");
  },
});

export function useTheme() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = "system" }: ThemeProviderProps) {
  return <ThemeContext.Provider value={{ theme: defaultTheme, setTheme: () => {} }}>{children}</ThemeContext.Provider>;
}
