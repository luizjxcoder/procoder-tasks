import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Flag, MoreVertical } from "lucide-react"
import {
     DropdownMenu,
     DropdownMenuContent,
     DropdownMenuItem,
     DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

export function TaskList({ tasks, onTaskUpdate }: TaskListProps) {
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
                         className="text-primary hover:text-primary/80 w-full sm:w-auto"
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
                                   className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border transition-all duration-300 hover:bg-secondary/20 cursor-pointer ${isCompleted ? "opacity-60" : ""
                                        }`}
                                   onClick={() => navigate('/tasks')}
                              >
                                   <Checkbox
                                        checked={isCompleted}
                                        onCheckedChange={(checked) => handleTaskComplete(task.id, checked as boolean)}
                                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-1 flex-shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                   />

                                   <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                             <h3 className={`font-medium text-sm sm:text-base text-card-foreground ${isCompleted ? "line-through" : ""}`}>
                                                  {truncateText(task.title)}
                                             </h3>
                                             <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-muted flex-shrink-0`}>
                                                  <Flag className={`w-3 h-3 ${priorityColors[task.priority]}`} />
                                             </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                                             <span className="font-medium">{task.project}</span>
                                             <div className="flex items-center gap-3">
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

                                   <Badge
                                        variant="secondary"
                                        className={`${statusColors[task.status]} text-white`}
                                   >
                                        {task.status === "in-progress" ? "In Progress" : task.status}
                                   </Badge>

                                   <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                             <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={(e) => e.stopPropagation()}
                                             >
                                                  <MoreVertical className="w-4 h-4" />
                                             </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                             <DropdownMenuItem>Edit Task</DropdownMenuItem>
                                             <DropdownMenuItem>Change Priority</DropdownMenuItem>
                                             <DropdownMenuItem className="text-destructive">Delete Task</DropdownMenuItem>
                                        </DropdownMenuContent>
                                   </DropdownMenu>
                              </div>
                         )
                    })}
               </div>
          </div>
     )
}