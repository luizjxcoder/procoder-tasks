import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Calendar, Clock, Flag, CheckSquare, Eye, LayoutGrid, List } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { TaskDetailsModal } from "@/components/TaskDetailsModal"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TaskManagerSidebar } from "@/components/TaskManagerSidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
     DropdownMenu,
     DropdownMenuContent,
     DropdownMenuItem,
     DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Task {
     id: string
     title: string
     description: string | null
     project_id: string | null
     priority: 'high' | 'medium' | 'low'
     status: 'todo' | 'in-progress' | 'completed'
     due_date: string | null
     estimated_time: string | null
     created_at: string
     updated_at: string
}

interface Project {
     id: string
     title: string
}

const priorityColors = {
     high: "text-red-500",
     medium: "text-yellow-500",
     low: "text-green-500"
}

const statusColors = {
     todo: "bg-muted",
     "in-progress": "bg-warning",
     completed: "bg-success"
}

const truncateText = (text: string, maxLength: number = 40) => {
     if (text.length <= maxLength) return text
     return text.substring(0, maxLength) + "..."
}

export default function Tasks() {
     const { user } = useAuth()
     const { toast } = useToast()
     const [tasks, setTasks] = useState<Task[]>([])
     const [projects, setProjects] = useState<Project[]>([])
     const [loading, setLoading] = useState(true)
     const [isCreateOpen, setIsCreateOpen] = useState(false)
     const [isEditOpen, setIsEditOpen] = useState(false)
     const [isDetailsOpen, setIsDetailsOpen] = useState(false)
     const [viewingTask, setViewingTask] = useState<Task | null>(null)
     const [editingTask, setEditingTask] = useState<Task | null>(null)
     const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')

     const [formData, setFormData] = useState<{
          title: string
          description: string
          project_id: string
          priority: 'high' | 'medium' | 'low'
          status: 'todo' | 'in-progress' | 'completed'
          due_date: string
          estimated_time: string
     }>({
          title: '',
          description: '',
          project_id: '',
          priority: 'medium',
          status: 'todo',
          due_date: '',
          estimated_time: ''
     })

     const fetchTasks = async () => {
          if (!user) return

          try {
               const { data, error } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

               if (error) throw error
               setTasks(data as Task[] || [])
          } catch (error) {
               console.error('Error fetching tasks:', error)
               toast({
                    title: "Erro ao carregar tasks",
                    description: "Não foi possível carregar suas tasks",
                    variant: "destructive"
               })
          }
     }

     const fetchProjects = async () => {
          if (!user) return

          try {
               const { data, error } = await supabase
                    .from('projects')
                    .select('id, title')
                    .eq('user_id', user.id)

               if (error) throw error
               setProjects(data || [])
          } catch (error) {
               console.error('Error fetching projects:', error)
          }
     }

     useEffect(() => {
          if (user) {
               Promise.all([fetchTasks(), fetchProjects()]).finally(() => {
                    setLoading(false)
               })
          }
     }, [user])

     const resetForm = () => {
          setFormData({
               title: '',
               description: '',
               project_id: '',
               priority: 'medium',
               status: 'todo',
               due_date: '',
               estimated_time: ''
          })
     }

     const handleCreate = async () => {
          if (!user || !formData.title.trim()) return

          try {
               const { data, error } = await supabase
                    .from('tasks')
                    .insert([{
                         user_id: user.id,
                         title: formData.title.trim(),
                         description: formData.description.trim() || null,
                         project_id: formData.project_id || null,
                         priority: formData.priority,
                         status: formData.status,
                         due_date: formData.due_date || null,
                         estimated_time: formData.estimated_time.trim() || null
                    }])
                    .select()
                    .single()

               if (error) throw error

               setTasks(prev => [data as Task, ...prev])
               setIsCreateOpen(false)
               resetForm()

               toast({
                    title: "Task criada",
                    description: "Task criada com sucesso"
               })
          } catch (error) {
               console.error('Error creating task:', error)
               toast({
                    title: "Erro ao criar task",
                    description: "Não foi possível criar a task",
                    variant: "destructive"
               })
          }
     }

     const handleUpdate = async () => {
          if (!editingTask || !formData.title.trim()) return

          try {
               const { data, error } = await supabase
                    .from('tasks')
                    .update({
                         title: formData.title.trim(),
                         description: formData.description.trim() || null,
                         project_id: formData.project_id || null,
                         priority: formData.priority,
                         status: formData.status,
                         due_date: formData.due_date || null,
                         estimated_time: formData.estimated_time.trim() || null
                    })
                    .eq('id', editingTask.id)
                    .select()
                    .single()

               if (error) throw error

               setTasks(prev => prev.map(task => task.id === editingTask.id ? data as Task : task))
               setIsEditOpen(false)
               setEditingTask(null)
               resetForm()

               toast({
                    title: "Task atualizada",
                    description: "Task atualizada com sucesso"
               })
          } catch (error) {
               console.error('Error updating task:', error)
               toast({
                    title: "Erro ao atualizar task",
                    description: "Não foi possível atualizar a task",
                    variant: "destructive"
               })
          }
     }

     const handleDelete = async (taskId: string) => {
          try {
               const { error } = await supabase
                    .from('tasks')
                    .delete()
                    .eq('id', taskId)

               if (error) throw error

               setTasks(prev => prev.filter(task => task.id !== taskId))

               toast({
                    title: "Task excluída",
                    description: "Task excluída com sucesso"
               })
          } catch (error) {
               console.error('Error deleting task:', error)
               toast({
                    title: "Erro ao excluir task",
                    description: "Não foi possível excluir a task",
                    variant: "destructive"
               })
          }
     }

     const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
          try {
               const { data, error } = await supabase
                    .from('tasks')
                    .update({ status: newStatus })
                    .eq('id', taskId)
                    .select()
                    .single()

               if (error) throw error

               setTasks(prev => prev.map(task => task.id === taskId ? data as Task : task))
          } catch (error) {
               console.error('Error updating task status:', error)
               toast({
                    title: "Erro ao atualizar status",
                    description: "Não foi possível atualizar o status da task",
                    variant: "destructive"
               })
          }
     }

     const openEditDialog = (task: Task) => {
          setEditingTask(task)
          setFormData({
               title: task.title,
               description: task.description || '',
               project_id: task.project_id || '',
               priority: task.priority as 'high' | 'medium' | 'low',
               status: task.status as 'todo' | 'in-progress' | 'completed',
               due_date: task.due_date || '',
               estimated_time: task.estimated_time || ''
          })
          setIsEditOpen(true)
     }

     const handleViewDetails = (task: Task) => {
          setViewingTask(task)
          setIsDetailsOpen(true)
     }

     const getProjectName = (projectId: string | null) => {
          if (!projectId) return 'Sem projeto'
          const project = projects.find(p => p.id === projectId)
          return project?.title || 'Projeto não encontrado'
     }

     const getDeadlineBorderColor = (dueDate: string | null) => {
          if (!dueDate) return 'border-border'

          const now = new Date()
          const due = new Date(dueDate)
          const diffTime = due.getTime() - now.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          if (diffDays < 0) {
               // Vencido - vermelho igual ao dashboard
               return 'border-destructive/20 bg-destructive/5'
          } else if (diffDays <= 2) {
               // Chegando ao prazo (2 dias ou menos) - laranja igual ao dashboard
               return 'border-warning/20 bg-warning/5'
          } else {
               // Dentro do prazo - verde igual ao dashboard
               return 'border-success/20 bg-success/5'
          }
     }

     const getDeadlineLeftBorderColor = (dueDate: string | null) => {
          if (!dueDate) return 'border-l-border'

          const now = new Date()
          const due = new Date(dueDate)
          const diffTime = due.getTime() - now.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          if (diffDays < 0) {
               // Vencido - vermelho igual ao dashboard
               return 'border-l-destructive/50 bg-destructive/5'
          } else if (diffDays <= 2) {
               // Chegando ao prazo (2 dias ou menos) - laranja igual ao dashboard
               return 'border-l-warning/50 bg-warning/5'
          } else {
               // Dentro do prazo - verde igual ao dashboard
               return 'border-l-success/50 bg-success/5'
          }
     }

     if (loading) {
          return (
               <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                         <TaskManagerSidebar />
                         <main className="flex-1 p-6">
                              <div className="flex items-center justify-center h-64">
                                   <div className="text-muted-foreground">Carregando...</div>
                              </div>
                         </main>
                    </div>
               </SidebarProvider>
          )
     }

     return (
          <SidebarProvider>
               <div className="min-h-screen flex w-full">
                    <TaskManagerSidebar />
                    <main className="flex-1 p-3 sm:p-6">
                         <div className="max-w-7xl mx-auto">
                              {/* Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                                   <div className="flex items-center gap-4">
                                        <SidebarTrigger className="lg:hidden" />
                                        <div>
                                             <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Tasks</h1>
                                             <p className="text-sm sm:text-base text-muted-foreground mt-1">
                                                  Gerencie suas tarefas e acompanhe seu progresso
                                             </p>
                                        </div>
                                   </div>

                                   <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                                        {/* View Mode Toggle */}
                                        <div className="flex rounded-lg border border-border p-1">
                                             <Button
                                                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                                                  size="sm"
                                                  onClick={() => setViewMode('cards')}
                                                  className="h-8"
                                             >
                                                  <LayoutGrid className="w-4 h-4 mr-2" />
                                                  Cards
                                             </Button>
                                             <Button
                                                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                                                  size="sm"
                                                  onClick={() => setViewMode('list')}
                                                  className="h-8"
                                             >
                                                  <List className="w-4 h-4 mr-2" />
                                                  Lista
                                             </Button>
                                        </div>

                                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                             <DialogTrigger asChild>
                                                  <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="w-full sm:w-auto">
                                                       <Plus className="w-4 h-4 mr-2" />
                                                       <span className="hidden sm:inline">Nova Task</span>
                                                       <span className="sm:hidden">Nova</span>
                                                  </Button>
                                             </DialogTrigger>
                                             <DialogContent className="max-w-md w-[95vw] sm:w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                                                  <DialogHeader>
                                                       <DialogTitle className="text-lg sm:text-xl">Criar Nova Task</DialogTitle>
                                                  </DialogHeader>
                                                  <div className="space-y-3 sm:space-y-4">
                                                       <div>
                                                            <Label htmlFor="title">Título *</Label>
                                                            <Input
                                                                 id="title"
                                                                 value={formData.title}
                                                                 onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                                                 placeholder="Digite o título da task"
                                                            />
                                                       </div>

                                                       <div>
                                                            <Label htmlFor="description">Descrição</Label>
                                                            <Textarea
                                                                 id="description"
                                                                 value={formData.description}
                                                                 onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                                 placeholder="Digite a descrição da task"
                                                                 rows={3}
                                                            />
                                                       </div>

                                                       <div>
                                                            <Label htmlFor="project">Projeto</Label>
                                                            <Select
                                                                 value={formData.project_id}
                                                                 onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value === "none" ? "" : value }))}
                                                            >
                                                                 <SelectTrigger>
                                                                      <SelectValue placeholder="Selecione um projeto" />
                                                                 </SelectTrigger>
                                                                 <SelectContent>
                                                                      <SelectItem value="none">Sem projeto</SelectItem>
                                                                      {projects.map((project) => (
                                                                           <SelectItem key={project.id} value={project.id}>
                                                                                {project.title}
                                                                           </SelectItem>
                                                                      ))}
                                                                 </SelectContent>
                                                            </Select>
                                                       </div>

                                                       <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                 <Label htmlFor="priority">Prioridade</Label>
                                                                 <Select
                                                                      value={formData.priority}
                                                                      onValueChange={(value: 'high' | 'medium' | 'low') =>
                                                                           setFormData(prev => ({ ...prev, priority: value }))}
                                                                 >
                                                                      <SelectTrigger>
                                                                           <SelectValue />
                                                                      </SelectTrigger>
                                                                      <SelectContent>
                                                                           <SelectItem value="high">Alta</SelectItem>
                                                                           <SelectItem value="medium">Média</SelectItem>
                                                                           <SelectItem value="low">Baixa</SelectItem>
                                                                      </SelectContent>
                                                                 </Select>
                                                            </div>

                                                            <div>
                                                                 <Label htmlFor="status">Status</Label>
                                                                 <Select
                                                                      value={formData.status}
                                                                      onValueChange={(value: 'todo' | 'in-progress' | 'completed') =>
                                                                           setFormData(prev => ({ ...prev, status: value }))}
                                                                 >
                                                                      <SelectTrigger>
                                                                           <SelectValue />
                                                                      </SelectTrigger>
                                                                      <SelectContent>
                                                                           <SelectItem value="todo">A fazer</SelectItem>
                                                                           <SelectItem value="in-progress">Em progresso</SelectItem>
                                                                           <SelectItem value="completed">Concluída</SelectItem>
                                                                      </SelectContent>
                                                                 </Select>
                                                            </div>
                                                       </div>

                                                       <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                 <Label htmlFor="due_date">Data de Vencimento</Label>
                                                                 <Input
                                                                      id="due_date"
                                                                      type="date"
                                                                      value={formData.due_date}
                                                                      onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                                                                 />
                                                            </div>

                                                            <div>
                                                                 <Label htmlFor="estimated_time">Tempo Estimado</Label>
                                                                 <Input
                                                                      id="estimated_time"
                                                                      value={formData.estimated_time}
                                                                      onChange={(e) => setFormData(prev => ({ ...prev, estimated_time: e.target.value }))}
                                                                      placeholder="ex: 2h, 30m"
                                                                 />
                                                            </div>
                                                       </div>

                                                       <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
                                                            <Button
                                                                 variant="outline"
                                                                 onClick={() => setIsCreateOpen(false)}
                                                                 className="w-full sm:w-auto"
                                                            >
                                                                 Cancelar
                                                            </Button>
                                                            <Button onClick={handleCreate} className="w-full sm:w-auto">
                                                                 Criar Task
                                                            </Button>
                                                       </div>
                                                  </div>
                                             </DialogContent>
                                        </Dialog>
                                   </div>
                              </div>

                              {/* Tasks Grid */}
                              <div className={viewMode === 'cards' ? 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6' : 'grid gap-4 sm:gap-6'}>
                                   {tasks.length === 0 ? (
                                        <Card className={viewMode === 'cards' ? 'col-span-full' : ''}>
                                             <CardContent className="flex flex-col items-center justify-center py-12">
                                                  <CheckSquare className="w-12 h-12 text-muted-foreground mb-4" />
                                                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                                                       Nenhuma task encontrada
                                                  </h3>
                                                  <p className="text-muted-foreground text-center mb-4">
                                                       Comece criando sua primeira task
                                                  </p>
                                                  <Button onClick={() => setIsCreateOpen(true)}>
                                                       <Plus className="w-4 h-4 mr-2" />
                                                       Criar Task
                                                  </Button>
                                             </CardContent>
                                        </Card>
                                   ) : viewMode === 'cards' ? (
                                        // Card View
                                        tasks.map((task) => (
                                             <Card
                                                  key={task.id}
                                                  className={`hover:shadow-md transition-colors border ${getDeadlineBorderColor(task.due_date)}`}
                                             >
                                                  <CardContent className="p-3 sm:p-6">
                                                       <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                                                                 <Checkbox
                                                                      checked={task.status === 'completed'}
                                                                      onCheckedChange={(checked) =>
                                                                           handleStatusChange(task.id, checked ? 'completed' : 'todo')
                                                                      }
                                                                      className="mt-1 flex-shrink-0"
                                                                 />

                                                                 <div className="flex-1 min-w-0">
                                                                      <div className="flex items-start justify-between gap-2 mb-2">
                                                                           <h3 className={`font-semibold text-sm sm:text-lg break-words line-clamp-2 ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                                                                                }`}>
                                                                                {task.title}
                                                                           </h3>
                                                                           <Flag className={`w-4 h-4 ${priorityColors[task.priority]} flex-shrink-0`} />
                                                                      </div>

                                                                      {task.description && (
                                                                           <p className="text-muted-foreground mb-3 text-xs sm:text-sm">
                                                                                {truncateText(task.description)}
                                                                           </p>
                                                                      )}

                                                                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                                                                           <span className="font-medium">
                                                                                {getProjectName(task.project_id)}
                                                                           </span>

                                                                           <div className="flex items-center gap-3">
                                                                                {task.due_date && (
                                                                                     <div className="flex items-center gap-1">
                                                                                          <Calendar className="w-3 h-3" />
                                                                                          <span>{new Date(task.due_date).toLocaleDateString('pt-BR')}</span>
                                                                                     </div>
                                                                                )}

                                                                                {task.estimated_time && (
                                                                                     <div className="flex items-center gap-1">
                                                                                          <Clock className="w-3 h-3" />
                                                                                          <span>{task.estimated_time}</span>
                                                                                     </div>
                                                                                )}
                                                                           </div>
                                                                      </div>
                                                                 </div>
                                                            </div>

                                                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                                                                 <Badge
                                                                      variant="secondary"
                                                                      className={`${statusColors[task.status]} text-white text-xs sm:text-sm`}
                                                                 >
                                                                      {task.status === 'todo' ? 'A fazer' :
                                                                           task.status === 'in-progress' ? 'Em progresso' : 'Concluída'}
                                                                 </Badge>

                                                                 <Button
                                                                      variant="ghost"
                                                                      size="sm"
                                                                      onClick={() => handleViewDetails(task)}
                                                                      title="Visualizar detalhes"
                                                                 >
                                                                      <Eye className="w-4 h-4" />
                                                                 </Button>

                                                                 <DropdownMenu>
                                                                      <DropdownMenuTrigger asChild>
                                                                           <Button variant="ghost" size="sm">
                                                                                <Edit className="w-4 h-4" />
                                                                           </Button>
                                                                      </DropdownMenuTrigger>
                                                                      <DropdownMenuContent align="end" className="z-50">
                                                                           <DropdownMenuItem onClick={() => openEditDialog(task)}>
                                                                                Editar Task
                                                                           </DropdownMenuItem>
                                                                           <DropdownMenuItem
                                                                                className="text-destructive"
                                                                                onClick={() => handleDelete(task.id)}
                                                                           >
                                                                                Excluir Task
                                                                           </DropdownMenuItem>
                                                                      </DropdownMenuContent>
                                                                 </DropdownMenu>
                                                            </div>
                                                       </div>
                                                  </CardContent>
                                             </Card>
                                        ))
                                   ) : (
                                        // List View
                                        <Card className="overflow-hidden">
                                             <div className="divide-y divide-border">
                                                  {tasks.map((task) => (
                                                       <div
                                                            key={task.id}
                                                            className={`p-4 hover:bg-muted/50 transition-colors border-l-4 ${getDeadlineLeftBorderColor(task.due_date)}`}
                                                       >
                                                            <div className="flex items-center justify-between gap-4">
                                                                 <div className="flex items-center gap-4 flex-1 min-w-0">
                                                                      <Checkbox
                                                                           checked={task.status === 'completed'}
                                                                           onCheckedChange={(checked) =>
                                                                                handleStatusChange(task.id, checked ? 'completed' : 'todo')
                                                                           }
                                                                           className="flex-shrink-0"
                                                                      />

                                                                      <div className="flex-1 min-w-0">
                                                                           <div className="flex items-center gap-2 mb-1">
                                                                                <h3 className={`font-semibold text-sm sm:text-base break-words line-clamp-2 ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                                                                                     }`}>
                                                                                     {task.title}
                                                                                </h3>
                                                                                <Flag className={`w-3 h-3 ${priorityColors[task.priority]} flex-shrink-0`} />
                                                                           </div>

                                                                           <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                                                                <span className="font-medium">
                                                                                     {getProjectName(task.project_id)}
                                                                                </span>

                                                                                {task.due_date && (
                                                                                     <div className="flex items-center gap-1">
                                                                                          <Calendar className="w-3 h-3" />
                                                                                          <span>{new Date(task.due_date).toLocaleDateString('pt-BR')}</span>
                                                                                     </div>
                                                                                )}

                                                                                {task.estimated_time && (
                                                                                     <div className="flex items-center gap-1">
                                                                                          <Clock className="w-3 h-3" />
                                                                                          <span>{task.estimated_time}</span>
                                                                                     </div>
                                                                                )}
                                                                           </div>
                                                                      </div>
                                                                 </div>

                                                                 <div className="flex items-center gap-2 flex-shrink-0">
                                                                      <Badge
                                                                           variant="secondary"
                                                                           className={`${statusColors[task.status]} text-white text-xs`}
                                                                      >
                                                                           {task.status === 'todo' ? 'A fazer' :
                                                                                task.status === 'in-progress' ? 'Em progresso' : 'Concluída'}
                                                                      </Badge>

                                                                      <Button
                                                                           variant="ghost"
                                                                           size="sm"
                                                                           onClick={() => handleViewDetails(task)}
                                                                           title="Visualizar detalhes"
                                                                      >
                                                                           <Eye className="w-4 h-4" />
                                                                      </Button>

                                                                      <DropdownMenu>
                                                                           <DropdownMenuTrigger asChild>
                                                                                <Button variant="ghost" size="sm">
                                                                                     <Edit className="w-4 h-4" />
                                                                                </Button>
                                                                           </DropdownMenuTrigger>
                                                                           <DropdownMenuContent align="end" className="z-50">
                                                                                <DropdownMenuItem onClick={() => openEditDialog(task)}>
                                                                                     Editar Task
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem
                                                                                     className="text-destructive"
                                                                                     onClick={() => handleDelete(task.id)}
                                                                                >
                                                                                     Excluir Task
                                                                                </DropdownMenuItem>
                                                                           </DropdownMenuContent>
                                                                      </DropdownMenu>
                                                                 </div>
                                                            </div>
                                                       </div>
                                                  ))}
                                             </div>
                                        </Card>
                                   )}
                              </div>

                              {/* Details Modal */}
                              <TaskDetailsModal
                                   task={viewingTask}
                                   projects={projects}
                                   open={isDetailsOpen}
                                   onOpenChange={setIsDetailsOpen}
                              />

                              {/* Edit Dialog */}
                              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                                   <DialogContent className="max-w-md w-[95vw] sm:w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                             <DialogTitle>Editar Task</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                             <div>
                                                  <Label htmlFor="edit-title">Título *</Label>
                                                  <Input
                                                       id="edit-title"
                                                       value={formData.title}
                                                       onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                                       placeholder="Digite o título da task"
                                                  />
                                             </div>

                                             <div>
                                                  <Label htmlFor="edit-description">Descrição</Label>
                                                  <Textarea
                                                       id="edit-description"
                                                       value={formData.description}
                                                       onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                       placeholder="Digite a descrição da task"
                                                       rows={3}
                                                  />
                                             </div>

                                             <div>
                                                  <Label htmlFor="edit-project">Projeto</Label>
                                                  <Select
                                                       value={formData.project_id || "none"}
                                                       onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value === "none" ? "" : value }))}
                                                  >
                                                       <SelectTrigger>
                                                            <SelectValue placeholder="Selecione um projeto" />
                                                       </SelectTrigger>
                                                       <SelectContent>
                                                            <SelectItem value="none">Sem projeto</SelectItem>
                                                            {projects.map((project) => (
                                                                 <SelectItem key={project.id} value={project.id}>
                                                                      {project.title}
                                                                 </SelectItem>
                                                            ))}
                                                       </SelectContent>
                                                  </Select>
                                             </div>

                                             <div className="grid grid-cols-2 gap-4">
                                                  <div>
                                                       <Label htmlFor="edit-priority">Prioridade</Label>
                                                       <Select
                                                            value={formData.priority}
                                                            onValueChange={(value: 'high' | 'medium' | 'low') =>
                                                                 setFormData(prev => ({ ...prev, priority: value }))}
                                                       >
                                                            <SelectTrigger>
                                                                 <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                 <SelectItem value="high">Alta</SelectItem>
                                                                 <SelectItem value="medium">Média</SelectItem>
                                                                 <SelectItem value="low">Baixa</SelectItem>
                                                            </SelectContent>
                                                       </Select>
                                                  </div>

                                                  <div>
                                                       <Label htmlFor="edit-status">Status</Label>
                                                       <Select
                                                            value={formData.status}
                                                            onValueChange={(value: 'todo' | 'in-progress' | 'completed') =>
                                                                 setFormData(prev => ({ ...prev, status: value }))}
                                                       >
                                                            <SelectTrigger>
                                                                 <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                 <SelectItem value="todo">A fazer</SelectItem>
                                                                 <SelectItem value="in-progress">Em progresso</SelectItem>
                                                                 <SelectItem value="completed">Concluída</SelectItem>
                                                            </SelectContent>
                                                       </Select>
                                                  </div>
                                             </div>

                                             <div className="grid grid-cols-2 gap-4">
                                                  <div>
                                                       <Label htmlFor="edit-due_date">Data de Vencimento</Label>
                                                       <Input
                                                            id="edit-due_date"
                                                            type="date"
                                                            value={formData.due_date}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                                                       />
                                                  </div>

                                                  <div>
                                                       <Label htmlFor="edit-estimated_time">Tempo Estimado</Label>
                                                       <Input
                                                            id="edit-estimated_time"
                                                            value={formData.estimated_time}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, estimated_time: e.target.value }))}
                                                            placeholder="ex: 2h, 30m"
                                                       />
                                                  </div>
                                             </div>

                                             <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
                                                  <Button
                                                       variant="outline"
                                                       onClick={() => setIsEditOpen(false)}
                                                       className="w-full sm:w-auto"
                                                  >
                                                       Cancelar
                                                  </Button>
                                                  <Button onClick={handleUpdate} className="w-full sm:w-auto">
                                                       Salvar Alterações
                                                  </Button>
                                             </div>
                                        </div>
                                   </DialogContent>
                              </Dialog>
                         </div>
                    </main>
               </div>
          </SidebarProvider>
     )
}