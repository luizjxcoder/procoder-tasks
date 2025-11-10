import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, DollarSign, User, Calendar } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

interface SaleActivity {
     id: string
     client_name: string
     sale_value: number
     payment_status: string
     created_at: string
     business_name: string
     project_name: string
}

export function RecentSalesActivity() {
     const { user } = useAuth()
     const [activities, setActivities] = useState<SaleActivity[]>([])
     const [loading, setLoading] = useState(true)

     const fetchRecentSales = async () => {
          if (!user) return

          try {
               setLoading(true)
               const { data, error } = await supabase
                    .from('sales')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(5)

               if (error) throw error

               const formattedActivities = data?.map(sale => ({
                    id: sale.id,
                    client_name: sale.client_name,
                    sale_value: sale.sale_value,
                    payment_status: sale.payment_status,
                    created_at: sale.created_at,
                    business_name: sale.business_name || 'Negócio',
                    project_name: sale.project_name || 'Projeto'
               })) || []

               setActivities(formattedActivities)
          } catch (error) {
               console.error('Erro ao buscar atividades de vendas:', error)
          } finally {
               setLoading(false)
          }
     }

     useEffect(() => {
          if (user) {
               fetchRecentSales()
          }
     }, [user])

     const formatDate = (dateString: string) => {
          const date = new Date(dateString)
          return date.toLocaleDateString('pt-BR', {
               day: '2-digit',
               month: '2-digit',
               hour: '2-digit',
               minute: '2-digit'
          })
     }

     const formatCurrency = (amount: number) => {
          return new Intl.NumberFormat('pt-BR', {
               style: 'currency',
               currency: 'BRL'
          }).format(amount)
     }

     const getStatusColor = (status: string) => {
          switch (status) {
               case 'paid':
                    return 'bg-success/10 text-success'
               case 'pending':
                    return 'bg-warning/10 text-warning'
               case 'overdue':
                    return 'bg-destructive/10 text-destructive'
               default:
                    return 'bg-secondary text-secondary-foreground'
          }
     }

     const getStatusText = (status: string) => {
          switch (status) {
               case 'paid':
                    return 'Pago'
               case 'pending':
                    return 'Pendente'
               case 'overdue':
                    return 'Atrasado'
               default:
                    return status
          }
     }

     return (
          <div className="bg-gradient-card border border-border rounded-xl p-4 shadow-card">
               {/* Header */}
               <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                         <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-primary" />
                              Vendas
                         </h3>
                         <p className="text-xs text-muted-foreground">Atividades recentes</p>
                    </div>
                    <Badge variant="secondary">{activities.length}</Badge>
               </div>

               {/* Activities List */}
               <div className="space-y-3">
                    {loading ? (
                         <div className="text-center text-muted-foreground text-sm">
                              Carregando atividades...
                         </div>
                    ) : activities.length > 0 ? (
                         activities.map((activity) => (
                              <div key={activity.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 border border-border/50">
                                   <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="p-1.5 rounded-full bg-primary/10">
                                             <DollarSign className="w-3 h-3 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                             <div className="flex items-center justify-between">
                                                  <p className="text-sm font-medium text-card-foreground truncate">
                                                       {activity.client_name}
                                                  </p>
                                                  <Badge className={`text-xs ${getStatusColor(activity.payment_status)}`}>
                                                       {getStatusText(activity.payment_status)}
                                                  </Badge>
                                             </div>
                                             <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                  <span className="flex items-center gap-1">
                                                       <User className="w-3 h-3" />
                                                       {activity.project_name}
                                                  </span>
                                                  <span className="font-medium text-success">
                                                       {formatCurrency(activity.sale_value)}
                                                  </span>
                                             </div>
                                             <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                  <Calendar className="w-3 h-3" />
                                                  {formatDate(activity.created_at)}
                                             </div>
                                        </div>
                                   </div>
                              </div>
                         ))
                    ) : (
                         <div className="text-center text-muted-foreground text-sm py-4">
                              <DollarSign className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                              <p>Nenhuma atividade recente</p>
                              <p className="text-xs">Suas vendas aparecerão aqui</p>
                         </div>
                    )}
               </div>

               {/* Footer */}
               {activities.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                         <Link to="/sales" className="block">
                              <Button
                                   variant="ghost"
                                   size="sm"
                                   className="w-full h-8 text-xs"
                              >
                                   Ver todas as vendas
                              </Button>
                         </Link>
                    </div>
               )}
          </div>
     )
}