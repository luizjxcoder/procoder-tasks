import { useState, useEffect } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TaskManagerSidebar } from "@/components/TaskManagerSidebar"
import { ProjectCard } from "@/components/ProjectCard"
import { TaskList } from "@/components/TaskList"
import { CalendarWidget } from "@/components/CalendarWidget"
import { NotesWidget } from "@/components/NotesWidget"
import { TimeTracker } from "@/components/TimeTracker"
import { AlertsWidget } from "@/components/AlertsWidget"
import { RecentSalesActivity } from "@/components/RecentSalesActivity"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, TrendingUp, Users, Clock, Target } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom" // ✅ Adicionado para navegação SPA

// Mock data
const projects = [
     {
          title: "Logo Design",
          company: "Google",
          progress: 75,
          totalTasks: 30,
          completedTasks: 22,
          priority: "high" as const,
          dueDate: "Feb 20",
          team: [
               { id: "1", name: "John Doe", avatar: "JD" },
               { id: "2", name: "Jane Smith", avatar: "JS" },
               { id: "3", name: "Mike Wilson", avatar: "MW" },
               { id: "4", name: "Sarah Connor", avatar: "SC" }
          ],
          tags: ["Design", "Branding", "iOS"],
          status: "active" as const
     },
     {
          title: "Dashboard Design",
          company: "Slack",
          progress: 45,
          totalTasks: 25,
          completedTasks: 11,
          priority: "medium" as const,
          dueDate: "Feb 25",
          team: [
               { id: "5", name: "Alex Turner", avatar: "AT" },
               { id: "6", name: "Emma Watson", avatar: "EW" },
               { id: "7", name: "David Brown", avatar: "DB" }
          ],
          tags: ["UI/UX", "Dashboard", "React"],
          status: "active" as const
     }
]

const tasks = [
     {
          id: "1",
          title: "Create wireframe for login page",
          project: "Google",
          priority: "high" as const,
          dueDate: "Today",
          status: "in-progress" as const,
          estimatedTime: "2h"
     },
     {
          id: "2",
          title: "Review design system components",
          project: "Slack",
          priority: "medium" as const,
          dueDate: "Tomorrow",
          status: "todo" as const,
          estimatedTime: "1h 30m"
     },
     {
          id: "3",
          title: "Update dashboard analytics",
          project: "Internal",
          priority: "low" as const,
          dueDate: "Feb 25",
          status: "todo" as const,
          estimatedTime: "45m"
     }
]

const Index = () => {
     const { user } = useAuth()
     const navigate = useNavigate() // ✅ Substitui window.location.href
     const [userTasks, setUserTasks] = useState<any[]>(tasks)
     const [stats, setStats] = useState([
          { label: "Total de Projetos", value: "0", icon: Target, color: "text-primary" },
          { label: "Tarefas Concluídas", value: "0", icon: TrendingUp, color: "text-success" },
          { label: "Total de Vendas", value: "0", icon: Users, color: "text-info" },
          { label: "Tarefas Ativas", value: "0", icon: Clock, color: "text-warning" }
     ])
     const [realProjects, setRealProjects] = useState<any[]>([])
     const [loading, setLoading] = useState(true)

     // Buscar dados reais do banco
     const fetchDashboardData = async () => {
          if (!user) return

          try {
               setLoading(true)

               const { data: projectsData, error: projectsError } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(5)

               if (projectsError) throw projectsError

               console.log('Projetos encontrados:', projectsData)

               let tasksData: any[] = []
               try {
                    const { data, error } = await supabase
                         .from('tasks')
                         .select('*')
                         .eq('user_id', user.id)
                    if (!error && data) tasksData = data
               } catch (e) {
                    console.warn('Erro ao buscar tarefas:', e)
               }

               let salesData: any[] = []
               try {
                    const { data, error } = await supabase
                         .from('sales')
                         .select('*')
                         .eq('user_id', user.id)
                    if (!error && data) salesData = data
               } catch (e) {
                    console.warn('Erro ao buscar vendas:', e)
               }

               const totalProjects = projectsData?.length || 0
               const completedTasks = tasksData?.filter(task => task.status === 'completed').length || 0
               const activeTasks = tasksData?.filter(task => task.status !== 'completed').length || 0
               const totalSales = salesData?.length || 0

               setStats([
                    { label: "Total de Projetos", value: totalProjects.toString(), icon: Target, color: "text-primary" },
                    { label: "Tarefas Concluídas", value: completedTasks.toString(), icon: TrendingUp, color: "text-success" },
                    { label: "Total de Vendas", value: totalSales.toString(), icon: Users, color: "text-info" },
                    { label: "Tarefas Ativas", value: activeTasks.toString(), icon: Clock, color: "text-warning" }
               ])

               const formattedProjects = projectsData?.map(project => ({
                    title: project.title,
                    company: project.company || "Empresa",
                    progress: project.progress || 0,
                    totalTasks: project.total_tasks || 0,
                    completedTasks: project.completed_tasks || 0,
                    priority: project.priority as "high" | "medium" | "low",
                    dueDate: project.due_date ? new Date(project.due_date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }) : "Sem data",
                    team: [{ id: "1", name: "Você", avatar: user.email?.charAt(0).toUpperCase() || "U" }],
                    tags: ["Projeto"],
                    status: project.status as "active" | "completed" | "on-hold"
               })) || []

               setRealProjects(formattedProjects)

               const formattedTasks = (tasksData || []).map(task => ({
                    id: task.id,
                    title: task.title,
                    project: "Sistema",
                    priority: task.priority,
                    dueDate: task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : "Sem data",
                    status: task.status,
                    estimatedTime: task.estimated_time || "N/A"
               }))

               setUserTasks(formattedTasks)
          } catch (error) {
               console.error('Erro ao buscar dados do dashboard:', error)
          } finally {
               setLoading(false)
          }
     }

     useEffect(() => {
          if (user) fetchDashboardData()
     }, [user])

     const handleTaskUpdate = async (taskId: string, updates: any) => {
          if (!user) return

          try {
               const { error } = await supabase
                    .from('tasks')
                    .update(updates)
                    .eq('id', taskId)
                    .eq('user_id', user.id)

               if (error) throw error

               setUserTasks(prev => prev.map(task => task.id === taskId ? { ...task, ...updates } : task))
               fetchDashboardData()
          } catch (error) {
               console.error('Erro ao atualizar tarefa:', error)
          }
     }

     return (
          <div className="min-h-screen bg-background">
               <SidebarProvider>
                    <div className="flex w-full">
                         <TaskManagerSidebar />

                         <main className="flex-1 p-3 sm:p-6">
                              {/* Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                                   <div className="flex items-center gap-4">
                                        <SidebarTrigger className="lg:hidden" />
                                        <div>
                                             <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
                                             <p className="text-sm sm:text-base text-muted-foreground">
                                                  Bem vindo de volta! Vamos ver o que há de novo em seus projetos.
                                             </p>
                                        </div>
                                   </div>
                                   <Button
                                        className="bg-gradient-primary hover:bg-gradient-primary/90 w-full sm:w-auto"
                                        onClick={() => navigate('/projects')} // ✅ SPA routing seguro
                                   >
                                        <Plus className="w-4 h-4 mr-2" />
                                        <span className="hidden sm:inline">New Project</span>
                                        <span className="sm:hidden">New</span>
                                   </Button>
                              </div>

                              {/* Stats */}
                              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                                   {stats.map((stat, index) => (
                                        <div key={index} className="bg-gradient-card border border-border rounded-xl p-6 shadow-card">
                                             <div className="flex items-center justify-between">
                                                  <div>
                                                       <p className="text-sm text-muted-foreground">{stat.label}</p>
                                                       <p className="text-2xl font-bold text-card-foreground">
                                                            {loading ? "..." : stat.value}
                                                       </p>
                                                  </div>
                                                  <div className={`p-3 rounded-lg bg-secondary ${stat.color}`}>
                                                       <stat.icon className="w-6 h-6" />
                                                  </div>
                                             </div>
                                        </div>
                                   ))}
                              </div>

                              {/* CARD DE ALERTAS */}
                              <div className="mb-4 sm:mb-6">
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                        <TimeTracker />
                                        <AlertsWidget />
                                   </div>
                              </div>

                              {/* Main Grid */}
                              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                                   {/* Projetos Recentes */}
                                   <div className="space-y-4 sm:space-y-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                             <h2 className="text-lg sm:text-xl font-semibold text-foreground">Projetos Recentes</h2>
                                             <div className="flex items-center gap-2">
                                                  <Badge variant="secondary">{realProjects.length}</Badge>
                                                  {realProjects.length > 0 && (
                                                       <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate('/projects')} // ✅ Atualizado
                                                            className="text-primary hover:text-primary/80"
                                                       >
                                                            Ver Todos
                                                       </Button>
                                                  )}
                                             </div>
                                        </div>

                                        {loading ? (
                                             <div className="text-center text-muted-foreground">Carregando projetos...</div>
                                        ) : realProjects.length > 0 ? (
                                             realProjects.map((project, index) => (
                                                  <div key={index} className="cursor-pointer" onClick={() => navigate('/projects')}>
                                                       <ProjectCard {...project} />
                                                  </div>
                                             ))
                                        ) : (
                                             <div className="text-center text-muted-foreground">
                                                  <p>Nenhum projeto encontrado.</p>
                                                  <Button
                                                       className="mt-4 bg-gradient-primary hover:bg-gradient-primary/90"
                                                       onClick={() => navigate('/projects')}
                                                  >
                                                       <Plus className="w-4 h-4 mr-2" />
                                                       Criar Primeiro Projeto
                                                  </Button>
                                             </div>
                                        )}
                                   </div>

                                   {/* Tarefas e Calendário */}
                                   <div className="space-y-4 sm:space-y-6">
                                        <TaskList
                                             tasks={userTasks.slice(0, 6)}
                                             onTaskUpdate={handleTaskUpdate}
                                        />
                                        <CalendarWidget tasks={userTasks} />
                                   </div>
                              </div>

                              {/* Notas e Atividade de Vendas */}
                              <div className="mt-4 sm:mt-6">
                                   <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                                        <NotesWidget />
                                        <RecentSalesActivity />
                                   </div>
                              </div>
                         </main>
                    </div>
               </SidebarProvider>
          </div>
     )
}

export default Index
