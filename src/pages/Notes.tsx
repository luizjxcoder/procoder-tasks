import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { TaskManagerSidebar } from "@/components/TaskManagerSidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Plus, BookOpen, Star, StarOff, Edit, Trash2, Search, Tag, Eye, LayoutGrid, List, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
     const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
     const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
     const [noteToDelete, setNoteToDelete] = useState<string | null>(null)

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

     const handleDeleteNote = async () => {
          if (!noteToDelete) return

          try {
               const { error } = await supabase
                    .from('notes')
                    .delete()
                    .eq('id', noteToDelete)
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
          } finally {
               setDeleteDialogOpen(false)
               setNoteToDelete(null)
          }
     }

     const openDeleteDialog = (noteId: string) => {
          setNoteToDelete(noteId)
          setDeleteDialogOpen(true)
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
                                   <SidebarTrigger className="lg:hidden h-12 w-12 p-3 [&_svg]:w-6 [&_svg]:h-6" />
                                   <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                                   <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground">Notas e Ideias</h2>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                                   {/* View Mode Toggle */}
                                   <div className="flex rounded-lg border border-border p-1">
                                        <Button
                                             variant={viewMode === 'cards' ? 'default' : 'ghost'}
                                             size="sm"
                                             onClick={() => setViewMode('cards')}
                                             className="h-8"
                                        >
                                             <LayoutGrid className="w-4 h-4 mr-2" />
                                             Cards
                                        </Button>
                                        <Button
                                             variant={viewMode === 'list' ? 'default' : 'ghost'}
                                             size="sm"
                                             onClick={() => setViewMode('list')}
                                             className="h-8"
                                        >
                                             <List className="w-4 h-4 mr-2" />
                                             Lista
                                        </Button>
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

                         {/* Notes Display */}
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

                         ) : viewMode === 'cards' ? (
                              // Cards Notas e Ideias View
                              <div className="grid gap-2.5 sm:gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                   {filteredNotes.map((note) => (
                                        <Card
                                             key={note.id}
                                            className="
                    relative flex flex-col overflow-hidden
                    rounded-xl
                    bg-card dark:bg-[#1C1E24]
                    border border-border dark:border-white/10
                    before:content-[''] before:absolute before:inset-0 before:rounded-[inherit]
                    before:pointer-events-none
                    before:transition-all before:duration-200 before:ease-[cubic-bezier(0.4,0,0.2,1)]
                    dark:before:shadow-[inset_0_0_55px_22px_rgba(0,0,0,0.45),inset_0_0_110px_55px_rgba(0,0,0,0.32)]
                    dark:before:opacity-65
                    hover:scale-[1.015]
                    hover:border-primary
                    hover:shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.15),inset_20px_20px_30px_-25px_rgba(var(--primary-rgb),0.2),inset_-20px_-20px_30px_-25px_rgba(var(--primary-rgb),0.2),inset_20px_-20px_30px_-25px_rgba(var(--primary-rgb),0.2),inset_-20px_20px_30px_-25px_rgba(var(--primary-rgb),0.2)]
                    dark:hover:shadow-[0_0_35px_15px_rgba(0,0,0,0.55),inset_0_0_20px_rgba(var(--primary-rgb),0.15),inset_20px_20px_30px_-25px_rgba(var(--primary-rgb),0.2),inset_-20px_-20px_30px_-25px_rgba(var(--primary-rgb),0.2),inset_20px_-20px_30px_-25px_rgba(var(--primary-rgb),0.2),inset_-20px_20px_30px_-25px_rgba(var(--primary-rgb),0.2)]
                    dark:hover:before:opacity-85
                    dark:hover:before:shadow-[inset_0_0_75px_30px_rgba(0,0,0,0.55),inset_0_0_150px_75px_rgba(0,0,0,0.40)]
                    transition-all duration-300
  ">

                                             <CardHeader className="pb-2 px-2.5 sm:px-4 md:px-6 pt-2.5 sm:pt-4 md:pt-6">
                                                  <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                                                       <CardTitle className="text-sm sm:text-base md:text-lg line-clamp-2 flex-1 break-words pr-1">{note.title}</CardTitle>
                                                       <div className="flex gap-0 sm:gap-0.5 flex-shrink-0">
                                                            {/* Mobile: 3-dot menu */}
                                                            <div className="sm:hidden flex items-center gap-0.5">
                                                                 <Button
                                                                      variant="ghost"
                                                                      size="sm"
                                                                      onClick={() => toggleFavorite(note)}
                                                                      title={note.is_favorite ? "Remover favorito" : "Adicionar favorito"}
                                                                      className="h-6 w-6 p-0"
                                                                 >
                                                                      {note.is_favorite ? (
                                                                           <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                                      ) : (
                                                                           <StarOff className="w-3 h-3 text-muted-foreground" />
                                                                      )}
                                                                 </Button>
                                                                 <DropdownMenu>
                                                                      <DropdownMenuTrigger asChild>
                                                                           <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                                                <MoreVertical className="w-3.5 h-3.5" />
                                                                           </Button>
                                                                      </DropdownMenuTrigger>
                                                                      <DropdownMenuContent align="end" className="bg-popover z-50">
                                                                           <DropdownMenuItem onClick={() => handleViewDetails(note)}>
                                                                                <Eye className="w-4 h-4 mr-2" />
                                                                                Visualizar
                                                                           </DropdownMenuItem>
                                                                           <DropdownMenuItem onClick={() => openEditDialog(note)}>
                                                                                <Edit className="w-4 h-4 mr-2" />
                                                                                Editar
                                                                           </DropdownMenuItem>
                                                                           <DropdownMenuItem onClick={() => openDeleteDialog(note.id)} className="text-destructive focus:text-destructive">
                                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                                Excluir
                                                                           </DropdownMenuItem>
                                                                      </DropdownMenuContent>
                                                                 </DropdownMenu>
                                                            </div>

                                                            {/* Desktop: individual icons */}
                                                            <div className="hidden sm:flex gap-0.5">
                                                                 <Button
                                                                      variant="ghost"
                                                                      size="sm"
                                                                      onClick={() => handleViewDetails(note)}
                                                                      title="Visualizar"
                                                                      className="h-7 w-7 p-0"
                                                                 >
                                                                      <Eye className="w-3.5 h-3.5" />
                                                                 </Button>
                                                                 <Button
                                                                      variant="ghost"
                                                                      size="sm"
                                                                      onClick={() => toggleFavorite(note)}
                                                                      title={note.is_favorite ? "Remover favorito" : "Adicionar favorito"}
                                                                      className="h-7 w-7 p-0"
                                                                 >
                                                                      {note.is_favorite ? (
                                                                           <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                                                                      ) : (
                                                                           <StarOff className="w-3.5 h-3.5 text-muted-foreground" />
                                                                      )}
                                                                 </Button>
                                                                 <Button
                                                                      variant="ghost"
                                                                      size="sm"
                                                                      onClick={() => openEditDialog(note)}
                                                                      title="Editar"
                                                                      className="h-7 w-7 p-0"
                                                                 >
                                                                      <Edit className="w-3.5 h-3.5" />
                                                                 </Button>
                                                                 <Button
                                                                      variant="ghost"
                                                                      size="sm"
                                                                      onClick={() => openDeleteDialog(note.id)}
                                                                      title="Excluir"
                                                                      className="h-7 w-7 p-0"
                                                                 >
                                                                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                                                 </Button>
                                                            </div>
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
                         ) : (
                              // List View
                              <Card className="overflow-hidden">
                                   <div className="divide-y divide-border">
                                        {filteredNotes.map((note) => (
                                             <div
                                                  key={note.id}
                                                  className="p-3 sm:p-4 hover:bg-muted/50 transition-colors"
                                             >
                                                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                                                       {/* Desktop: favorite icon on left */}
                                                       <div className="hidden sm:block">
                                                            <Button
                                                                 variant="ghost"
                                                                 size="sm"
                                                                 onClick={() => toggleFavorite(note)}
                                                                 title={note.is_favorite ? "Remover favorito" : "Adicionar favorito"}
                                                                 className="flex-shrink-0 h-8 w-8 p-0"
                                                            >
                                                                 {note.is_favorite ? (
                                                                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                                 ) : (
                                                                      <StarOff className="w-4 h-4 text-muted-foreground" />
                                                                 )}
                                                            </Button>

                                                       </div>

                                                       <div className="flex-1 min-w-0">
                                                            {/* Mobile: truncated to 35 chars */}
                                                            <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1">
                                                                 <span className="sm:hidden">
                                                                      {note.title.length > 35 ? `${note.title.substring(0, 35)}...` : note.title}
                                                                 </span>
                                                                 <span className="hidden sm:inline">
                                                                      {note.title.length > 85 ? `${note.title.substring(0, 85)}...` : note.title}
                                                                 </span>
                                                            </h3>

                                                            {note.content && (
                                                                 <p className="text-muted-foreground text-xs sm:text-sm mb-2">
                                                                      <span className="sm:hidden">
                                                                           {note.content.length > 35 ? `${note.content.substring(0, 35)}...` : note.content}
                                                                      </span>
                                                                      <span className="hidden sm:inline">
                                                                           {note.content.length > 85 ? `${note.content.substring(0, 85)}...` : note.content}
                                                                      </span>
                                                                 </p>
                                                            )}
                                                            <div className="hidden sm:flex flex-wrap items-center gap-2">
                                                                 {note.tags && note.tags.length > 0 && (
                                                                      <div className="flex flex-wrap gap-1">
                                                                           {note.tags.slice(0, 3).map((tag) => (
                                                                                <Badge key={tag} variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0">
                                                                                     {tag}
                                                                                </Badge>
                                                                           ))}
                                                                           {note.tags.length > 3 && (
                                                                                <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0">
                                                                                     +{note.tags.length - 3}
                                                                                </Badge>
                                                                           )}
                                                                      </div>
                                                                 )}

                                                                 <span className="text-[10px] sm:text-xs text-muted-foreground">
                                                                      {new Date(note.updated_at).toLocaleDateString('pt-BR', {
                                                                           day: '2-digit',
                                                                           month: '2-digit',
                                                                           year: '2-digit',
                                                                           hour: '2-digit',
                                                                           minute: '2-digit'
                                                                      })}
                                                                 </span>
                                                            </div>
                                                       </div>

                                                       {/* Mobile: favorite icon on right + 3-dot menu */}
                                                       <div className="flex items-center gap-1 sm:hidden flex-shrink-0">
                                                            <Button
                                                                 variant="ghost"
                                                                 size="sm"
                                                                 onClick={() => toggleFavorite(note)}
                                                                 title={note.is_favorite ? "Remover favorito" : "Adicionar favorito"}
                                                                 className="h-8 w-8 p-0"
                                                            >
                                                                 {note.is_favorite ? (
                                                                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                                 ) : (
                                                                      <StarOff className="w-4 h-4 text-muted-foreground" />
                                                                 )}
                                                            </Button>
                                                       </div>

                                                       <div className="flex items-center gap-1 flex-shrink-0">
                                                            {/* Mobile: 3-dot menu */}
                                                            <div className="sm:hidden">
                                                                 <DropdownMenu>
                                                                      <DropdownMenuTrigger asChild>
                                                                           <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                                <MoreVertical className="w-4 h-4" />
                                                                           </Button>
                                                                      </DropdownMenuTrigger>
                                                                      <DropdownMenuContent align="end" className="bg-popover z-50">
                                                                           <DropdownMenuItem onClick={() => handleViewDetails(note)}>
                                                                                <Eye className="w-4 h-4 mr-2" />
                                                                                Visualizar
                                                                           </DropdownMenuItem>
                                                                           <DropdownMenuItem onClick={() => openEditDialog(note)}>
                                                                                <Edit className="w-4 h-4 mr-2" />
                                                                                Editar
                                                                           </DropdownMenuItem>
                                                                           <DropdownMenuItem onClick={() => openDeleteDialog(note.id)} className="text-destructive focus:text-destructive">
                                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                                Excluir
                                                                           </DropdownMenuItem>
                                                                      </DropdownMenuContent>
                                                                 </DropdownMenu>
                                                            </div>

                                                            {/* Desktop: individual icons */}
                                                            <div className="hidden sm:flex items-center gap-1">
                                                                 <Button
                                                                      variant="ghost"
                                                                      size="sm"
                                                                      onClick={() => handleViewDetails(note)}
                                                                      title="Visualizar detalhes"
                                                                 >
                                                                      <Eye className="w-4 h-4" />
                                                                 </Button>

                                                                 <Button
                                                                      variant="ghost"
                                                                      size="sm"
                                                                      onClick={() => openEditDialog(note)}
                                                                      title="Editar"
                                                                 >
                                                                      <Edit className="w-4 h-4" />
                                                                 </Button>

                                                                 <Button
                                                                      variant="ghost"
                                                                      size="sm"
                                                                      onClick={() => openDeleteDialog(note.id)}
                                                                      title="Excluir"
                                                                      className="text-destructive hover:text-destructive"
                                                                 >
                                                                      <Trash2 className="w-4 h-4" />
                                                                 </Button>
                                                            </div>
                                                       </div>
                                                  </div>
                                             </div>
                                        ))}
                                   </div>
                              </Card>
                         )}

                         {/* Details Modal */}
                         <NoteDetailsModal
                              note={viewingNote}
                              open={isDetailsOpen}
                              onOpenChange={setIsDetailsOpen}
                         />

                         {/* Delete Confirmation Dialog */}
                         <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                              <AlertDialogContent>
                                   <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                        <AlertDialogDescription>
                                             Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                   </AlertDialogHeader>
                                   <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => setNoteToDelete(null)}>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                             Excluir
                                        </AlertDialogAction>
                                   </AlertDialogFooter>
                              </AlertDialogContent>
                         </AlertDialog>
                    </div>
               </SidebarInset>
          </SidebarProvider>
     )
}