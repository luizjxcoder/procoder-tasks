import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" 
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TaskManagerSidebar } from "@/components/TaskManagerSidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Plus, BookOpen, Star, StarOff, Edit, Trash2, Search, Tag, Eye } from "lucide-react"
import { Label } from "@/components/ui/label"
import { NoteDetailsModal } from "@/components/NoteDetailsModal"

interface Note {
  id: string
  title: string
  content: string | null
  tags: string[] | null
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export default function Notes() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [viewingNote, setViewingNote] = useState<Note | null>(null)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  
  // Form states
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (user) {
      fetchNotes()
    }
  }, [user])

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      toast({
        title: "Erro ao carregar notas",
        description: "Tente novamente",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNote = async () => {
    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Digite um título para a nota",
        variant: "destructive"
      })
      return
    }

    try {
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      
      if (editingNote) {
        const { error } = await supabase
          .from('notes')
          .update({
            title: title.trim(),
            content: content.trim() || null,
            tags: tagsArray.length > 0 ? tagsArray : null,
            is_favorite: isFavorite
          })
          .eq('id', editingNote.id)
          .eq('user_id', user?.id)

        if (error) throw error
        
        toast({
          title: "Nota atualizada",
          description: "Sua nota foi atualizada com sucesso"
        })
      } else {
        const { error } = await supabase
          .from('notes')
          .insert({
            title: title.trim(),
            content: content.trim() || null,
            tags: tagsArray.length > 0 ? tagsArray : null,
            is_favorite: isFavorite,
            user_id: user?.id
          })

        if (error) throw error
        
        toast({
          title: "Nota criada",
          description: "Sua nota foi criada com sucesso"
        })
      }

      resetForm()
      setIsDialogOpen(false)
      fetchNotes()
    } catch (error) {
      toast({
        title: "Erro ao salvar nota",
        description: "Tente novamente",
        variant: "destructive"
      })
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user?.id)

      if (error) throw error
      
      toast({
        title: "Nota excluída",
        description: "Sua nota foi excluída com sucesso"
      })
      
      fetchNotes()
    } catch (error) {
      toast({
        title: "Erro ao excluir nota",
        description: "Tente novamente",
        variant: "destructive"
      })
    }
  }

  const toggleFavorite = async (note: Note) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_favorite: !note.is_favorite })
        .eq('id', note.id)
        .eq('user_id', user?.id)

      if (error) throw error
      fetchNotes()
    } catch (error) {
      toast({
        title: "Erro ao atualizar favorito",
        description: "Tente novamente",
        variant: "destructive"
      })
    }
  }

  const openEditDialog = (note: Note) => {
    setEditingNote(note)
    setTitle(note.title)
    setContent(note.content || "")
    setTags(note.tags?.join(', ') || "")
    setIsFavorite(note.is_favorite)
    setIsDialogOpen(true)
  }

  const handleViewDetails = (note: Note) => {
    setViewingNote(note)
    setIsDetailsOpen(true)
  }

  const resetForm = () => {
    setEditingNote(null)
    setTitle("")
    setContent("")
    setTags("")
    setIsFavorite(false)
  }

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTag = !selectedTag || note.tags?.includes(selectedTag)
    return matchesSearch && matchesTag
  })

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags || [])))

  if (loading) {
    return (
      <SidebarProvider>
        <TaskManagerSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-muted-foreground">Carregando...</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <TaskManagerSidebar />
      <SidebarInset>
        <div className="flex-1 space-y-3 sm:space-y-4 p-2 sm:p-4 md:p-6 lg:p-8 pt-3 sm:pt-4 md:pt-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="lg:hidden" />
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
              <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground">Notas e Ideias</h2>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Nova Nota</span>
                  <span className="sm:hidden">Nova</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] w-[95vw] sm:w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">
                    {editingNote ? "Editar Nota" : "Nova Nota"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-sm sm:text-base">Título</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Digite o título da nota..."
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="content" className="text-sm sm:text-base">Conteúdo</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Digite o conteúdo da nota..."
                      rows={6}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags" className="text-sm sm:text-base">Tags (separadas por vírgula)</Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="tag1, tag2, tag3..."
                      className="mt-1.5"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="favorite"
                      checked={isFavorite}
                      onChange={(e) => setIsFavorite(e.target.checked)}
                      className="rounded border-border"
                    />
                    <Label htmlFor="favorite" className="text-sm sm:text-base">Marcar como favorito</Label>
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveNote} className="w-full sm:w-auto">
                      {editingNote ? "Atualizar" : "Salvar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1 max-w-full sm:max-w-sm">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm"
              />
            </div>
            {allTags.length > 0 && (
              <div className="flex gap-1.5 sm:gap-2 items-center overflow-x-auto pb-2 sm:pb-0 -mx-2 px-2 sm:mx-0 sm:px-0">
                <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                <Button
                  variant={selectedTag === "" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag("")}
                  className="whitespace-nowrap h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                >
                  Todas
                </Button>
                {allTags.slice(0, 4).map((tag) => (
                  <Button
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
                    className="whitespace-nowrap h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Notes Grid */}
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm || selectedTag ? "Nenhuma nota encontrada" : "Nenhuma nota cadastrada"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedTag 
                  ? "Tente ajustar os filtros de busca" 
                  : "Comece criando sua primeira nota para organizar suas ideias"
                }
              </p>
              {!searchTerm && !selectedTag && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeira nota
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-2.5 sm:gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredNotes.map((note) => (
                <Card key={note.id} className="hover:shadow-md transition-shadow flex flex-col">
                  <CardHeader className="pb-2 px-2.5 sm:px-4 md:px-6 pt-2.5 sm:pt-4 md:pt-6">
                    <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                      <CardTitle className="text-sm sm:text-base md:text-lg line-clamp-2 flex-1 break-words pr-1">{note.title}</CardTitle>
                      <div className="flex gap-0 sm:gap-0.5 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(note)}
                          title="Visualizar"
                          className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                        >
                          <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(note)}
                          title={note.is_favorite ? "Remover favorito" : "Adicionar favorito"}
                          className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                        >
                          {note.is_favorite ? (
                            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(note)}
                          title="Editar"
                          className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                        >
                          <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          title="Excluir"
                          className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                        >
                          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-2.5 sm:px-4 md:px-6 pb-2.5 sm:pb-4 md:pb-6 flex-1 flex flex-col">
                    {note.content && (
                      <p className="text-muted-foreground text-xs sm:text-sm line-clamp-3 mb-2 break-words">
                        {note.content}
                      </p>
                    )}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {note.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0 truncate max-w-[80px] sm:max-w-none">
                            {tag}
                          </Badge>
                        ))}
                        {note.tags.length > 2 && (
                          <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0">
                            +{note.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-auto">
                      {new Date(note.updated_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Details Modal */}
          <NoteDetailsModal
            note={viewingNote}
            open={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}