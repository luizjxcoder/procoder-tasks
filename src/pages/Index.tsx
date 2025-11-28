import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TaskManagerSidebar } from "@/components/TaskManagerSidebar"
import { ProjectCard } from "@/components/ProjectCard"
import { TaskList } from "@/components/TaskList"
import { CalendarWidget } from "@/components/CalendarWidget"
import { NotesWidget } from "@/components/NotesWidget"
import { TimeTracker } from "@/components/TimeTracker"
import { AlertsWidget } from "@/components/AlertsWidget"
import { RecentSalesActivity } from "@/components/RecentSalesActivity"
import { RecentBriefings } from "@/components/RecentBriefings"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, TrendingUp, Users, Clock, Target, DollarSign } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useSettings } from "@/contexts/SettingsContext"

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
     const { userName } = useSettings()
     const navigate = useNavigate()

     const [userTasks, setUserTasks] = useState<any[]>(tasks)
     const [stats, setStats] = useState([
          { label: "Total de Projetos", value: "0", icon: Target, color: "text-primary" },
          { label: "Tarefas Concluídas", value: "0", icon: TrendingUp, color: "text-success" },
          { label: "Tarefas + Subtarefas Ativas", value: "0", icon: Clock, color: "text-warning" },
          { label: "Total de Vendas", value: "0", icon: DollarSign, color: "text-info" },
          { label: "Total de Clientes", value: "0", icon: Users, color: "text-accent" }
     ])

     const [realProjects, setRealProjects] = useState<any[]>([])
     const [loading, setLoading] = useState(true)

     const fetchDashboardData = async () => {
          if (!user) return

          try {
               setLoading(true)

               // -----------------------------
               // 🔥 QUERY 1: BUSCAR TODOS PROJETOS (para total real)
               // -----------------------------
               const { data: allProjects, error: allProjectsError } = await supabase
                    .from("projects")
                    .select("*")
                    .eq("user_id", user.id)

               if (allProjectsError) throw allProjectsError

               // -----------------------------
               // 🔥 QUERY 2: TRAZER SÓ OS 3 MAIS RECENTES
               // -----------------------------
               const { data: recentProjects, error: recentProjectsError } = await supabase
                    .from("projects")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(3)

               if (recentProjectsError) throw recentProjectsError

               // -----------------------------
               // 🔥 TAREFAS
               // -----------------------------
               let tasksData: any[] = []
               try {
                    const { data, error } = await supabase
                         .from("tasks")
                         .select("*")
                         .eq("user_id", user.id)
                    if (!error && data) tasksData = data
               } catch (e) {
                    console.warn("Erro ao buscar tarefas:", e)
               }

               // -----------------------------
               // 🔥 VENDAS
               // -----------------------------
               let salesData: any[] = []
               try {
                    const { data, error } = await supabase
                         .from("sales")
                         .select("*")
                         .eq("user_id", user.id)
                    if (!error && data) salesData = data
               } catch (e) {
                    console.warn("Erro ao buscar vendas:", e)
               }

               // Buscar clientes (opcional)
               let customersData: any[] = []
               try {
                    const { data, error } = await supabase
                         .from('customers')
                         .select('*')
                         .eq('user_id', user.id)
                    if (!error && data) customersData = data
                    else if (error) console.warn('Erro ao buscar clientes (ignorando):', error.message)
               } catch (e) {
                    console.warn('Falha inesperada ao buscar clientes (ignorando):', e)
               }


               // -----------------------------
               // 📊 CALCULO DE ESTATÍSTICAS ATUAIS
               // -----------------------------
               const totalProjects = allProjects?.length || 0
               const completedTasks = tasksData.filter(t => t.status === "completed").length
               const activeTasks = tasksData.filter(t => t.status !== "completed").length
               const totalSales = salesData?.length || 0
               const totalCustomers = customersData?.length || 0

               setStats([
                    { label: "Total de Projetos", value: totalProjects.toString(), icon: Target, color: "text-primary" },
                    { label: "Tarefas Concluídas", value: completedTasks.toString(), icon: TrendingUp, color: "text-success" },
                    { label: "Tarefas + Subtarefas Ativas", value: activeTasks.toString(), icon: Clock, color: "text-warning" },
                    { label: "Total de Vendas", value: totalSales.toString(), icon: DollarSign, color: "text-info" },
                    { label: "Total de Clientes", value: totalCustomers.toString(), icon: Users, color: "text-accent" },
               ])

               // -----------------------------
               // 🗂 FORMATAR SÓ OS 3 RECENTES
               // -----------------------------
               const formattedProjects = recentProjects?.map(project => ({
                    title: project.title,
                    company: project.company || "Empresa",
                    progress: project.progress || 0,
                    totalTasks: project.total_tasks || 0,
                    completedTasks: project.completed_tasks || 0,
                    priority: project.priority as "high" | "medium" | "low",
                    dueDate: project.due_date
                         ? new Date(project.due_date).toLocaleDateString("pt-BR", { month: "short", day: "numeric" })
                         : "Sem data",
                    team: [
                         { id: "1", name: "Você", avatar: user.email?.charAt(0).toUpperCase() || "U" },
                    ],
                    tags: ["Projeto"],
                    status: project.status as "active" | "completed" | "on-hold",
                    imageUrl: project.image_url || undefined,
                    project
               })) || []

               setRealProjects(formattedProjects)
               setUserTasks(tasksData)

          } catch (error) {
               console.error("Erro no dashboard:", error)
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
                    .from("tasks")
                    .update(updates)
                    .eq("id", taskId)
                    .eq("user_id", user.id)

               if (error) throw error

               setUserTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t))
               fetchDashboardData()
          } catch (error) {
               console.error("Erro ao atualizar tarefa:", error)
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
                                             <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                                                  {userName ? `Olá ${userName} - ` : ""}Dashboard
                                             </h1>
                                             <p className="text-sm sm:text-base text-muted-foreground">
                                                  Welcome back! Here's what's happening with your projects.
                                             </p>
                                        </div>
                                   </div>
                                   <Button
                                        className="bg-gradient-primary hover:bg-gradient-primary/90 w-full sm:w-auto"
                                        onClick={() => navigate("/projects")}
                                   >
                                        <Plus className="w-4 h-4 mr-2" />
                                        <span className="hidden sm:inline">New Project</span>
                                        <span className="sm:hidden">New</span>
                                   </Button>
                              </div>

                              {/* CARDS DE STATUS */}
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
                                   {stats.map((stat, i) => (
                                        <div key={i} className="bg-gradient-card border border-border rounded-xl p-6 shadow-card">
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

                              {/* Widgets */}
                              <div className="mb-4 sm:mb-6">
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                        <TimeTracker />
                                        <AlertsWidget />
                                   </div>
                              </div>

                              {/* Projects & Tasks */}
                              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                                   <div className="space-y-4 sm:space-y-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                             <h2 className="text-lg sm:text-xl font-semibold text-foreground">Projetos Recentes</h2>
                                             <div className="flex items-center gap-2">
                                                  <Badge variant="secondary">{realProjects.length}</Badge>
                                                  {realProjects.length > 0 && (
                                                       <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate("/projects")}
                                                            className="text-primary hover:text-white"
                                                       >
                                                            Ver Todos
                                                       </Button>
                                                  )}
                                             </div>
                                        </div>

                                        {loading ? (
                                             <div className="text-center text-muted-foreground">Carregando projetos...</div>
                                        ) : realProjects.length > 0 ? (
                                             realProjects.map((project, i) => (
                                                  <div key={i} className="cursor-pointer" onClick={() => navigate("/projects")}>
                                                       <ProjectCard {...project} />
                                                  </div>
                                             ))
                                        ) : (
                                             <div className="text-center text-muted-foreground">
                                                  <p>Nenhum projeto encontrado.</p>
                                                  <Button
                                                       className="mt-4 bg-gradient-primary hover:bg-gradient-primary/90"
                                                       onClick={() => navigate("/projects")}
                                                  >
                                                       <Plus className="w-4 h-4 mr-2" />
                                                       Criar Primeiro Projeto
                                                  </Button>
                                             </div>
                                        )}
                                   </div>

                                   <div className="space-y-4 sm:space-y-6">
                                        <TaskList
                                             tasks={userTasks.slice(0, 6).map(task => ({
                                                  id: task.id,
                                                  title: task.title,
                                                  project: "Sistema",
                                                  priority: task.priority,
                                                  dueDate: task.due_date
                                                       ? new Date(task.due_date).toLocaleDateString("pt-BR")
                                                       : "Sem data",
                                                  status: task.status,
                                                  estimatedTime: task.estimated_time || "N/A"
                                             }))}
                                             onTaskUpdate={handleTaskUpdate}
                                             showEditDelete={false}
                                        />
                                        <CalendarWidget tasks={userTasks} />
                                   </div>
                              </div>

                              {/* Notes and Sales */}
                              <div className="mt-4 sm:mt-6">
                                   <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                                        <NotesWidget />
                                        <RecentSalesActivity />
                                   </div>
                              </div>

                              {/* Briefings CARD */}
                              <div className="mt-4 sm:mt-6">
                                   <RecentBriefings />
                              </div>
                         </main>
                    </div>
               </SidebarProvider>
          </div>
     )
}

export default Index
