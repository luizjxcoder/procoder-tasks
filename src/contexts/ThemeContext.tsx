import * as React from "react"

const { createContext, useContext, useState, useEffect } = React

export type ThemeColor = 'default' | 'green' | 'blue' | 'purple'
export type ThemeMode = 'dark' | 'light'

interface ThemeContextType {
  themeColor: ThemeColor
  setThemeColor: (color: ThemeColor) => void
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  toggleThemeMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeColor, setThemeColorState] = useState<ThemeColor>('default')
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark')

  // Load from localStorage on mount
  useEffect(() => {
    const savedColor = localStorage.getItem("theme-color") as ThemeColor
    const savedMode = localStorage.getItem("theme-mode") as ThemeMode
    
    if (savedColor && ['default', 'green', 'blue', 'purple'].includes(savedColor)) {
      setThemeColorState(savedColor)
    }
    
    if (savedMode && ['dark', 'light'].includes(savedMode)) {
      setThemeModeState(savedMode)
    }
    
    applyTheme(savedColor || 'default', savedMode || 'dark')
  }, [])

  const setThemeColor = (color: ThemeColor) => {
    setThemeColorState(color)
    localStorage.setItem("theme-color", color)
    applyTheme(color, themeMode)
  }

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode)
    localStorage.setItem("theme-mode", mode)
    applyTheme(themeColor, mode)
  }

  const toggleThemeMode = () => {
    const newMode = themeMode === 'dark' ? 'light' : 'dark'
    setThemeMode(newMode)
  }

  const applyTheme = (color: ThemeColor, mode: ThemeMode) => {
    const root = document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('theme-default', 'theme-green', 'theme-blue', 'theme-purple', 'dark', 'light')
    
    // Add theme color and mode classes
    root.classList.add(`theme-${color}`)
    root.classList.add(mode)
  }

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor, themeMode, setThemeMode, toggleThemeMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    return {
      themeColor: 'default' as ThemeColor,
      setThemeColor: () => {},
      themeMode: 'dark' as ThemeMode,
      setThemeMode: () => {},
      toggleThemeMode: () => {}
    }
  }
  return context
}