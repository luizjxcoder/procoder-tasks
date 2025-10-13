import * as React from "react"

const { createContext, useContext, useState, useEffect } = React

interface SettingsContextType {
  systemName: string
  setSystemName: (name: string) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [systemName, setSystemNameState] = useState("TaskManager")

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("system-name")
    if (saved) {
      setSystemNameState(saved)
    }
  }, [])

  const setSystemName = (name: string) => {
    setSystemNameState(name)
    localStorage.setItem("system-name", name)
  }

  return (
    <SettingsContext.Provider value={{ systemName, setSystemName }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    // Fallback to default values if provider is not available
    return {
      systemName: "TaskManager",
      setSystemName: () => {}
    }
  }
  return context
}