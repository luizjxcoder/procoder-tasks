import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Star } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"

interface Note {
  id: string
  title: string
  content: string | null
  is_favorite: boolean
  created_at: string
  tags: string[] | null
}

export const NotesWidget = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotes = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error('Erro ao buscar notas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [user])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short' 
    })
  }

  const truncateContent = (content: string | null, maxLength: number = 80) => {
    if (!content) return "Sem conteúdo"
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + "..."
  }

  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Notas Recentes
        </CardTitle>
        <Badge variant="secondary">{notes.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center text-muted-foreground py-4">
            Carregando notas...
          </div>
        ) : notes.length > 0 ? (
          <>
            <div className="space-y-3">
              {notes.map((note) => (
                <div 
                  key={note.id} 
                  className="p-3 rounded-lg border border-border bg-background/50 hover:bg-background/80 transition-colors cursor-pointer"
                  onClick={() => navigate('/notes')}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm text-foreground line-clamp-1">
                      {note.title}
                    </h4>
                    <div className="flex items-center gap-1 ml-2">
                      {note.is_favorite && (
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(note.created_at)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {truncateContent(note.content)}
                  </p>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                          {tag}
                        </Badge>
                      ))}
                      {note.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          +{note.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button 
              className="w-full mt-4 bg-primary hover:bg-primary/90"
              onClick={() => navigate('/notes')}
            >
              Ver Todas as Notas
            </Button>
          </>
        ) : (
          <div className="text-center py-6">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Nenhuma nota encontrada
            </p>
            <Button 
              className="bg-gradient-primary hover:bg-gradient-primary/90"
              onClick={() => navigate('/notes')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Nota
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}