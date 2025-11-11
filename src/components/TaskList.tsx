import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Flag, Eye, Edit2, Trash2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Task {
     id: string
     title: string
     project: string
     priority: "high" | "medium" | "low"
     dueDate: string
     status: "todo" | "in-progress" | "completed"
     estimatedTime: string
}

interface TaskListProps {
     tasks: Task[]
     onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
     onTaskDelete?: (taskId: string) => void
     onTaskEdit?: (taskId: string) => void
     showEditDelete?: boolean
}

const priorityColors = {
     high: "text-priority-high",
     medium: "text-priority-medium",
     low: "text-priority-low"
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

export function TaskList({ tasks, onTaskUpdate, onTaskDelete, onTaskEdit, showEditDelete = true }: TaskListProps) {
     const navigate = useNavigate()
     const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())

     const handleTaskComplete = (taskId: string, completed: boolean) => {
          const newCompleted = new Set(completedTasks)
          if (completed) {
               newCompleted.add(taskId)
               onTaskUpdate(taskId, { status: "completed" })
          } else {
               newCompleted.delete(taskId)
               onTaskUpdate(taskId, { status: "todo" })
          }
          setCompletedTasks(newCompleted)
     }

     return (
          <div className="bg-gradient-card border border-border rounded-xl p-4 sm:p-6 shadow-card">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-card-foreground">My Tasks</h2>
                    <Button
                         variant="outline"
                         size="sm"
                         onClick={() => navigate('/tasks')}
                         className="text-primary hover:text-white w-full sm:w-auto"
                    >
                         Ver Todos
                    </Button>
               </div>

               <div className="space-y-4">
                    {tasks.map((task) => {
                         const isCompleted = completedTasks.has(task.id) || task.status === "completed"

                         return (
                              <div
                                   key={task.id}
                                   className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 rounded-lg border border-border transition-all duration-300 hover:bg-secondary/20 cursor-pointer h-[60px] overflow-hidden ${isCompleted ? "opacity-60" : ""
                                        }`}
                                   onClick={() => navigate('/tasks')}
                              >
                                   <Checkbox
                                        checked={isCompleted}
                                        onCheckedChange={(checked) => handleTaskComplete(task.id, checked as boolean)}
                                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary flex-shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                   />

                                   <div className="flex-1 min-w-0 overflow-hidden">
                                        <h3 className={`font-medium text-sm text-card-foreground truncate ${isCompleted ? "line-through" : ""}`}>
                                             {task.title}
                                        </h3>

                                        <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden">
                                             <span className="font-medium truncate max-w-[100px]">{task.project}</span>
                                             <div className="flex items-center gap-2 flex-shrink-0">
                                                  <div className="flex items-center gap-1">
                                                       <Calendar className="w-3 h-3" />
                                                       <span>{task.dueDate}</span>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                       <Clock className="w-3 h-3" />
                                                       <span>{task.estimatedTime}</span>
                                                  </div>
                                             </div>
                                        </div>
                                   </div>

                                   <div className="flex items-center gap-1 flex-shrink-0">
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted">
                                             <Flag className={`w-3 h-3 ${priorityColors[task.priority]}`} />
                                        </div>
                                   </div>

                                   <Badge
                                        variant="secondary"
                                        className={`${statusColors[task.status]} text-white flex-shrink-0`}
                                   >
                                        {task.status === "in-progress" ? "In Progress" : task.status}
                                   </Badge>

                                   <TooltipProvider>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                             <Tooltip>
                                                  <TooltipTrigger asChild>
                                                       <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                 e.stopPropagation()
                                                                 navigate('/tasks')
                                                            }}
                                                            className="h-8 w-8 p-0"
                                                       >
                                                            <Eye className="w-4 h-4 text-foreground" />
                                                       </Button>
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                       <p>Visualizar</p>
                                                  </TooltipContent>
                                             </Tooltip>

                                             {showEditDelete && (
                                                  <>
                                                       <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                 <Button
                                                                      variant="ghost"
                                                                      size="sm"
                                                                      onClick={(e) => {
                                                                           e.stopPropagation()
                                                                           onTaskEdit?.(task.id)
                                                                      }}
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
                                                                      onClick={(e) => {
                                                                           e.stopPropagation()
                                                                           onTaskDelete?.(task.id)
                                                                      }}
                                                                      className="h-8 w-8 p-0"
                                                                 >
                                                                      <Trash2 className="w-4 h-4 text-destructive" />
                                                                 </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                 <p>Excluir</p>
                                                            </TooltipContent>
                                                       </Tooltip>
                                                  </>
                                             )}
                                        </div>
                                   </TooltipProvider>
                              </div>
                         )
                    })}
               </div>
          </div>
     )
}