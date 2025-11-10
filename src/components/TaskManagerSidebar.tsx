import {
     LayoutDashboard,
     FolderOpen,
     CheckSquare,
     Calendar,
     BookOpen,
     FileText,
     Settings,
     LogOut,
     DollarSign,
     Users,
     UserCircle
} from "lucide-react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useRoles } from "@/hooks/useRoles"
import { useSettings } from "@/contexts/SettingsContext"

import {
     Sidebar,
     SidebarContent,
     SidebarGroup,
     SidebarGroupContent,
     SidebarMenu,
     SidebarMenuButton,
     SidebarMenuItem,
     useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"


export function TaskManagerSidebar() {
     const { state } = useSidebar()
     const location = useLocation()
     const navigate = useNavigate()
     const { user, signOut } = useAuth()
     const { isAdmin } = useRoles()
     const { systemName } = useSettings()
     const { toast } = useToast()
     const currentPath = location.pathname
     const collapsed = state === "collapsed"

     // Menu items básicos
     const baseMenuItems = [
          { title: "Dashboard", url: "/", icon: LayoutDashboard },
          { title: "Projetos", url: "/projects", icon: FolderOpen },
          { title: "Tarefas", url: "/tasks", icon: CheckSquare },
          { title: "Calendário", url: "/calendar", icon: Calendar },
          { title: "Notas", url: "/notes", icon: BookOpen },
          { title: "Vendas", url: "/sales", icon: DollarSign },
          { title: "Clientes", url: "/customers", icon: UserCircle },
          { title: "Relatórios", url: "/reports", icon: FileText },
     ]

     // Adicionar item admin se for admin
     const adminItems = isAdmin
          ? [{ title: "Usuários", url: "/admin/users", icon: Users }]
          : []

     const settingsItems = [
          { title: "Configurações", url: "/settings", icon: Settings }
     ]

     // Menu completo
     const menuItems = [...baseMenuItems, ...adminItems, ...settingsItems]

     const handleSignOut = async () => {
          try {
               await signOut()
               toast({
                    title: "Logout realizado",
                    description: "Você foi desconectado com sucesso"
               })
               navigate("/auth")
          } catch (error) {
               toast({
                    title: "Erro ao fazer logout",
                    description: "Tente novamente",
                    variant: "destructive"
               })
          }
     }

     const isActive = (path: string) => {
          if (path === "/") return currentPath === "/"
          return currentPath.startsWith(path)
     }

     const getNavClass = (path: string) => {
          const baseClass = "w-full h-12 rounded-lg transition-all duration-300 flex items-center justify-start gap-3 px-3"
          if (isActive(path)) {
               return `${baseClass} bg-primary text-primary-foreground shadow-primary font-medium`
          }
          return `${baseClass} text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`
     }

     return (
          <Sidebar className="border-r border-sidebar-border bg-gradient-sidebar">
               <SidebarContent className="p-4 sidebar-scroll">
                    {/* Logo */}
                    <div className="mb-8 flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center">
                              <img
                                   src="/lovable-uploads/f11bb6d6-1c0f-4aa0-a897-7bb6abaf8a4e.png"
                                   alt="Logo"
                                   className="w-full h-full object-contain"
                              />
                         </div>
                         {!collapsed && (
                              <h1 className="text-xl font-bold text-sidebar-foreground">{systemName}</h1>
                         )}
                    </div>

                    {/* Navigation Menu */}
                    <SidebarGroup>
                         <SidebarGroupContent>
                              <SidebarMenu className="space-y-2">
                                   {menuItems.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                             <SidebarMenuButton asChild className="p-0">
                                                  <NavLink to={item.url} className={getNavClass(item.url)}>
                                                       <item.icon className="w-5 h-5 flex-shrink-0" />
                                                       {!collapsed && <span className="font-medium">{item.title}</span>}
                                                  </NavLink>
                                             </SidebarMenuButton>
                                        </SidebarMenuItem>
                                   ))}
                              </SidebarMenu>
                         </SidebarGroupContent>
                    </SidebarGroup>

                    {/* User Profile */}
                    {!collapsed && (
                         <div className="mt-auto pt-6 border-t border-sidebar-border">
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent mb-3">
                                   <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                                        <span className="text-sm font-bold text-primary-foreground">
                                             {user?.email?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                   </div>
                                   <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-sidebar-foreground truncate">
                                             {user?.email || 'Usuário'}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                             {isAdmin ? 'Administrador' : 'Usuário'}
                                        </p>
                                   </div>
                              </div>
                              <Button
                                   variant="ghost"
                                   className="w-full justify-start text-muted-foreground hover:text-foreground"
                                   onClick={handleSignOut}
                              >
                                   <LogOut className="mr-2 h-4 w-4" />
                                   Sair
                              </Button>
                         </div>
                    )}
               </SidebarContent>
          </Sidebar>
     )
}