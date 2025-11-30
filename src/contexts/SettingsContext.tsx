import * as React from "react"

const { createContext, useContext, useState, useEffect } = React

interface SettingsContextType {
     systemName: string
     setSystemName: (name: string) => void
     userName: string
     setUserName: (name: string) => void
     logoUrl: string
     setLogoUrl: (url: string) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
     const [systemName, setSystemNameState] = useState("TaskManager")
     const [userName, setUserNameState] = useState("")
     const [logoUrl, setLogoUrlState] = useState("")

     // Load from localStorage on mount
     useEffect(() => {
          const saved = localStorage.getItem("system-name")
          if (saved) {
               setSystemNameState(saved)
          }
          const savedUserName = localStorage.getItem("user-name")
          if (savedUserName) {
               setUserNameState(savedUserName)
          }
          const savedLogoUrl = localStorage.getItem("logo-url")
          if (savedLogoUrl) {
               setLogoUrlState(savedLogoUrl)
          }
     }, [])

     const setSystemName = (name: string) => {
          setSystemNameState(name)
          localStorage.setItem("system-name", name)
     }

     const setUserName = (name: string) => {
          setUserNameState(name)
          localStorage.setItem("user-name", name)
     }

     const setLogoUrl = (url: string) => {
          setLogoUrlState(url)
          localStorage.setItem("logo-url", url)
     }

     return (
          <SettingsContext.Provider value={{ systemName, setSystemName, userName, setUserName, logoUrl, setLogoUrl }}>
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
               setSystemName: () => { },
               userName: "",
               setUserName: () => { },
               logoUrl: "",
               setLogoUrl: () => { }
          }
     }
     return context
}