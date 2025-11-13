import { useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Flag, Eye, Edit2, Trash2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"

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

interface KanbanBoardProps {
  tasks: Task[]
  projects: Project[]
  onStatusChange: (taskId: string, newStatus: Task['status']) => void
  onViewDetails: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

const priorityColors = {
  high: "text-red-500",
  medium: "text-yellow-500",
  low: "text-green-500"
}

const columns = [
  { id: 'todo' as const, title: 'A Fazer', bgClass: 'bg-muted/30' },
  { id: 'in-progress' as const, title: 'Em Progresso', bgClass: 'bg-warning/10' },
  { id: 'completed' as const, title: 'Concluídas', bgClass: 'bg-success/10' },
]

interface KanbanTaskCardProps {
  task: Task
  getProjectName: (projectId: string | null) => string
  onViewDetails: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

function KanbanTaskCard({ task, getProjectName, onViewDetails, onEdit, onDelete }: KanbanTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-3"
    >
      <Card className="hover:shadow-md transition-all cursor-grab active:cursor-grabbing border border-border bg-card">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm text-foreground line-clamp-2 flex-1">
                {task.title}
              </h4>
              <Flag className={`w-3 h-3 ${priorityColors[task.priority]} flex-shrink-0 mt-1`} />
            </div>

            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <span className="font-medium truncate">
                {getProjectName(task.project_id)}
              </span>
              
              <div className="flex flex-wrap items-center gap-2">
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

                {task.subtasks && task.subtasks.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {task.subtasks.filter(st => st.status === 'completed').length}/{task.subtasks.length} subtarefas
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-1 pt-2 border-t border-border">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewDetails(task)
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <Eye className="w-3.5 h-3.5 text-foreground" />
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
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(task)
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-foreground" />
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
                        onDelete(task)
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Excluir</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function KanbanColumn({ 
  column, 
  tasks, 
  getProjectName, 
  onViewDetails, 
  onEdit, 
  onDelete 
}: {
  column: typeof columns[0]
  tasks: Task[]
  getProjectName: (projectId: string | null) => string
  onViewDetails: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  })

  return (
    <Card className={`${column.bgClass} border-2`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center justify-between">
          <span>{column.title}</span>
          <Badge variant="secondary" className="ml-2">
            {tasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div ref={setNodeRef} className="min-h-[100px]">
            <SortableContext
              items={tasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Arraste tarefas aqui
                  </div>
                ) : (
                  tasks.map((task) => (
                    <KanbanTaskCard
                      key={task.id}
                      task={task}
                      getProjectName={getProjectName}
                      onViewDetails={onViewDetails}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export function KanbanBoard({ tasks, projects, onStatusChange, onViewDetails, onEdit, onDelete }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [overColumn, setOverColumn] = useState<Task['status'] | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Debug: Log tasks status distribution
  // Normalize invalid statuses (anything not in the allowed set becomes 'todo')
  const isValidStatus = (status: any): status is Task['status'] =>
    status === 'todo' || status === 'in-progress' || status === 'completed'
  const normalizedTasks = tasks.map(t => (isValidStatus(t.status) ? t : { ...t, status: 'todo' as const }))

  // Debug: Log tasks status distribution (normalized)
  console.log('KanbanBoard - Total tasks:', normalizedTasks.length)
  console.log('KanbanBoard - Tasks by status:', {
    todo: normalizedTasks.filter(t => t.status === 'todo').length,
    'in-progress': normalizedTasks.filter(t => t.status === 'in-progress').length,
    completed: normalizedTasks.filter(t => t.status === 'completed').length
  })
  console.log('KanbanBoard - First 3 tasks:', normalizedTasks.slice(0, 3).map(t => ({ id: t.id, title: t.title, status: t.status })))

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return 'Sem projeto'
    const project = projects.find(p => p.id === projectId)
    return project?.title || 'Projeto não encontrado'
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = normalizedTasks.find(t => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    if (over) {
      // Check if over a column
      if (['todo', 'in-progress', 'completed'].includes(over.id as string)) {
        setOverColumn(over.id as Task['status'])
      } else {
        // Over a task, find its column
        const task = normalizedTasks.find(t => t.id === over.id)
        if (task) {
          setOverColumn(task.status)
        }
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveTask(null)
      setOverColumn(null)
      return
    }

    const taskId = active.id as string
    const task = normalizedTasks.find(t => t.id === taskId)
    
    if (!task) {
      setActiveTask(null)
      setOverColumn(null)
      return
    }

    let newStatus: Task['status'] | null = null

    // Check if dropped on a column directly
    if (['todo', 'in-progress', 'completed'].includes(over.id as string)) {
      newStatus = over.id as Task['status']
    } else {
      // Dropped on a task, get that task's status
      const overTask = normalizedTasks.find(t => t.id === over.id)
      if (overTask) {
        newStatus = overTask.status
      }
    }
    
    if (newStatus && task.status !== newStatus) {
      onStatusChange(taskId, newStatus)
    }
    
    setActiveTask(null)
    setOverColumn(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        {columns.map((column) => {
          const columnTasks = normalizedTasks.filter(task => task.status === column.id)
          
          return (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={columnTasks}
              getProjectName={getProjectName}
              onViewDetails={onViewDetails}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )
        })}
      </div>

      <DragOverlay>
        {activeTask && (
          <Card className="cursor-grabbing shadow-lg border-2 border-primary">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Flag className={`w-3 h-3 ${priorityColors[activeTask.priority]}`} />
                <h4 className="font-semibold text-sm">{activeTask.title}</h4>
              </div>
            </CardContent>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  )
}
