import * as React from "react"

const { createContext, useContext, useState, useEffect } = React

export type ThemeColor = 'default' | 'green' | 'blue' | 'purple'

interface ThemeContextType {
  themeColor: ThemeColor
  setThemeColor: (color: ThemeColor) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeColor, setThemeColorState] = useState<ThemeColor>('default')

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme-color") as ThemeColor
    if (saved && ['default', 'green', 'blue', 'purple'].includes(saved)) {
      setThemeColorState(saved)
      applyThemeColor(saved)
    }
  }, [])

  const setThemeColor = (color: ThemeColor) => {
    setThemeColorState(color)
    localStorage.setItem("theme-color", color)
    applyThemeColor(color)
  }

  const applyThemeColor = (color: ThemeColor) => {
    const root = document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('theme-default', 'theme-green', 'theme-blue', 'theme-purple')
    
    // Add new theme class
    root.classList.add(`theme-${color}`)
  }

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    return {
      themeColor: 'default' as ThemeColor,
      setThemeColor: () => {}
    }
  }
  return context
}