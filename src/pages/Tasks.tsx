import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Calendar, Clock, Flag, CheckSquare, Eye, LayoutGrid, List, Columns3 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { TaskDetailsModal } from "@/components/TaskDetailsModal"
import { SubtaskManager } from "@/components/SubtaskManager"
import { KanbanBoard } from "@/components/KanbanBoard"

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
     AlertDialog,
     AlertDialogAction,
     AlertDialogCancel,
     AlertDialogContent,
     AlertDialogDescription,
     AlertDialogFooter,
     AlertDialogHeader,
     AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
     parent_task_id: string | null
     subtasks?: Task[]
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
     const [isDeleteOpen, setIsDeleteOpen] = useState(false)
     const [viewingTask, setViewingTask] = useState<Task | null>(null)
     const [editingTask, setEditingTask] = useState<Task | null>(null)
     const [deletingTask, setDeletingTask] = useState<Task | null>(null)
     const [viewMode, setViewMode] = useState<'cards' | 'list' | 'kanban'>('cards')

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

     const [subtasks, setSubtasks] = useState<Array<{ title: string; status: 'todo' | 'completed' }>>([])

     const fetchTasks = async () => {
          if (!user) return

          try {
               // Fetch only parent tasks (tasks without parent_task_id)
               const { data: parentTasks, error: parentError } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', user.id)
                    .is('parent_task_id', null)
                    .order('created_at', { ascending: false })

               if (parentError) throw parentError

               // Fetch all subtasks
               const { data: allSubtasks, error: subtasksError } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', user.id)
                    .not('parent_task_id', 'is', null)

               if (subtasksError) throw subtasksError

               // Organize tasks with their subtasks
               const tasksWithSubtasks = (parentTasks || []).map(task => ({
                    ...task,
                    subtasks: (allSubtasks || []).filter(subtask => subtask.parent_task_id === task.id)
               }))

               setTasks(tasksWithSubtasks as Task[])
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
          setSubtasks([])
     }

     const handleCreate = async () => {
          if (!user || !formData.title.trim()) return

          try {
               // Create parent task
               const { data: parentTask, error: parentError } = await supabase
                    .from('tasks')
                    .insert([{
                         user_id: user.id,
                         title: formData.title.trim(),
                         description: formData.description.trim() || null,
                         project_id: formData.project_id || null,
                         priority: formData.priority,
                         status: formData.status,
                         due_date: formData.due_date || null,
                         estimated_time: formData.estimated_time.trim() || null,
                         parent_task_id: null
                    }])
                    .select()
                    .single()

               if (parentError) throw parentError

               // Create subtasks if any
               let createdSubtasks: Task[] = []
               if (subtasks.length > 0) {
                    const subtasksToInsert = subtasks.map(subtask => ({
                         user_id: user.id,
                         title: subtask.title,
                         description: null,
                         project_id: formData.project_id || null,
                         priority: formData.priority,
                         status: subtask.status === 'completed' ? 'completed' : 'todo',
                         due_date: formData.due_date || null,
                         estimated_time: null,
                         parent_task_id: parentTask.id
                    }))

                    const { data: subtasksData, error: subtasksError } = await supabase
                         .from('tasks')
                         .insert(subtasksToInsert)
                         .select()

                    if (subtasksError) throw subtasksError
                    createdSubtasks = subtasksData as Task[]
               }

               // Add to tasks list with subtasks
               const taskWithSubtasks = {
                    ...parentTask,
                    subtasks: createdSubtasks
               } as Task

               setTasks(prev => [taskWithSubtasks, ...prev])
               setIsCreateOpen(false)
               resetForm()

               toast({
                    title: "Task criada",
                    description: `Task criada com sucesso${subtasks.length > 0 ? ` com ${subtasks.length} subtarefa(s)` : ''}`
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
               // Update parent task
               const { data: updatedTask, error: updateError } = await supabase
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

               if (updateError) throw updateError

               // Delete existing subtasks
               const { error: deleteError } = await supabase
                    .from('tasks')
                    .delete()
                    .eq('parent_task_id', editingTask.id)

               if (deleteError) throw deleteError

               // Create new subtasks
               let createdSubtasks: Task[] = []
               if (subtasks.length > 0) {
                    const subtasksToInsert = subtasks.map(subtask => ({
                         user_id: user!.id,
                         title: subtask.title,
                         description: null,
                         project_id: formData.project_id || null,
                         priority: formData.priority,
                         status: subtask.status === 'completed' ? 'completed' : 'todo',
                         due_date: formData.due_date || null,
                         estimated_time: null,
                         parent_task_id: editingTask.id
                    }))

                    const { data: subtasksData, error: subtasksError } = await supabase
                         .from('tasks')
                         .insert(subtasksToInsert)
                         .select()

                    if (subtasksError) throw subtasksError
                    createdSubtasks = subtasksData as Task[]
               }

               // Update tasks list with subtasks
               const taskWithSubtasks = {
                    ...updatedTask,
                    subtasks: createdSubtasks
               } as Task

               setTasks(prev => prev.map(task => task.id === editingTask.id ? taskWithSubtasks : task))
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

     const handleDeleteClick = (task: Task) => {
          setDeletingTask(task)
          setIsDeleteOpen(true)
     }

     const handleDeleteConfirm = async () => {
          if (!deletingTask) return

          try {
               const { error } = await supabase
                    .from('tasks')
                    .delete()
                    .eq('id', deletingTask.id)

               if (error) throw error

               setTasks(prev => prev.filter(task => task.id !== deletingTask.id))

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
          } finally {
               setIsDeleteOpen(false)
               setDeletingTask(null)
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

               // Preserve subtasks when updating status
               setTasks(prev => prev.map(task =>
                    task.id === taskId
                         ? { ...data as Task, subtasks: task.subtasks }
                         : task
               ))
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

          // Load existing subtasks
          const existingSubtasks = (task.subtasks || []).map(subtask => ({
               title: subtask.title,
               status: subtask.status === 'completed' ? 'completed' as const : 'todo' as const
          }))
          setSubtasks(existingSubtasks)

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
                                                  <LayoutGrid className="w-4 h-4 sm:mr-2" />
                                                  <span className="hidden sm:inline">Cards</span>
                                             </Button>
                                             <Button
                                                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                                                  size="sm"
                                                  onClick={() => setViewMode('list')}
                                                  className="h-8"
                                             >
                                                  <List className="w-4 h-4 sm:mr-2" />
                                                  <span className="hidden sm:inline">Lista</span>
                                             </Button>
                                             <Button
                                                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                                                  size="sm"
                                                  onClick={() => setViewMode('kanban')}
                                                  className="h-8"
                                             >
                                                  <Columns3 className="w-4 h-4 sm:mr-2" />
                                                  <span className="hidden sm:inline">Kanban</span>
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

                                                       <SubtaskManager
                                                            subtasks={subtasks}
                                                            onSubtasksChange={setSubtasks}
                                                       />

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

                              {/* Tasks Content */}
                              {viewMode === 'kanban' ? (
                                   <KanbanBoard
                                        tasks={tasks}
                                        projects={projects}
                                        onStatusChange={handleStatusChange}
                                        onViewDetails={handleViewDetails}
                                        onEdit={openEditDialog}
                                        onDelete={handleDeleteClick}
                                   />
                              ) : (
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
                                                       <CardContent className="p-2 sm:p-3 h-[60px] overflow-hidden">
                                                            <div className="flex items-center justify-between gap-2 h-full">
                                                                 <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                                                                      <Checkbox
                                                                           checked={task.status === 'completed'}
                                                                           onCheckedChange={(checked) =>
                                                                                handleStatusChange(task.id, checked ? 'completed' : 'todo')
                                                                           }
                                                                           className="flex-shrink-0"
                                                                      />

                                                                      <div className="flex-1 min-w-0 overflow-hidden">
                                                                           <h3 className={`font-semibold text-sm truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                                                                                }`}>
                                                                                {task.title}
                                                                           </h3>

                                                                           <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden">
                                                                                <span className="font-medium truncate max-w-[100px]">
                                                                                     {getProjectName(task.project_id)}
                                                                                </span>

                                                                                <div className="flex items-center gap-2 flex-shrink-0">
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

                                                                      <Flag className={`w-3 h-3 ${priorityColors[task.priority]} flex-shrink-0`} />
                                                                 </div>

                                                                 <div className="flex items-center gap-1 flex-shrink-0">
                                                                      <Badge
                                                                           variant="secondary"
                                                                           className={`${statusColors[task.status]} text-white text-xs`}
                                                                      >
                                                                           {task.status === 'todo' ? 'A fazer' :
                                                                                task.status === 'in-progress' ? 'Em progresso' : 'Concluída'}
                                                                      </Badge>

                                                                      <TooltipProvider>
                                                                           <div className="flex items-center gap-1">
                                                                                <Tooltip>
                                                                                     <TooltipTrigger asChild>
                                                                                          <Button
                                                                                               variant="ghost"
                                                                                               size="sm"
                                                                                               onClick={() => handleViewDetails(task)}
                                                                                               className="h-8 w-8 p-0"
                                                                                          >
                                                                                               <Eye className="w-4 h-4 text-foreground" />
                                                                                          </Button>
                                                                                     </TooltipTrigger>
                                                                                     <TooltipContent>
                                                                                          <p>Visualizar</p>
                                                                                     </TooltipContent>
                                                                                </Tooltip>

                                                                                <Tooltip>
                                                                                     <TooltipTrigger asChild>
                                                                                          <Button
                                                                                               variant="ghost"
                                                                                               size="sm"
                                                                                               onClick={() => openEditDialog(task)}
                                                                                               className="h-8 w-8 p-0"
                                                                                          >
                                                                                               <Edit2 className="w-4 h-4 text-foreground" />
                                                                                          </Button>
                                                                                     </TooltipTrigger>
                                                                                     <TooltipContent>
                                                                                          <p>Editar</p>
                                                                                     </TooltipContent>
                                                                                </Tooltip>

                                                                                <Tooltip>
                                                                                     <TooltipTrigger asChild>
                                                                                          <Button
                                                                                               variant="ghost"
                                                                                               size="sm"
                                                                                               onClick={() => handleDeleteClick(task)}
                                                                                               className="h-8 w-8 p-0"
                                                                                          >
                                                                                               <Trash2 className="w-4 h-4 text-destructive" />
                                                                                          </Button>
                                                                                     </TooltipTrigger>
                                                                                     <TooltipContent>
                                                                                          <p>Excluir</p>
                                                                                     </TooltipContent>
                                                                                </Tooltip>
                                                                           </div>
                                                                      </TooltipProvider>
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
                                                                 className={`px-2 sm:px-3 hover:bg-muted/50 transition-colors border-l-4 h-[60px] overflow-hidden ${getDeadlineLeftBorderColor(task.due_date)}`}
                                                            >
                                                                 <div className="flex items-center justify-between gap-2 h-full">
                                                                      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                                                                           <Checkbox
                                                                                checked={task.status === 'completed'}
                                                                                onCheckedChange={(checked) =>
                                                                                     handleStatusChange(task.id, checked ? 'completed' : 'todo')
                                                                                }
                                                                                className="flex-shrink-0"
                                                                           />

                                                                           <div className="flex-1 min-w-0 overflow-hidden">
                                                                                <h3 className={`font-semibold text-sm truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                                                                                     }`}>
                                                                                     {task.title}
                                                                                </h3>

                                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden">
                                                                                     <span className="font-medium truncate max-w-[100px]">
                                                                                          {getProjectName(task.project_id)}
                                                                                     </span>

                                                                                     <div className="flex items-center gap-2 flex-shrink-0">
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

                                                                           <Flag className={`w-3 h-3 ${priorityColors[task.priority]} flex-shrink-0`} />
                                                                      </div>

                                                                      <div className="flex items-center gap-1 flex-shrink-0">
                                                                           <Badge
                                                                                variant="secondary"
                                                                                className={`${statusColors[task.status]} text-white text-xs`}
                                                                           >
                                                                                {task.status === 'todo' ? 'A fazer' :
                                                                                     task.status === 'in-progress' ? 'Em progresso' : 'Concluída'}
                                                                           </Badge>

                                                                           <TooltipProvider>
                                                                                <div className="flex items-center gap-1">
                                                                                     <Tooltip>
                                                                                          <TooltipTrigger asChild>
                                                                                               <Button
                                                                                                    variant="ghost"
                                                                                                    size="sm"
                                                                                                    onClick={() => handleViewDetails(task)}
                                                                                                    className="h-8 w-8 p-0"
                                                                                               >
                                                                                                    <Eye className="w-4 h-4 text-foreground" />
                                                                                               </Button>
                                                                                          </TooltipTrigger>
                                                                                          <TooltipContent>
                                                                                               <p>Visualizar</p>
                                                                                          </TooltipContent>
                                                                                     </Tooltip>

                                                                                     <Tooltip>
                                                                                          <TooltipTrigger asChild>
                                                                                               <Button
                                                                                                    variant="ghost"
                                                                                                    size="sm"
                                                                                                    onClick={() => openEditDialog(task)}
                                                                                                    className="h-8 w-8 p-0"
                                                                                               >
                                                                                                    <Edit2 className="w-4 h-4 text-foreground" />
                                                                                               </Button>
                                                                                          </TooltipTrigger>
                                                                                          <TooltipContent>
                                                                                               <p>Editar</p>
                                                                                          </TooltipContent>
                                                                                     </Tooltip>

                                                                                     <Tooltip>
                                                                                          <TooltipTrigger asChild>
                                                                                               <Button
                                                                                                    variant="ghost"
                                                                                                    size="sm"
                                                                                                    onClick={() => handleDeleteClick(task)}
                                                                                                    className="h-8 w-8 p-0"
                                                                                               >
                                                                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                                                               </Button>
                                                                                          </TooltipTrigger>
                                                                                          <TooltipContent>
                                                                                               <p>Excluir</p>
                                                                                          </TooltipContent>
                                                                                     </Tooltip>
                                                                                </div>
                                                                           </TooltipProvider>
                                                                      </div>
                                                                 </div>
                                                            </div>
                                                       ))}
                                                  </div>
                                             </Card>
                                        )}
                                   </div>
                              )}

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

                                             <SubtaskManager
                                                  subtasks={subtasks}
                                                  onSubtasksChange={setSubtasks}
                                             />

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

                              {/* Delete Confirmation Dialog */}
                              <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                                   <AlertDialogContent>
                                        <AlertDialogHeader>
                                             <div className="flex items-center gap-3 mb-2">
                                                  <div className="p-2 bg-destructive/10 rounded-lg">
                                                       <Trash2 className="w-5 h-5 text-destructive" />
                                                  </div>
                                                  <div>
                                                       <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                                  </div>
                                             </div>
                                             <AlertDialogDescription>
                                                  Tem certeza que deseja excluir a tarefa <span className="font-semibold">"{deletingTask?.title}"</span>?
                                                  {deletingTask?.subtasks && deletingTask.subtasks.length > 0 && (
                                                       <span className="block mt-2 text-warning">
                                                            Esta ação também excluirá {deletingTask.subtasks.length} subtarefa(s) associada(s).
                                                       </span>
                                                  )}
                                                  <span className="block mt-2">
                                                       Esta ação não pode ser desfeita.
                                                  </span>
                                             </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                             <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                             <AlertDialogAction
                                                  onClick={handleDeleteConfirm}
                                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                             >
                                                  Excluir
                                             </AlertDialogAction>
                                        </AlertDialogFooter>
                                   </AlertDialogContent>
                              </AlertDialog>
                         </div>
                    </main>
               </div>
          </SidebarProvider>
     )
}