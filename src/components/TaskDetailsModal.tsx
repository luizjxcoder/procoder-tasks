import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Flag, Target, FolderOpen, CheckSquare } from "lucide-react"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"

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

interface TaskDetailsModalProps {
     task: Task | null
     projects: Project[]
     open: boolean
     onOpenChange: (open: boolean) => void
}

export function TaskDetailsModal({ task, projects, open, onOpenChange }: TaskDetailsModalProps) {
     if (!task) return null

     const getPriorityColor = (priority: string) => {
          switch (priority) {
               case 'high': return 'text-priority-high bg-priority-high/10 border-priority-high/20'
               case 'medium': return 'text-priority-medium bg-priority-medium/10 border-priority-medium/20'
               case 'low': return 'text-priority-low bg-priority-low/10 border-priority-low/20'
               default: return 'text-muted-foreground'
          }
     }

     const getStatusColor = (status: string) => {
          switch (status) {
               case 'todo': return 'bg-muted text-muted-foreground'
               case 'in-progress': return 'bg-warning text-white'
               case 'completed': return 'bg-success text-white'
               default: return 'bg-secondary text-secondary-foreground'
          }
     }

     const getStatusLabel = (status: string) => {
          switch (status) {
               case 'todo': return 'A Fazer'
               case 'in-progress': return 'Em Progresso'
               case 'completed': return 'Concluída'
               default: return status
          }
     }

     const getPriorityLabel = (priority: string) => {
          switch (priority) {
               case 'high': return 'Alta'
               case 'medium': return 'Média'
               case 'low': return 'Baixa'
               default: return priority
          }
     }

     const getProjectName = (projectId: string | null) => {
          if (!projectId) return 'Sem projeto'
          const project = projects.find(p => p.id === projectId)
          return project?.title || 'Projeto não encontrado'
     }

     return (
          <Dialog open={open} onOpenChange={onOpenChange}>
               <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                         <DialogTitle className="text-lg sm:text-2xl">Detalhes da Tarefa</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 sm:space-y-6">
                         {/* Header */}
                         <div className="space-y-2">
                              <h1 className="text-xl sm:text-2xl font-bold text-card-foreground break-words">{task.title}</h1>
                         </div>

                         {/* Description */}
                         {task.description && (
                              <div className="space-y-2">
                                   <h2 className="text-sm font-semibold text-card-foreground">Descrição</h2>
                                   <div className="p-3 rounded-lg bg-muted/50">
                                        <p className="text-sm text-white whitespace-pre-wrap">
                                             {task.description}
                                        </p>
                                   </div>
                              </div>
                         )}

                         {/* Status and Priority */}
                         <div className="flex flex-wrap gap-2 sm:gap-3">
                              <Badge className={getStatusColor(task.status)}>
                                   {getStatusLabel(task.status)}
                              </Badge>
                              <div className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                                   <Flag className="w-3 h-3" />
                                   <span className="text-xs sm:text-sm font-medium">{getPriorityLabel(task.priority)}</span>
                              </div>
                         </div>

                         {/* Details Grid */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                              <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/50">
                                   <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                                   <div className="min-w-0">
                                        <p className="text-xs sm:text-sm text-muted-foreground">Projeto</p>
                                        <p className="text-sm sm:text-base font-medium truncate">{getProjectName(task.project_id)}</p>
                                   </div>
                              </div>

                              <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/50">
                                   <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                                   <div className="min-w-0">
                                        <p className="text-xs sm:text-sm text-muted-foreground">Tempo Estimado</p>
                                        <p className="text-sm sm:text-base font-medium truncate">{task.estimated_time || 'Não definido'}</p>
                                   </div>
                              </div>

                              <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/50">
                                   <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-foreground flex-shrink-0" />
                                   <div className="min-w-0">
                                        <p className="text-xs sm:text-sm text-muted-foreground">Data de Vencimento</p>
                                        <p className="text-sm sm:text-base font-medium">
                                             {task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy') : 'Não definida'}
                                        </p>
                                   </div>
                              </div>

                              <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/50">
                                   <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                                   <div className="min-w-0">
                                        <p className="text-xs sm:text-sm text-muted-foreground">Criada em</p>
                                        <p className="text-sm sm:text-base font-medium">
                                             {format(new Date(task.created_at), 'dd/MM/yyyy HH:mm')}
                                        </p>
                                   </div>
                              </div>

                              {task.updated_at !== task.created_at && (
                                   <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/50 md:col-span-2">
                                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                                        <div className="min-w-0">
                                             <p className="text-xs sm:text-sm text-muted-foreground">Última atualização</p>
                                             <p className="text-sm sm:text-base font-medium">
                                                  {format(new Date(task.updated_at), 'dd/MM/yyyy HH:mm')}
                                             </p>
                                        </div>
                                   </div>
                              )}
                         </div>

                         {/* Subtasks Section */}
                         {task.subtasks && task.subtasks.length > 0 && (
                              <div className="space-y-3">
                                   <div className="flex items-center gap-2">
                                        <CheckSquare className="w-5 h-5 text-primary" />
                                        <h3 className="text-lg font-semibold">Subtarefas ({task.subtasks.length})</h3>
                                   </div>

                                   <Card className="p-3">
                                        <div className="space-y-2">
                                             {task.subtasks.map((subtask, index) => (
                                                  <div
                                                       key={subtask.id || index}
                                                       className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                                                  >
                                                       <Checkbox
                                                            checked={subtask.status === 'completed'}
                                                            disabled
                                                       />
                                                       <span
                                                            className={`flex-1 text-sm ${subtask.status === 'completed'
                                                                 ? 'line-through text-muted-foreground'
                                                                 : 'text-foreground'
                                                                 }`}
                                                       >
                                                            {subtask.title}
                                                       </span>
                                                       <Badge
                                                            variant="secondary"
                                                            className={`text-xs ${subtask.status === 'completed'
                                                                 ? 'bg-success text-white'
                                                                 : 'bg-muted text-muted-foreground'
                                                                 }`}
                                                       >
                                                            {subtask.status === 'completed' ? 'Concluída' : 'Pendente'}
                                                       </Badge>
                                                  </div>
                                             ))}
                                        </div>
                                   </Card>
                              </div>
                         )}

                         <div className="flex justify-end pt-2">
                              <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                                   Fechar
                              </Button>
                         </div>
                    </div>
               </DialogContent>
          </Dialog>
     )
}