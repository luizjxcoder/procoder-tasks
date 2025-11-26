import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Calendar, User, ArrowRight } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

export const RecentBriefings = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [briefings, setBriefings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBriefings = async () => {
      if (!user) return

      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('design_briefings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3)

        if (error) throw error

        setBriefings(data || [])
      } catch (error) {
        console.error('Erro ao buscar briefings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBriefings()
  }, [user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20'
      case 'in_progress':
        return 'bg-warning/10 text-warning border-warning/20'
      case 'draft':
        return 'bg-muted/10 text-muted-foreground border-muted/20'
      default:
        return 'bg-secondary/10 text-secondary-foreground border-secondary/20'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído'
      case 'in_progress':
        return 'Em Progresso'
      case 'draft':
        return 'Rascunho'
      default:
        return status
    }
  }

  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Briefings de Design Recentes
        </CardTitle>
        {briefings.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/design-briefings')}
            className="text-primary hover:text-white"
          >
            Ver Todos
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center text-muted-foreground py-8">
            Carregando briefings...
          </div>
        ) : briefings.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">Nenhum briefing encontrado.</p>
            <Button 
              className="bg-gradient-primary hover:bg-gradient-primary/90"
              onClick={() => navigate('/design-briefings')}
            >
              Criar Primeiro Briefing
            </Button>
          </div>
        ) : (
          <ScrollArea className="max-h-[420px] pr-4">
            <div className="space-y-3">
              {briefings.map((briefing) => (
                <div
                  key={briefing.id}
                  onClick={() => navigate('/design-briefings')}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card/50 hover:bg-card/70 rounded-lg border border-border/50 transition-all cursor-pointer group"
                >
                  <div className="flex-1 space-y-2 mb-3 sm:mb-0">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-2 rounded-md bg-primary/10">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground mb-1 truncate group-hover:text-primary transition-colors">
                          {briefing.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">{briefing.client_name}</span>
                          </div>
                          <span className="text-border">•</span>
                          <span className="truncate">{briefing.project_type}</span>
                          <span className="text-border">•</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(briefing.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(briefing.status)} shrink-0`}
                  >
                    {getStatusLabel(briefing.status)}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
