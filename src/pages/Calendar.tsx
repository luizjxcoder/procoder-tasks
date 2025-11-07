import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { TaskManagerSidebar } from "@/components/TaskManagerSidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

interface Task {
     id: string
     title: string
     description: string | null
     due_date: string | null
     priority: string
     status: string
     project_id: string | null
     user_id: string
}

interface Project {
     id: string
     title: string
}

const truncateText = (text: string, maxLength: number = 40) => {
     if (text.length <= maxLength) return text
     return text.substring(0, maxLength) + "..."
}

export default function Calendar() {
     const [currentDate, setCurrentDate] = useState(new Date())
     const [selectedDate, setSelectedDate] = useState<Date | null>(null)
     const [tasks, setTasks] = useState<Task[]>([])
     const [projects, setProjects] = useState<Project[]>([])
     const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
     const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
     const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
     const [editingTask, setEditingTask] = useState<Task | null>(null)
     const [viewingTask, setViewingTask] = useState<Task | null>(null)
     const [formData, setFormData] = useState({
          title: '',
          description: '',
          priority: 'medium' as 'high' | 'medium' | 'low',
          status: 'todo' as 'todo' | 'in-progress' | 'completed',
          project_id: '',
          due_date: ''
     })

     const { user } = useAuth()
     const { toast } = useToast()

     // Get calendar days for current month
     const monthStart = startOfMonth(currentDate)
     const monthEnd = endOfMonth(currentDate)
     const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

     // Get first day of week offset
     const firstDayOffset = monthStart.getDay()
     const emptyDays = Array.from({ length: firstDayOffset }, (_, i) => i)

     useEffect(() => {
          if (user) {
               fetchTasks()
               fetchProjects()
          }
     }, [user, currentDate])

     const fetchTasks = async () => {
          if (!user) return

          const { data, error } = await supabase
               .from('tasks')
               .select('*')
               .eq('user_id', user.id)
               .gte('due_date', format(monthStart, 'yyyy-MM-dd'))
               .lte('due_date', format(monthEnd, 'yyyy-MM-dd'))

          if (error) {
               toast({
                    title: "Erro ao carregar tarefas",
                    description: error.message,
                    variant: "destructive"
               })
          } else {
               setTasks(data || [])
          }
     }

     const fetchProjects = async () => {
          if (!user) return

          const { data, error } = await supabase
               .from('projects')
               .select('id, title')
               .eq('user_id', user.id)

          if (error) {
               toast({
                    title: "Erro ao carregar projetos",
                    description: error.message,
                    variant: "destructive"
               })
          } else {
               setProjects(data || [])
          }
     }

     const handleCreateTask = async () => {
          if (!user || !selectedDate) return

          const taskData = {
               ...formData,
               user_id: user.id,
               due_date: format(selectedDate, 'yyyy-MM-dd'),
               project_id: formData.project_id === 'none' ? null : formData.project_id || null
          }

          const { error } = await supabase
               .from('tasks')
               .insert(taskData)

          if (error) {
               toast({
                    title: "Erro ao criar tarefa",
                    description: error.message,
                    variant: "destructive"
               })
          } else {
               toast({
                    title: "Sucesso",
                    description: "Tarefa criada com sucesso!"
               })
               setIsCreateDialogOpen(false)
               resetForm()
               fetchTasks()
          }
     }

     const handleEditTask = async () => {
          if (!editingTask) return

          const updateData = {
               ...formData,
               project_id: formData.project_id === 'none' ? null : formData.project_id || null
          }

          const { error } = await supabase
               .from('tasks')
               .update(updateData)
               .eq('id', editingTask.id)

          if (error) {
               toast({
                    title: "Erro ao atualizar tarefa",
                    description: error.message,
                    variant: "destructive"
               })
          } else {
               toast({
                    title: "Sucesso",
                    description: "Tarefa atualizada com sucesso!"
               })
               setIsEditDialogOpen(false)
               setEditingTask(null)
               resetForm()
               fetchTasks()
          }
     }

     const handleDeleteTask = async (taskId: string) => {
          const { error } = await supabase
               .from('tasks')
               .delete()
               .eq('id', taskId)

          if (error) {
               toast({
                    title: "Erro ao excluir tarefa",
                    description: error.message,
                    variant: "destructive"
               })
          } else {
               toast({
                    title: "Sucesso",
                    description: "Tarefa excluída com sucesso!"
               })
               fetchTasks()
          }
     }

     const openEditDialog = (task: Task) => {
          setEditingTask(task)
          setFormData({
               title: task.title,
               description: task.description || '',
               priority: task.priority as 'high' | 'medium' | 'low',
               status: task.status as 'todo' | 'in-progress' | 'completed',
               project_id: task.project_id || 'none',
               due_date: task.due_date || ''
          })
          setIsEditDialogOpen(true)
     }

     const openViewDialog = (task: Task) => {
          setViewingTask(task)
          setIsViewDialogOpen(true)
     }

     const resetForm = () => {
          setFormData({
               title: '',
               description: '',
               priority: 'medium',
               status: 'todo',
               project_id: '',
               due_date: ''
          })
     }

     const getTasksForDate = (date: Date) => {
          return tasks.filter(task =>
               task.due_date && isSameDay(new Date(task.due_date), date)
          )
     }

     const getPriorityColor = (priority: string) => {
          switch (priority) {
               case 'high': return 'bg-destructive'
               case 'medium': return 'bg-warning'
               case 'low': return 'bg-success'
               default: return 'bg-muted'
          }
     }

     const getStatusColor = (status: string) => {
          switch (status) {
               case 'completed': return 'border-success'
               case 'in-progress': return 'border-warning'
               case 'todo': return 'border-muted'
               default: return 'border-muted'
          }
     }

     const navigateMonth = (direction: 'prev' | 'next') => {
          setCurrentDate(prev => {
               const newDate = new Date(prev)
               if (direction === 'prev') {
                    newDate.setMonth(newDate.getMonth() - 1)
               } else {
                    newDate.setMonth(newDate.getMonth() + 1)
               }
               return newDate
          })
     }

     const handleDateClick = (date: Date) => {
          setSelectedDate(date)
          setFormData(prev => ({ ...prev, due_date: format(date, 'yyyy-MM-dd') }))
          setIsCreateDialogOpen(true)
     }

     return (
          <SidebarProvider>
               <div className="flex min-h-screen w-full">
                    <TaskManagerSidebar />
                    <main className="flex-1 p-3 sm:p-6 bg-background">
                         <div className="max-w-7xl mx-auto">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                   <div className="flex items-center gap-4">
                                        <SidebarTrigger className="lg:hidden" />
                                        <div className="flex items-center gap-2">
                                             <CalendarIcon className="w-6 h-6 text-primary" />
                                             <h1 className="text-2xl sm:text-3xl font-bold">Calendário</h1>
                                        </div>
                                   </div>
                              </div>

                              <Card>
                                   <CardHeader>
                                        <div className="flex items-center justify-between">
                                             <CardTitle className="text-xl">
                                                  {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                                             </CardTitle>
                                             <div className="flex items-center gap-2">
                                                  <Button
                                                       variant="outline"
                                                       size="sm"
                                                       onClick={() => navigateMonth('prev')}
                                                  >
                                                       <ChevronLeft className="w-4 h-4" />
                                                  </Button>
                                                  <Button
                                                       variant="outline"
                                                       size="sm"
                                                       onClick={() => navigateMonth('next')}
                                                  >
                                                       <ChevronRight className="w-4 h-4" />
                                                  </Button>
                                             </div>
                                        </div>
                                   </CardHeader>
                                   <CardContent>
                                        {/* Calendar Grid */}
                                        <div className="grid grid-cols-7 gap-1 mb-4">
                                             {/* Day headers */}
                                             {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                                                       {day}
                                                  </div>
                                             ))}

                                             {/* Empty days for offset */}
                                             {emptyDays.map(day => (
                                                  <div key={`empty-${day}`} className="p-2 h-24"></div>
                                             ))}

                                             {/* Calendar days */}
                                             {calendarDays.map(date => {
                                                  const dayTasks = getTasksForDate(date)
                                                  const isToday_ = isToday(date)

                                                  return (
                                                       <div
                                                            key={date.toISOString()}
                                                            className={`p-2 h-24 border border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${isToday_ ? 'bg-primary/10 border-primary' : ''
                                                                 }`}
                                                            onClick={() => handleDateClick(date)}
                                                       >
                                                            <div className={`text-sm font-medium mb-1 ${isToday_ ? 'text-primary' : 'text-foreground'
                                                                 }`}>
                                                                 {format(date, 'd')}
                                                            </div>
                                                            <div className="space-y-1">
                                                                 {dayTasks.slice(0, 2).map(task => (
                                                                      <div
                                                                           key={task.id}
                                                                           className={`px-1 py-0.5 rounded text-xs truncate border-l-2 ${getStatusColor(task.status)} bg-accent/30`}
                                                                           title={task.title}
                                                                      >
                                                                           <div className="flex items-center gap-1">
                                                                                <div className={`w-1 h-1 rounded-full ${getPriorityColor(task.priority)}`} />
                                                                                <span className="truncate">{task.title}</span>
                                                                           </div>
                                                                      </div>
                                                                 ))}
                                                                 {dayTasks.length > 2 && (
                                                                      <div className="text-xs text-muted-foreground">
                                                                           +{dayTasks.length - 2} mais
                                                                      </div>
                                                                 )}
                                                            </div>
                                                       </div>
                                                  )
                                             })}
                                        </div>

                                        {/* Monthly Tasks */}
                                        <div className="mt-6 border-t pt-6">
                                             <div className="flex items-center justify-between mb-4">
                                                  <h3 className="text-lg font-semibold">
                                                       Tarefas de {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                                                  </h3>
                                             </div>
                                             <div className="space-y-2">
                                                  {tasks.length > 0 ? (
                                                       tasks
                                                            .sort((a, b) => {
                                                                 if (!a.due_date) return 1
                                                                 if (!b.due_date) return -1
                                                                 return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
                                                            })
                                                            .map(task => (
                                                                 <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                                      <div className="flex-1">
                                                                           <div className="flex items-center gap-2 mb-1">
                                                                                <h4 className="font-medium">{task.title}</h4>
                                                                                <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                                                                     {task.priority}
                                                                                </Badge>
                                                                                <Badge variant="outline">{task.status}</Badge>
                                                                                {task.due_date && (
                                                                                     <span className="text-xs text-muted-foreground">
                                                                                          {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                                                                                     </span>
                                                                                )}
                                                                           </div>
                                                                           {task.description && (
                                                                                <p className="text-sm text-muted-foreground">{truncateText(task.description)}</p>
                                                                           )}
                                                                      </div>
                                                                      <div className="flex items-center gap-2">
                                                                           <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => openViewDialog(task)}
                                                                           >
                                                                                <Eye className="w-4 h-4" />
                                                                           </Button>
                                                                           <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => openEditDialog(task)}
                                                                           >
                                                                                <Edit className="w-4 h-4" />
                                                                           </Button>
                                                                           <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => handleDeleteTask(task.id)}
                                                                           >
                                                                                <Trash2 className="w-4 h-4" />
                                                                           </Button>
                                                                      </div>
                                                                 </div>
                                                            ))
                                                  ) : (
                                                       <div className="text-center text-muted-foreground py-8">
                                                            Nenhuma tarefa para este mês
                                                       </div>
                                                  )}
                                             </div>
                                        </div>
                                   </CardContent>
                              </Card>

                              {/* Create Task Dialog */}
                              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                   <DialogContent>
                                        <DialogHeader>
                                             <DialogTitle>
                                                  Nova Tarefa - {selectedDate && format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
                                             </DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                             <div>
                                                  <Label htmlFor="title">Título</Label>
                                                  <Input
                                                       id="title"
                                                       value={formData.title}
                                                       onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                                       placeholder="Digite o título da tarefa"
                                                  />
                                             </div>
                                             <div>
                                                  <Label htmlFor="description">Descrição</Label>
                                                  <Textarea
                                                       id="description"
                                                       value={formData.description}
                                                       onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                       placeholder="Digite a descrição da tarefa"
                                                  />
                                             </div>
                                             <div className="grid grid-cols-2 gap-4">
                                                  <div>
                                                       <Label htmlFor="priority">Prioridade</Label>
                                                       <Select
                                                            value={formData.priority}
                                                            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as 'high' | 'medium' | 'low' }))}
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
                                                            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'todo' | 'in-progress' | 'completed' }))}
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
                                             <div className="flex justify-end gap-2">
                                                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                                       Cancelar
                                                  </Button>
                                                  <Button onClick={handleCreateTask}>
                                                       Criar Tarefa
                                                  </Button>
                                             </div>
                                        </div>
                                   </DialogContent>
                              </Dialog>

                              {/* Edit Task Dialog */}
                              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                   <DialogContent>
                                        <DialogHeader>
                                             <DialogTitle>Editar Tarefa</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                             <div>
                                                  <Label htmlFor="edit-title">Título</Label>
                                                  <Input
                                                       id="edit-title"
                                                       value={formData.title}
                                                       onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                                  />
                                             </div>
                                             <div>
                                                  <Label htmlFor="edit-description">Descrição</Label>
                                                  <Textarea
                                                       id="edit-description"
                                                       value={formData.description}
                                                       onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                  />
                                             </div>
                                             <div className="grid grid-cols-2 gap-4">
                                                  <div>
                                                       <Label htmlFor="edit-priority">Prioridade</Label>
                                                       <Select
                                                            value={formData.priority}
                                                            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as 'high' | 'medium' | 'low' }))}
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
                                                            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'todo' | 'in-progress' | 'completed' }))}
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
                                             <div>
                                                  <Label htmlFor="edit-due-date">Data de vencimento</Label>
                                                  <Input
                                                       id="edit-due-date"
                                                       type="date"
                                                       value={formData.due_date}
                                                       onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                                                  />
                                             </div>
                                             <div className="flex justify-end gap-2">
                                                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                                       Cancelar
                                                  </Button>
                                                  <Button onClick={handleEditTask}>
                                                       Salvar Alterações
                                                  </Button>
                                             </div>
                                        </div>
                                   </DialogContent>
                              </Dialog>

                              {/* View Task Dialog */}
                              <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                                   <DialogContent>
                                        <DialogHeader>
                                             <DialogTitle>Detalhes da Tarefa</DialogTitle>
                                        </DialogHeader>
                                        {viewingTask && (
                                             <div className="space-y-4">
                                                  <div>
                                                       <Label className="text-muted-foreground">Título</Label>
                                                       <p className="text-lg font-medium">{viewingTask.title}</p>
                                                  </div>
                                                  {viewingTask.description && (
                                                       <div>
                                                            <Label className="text-muted-foreground">Descrição</Label>
                                                            <p className="text-sm">{viewingTask.description}</p>
                                                       </div>
                                                  )}
                                                  <div className="grid grid-cols-2 gap-4">
                                                       <div>
                                                            <Label className="text-muted-foreground">Prioridade</Label>
                                                            <div className="mt-1">
                                                                 <Badge variant="outline" className={getPriorityColor(viewingTask.priority)}>
                                                                      {viewingTask.priority === 'high' ? 'Alta' :
                                                                           viewingTask.priority === 'medium' ? 'Média' : 'Baixa'}
                                                                 </Badge>
                                                            </div>
                                                       </div>
                                                       <div>
                                                            <Label className="text-muted-foreground">Status</Label>
                                                            <div className="mt-1">
                                                                 <Badge variant="outline">
                                                                      {viewingTask.status === 'todo' ? 'A fazer' :
                                                                           viewingTask.status === 'in-progress' ? 'Em progresso' : 'Concluída'}
                                                                 </Badge>
                                                            </div>
                                                       </div>
                                                  </div>
                                                  {viewingTask.due_date && (
                                                       <div>
                                                            <Label className="text-muted-foreground">Data de vencimento</Label>
                                                            <p className="text-sm">{format(new Date(viewingTask.due_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                                                       </div>
                                                  )}
                                                  <div className="flex justify-end gap-2 pt-4">
                                                       <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                                                            Fechar
                                                       </Button>
                                                       <Button onClick={() => {
                                                            setIsViewDialogOpen(false)
                                                            openEditDialog(viewingTask)
                                                       }}>
                                                            Editar
                                                       </Button>
                                                  </div>
                                             </div>
                                        )}
                                   </DialogContent>
                              </Dialog>
                         </div>
                    </main>
               </div>
          </SidebarProvider>
     )
}