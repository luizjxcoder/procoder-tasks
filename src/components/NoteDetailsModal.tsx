import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Tag, Star, BookOpen } from "lucide-react"
import { format } from "date-fns"

interface Note {
  id: string
  title: string
  content: string | null
  tags: string[] | null
  is_favorite: boolean
  created_at: string
  updated_at: string
}

interface NoteDetailsModalProps {
  note: Note | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NoteDetailsModal({ note, open, onOpenChange }: NoteDetailsModalProps) {
  if (!note) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl">Detalhes da Nota</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-start gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-card-foreground break-words flex-1">{note.title}</h1>
              {note.is_favorite && (
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 fill-current flex-shrink-0 mt-1" />
              )}
            </div>
          </div>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
              {note.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs sm:text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Content */}
          {note.content && (
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Conteúdo</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                <p className="text-sm sm:text-base text-card-foreground leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/50">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Criada em</p>
                <p className="text-sm sm:text-base font-medium">
                  {format(new Date(note.created_at), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
            </div>

            {note.updated_at !== note.created_at && (
              <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/50">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Última atualização</p>
                  <p className="text-sm sm:text-base font-medium">
                    {format(new Date(note.updated_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}