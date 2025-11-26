import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, Clock, AlertTriangle, Calendar } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

interface Alert {
     id: string
     type: 'task' | 'project' | 'sale'
     title: string
     description: string
     dueDate: string
     priority: 'high' | 'medium' | 'low'
     overdue: boolean
}

export const AlertsWidget = () => {
     const { user } = useAuth()
     const [alerts, setAlerts] = useState<Alert[]>([])
     const [loading, setLoading] = useState(true)

     const fetchAlerts = async () => {
          if (!user) return

          try {
               setLoading(true)
               const now = new Date()
               const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

               // Buscar tarefas vencendo
               const { data: tasks, error: tasksError } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', user.id)
                    .not('status', 'eq', 'completed')
                    .not('due_date', 'is', null)
                    .lte('due_date', threeDaysFromNow.toISOString())

               if (tasksError) throw tasksError

               // Buscar projetos vencendo
               const { data: projects, error: projectsError } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('user_id', user.id)
                    .not('status', 'eq', 'completed')
                    .not('due_date', 'is', null)
                    .lte('due_date', threeDaysFromNow.toISOString())

               if (projectsError) throw projectsError

               // Processar alertas
               const alertList: Alert[] = []

               // Adicionar tarefas
               tasks?.forEach(task => {
                    const dueDate = new Date(task.due_date)
                    const isOverdue = dueDate < now

                    alertList.push({
                         id: task.id,
                         type: 'task',
                         title: task.title,
                         description: `Tarefa ${isOverdue ? 'vencida' : 'vencendo'}`,
                         dueDate: task.due_date,
                         priority: task.priority || 'medium',
                         overdue: isOverdue
                    })
               })

               // Adicionar projetos
               projects?.forEach(project => {
                    const dueDate = new Date(project.due_date)
                    const isOverdue = dueDate < now

                    alertList.push({
                         id: project.id,
                         type: 'project',
                         title: project.title,
                         description: `Projeto ${isOverdue ? 'vencido' : 'vencendo'}`,
                         dueDate: project.due_date,
                         priority: project.priority || 'medium',
                         overdue: isOverdue
                    })
               })

               // Ordenar por data de vencimento
               alertList.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

               setAlerts(alertList.slice(0, 4)) // Mostrar apenas os 4 mais urgentes
          } catch (error) {
               console.error('Erro ao buscar alertas:', error)
          } finally {
               setLoading(false)
          }
     }

     useEffect(() => {
          fetchAlerts()
     }, [user])

     const formatDate = (dateString: string) => {
          const date = new Date(dateString)
          const now = new Date()
          const diffTime = date.getTime() - now.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          if (diffDays < 0) {
               return `${Math.abs(diffDays)} dias atrás`
          } else if (diffDays === 0) {
               return 'Hoje'
          } else if (diffDays === 1) {
               return 'Amanhã'
          } else {
               return `${diffDays} dias`
          }
     }

     const getPriorityColor = (priority: string, overdue: boolean) => {
          if (overdue) return 'text-destructive'
          switch (priority) {
               case 'high': return 'text-destructive'
               case 'medium': return 'text-warning'
               case 'low': return 'text-muted-foreground'
               default: return 'text-muted-foreground'
          }
     }

     return (
          <div className="bg-gradient-card border border-border rounded-xl p-2 shadow-card">
               {/* Header */}
               <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                         <Bell className="w-3 h-3 text-warning" />
                         <h3 className="text-sm font-semibold text-card-foreground">Alertas</h3>
                    </div>
                    <Badge variant={alerts.length > 0 ? "destructive" : "secondary"} className="text-xs px-1.5 py-0.5">
                         {alerts.length}
                    </Badge>
               </div>

               {/* Alerts List */}
               <div className="space-y-1">
                    {loading ? (
                         <div className="text-center text-muted-foreground py-2">
                              <div className="text-xs">Carregando...</div>
                         </div>
                    ) : alerts.length > 0 ? (
                         alerts.map((alert) => (
                              <div
                                   key={alert.id}
                                   className={`p-1.5 rounded border ${alert.overdue
                                        ? 'border-destructive/20 bg-destructive/5'
                                        : 'border-border bg-background/50'
                                        } hover:bg-background/80 transition-colors`}
                              >
                                   <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                             <div className="flex items-center gap-1">
                                                  {alert.overdue && <AlertTriangle className="w-2.5 h-2.5 text-destructive" />}
                                                  {alert.type === 'task' ? (
                                                       <Clock className="w-2.5 h-2.5 text-primary" />
                                                  ) : (
                                                       <Calendar className="w-2.5 h-2.5 text-info" />
                                                  )}
                                             </div>
                                             <h4 className="text-xs font-medium text-foreground truncate">
                                                  {alert.title}
                                             </h4>
                                             <p className="text-xs text-muted-foreground">
                                                  {alert.description}
                                             </p>
                                        </div>
                                        <div className="text-right ml-1">
                                             <span className={`text-xs font-medium ${getPriorityColor(alert.priority, alert.overdue)}`}>
                                                  {formatDate(alert.dueDate)}
                                             </span>
                                        </div>
                                   </div>
                              </div>
                         ))
                    ) : (
                         <div className="text-center py-3">
                              <Bell className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                              <p className="text-xs text-muted-foreground">
                                   Nenhum alerta no momento
                              </p>
                         </div>
                    )}
               </div>

               {/* Action Button */}
               {alerts.length > 0 && (
                    <div className="mt-1 pt-1 border-t border-border">
                         <Link to="/tasks" className="block">
                              <Button
                                   variant="ghost"
                                   size="sm"
                                   className="w-full h-5 text-xs"
                              >
                                   Ver Todos
                              </Button>
                         </Link>
                    </div>
               )}
          </div>
     )
}