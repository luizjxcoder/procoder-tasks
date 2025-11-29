import { useState, useEffect } from "react"
import { TaskManagerSidebar } from "@/components/TaskManagerSidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { 
  BarChart3, 
  Download, 
  FileText, 
  Calendar as CalendarIcon,
  Clock,
  TrendingUp,
  Users,
  DollarSign
} from "lucide-react"
import * as XLSX from 'xlsx'
import { toast } from "@/hooks/use-toast"

interface Project {
  id: string
  title: string
  description: string
  company: string
  status: string
  priority: string
  progress: number
  total_tasks: number
  completed_tasks: number
  due_date: string
  budget: number
  created_at: string
}

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  due_date: string
  project_id: string
  estimated_time: string
  created_at: string
  projects?: { title: string; company: string }
}

interface Sale {
  id: string
  project_name: string
  client_name: string
  client_phone: string | null
  client_social_media: string | null
  business_name: string | null
  sale_value: number
  sale_date: string
  payment_status: string
  client_rating: number | null
  categories: string[] | null
  created_at: string
}

interface Note {
  id: string
  title: string
  content: string | null
  tags: string[] | null
  is_favorite: boolean
  created_at: string
}

const Reports = () => {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [reportType, setReportType] = useState<string>("projects")

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (projectsError) throw projectsError
      setProjects(projectsData || [])

      // Fetch tasks with project info
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          projects:project_id (title, company)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (tasksError) throw tasksError
      setTasks(tasksData || [])

      // Fetch sales
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (salesError) throw salesError
      setSales(salesData || [])

      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (notesError) throw notesError
      setNotes(notesData || [])

    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos relatórios",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getFilteredData = () => {
    let filteredProjects = projects
    let filteredTasks = tasks
    let filteredSales = sales
    let filteredNotes = notes

    // Filter by project if selected
    if (selectedProject !== "all") {
      filteredProjects = projects.filter(p => p.id === selectedProject)
      filteredTasks = tasks.filter(t => t.project_id === selectedProject)
      filteredSales = sales.filter(s => s.project_name === filteredProjects[0]?.title)
    }

    // Filter by date range
    if (dateFrom) {
      const fromStr = format(dateFrom, 'yyyy-MM-dd')
      filteredProjects = filteredProjects.filter(p => p.created_at >= fromStr)
      filteredTasks = filteredTasks.filter(t => t.created_at >= fromStr)
      filteredSales = filteredSales.filter(s => s.created_at >= fromStr)
      filteredNotes = filteredNotes.filter(n => n.created_at >= fromStr)
    }

    if (dateTo) {
      const toStr = format(dateTo, 'yyyy-MM-dd')
      filteredProjects = filteredProjects.filter(p => p.created_at <= toStr)
      filteredTasks = filteredTasks.filter(t => t.created_at <= toStr)
      filteredSales = filteredSales.filter(s => s.created_at <= toStr)
      filteredNotes = filteredNotes.filter(n => n.created_at <= toStr)
    }

    return {
      projects: filteredProjects,
      tasks: filteredTasks,
      sales: filteredSales,
      notes: filteredNotes
    }
  }

  const getExportData = () => {
    const { projects: filteredProjects, tasks: filteredTasks, sales: filteredSales, notes: filteredNotes } = getFilteredData()

    switch (reportType) {
      case "projects":
        return filteredProjects.map(project => ({
          "ID": project.id,
          "Título": project.title,
          "Descrição": project.description || "N/A",
          "Empresa": project.company || "N/A",
          "Status": project.status,
          "Prioridade": project.priority,
          "Progresso (%)": project.progress,
          "Total Tarefas": project.total_tasks,
          "Tarefas Concluídas": project.completed_tasks,
          "Data Entrega": project.due_date || "N/A",
          "Orçamento": project.budget || 0,
          "Data Criação": format(new Date(project.created_at), "dd/MM/yyyy", { locale: ptBR })
        }))

      case "tasks":
        return filteredTasks.map(task => ({
          "ID": task.id,
          "Título": task.title,
          "Descrição": task.description || "N/A",
          "Status": task.status,
          "Prioridade": task.priority,
          "Data Entrega": task.due_date || "N/A",
          "Tempo Estimado": task.estimated_time || "N/A",
          "Projeto": task.projects?.title || "N/A",
          "Empresa": task.projects?.company || "N/A",
          "Data Criação": format(new Date(task.created_at), "dd/MM/yyyy", { locale: ptBR })
        }))

      case "sales":
        return filteredSales.map(sale => ({
          "ID": sale.id,
          "Projeto": sale.project_name,
          "Cliente": sale.client_name,
          "Telefone": sale.client_phone || "N/A",
          "Empresa Cliente": sale.business_name || "N/A",
          "Valor": `R$ ${sale.sale_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          "Data Venda": format(new Date(sale.sale_date), "dd/MM/yyyy", { locale: ptBR }),
          "Status Pagamento": sale.payment_status,
          "Avaliação": sale.client_rating || "N/A",
          "Categorias": sale.categories?.join(", ") || "N/A",
          "Data Criação": format(new Date(sale.created_at), "dd/MM/yyyy", { locale: ptBR })
        }))

      case "notes":
        return filteredNotes.map(note => ({
          "ID": note.id,
          "Título": note.title,
          "Conteúdo": note.content || "N/A",
          "Tags": note.tags?.join(", ") || "N/A",
          "Favorito": note.is_favorite ? "Sim" : "Não",
          "Data Criação": format(new Date(note.created_at), "dd/MM/yyyy", { locale: ptBR })
        }))

      default:
        return []
    }
  }

  const exportToExcel = () => {
    const data = getExportData()
    
    if (data.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há dados para exportar",
        variant: "default"
      })
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    
    const sheetName = reportType === "projects" ? "Projetos" : 
                     reportType === "tasks" ? "Tarefas" : 
                     reportType === "sales" ? "Vendas" : "Notas"
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    
    const fileName = `relatorio_${sheetName.toLowerCase()}_${format(new Date(), "yyyy-MM-dd")}.xlsx`
    XLSX.writeFile(workbook, fileName)

    toast({
      title: "Sucesso",
      description: "Relatório exportado com sucesso!"
    })
  }

  const getStatsData = () => {
    const { projects: filteredProjects, tasks: filteredTasks, sales: filteredSales, notes: filteredNotes } = getFilteredData()
    
    const totalProjects = filteredProjects.length
    const completedProjects = filteredProjects.filter(p => p.status === 'completed').length
    const totalTasks = filteredTasks.length
    const completedTasks = filteredTasks.filter(t => t.status === 'completed').length
    const totalSales = filteredSales.length
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.sale_value || 0), 0)
    const totalNotes = filteredNotes.length
    const totalBudget = filteredProjects.reduce((sum, project) => sum + (project.budget || 0), 0)

    return {
      totalProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      totalSales,
      totalRevenue,
      totalNotes,
      totalBudget
    }
  }

  const stats = getStatsData()

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SidebarProvider>
          <div className="flex w-full">
            <TaskManagerSidebar />
            <main className="flex-1 p-3 sm:p-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Carregando relatórios...</div>
              </div>
            </main>
          </div>
        </SidebarProvider>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider>
        <div className="flex w-full">
          <TaskManagerSidebar />
          <main className="flex-1 p-3 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                                          <SidebarTrigger className="lg:hidden h-12 w-12 p-3 [&_svg]:w-6 [&_svg]:h-6" />
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Relatórios</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">Visualize e analise dados dos seus projetos</p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Projetos</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalProjects}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.completedProjects} concluídos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tarefas</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalTasks}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.completedTasks} concluídas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Vendas</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.totalSales}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      R$ {stats.totalBudget.toLocaleString('pt-BR')}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Todos os projetos
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>Filtros</CardTitle>
                  <CardDescription>Selecione os filtros para personalizar seus relatórios</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="project-filter">Projeto</Label>
                      <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os projetos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os projetos</SelectItem>
                          {projects.map(project => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Data Inicial</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !dateFrom && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateFrom}
                            onSelect={setDateFrom}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Data Final</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !dateTo && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateTo}
                            onSelect={setDateTo}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clear-filters">Ações</Label>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setDateFrom(undefined)
                          setDateTo(undefined)
                          setSelectedProject("all")
                        }}
                      >
                        Limpar Filtros
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reports */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Dados dos Relatórios</CardTitle>
                      <CardDescription>Visualize e exporte dados dos seus projetos</CardDescription>
                    </div>
                    <Button onClick={exportToExcel} className="flex items-center gap-2 w-full sm:w-auto">
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Exportar Excel</span>
                      <span className="sm:hidden">Exportar</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={reportType} onValueChange={setReportType}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="projects">Projetos</TabsTrigger>
                      <TabsTrigger value="tasks">Tarefas</TabsTrigger>
                      <TabsTrigger value="sales">Vendas</TabsTrigger>
                      <TabsTrigger value="notes">Notas</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="projects" className="mt-6">
                      <div className="space-y-4">
                        {getFilteredData().projects.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            Nenhum projeto encontrado com os filtros selecionados
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {getFilteredData().projects.map(project => (
                              <Card key={project.id} className="p-3 sm:p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                                  <div>
                                    <h3 className="font-medium">{project.title}</h3>
                                    <p className="text-sm text-muted-foreground">{project.company || 'N/A'}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                                      {project.status}
                                    </Badge>
                                    <Badge variant={project.priority === 'high' ? 'destructive' : 'outline'}>
                                      {project.priority}
                                    </Badge>
                                  </div>
                                  <div className="text-left sm:text-right">
                                    <div className="text-sm font-medium">{project.progress}% concluído</div>
                                    <div className="text-sm text-muted-foreground">
                                      {project.completed_tasks}/{project.total_tasks} tarefas
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="tasks" className="mt-6">
                      <div className="space-y-4">
                        {getFilteredData().tasks.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            Nenhuma tarefa encontrada com os filtros selecionados
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {getFilteredData().tasks.map(task => (
                              <Card key={task.id} className="p-3 sm:p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                                  <div>
                                    <h3 className="font-medium">{task.title}</h3>
                                    <p className="text-sm text-muted-foreground">{task.projects?.title || 'Sem projeto'}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                                      {task.status}
                                    </Badge>
                                    <Badge variant={task.priority === 'high' ? 'destructive' : 'outline'}>
                                      {task.priority}
                                    </Badge>
                                  </div>
                                  <div className="text-left sm:text-right">
                                    <div className="text-sm font-medium">{task.estimated_time || 'N/A'}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {task.due_date ? format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR }) : 'Sem prazo'}
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="sales" className="mt-6">
                      <div className="space-y-4">
                        {getFilteredData().sales.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            Nenhuma venda encontrada com os filtros selecionados
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {getFilteredData().sales.map(sale => (
                              <Card key={sale.id} className="p-3 sm:p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                                  <div>
                                    <h3 className="font-medium">{sale.client_name}</h3>
                                    <p className="text-sm text-muted-foreground">{sale.project_name}</p>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <Badge variant={sale.payment_status === 'paid' ? 'default' : 'secondary'}>
                                      {sale.payment_status}
                                    </Badge>
                                    {sale.categories && sale.categories.length > 0 && (
                                      <span className="text-xs text-muted-foreground">
                                        {sale.categories.join(", ")}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-left sm:text-right">
                                    <div className="text-sm font-medium">
                                      R$ {sale.sale_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {format(new Date(sale.sale_date), "dd/MM/yyyy", { locale: ptBR })}
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="notes" className="mt-6">
                      <div className="space-y-4">
                        {getFilteredData().notes.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            Nenhuma nota encontrada com os filtros selecionados
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {getFilteredData().notes.map(note => (
                              <Card key={note.id} className="p-3 sm:p-4">
                                <div className="grid grid-cols-1 gap-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h3 className="font-medium">{note.title}</h3>
                                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {note.content || "Sem conteúdo"}
                                      </p>
                                    </div>
                                    {note.is_favorite && (
                                      <Badge variant="default">⭐ Favorito</Badge>
                                    )}
                                  </div>
                                  {note.tags && note.tags.length > 0 && (
                                    <div className="flex gap-1 flex-wrap">
                                      {note.tags.map((tag, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                  <div className="text-sm text-muted-foreground">
                                    Criada em {format(new Date(note.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  )
}

export default Reports