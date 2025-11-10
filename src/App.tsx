import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "@/hooks/useAuth"
import { SettingsProvider } from "@/contexts/SettingsContext"
import { ThemeProvider } from "@/contexts/ThemeContext"
import Index from "./pages/Index"
import Projects from "./pages/Projects"
import Tasks from "./pages/Tasks"
import Calendar from "./pages/Calendar"
import Notes from "./pages/Notes"
import Reports from "./pages/Reports"
import Settings from "./pages/Settings"
import Sales from "./pages/Sales"
import Customers from "./pages/Customers"
import Auth from "./pages/Auth"
import UserManagement from "./pages/UserManagement"
import NotFound from "./pages/NotFound"

const queryClient = new QueryClient()

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
     const { user, loading } = useAuth()

     if (loading) {
          return (
               <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="text-muted-foreground">Carregando...</div>
               </div>
          )
     }

     if (!user) {
          return <Navigate to="/auth" replace />
     }

     return <>{children}</>
}

const App = () => (
     <QueryClientProvider client={queryClient}>
          <AuthProvider>
               <SettingsProvider>
                    <ThemeProvider>
                         <TooltipProvider>
                              <Toaster />
                              <Sonner />
                              <BrowserRouter basename={import.meta.env.DEV ? "/" : "/procoder-tasks"}>
                                   <Routes>
                                        <Route path="/auth" element={<Auth />} />
                                        <Route
                                             path="/"
                                             element={
                                                  <ProtectedRoute>
                                                       <Index />
                                                  </ProtectedRoute>
                                             }
                                        />
                                        <Route
                                             path="/projects"
                                             element={
                                                  <ProtectedRoute>
                                                       <Projects />
                                                  </ProtectedRoute>
                                             }
                                        />
                                        <Route
                                             path="/tasks"
                                             element={
                                                  <ProtectedRoute>
                                                       <Tasks />
                                                  </ProtectedRoute>
                                             }
                                        />
                                        <Route
                                             path="/calendar"
                                             element={
                                                  <ProtectedRoute>
                                                       <Calendar />
                                                  </ProtectedRoute>
                                             }
                                        />
                                        <Route
                                             path="/notes"
                                             element={
                                                  <ProtectedRoute>
                                                       <Notes />
                                                  </ProtectedRoute>
                                             }
                                        />
                                        <Route
                                             path="/reports"
                                             element={
                                                  <ProtectedRoute>
                                                       <Reports />
                                                  </ProtectedRoute>
                                             }
                                        />
                                        <Route
                                             path="/settings"
                                             element={
                                                  <ProtectedRoute>
                                                       <Settings />
                                                  </ProtectedRoute>
                                             }
                                        />
                                        <Route
                                             path="/sales"
                                             element={
                                                  <ProtectedRoute>
                                                       <Sales />
                                                  </ProtectedRoute>
                                             }
                                        />
                                        <Route
                                             path="/customers"
                                             element={
                                                  <ProtectedRoute>
                                                       <Customers />
                                                  </ProtectedRoute>
                                             }
                                        />
                                        <Route
                                             path="/admin/users"
                                             element={
                                                  <ProtectedRoute>
                                                       <UserManagement />
                                                  </ProtectedRoute>
                                             }
                                        />
                                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                                        <Route path="*" element={<NotFound />} />
                                   </Routes>
                              </BrowserRouter>
                         </TooltipProvider>
                    </ThemeProvider>
               </SettingsProvider>
          </AuthProvider>
     </QueryClientProvider>
)

export default App
