import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Flag, DollarSign, Calendar as CalendarIcon, Clock, Target, Maximize2, RefreshCw } from "lucide-react"
import { format } from "date-fns"

interface Project {
     id: string
     title: string
     description: string | null
     company: string | null
     status: 'active' | 'completed' | 'on-hold' | 'cancelled'
     priority: 'high' | 'medium' | 'low'
     progress: number
     total_tasks: number
     completed_tasks: number
     due_date: string | null
     start_date: string | null
     budget: number | null
     image_url?: string | null
     created_at: string
     updated_at: string
}

interface ProjectDetailsModalProps {
     project: Project | null
     open: boolean
     onOpenChange: (open: boolean) => void
}

export function ProjectDetailsModal({ project, open, onOpenChange }: ProjectDetailsModalProps) {
     const [imageFullscreen, setImageFullscreen] = useState(false)

     if (!project) return null

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
               case 'active': return 'bg-success text-white'
               case 'completed': return 'bg-primary text-primary-foreground'
               case 'on-hold': return 'bg-warning text-white'
               case 'cancelled': return 'bg-destructive text-destructive-foreground'
               default: return 'bg-secondary text-secondary-foreground'
          }
     }

     const getStatusLabel = (status: string) => {
          switch (status) {
               case 'active': return 'Ativo'
               case 'completed': return 'Concluído'
               case 'on-hold': return 'Pausado'
               case 'cancelled': return 'Cancelado'
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

     return (
          <>
               <Dialog open={open} onOpenChange={onOpenChange}>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto w-[95vw] mx-auto sm:w-full p-4">
                         <DialogHeader>
                              <DialogTitle className="text-xl sm:text-2xl">Detalhes do Projeto</DialogTitle>
                         </DialogHeader>

                         <div className="space-y-4 sm:space-y-6">
                              {/* Image */}
                              {project.image_url && (
                                   <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden bg-muted group">
                                        <img
                                             src={project.image_url}
                                             alt={project.title}
                                             className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
                                             onClick={() => setImageFullscreen(true)}
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                             <Button
                                                  size="sm"
                                                  variant="secondary"
                                                  onClick={() => setImageFullscreen(true)}
                                                  className="gap-2"
                                             >
                                                  <Maximize2 className="w-4 h-4" />
                                                  <span className="hidden sm:inline">Ver em tela cheia</span>
                                             </Button>
                                        </div>
                                   </div>
                              )}

                              {/* Header */}
                              <div className="space-y-2">
                                   <h1 className="text-xl sm:text-2xl font-bold text-card-foreground">{project.title}</h1>
                              </div>

                              {/* Description */}
                              {project.description && (
                                   <div className="space-y-2">
                                        <h2 className="text-SM font-semibold text-card-foreground">DESCRIÇÃO DO PROJETO:</h2>
                                        <div className="p-8 rounded-lg bg-muted/50">
                                             <p className="text-sm text-foreground whitespace-pre-wrap">
                                                  {project.description}
                                             </p>
                                        </div>
                                   </div>
                              )}

                              {/* Status and Priority */}
                              <div className="flex flex-wrap gap-2 sm:gap-3">
                                   <Badge className={getStatusColor(project.status)}>
                                        {getStatusLabel(project.status)}
                                   </Badge>
                                   <div className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full border ${getPriorityColor(project.priority)}`}>
                                        <Flag className="w-3 h-3" />
                                        <span className="text-xs sm:text-sm font-medium">{getPriorityLabel(project.priority)}</span>
                                   </div>
                              </div>

                              {/* Progress */}
                              <div className="space-y-2">
                                   <div className="flex items-center justify-between">
                                        <span className="text-xs sm:text-sm font-medium">Progresso do Projeto</span>
                                        <span className="text-xs sm:text-sm text-muted-foreground">{project.progress}%</span>
                                   </div>
                                   <div className="w-full bg-secondary rounded-full h-2">
                                        <div
                                             className="bg-primary h-2 rounded-full transition-all duration-500"
                                             style={{ width: `${project.progress}%` }}
                                        />
                                   </div>
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                   <div className="flex items-center gap-2 sm:gap-3 p-3 rounded-lg bg-muted/50">
                                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                                        <div className="min-w-0">
                                             <p className="text-xs sm:text-sm text-muted-foreground">Empresa</p>
                                             <p className="text-sm sm:text-base font-medium truncate">{project.company || 'Não informado'}</p>
                                        </div>
                                   </div>

                                   <div className="flex items-center gap-2 sm:gap-3 p-3 rounded-lg bg-muted/50">
                                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                                        <div>
                                             <p className="text-xs sm:text-sm text-muted-foreground">Tarefas</p>
                                             <p className="text-sm sm:text-base font-medium">{project.completed_tasks}/{project.total_tasks}</p>
                                        </div>
                                   </div>

                                   <div className="flex items-center gap-2 sm:gap-3 p-3 rounded-lg bg-muted/50">
                                        <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-foreground flex-shrink-0" />
                                        <div className="min-w-0">
                                             <p className="text-xs sm:text-sm text-muted-foreground">Data de Início</p>
                                             <p className="text-sm sm:text-base font-medium truncate">
                                                  {project.start_date ? format(new Date(project.start_date), 'dd/MM/yyyy') : 'Não definida'}
                                             </p>
                                        </div>
                                   </div>

                                   <div className="flex items-center gap-2 sm:gap-3 p-3 rounded-lg bg-muted/50">
                                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-foreground flex-shrink-0" />
                                        <div className="min-w-0">
                                             <p className="text-xs sm:text-sm text-muted-foreground">Data de Entrega</p>
                                             <p className="text-sm sm:text-base font-medium truncate">
                                                  {project.due_date ? format(new Date(project.due_date), 'dd/MM/yyyy') : 'Não definida'}
                                             </p>
                                        </div>
                                   </div>

                                   <div className="flex items-center gap-2 sm:gap-3 p-3 rounded-lg bg-muted/50">
                                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                                        <div className="min-w-0">
                                             <p className="text-xs sm:text-sm text-muted-foreground">Orçamento</p>
                                             <p className="text-sm sm:text-base font-medium truncate">
                                                  {project.budget ? `R$ ${project.budget.toLocaleString('pt-BR')}` : 'Não definido'}
                                             </p>
                                        </div>
                                   </div>

                                   <div className="flex items-center gap-2 sm:gap-3 p-3 rounded-lg bg-muted/50">
                                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                                        <div className="min-w-0">
                                             <p className="text-xs sm:text-sm text-muted-foreground">Criado em</p>
                                             <p className="text-sm sm:text-base font-medium truncate">
                                                  {format(new Date(project.created_at), 'dd/MM/yyyy HH:mm')}

                                             </p>
                                        </div>
                                   </div>

                                   <div className="flex items-center gap-2 sm:gap-3 p-3 rounded-lg bg-muted/50">
                                        <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                                        <div className="min-w-0">
                                             <p className="text-xs sm:text-sm text-muted-foreground">Última Atualização</p>
                                             <p className="text-sm sm:text-base font-medium truncate">
                                                  {format(new Date(project.updated_at), 'dd/MM/yyyy HH:mm')}
                                             </p>
                                        </div>
                                   </div>
                              </div>

                              <div className="flex justify-end pt-2">
                                   <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                                        Fechar
                                   </Button>
                              </div>
                         </div>
                    </DialogContent>
               </Dialog>

               {/* Fullscreen Image Modal */}
               {imageFullscreen && project.image_url && (
                    <Dialog open={imageFullscreen} onOpenChange={setImageFullscreen}>
                         <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-0 [&>button]:!text-white [&>button]:bg-transparent [&>button]:active:bg-primary/20 [&>button]:hover:!text-primary [&>button]:top-4 [&>button]:right-4 [&>button]:rounded-full [&>button]:p-2 [&>button]:border-transparent [&>button]:hover:border-primary [&>button]:active:border-primary [&>button]:transition-all">

                              <div className="w-full h-full flex items-center justify-center p-4">
                                   <img
                                        src={project.image_url}
                                        alt={project.title}
                                        className="max-w-full max-h-full object-contain"
                                   />
                              </div>
                         </DialogContent>
                    </Dialog>
               )}
          </>
     )
}