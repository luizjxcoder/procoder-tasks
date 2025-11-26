import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Eye, LayoutGrid, List } from "lucide-react"
import { TaskManagerSidebar } from "@/components/TaskManagerSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { BriefingForm } from "@/components/BriefingForm"
import { BriefingDetailsModal } from "@/components/BriefingDetailsModal"

interface Briefing {
     id: string
     title: string
     client_name: string
     project_type: string
     target_audience: string | null
     design_inspiration: string | null
     main_objective: string | null
     brand_personality: string | null
     conversion_goals: any[]
     color_palette: any
     typography_primary: string | null
     typography_secondary: string | null
     brand_voice: string | null
     logo_url: string | null
     brand_assets: any[]
     status: string
     created_at: string
     updated_at: string
}

export default function DesignBriefings() {
     const { user } = useAuth()
     const { toast } = useToast()
     const [briefings, setBriefings] = useState<Briefing[]>([])
     const [loading, setLoading] = useState(true)
     const [showCreateDialog, setShowCreateDialog] = useState(false)
     const [showEditDialog, setShowEditDialog] = useState(false)
     const [showDetailsDialog, setShowDetailsDialog] = useState(false)
     const [showDeleteDialog, setShowDeleteDialog] = useState(false)
     const [selectedBriefing, setSelectedBriefing] = useState<Briefing | null>(null)
     const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
     const [formData, setFormData] = useState<Partial<Briefing>>({
          status: 'draft',
          conversion_goals: [],
          color_palette: {},
          brand_assets: []
     })

     useEffect(() => {
          loadBriefings()
     }, [user])

     const loadBriefings = async () => {
          if (!user) return

          try {
               const { data, error } = await supabase
                    .from('design_briefings')
                    .select('*')
                    .order('created_at', { ascending: false })

               if (error) throw error
               setBriefings(data || [])
          } catch (error) {
               console.error('Error loading briefings:', error)
               toast({
                    title: "Erro ao carregar briefings",
                    description: "Não foi possível carregar os briefings",
                    variant: "destructive"
               })
          } finally {
               setLoading(false)
          }
     }

     const handleCreate = async (data: Partial<Briefing>) => {
          if (!user) return

          try {
               const { error } = await supabase
                    .from('design_briefings')
                    .insert([{ ...data, user_id: user.id }])

               if (error) throw error

               toast({
                    title: "Briefing criado",
                    description: "O briefing foi criado com sucesso"
               })

               setShowCreateDialog(false)
               resetForm()
               loadBriefings()
          } catch (error) {
               console.error('Error creating briefing:', error)
               toast({
                    title: "Erro ao criar briefing",
                    description: "Não foi possível criar o briefing",
                    variant: "destructive"
               })
          }
     }

     const handleEdit = (briefing: Briefing) => {
          setSelectedBriefing(briefing)
          setFormData(briefing)
          setShowEditDialog(true)
     }

     const handleUpdate = async (data: Partial<Briefing>) => {
          if (!selectedBriefing) return

          try {
               const { error } = await supabase
                    .from('design_briefings')
                    .update(data)
                    .eq('id', selectedBriefing.id)

               if (error) throw error

               toast({
                    title: "Briefing atualizado",
                    description: "O briefing foi atualizado com sucesso"
               })

               setShowEditDialog(false)
               resetForm()
               loadBriefings()
          } catch (error) {
               console.error('Error updating briefing:', error)
               toast({
                    title: "Erro ao atualizar briefing",
                    description: "Não foi possível atualizar o briefing",
                    variant: "destructive"
               })
          }
     }

     const handleDeleteClick = (briefing: Briefing) => {
          setSelectedBriefing(briefing)
          setShowDeleteDialog(true)
     }

     const handleDeleteConfirm = async () => {
          if (!selectedBriefing) return

          try {
               const { error } = await supabase
                    .from('design_briefings')
                    .delete()
                    .eq('id', selectedBriefing.id)

               if (error) throw error

               toast({
                    title: "Briefing excluído",
                    description: "O briefing foi excluído com sucesso"
               })

               setShowDeleteDialog(false)
               setSelectedBriefing(null)
               loadBriefings()
          } catch (error) {
               console.error('Error deleting briefing:', error)
               toast({
                    title: "Erro ao excluir briefing",
                    description: "Não foi possível excluir o briefing",
                    variant: "destructive"
               })
          }
     }

     const handleViewDetails = (briefing: Briefing) => {
          setSelectedBriefing(briefing)
          setShowDetailsDialog(true)
     }

     const resetForm = () => {
          setFormData({
               status: 'draft',
               conversion_goals: [],
               color_palette: {},
               brand_assets: []
          })
          setSelectedBriefing(null)
     }

     const getStatusColor = (status: string) => {
          const colors: Record<string, string> = {
               draft: 'bg-muted text-muted-foreground',
               in_progress: 'bg-blue-500/10 text-blue-500',
               completed: 'bg-green-500/10 text-green-500',
               approved: 'bg-purple-500/10 text-purple-500'
          }
          return colors[status] || colors.draft
     }

     const getStatusLabel = (status: string) => {
          const labels: Record<string, string> = {
               draft: 'Rascunho',
               in_progress: 'Em Progresso',
               completed: 'Concluído',
               approved: 'Aprovado'
          }
          return labels[status] || status
     }

     return (
          <SidebarProvider>
               <div className="flex min-h-screen w-full bg-background">
                    <TaskManagerSidebar />
                    <main className="flex-1 p-6 overflow-auto">
                         <div className="max-w-7xl mx-auto space-y-6">
                              <div className="flex items-center justify-between">
                                   <div>
                                        <h1 className="text-3xl font-bold text-foreground">Briefings de Design</h1>
                                        <p className="text-muted-foreground mt-1">
                                             Gerencie briefings detalhados e recursos de design
                                        </p>
                                   </div>
                                   <div className="flex gap-4">
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
                                        <Button onClick={() => setShowCreateDialog(true)}>
                                             <Plus className="w-4 h-4 mr-2" />
                                             Novo Briefing
                                        </Button>
                                   </div>
                              </div>

                              {loading ? (
                                   <div className="text-center py-12 text-muted-foreground">
                                        Carregando briefings...
                                   </div>
                              ) : briefings.length === 0 ? (
                                   <Card className="p-12 text-center">
                                        <h3 className="text-lg font-medium text-foreground mb-2">
                                             Nenhum briefing criado
                                        </h3>
                                        <p className="text-muted-foreground mb-6">
                                             Crie seu primeiro briefing de design para começar
                                        </p>
                                        <Button onClick={() => setShowCreateDialog(true)}>
                                             <Plus className="w-4 h-4 mr-2" />
                                             Criar Primeiro Briefing
                                        </Button>
                                   </Card>
                              ) : viewMode === 'cards' ? (
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {briefings.map((briefing) => (
                                             <Card key={briefing.id} className="p-6 hover:shadow-lg transition-shadow">
                                                  <div className="flex items-start justify-between mb-4">
                                                       <div className="flex-1">
                                                            <h3 className="font-semibold text-lg text-foreground mb-1">
                                                                 {briefing.title}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground">
                                                                 {briefing.client_name}
                                                            </p>
                                                       </div>
                                                       <Badge className={getStatusColor(briefing.status)}>
                                                            {getStatusLabel(briefing.status)}
                                                       </Badge>
                                                  </div>

                                                  <div className="space-y-2 mb-4">
                                                       <p className="text-sm">
                                                            <span className="text-muted-foreground">Tipo: </span>
                                                            <span className="text-foreground">{briefing.project_type}</span>
                                                       </p>
                                                       {briefing.target_audience && (
                                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                                 {briefing.target_audience}
                                                            </p>
                                                       )}
                                                  </div>

                                                  <div className="flex gap-2">
                                                       <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleViewDetails(briefing)}
                                                            className="flex-1"
                                                       >
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            Ver
                                                       </Button>
                                                       <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEdit(briefing)}
                                                       >
                                                            <Pencil className="w-4 h-4" />
                                                       </Button>
                                                       <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteClick(briefing)}
                                                       >
                                                            <Trash2 className="w-4 h-4" />
                                                       </Button>
                                                  </div>
                                             </Card>
                                        ))}
                                   </div>
                              ) : (
                                   // List View
                                   <Card className="overflow-hidden">
                                        <div className="divide-y divide-border">
                                             {briefings.map((briefing) => (
                                                  <div
                                                       key={briefing.id}
                                                       className="p-4 hover:bg-muted/50 transition-colors"
                                                  >
                                                       <div className="flex items-center justify-between gap-4">
                                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                                 <Badge className={getStatusColor(briefing.status)}>
                                                                      {getStatusLabel(briefing.status)}
                                                                 </Badge>

                                                                 <div className="flex-1 min-w-0">
                                                                      <h3 className="font-semibold text-base text-foreground mb-1 break-words">
                                                                           {briefing.title}
                                                                      </h3>

                                                                      <p className="text-sm text-muted-foreground mb-2">
                                                                           <span className="font-medium">{briefing.client_name}</span>
                                                                           {' • '}
                                                                           <span>{briefing.project_type}</span>
                                                                      </p>

                                                                      {briefing.target_audience && (
                                                                           <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                                                                                {briefing.target_audience}
                                                                           </p>
                                                                      )}
                                                                 </div>
                                                            </div>

                                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                                 <Button
                                                                      variant="ghost"
                                                                      size="sm"
                                                                      onClick={() => handleViewDetails(briefing)}
                                                                      title="Visualizar detalhes"
                                                                 >
                                                                      <Eye className="w-4 h-4" />
                                                                 </Button>

                                                                 <Button
                                                                      variant="ghost"
                                                                      size="sm"
                                                                      onClick={() => handleEdit(briefing)}
                                                                      title="Editar"
                                                                 >
                                                                      <Pencil className="w-4 h-4" />
                                                                 </Button>

                                                                 <Button
                                                                      variant="ghost"
                                                                      size="sm"
                                                                      onClick={() => handleDeleteClick(briefing)}
                                                                      title="Excluir"
                                                                      className="text-destructive hover:text-destructive"
                                                                 >
                                                                      <Trash2 className="w-4 h-4" />
                                                                 </Button>
                                                            </div>
                                                       </div>
                                                  </div>
                                             ))}
                                        </div>
                                   </Card>
                              )}
                         </div>

                         {/* Create Dialog */}
                         <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                   <DialogHeader>
                                        <DialogTitle>Novo Briefing de Design</DialogTitle>
                                   </DialogHeader>
                                   <BriefingForm
                                        formData={formData}
                                        onFormDataChange={setFormData}
                                        onSubmit={handleCreate}
                                        onCancel={() => {
                                             setShowCreateDialog(false)
                                             resetForm()
                                        }}
                                   />
                              </DialogContent>
                         </Dialog>

                         {/* Edit Dialog */}
                         <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                   <DialogHeader>
                                        <DialogTitle>Editar Briefing</DialogTitle>
                                   </DialogHeader>
                                   <BriefingForm
                                        formData={formData}
                                        onFormDataChange={setFormData}
                                        onSubmit={handleUpdate}
                                        onCancel={() => {
                                             setShowEditDialog(false)
                                             resetForm()
                                        }}
                                        isEdit
                                   />
                              </DialogContent>
                         </Dialog>

                         {/* Details Dialog */}
                         {selectedBriefing && (
                              <BriefingDetailsModal
                                   briefing={selectedBriefing}
                                   open={showDetailsDialog}
                                   onOpenChange={setShowDetailsDialog}
                              />
                         )}

                         {/* Delete Dialog */}
                         <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                              <AlertDialogContent>
                                   <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                        <AlertDialogDescription>
                                             Tem certeza que deseja excluir o briefing "{selectedBriefing?.title}"?
                                             Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                   </AlertDialogHeader>
                                   <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteConfirm}>
                                             Excluir
                                        </AlertDialogAction>
                                   </AlertDialogFooter>
                              </AlertDialogContent>
                         </AlertDialog>
                    </main>
               </div>
          </SidebarProvider>
     )
}
