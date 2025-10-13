import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Flag, Eye, Edit, Trash2 } from "lucide-react"

interface TeamMember {
  id: string
  name: string
  avatar: string
}

interface ProjectCardProps {
  title: string
  company: string
  progress: number
  totalTasks: number
  completedTasks: number
  priority: "high" | "medium" | "low"
  dueDate: string
  team: TeamMember[]
  tags: string[]
  status: "active" | "completed" | "on-hold"
  project?: any
  onViewDetails?: (project: any) => void
  onEdit?: (project: any) => void
  onDelete?: (id: string) => void
}

const priorityColors = {
  high: "text-priority-high",
  medium: "text-priority-medium", 
  low: "text-priority-low"
}

const priorityBgColors = {
  high: "bg-priority-high/10",
  medium: "bg-priority-medium/10",
  low: "bg-priority-low/10"
}

export function ProjectCard({
  title,
  company,
  progress,
  totalTasks,
  completedTasks,
  priority,
  dueDate,
  team,
  tags,
  status,
  project,
  onViewDetails,
  onEdit,
  onDelete
}: ProjectCardProps) {
  return (
    <div className="bg-gradient-card border border-border rounded-xl p-4 sm:p-6 shadow-card hover:shadow-hover transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-xs sm:text-sm font-bold text-primary-foreground">
              {company.charAt(0)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm sm:text-base text-card-foreground group-hover:text-primary transition-colors truncate">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{company}</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${priorityBgColors[priority]} flex-shrink-0`}>
          <Flag className={`w-3 h-3 ${priorityColors[priority]}`} />
          <span className={`text-xs font-medium capitalize ${priorityColors[priority]} hidden sm:inline`}>
            {priority}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Progress</span>
          <span className="text-sm font-medium text-card-foreground">
            {completedTasks}/{totalTasks}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Team Avatars */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div className="flex -space-x-2">
            {team.slice(0, 3).map((member, index) => (
              <div
                key={member.id}
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-card bg-gradient-primary flex items-center justify-center"
                style={{ zIndex: team.length - index }}
              >
                <span className="text-xs font-medium text-primary-foreground">
                  {member.name.charAt(0)}
                </span>
              </div>
            ))}
            {team.length > 3 && (
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-card bg-muted flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">
                  +{team.length - 3}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span className="text-xs sm:text-sm">{dueDate}</span>
        </div>
      </div>

      {/* Tags and Actions */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="text-xs bg-secondary/50 hover:bg-secondary"
            >
              {tag}
            </Badge>
          ))}
        </div>
        
        {/* Action Buttons */}
        {(onViewDetails || onEdit || onDelete) && project && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            {onViewDetails && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails(project)
                }}
                title="Visualizar detalhes"
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
            {onEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(project)
                }}
                title="Editar projeto"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(project.id)
                }}
                title="Excluir projeto"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}