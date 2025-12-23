import { useState, useEffect, useCallback } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TaskManagerSidebar } from "@/components/TaskManagerSidebar"
import { ProjectForm } from "@/components/ProjectForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Edit, Trash2, Calendar, Users, Flag, DollarSign, Eye, MoreVertical } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ProjectDetailsModal } from "@/components/ProjectDetailsModal"
import { useIsMobile } from "@/hooks/use-mobile"

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

const Projects = () => {
     const [projects, setProjects] = useState<Project[]>([])
     const [loading, setLoading] = useState(true)
     const [isCreateOpen, setIsCreateOpen] = useState(false)
     const [isEditOpen, setIsEditOpen] = useState(false)
     const [isDetailsOpen, setIsDetailsOpen] = useState(false)
     const [isDeleteOpen, setIsDeleteOpen] = useState(false)
     const [viewingProject, setViewingProject] = useState<Project | null>(null)
     const [editingProject, setEditingProject] = useState<Project | null>(null)
     const [deletingProject, setDeletingProject] = useState<Project | null>(null)
     const [formData, setFormData] = useState<{
          title: string
          description: string
          company: string
          status: 'active' | 'completed' | 'on-hold' | 'cancelled'
          priority: 'high' | 'medium' | 'low'
          progress: number
          total_tasks: number
          completed_tasks: number
          due_date: string
          start_date: string
          budget: string
          image_url?: string
     }>({
          title: '',
          description: '',
          company: '',
          status: 'active',
          priority: 'medium',
          progress: 0,
          total_tasks: 0,
          completed_tasks: 0,
          due_date: '',
          start_date: '',
          budget: '',
          image_url: ''
     })
     const { toast } = useToast()
     const isMobile = useIsMobile()

     // Load projects on component mount
     useEffect(() => {
          loadProjects()
     }, [])

     const loadProjects = async () => {
          try {
               const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .order('created_at', { ascending: false })

               if (error) throw error
               setProjects((data || []) as Project[])
          } catch (error) {
               toast({
                    title: "Erro ao carregar projetos",
                    description: "Não foi possível carregar os projetos",
                    variant: "destructive"
               })
          } finally {
               setLoading(false)
          }
     }

     const handleCreate = useCallback(async () => {
          try {
               const { data: { user } } = await supabase.auth.getUser()
               if (!user) {
                    toast({
                         title: "Erro de autenticação",
                         description: "Você precisa estar logado para criar projetos",
                         variant: "destructive"
                    })
                    return
               }

               const { error } = await supabase
                    .from('projects')
                    .insert({
                         ...formData,
                         budget: formData.budget ? parseFloat(formData.budget) : null,
                         due_date: formData.due_date || null,
                         start_date: formData.start_date || null,
                         image_url: formData.image_url || null,
                         user_id: user.id
                    })

               if (error) throw error

               toast({
                    title: "Projeto criado",
                    description: "Projeto criado com sucesso!"
               })

               setIsCreateOpen(false)
               resetForm()
               loadProjects()
          } catch (error) {
               toast({
                    title: "Erro ao criar projeto",
                    description: "Não foi possível criar o projeto",
                    variant: "destructive"
               })
          }
     }, [formData, toast])

     const handleEdit = (project: Project) => {
          setEditingProject(project)
          setFormData({
               title: project.title,
               description: project.description || '',
               company: project.company || '',
               status: project.status,
               priority: project.priority,
               progress: project.progress,
               total_tasks: project.total_tasks,
               completed_tasks: project.completed_tasks,
               due_date: project.due_date || '',
               start_date: project.start_date || '',
               budget: project.budget?.toString() || '',
               image_url: project.image_url || ''
          })
          setIsEditOpen(true)
     }

     const handleViewDetails = (project: Project) => {
          setViewingProject(project)
          setIsDetailsOpen(true)
     }

     const handleUpdate = useCallback(async () => {
          if (!editingProject) return

          try {
               const { error } = await supabase
                    .from('projects')
                    .update({
                         ...formData,
                         budget: formData.budget ? parseFloat(formData.budget) : null,
                         due_date: formData.due_date || null,
                         start_date: formData.start_date || null,
                         image_url: formData.image_url || null
                    })
                    .eq('id', editingProject.id)

               if (error) throw error

               toast({
                    title: "Projeto atualizado",
                    description: "Projeto atualizado com sucesso!"
               })

               setIsEditOpen(false)
               setEditingProject(null)
               resetForm()
               loadProjects()
          } catch (error) {
               toast({
                    title: "Erro ao atualizar projeto",
                    description: "Não foi possível atualizar o projeto",
                    variant: "destructive"
               })
          }
     }, [editingProject, formData, toast])

     const handleDeleteClick = (project: Project) => {
          setDeletingProject(project)
          setIsDeleteOpen(true)
     }

     const handleDeleteConfirm = async () => {
          if (!deletingProject) return

          try {
               const { error } = await supabase
                    .from('projects')
                    .delete()
                    .eq('id', deletingProject.id)

               if (error) throw error

               toast({
                    title: "Projeto excluído",
                    description: "Projeto excluído com sucesso!"
               })

               setIsDeleteOpen(false)
               setDeletingProject(null)
               loadProjects()
          } catch (error) {
               toast({
                    title: "Erro ao excluir projeto",
                    description: "Não foi possível excluir o projeto",
                    variant: "destructive"
               })
          }
     }

     const resetForm = useCallback(() => {
          setFormData({
               title: '',
               description: '',
               company: '',
               status: 'active',
               priority: 'medium',
               progress: 0,
               total_tasks: 0,
               completed_tasks: 0,
               due_date: '',
               start_date: '',
               budget: '',
               image_url: ''
          })
     }, [])

     const getPriorityColor = (priority: string) => {
          switch (priority) {
               case 'high': return 'text-priority-high'
               case 'medium': return 'text-priority-medium'
               case 'low': return 'text-priority-low'
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

     const handleFormDataChange = useCallback((field: string, value: any) => {
          setFormData(prev => ({ ...prev, [field]: value }))
     }, [])

     const handleCreateSubmit = useCallback(() => {
          handleCreate()
     }, [handleCreate])

     const handleUpdateSubmit = useCallback(() => {
          handleUpdate()
     }, [handleUpdate])

     const handleCancel = useCallback((isEdit: boolean) => {
          if (isEdit) {
               setIsEditOpen(false)
               setEditingProject(null)
          } else {
               setIsCreateOpen(false)
          }
          resetForm()
     }, [resetForm])

     // Calculate total budget
     const totalBudget = projects.reduce((sum, project) => {
          return sum + (project.budget || 0)
     }, 0)

     // Mobile Card Component
     const ProjectCard = ({ project }: { project: Project }) => (
          <Card className="border border-border">
               <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                         <div className="flex items-start gap-2 flex-1 min-w-0">
                              {project.image_url && (
                                   <img
                                        src={project.image_url}
                                        alt={project.title}
                                        className="w-[35px] h-[35px] rounded-full object-cover border border-border flex-shrink-0"
                                   />
                              )}
                              <div className="flex-1 min-w-0">
                                   <h3 className="font-semibold text-sm text-card-foreground truncate">
                                        {project.title}
                                   </h3>
                                   {project.company && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                             <Users className="w-3 h-3" />
                                             <span className="truncate">{project.company}</span>
                                        </div>
                                   )}
                              </div>
                         </div>
                         <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                   <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                        <MoreVertical className="w-3.5 h-3.5" />
                                   </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="z-50">
                                   <DropdownMenuItem onClick={() => handleViewDetails(project)}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        Ver detalhes
                                   </DropdownMenuItem>
                                   <DropdownMenuItem onClick={() => handleEdit(project)}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Editar
                                   </DropdownMenuItem>
                                   <DropdownMenuItem
                                        onClick={() => handleDeleteClick(project)}
                                        className="text-destructive focus:text-destructive"
                                   >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Excluir
                                   </DropdownMenuItem>
                              </DropdownMenuContent>
                         </DropdownMenu>
                    </div>

                    <div className="space-y-2">
                         <div className="flex items-center justify-between gap-2">
                              <Badge className={`${getStatusColor(project.status)} text-xs px-2 py-0.5`}>
                                   {project.status === 'active' ? 'Ativo' :
                                        project.status === 'completed' ? 'Concluído' :
                                             project.status === 'on-hold' ? 'Pausado' : 'Cancelado'}
                              </Badge>
                              <div className={`flex items-center gap-1 ${getPriorityColor(project.priority)}`}>
                                   <Flag className="w-3 h-3" />
                                   <span className="text-xs">
                                        {project.priority === 'high' ? 'Alta' :
                                             project.priority === 'medium' ? 'Média' : 'Baixa'}
                                   </span>
                              </div>
                         </div>

                         <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                   <span className="text-muted-foreground">Progresso</span>
                                   <span className="font-medium">{project.progress}%</span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-1.5">
                                   <div
                                        className="bg-primary h-1.5 rounded-full transition-all"
                                        style={{ width: `${project.progress}%` }}
                                   />
                              </div>
                         </div>

                         <div className="flex items-center justify-between text-xs pt-1">
                              <div className="flex items-center gap-1">
                                   <span className="text-muted-foreground">Tarefas:</span>
                                   <span className="font-medium">
                                        {project.completed_tasks}/{project.total_tasks}
                                   </span>
                              </div>
                              {project.due_date && (
                                   <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-muted-foreground" />
                                        <span className="font-medium">
                                             {format(new Date(project.due_date), 'dd/MM/yyyy')}
                                        </span>
                                   </div>
                              )}
                         </div>
                    </div>
               </CardContent>
          </Card>
     )

     return (
          <div className="min-h-screen bg-background">
               <SidebarProvider>
                    <div className="flex w-full">
                         <TaskManagerSidebar />

                         <main className="flex-1 p-3 sm:p-6">
                              {/* Header */}
                              <div className="flex flex-col gap-4 mb-8">
                                   <div className="flex items-center gap-4">
                                        <SidebarTrigger className="lg:hidden h-12 w-12 p-3 [&_svg]:w-6 [&_svg]:h-6" />
                                        <div className="flex-1">
                                             <h1 className="text-3xl font-bold text-foreground">Projetos</h1>
                                             <p className="text-muted-foreground">Gerencie seus projetos</p>
                                        </div>
                                   </div>

                                   <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                        <DialogTrigger asChild>
                                             <Button className="bg-gradient-primary hover:bg-gradient-primary/90 shrink-0">
                                                  <Plus className="w-4 h-4 mr-2" />
                                                  <span className="hidden xs:inline">Novo Projeto</span>
                                                  <span className="xs:hidden">Novo</span>
                                             </Button>
                                        </DialogTrigger>
                                        <DialogContent
                                             className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full"
                                             onPointerDownOutside={(e) => e.preventDefault()}
                                             onInteractOutside={(e) => e.preventDefault()}
                                        >
                                             <DialogHeader>
                                                  <DialogTitle>Criar Novo Projeto</DialogTitle>
                                             </DialogHeader>
                                             <ProjectForm
                                                  formData={formData}
                                                  onFormDataChange={handleFormDataChange}
                                                  onSubmit={handleCreateSubmit}
                                                  onCancel={() => handleCancel(false)}
                                             />
                                        </DialogContent>
                                   </Dialog>
                              </div>

                              {/* Projects List */}
                              <Card className="bg-gradient-card border border-border shadow-card">
                                   <CardHeader>
                                        <div className="flex items-center justify-between gap-2">
                                             <CardTitle className="flex items-center gap-2">
                                                  <span>Lista de Projetos</span>
                                                  <Badge variant="secondary">{projects.length}</Badge>
                                             </CardTitle>
                                             <div className="text-sm font-normal text-muted-foreground">
                                                  TOTAL: <span className="font-bold text-foreground">R$ {totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                             </div>
                                        </div>
                                   </CardHeader>
                                   <CardContent>
                                        {loading ? (
                                             <div className="flex items-center justify-center py-8">
                                                  <div className="text-muted-foreground">Carregando projetos...</div>
                                             </div>
                                        ) : projects.length === 0 ? (
                                             <div className="flex flex-col items-center justify-center py-12 text-center">
                                                  <div className="mb-4 text-muted-foreground">
                                                       Nenhum projeto encontrado
                                                  </div>
                                                  <Button
                                                       onClick={() => setIsCreateOpen(true)}
                                                       variant="outline"
                                                  >
                                                       <Plus className="w-4 h-4 mr-2" />
                                                       Criar Primeiro Projeto
                                                  </Button>
                                             </div>
                                        ) : isMobile ? (
                                             // Mobile Card View - responsive grid that compresses
                                             <div className="grid grid-cols-1 gap-4">
                                                  {projects.map((project) => (
                                                       <ProjectCard key={project.id} project={project} />
                                                  ))}
                                             </div>
                                        ) : (
                                             // Desktop Table View
                                             <div className="overflow-x-auto">
                                                  <Table>
                                                       <TableHeader>
                                                            <TableRow>
                                                                 <TableHead>Projeto</TableHead>
                                                                 <TableHead>Empresa</TableHead>
                                                                 <TableHead>Status</TableHead>
                                                                 <TableHead>Prioridade</TableHead>
                                                                 <TableHead>Progresso</TableHead>
                                                                 <TableHead>Tarefas</TableHead>
                                                                 <TableHead>Entrega</TableHead>
                                                                 <TableHead>Orçamento</TableHead>
                                                                 <TableHead className="text-right">Ações</TableHead>
                                                            </TableRow>
                                                       </TableHeader>
                                                       <TableBody>
                                                            {projects.map((project) => (
                                                                 <TableRow key={project.id}>
                                                                      <TableCell>
                                                                           <div className="flex items-center gap-3">
                                                                                {project.image_url && (
                                                                                     <img
                                                                                          src={project.image_url}
                                                                                          alt={project.title}
                                                                                          className="w-[35px] h-[35px] rounded-full object-cover border border-border flex-shrink-0"
                                                                                     />
                                                                                )}
                                                                                <div>
                                                                                     <div className="font-medium text-card-foreground">{project.title}</div>
                                                                                     {project.description && (
                                                                                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                                                                                               {project.description}
                                                                                          </div>
                                                                                     )}
                                                                                </div>
                                                                           </div>
                                                                      </TableCell>
                                                                      <TableCell>
                                                                           <div className="flex items-center gap-2">
                                                                                <Users className="w-4 h-4 text-muted-foreground" />
                                                                                {project.company || '-'}
                                                                           </div>
                                                                      </TableCell>
                                                                      <TableCell>
                                                                           <Badge className={getStatusColor(project.status)}>
                                                                                {project.status === 'active' ? 'Ativo' :
                                                                                     project.status === 'completed' ? 'Concluído' :
                                                                                          project.status === 'on-hold' ? 'Pausado' : 'Cancelado'}
                                                                           </Badge>
                                                                      </TableCell>
                                                                      <TableCell>
                                                                           <div className={`flex items-center gap-1 ${getPriorityColor(project.priority)}`}>
                                                                                <Flag className="w-3 h-3" />
                                                                                {project.priority === 'high' ? 'Alta' :
                                                                                     project.priority === 'medium' ? 'Média' : 'Baixa'}
                                                                           </div>
                                                                      </TableCell>
                                                                      <TableCell>
                                                                           <div className="flex items-center gap-2">
                                                                                <div className="w-20 bg-secondary rounded-full h-2">
                                                                                     <div
                                                                                          className="bg-primary h-2 rounded-full transition-all"
                                                                                          style={{ width: `${project.progress}%` }}
                                                                                     />
                                                                                </div>
                                                                                <span className="text-sm">{project.progress}%</span>
                                                                           </div>
                                                                      </TableCell>
                                                                      <TableCell>
                                                                           <span className="text-sm">
                                                                                {project.completed_tasks}/{project.total_tasks}
                                                                           </span>
                                                                      </TableCell>
                                                                      <TableCell>
                                                                           <div className="flex items-center gap-1 text-sm">
                                                                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                                                                {project.due_date ? format(new Date(project.due_date), 'dd/MM/yyyy') : '-'}
                                                                           </div>
                                                                      </TableCell>
                                                                      <TableCell>
                                                                           <div className="flex items-center gap-1 text-sm">
                                                                                <DollarSign className="w-3 h-3 text-muted-foreground" />
                                                                                {project.budget ? `R$ ${project.budget.toLocaleString('pt-BR')}` : '-'}
                                                                           </div>
                                                                      </TableCell>
                                                                      <TableCell className="text-right">
                                                                           <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                                                <Button
                                                                                     size="sm"
                                                                                     variant="ghost"
                                                                                     onClick={() => handleViewDetails(project)}
                                                                                     title="Visualizar detalhes"
                                                                                >
                                                                                     <Eye className="w-4 h-4" />
                                                                                </Button>
                                                                                <Button
                                                                                     size="sm"
                                                                                     variant="ghost"
                                                                                     onClick={() => handleEdit(project)}
                                                                                >
                                                                                     <Edit className="w-4 h-4" />
                                                                                </Button>
                                                                                <Button
                                                                                     size="sm"
                                                                                     variant="ghost"
                                                                                     className="text-destructive hover:text-destructive"
                                                                                     onClick={() => handleDeleteClick(project)}
                                                                                >
                                                                                     <Trash2 className="w-4 h-4" />
                                                                                </Button>
                                                                           </div>
                                                                      </TableCell>
                                                                 </TableRow>
                                                            ))}
                                                       </TableBody>
                                                  </Table>
                                             </div>
                                        )}
                                   </CardContent>
                              </Card>

                              {/* Details Modal */}
                              <ProjectDetailsModal
                                   project={viewingProject}
                                   open={isDetailsOpen}
                                   onOpenChange={setIsDetailsOpen}
                              />

                              {/* Edit Dialog */}
                              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                                   <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                                        <DialogHeader>
                                             <DialogTitle>Editar Projeto</DialogTitle>
                                        </DialogHeader>
                                        <ProjectForm
                                             formData={formData}
                                             onFormDataChange={handleFormDataChange}
                                             onSubmit={handleUpdateSubmit}
                                             onCancel={() => handleCancel(true)}
                                             isEdit
                                        />
                                   </DialogContent>
                              </Dialog>

                              {/* Delete Confirmation Dialog */}
                              <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                                   <AlertDialogContent className="max-w-md">
                                        <AlertDialogHeader>
                                             <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                                  <Trash2 className="w-5 h-5" />
                                                  Excluir Projeto
                                             </AlertDialogTitle>
                                             <AlertDialogDescription className="text-base pt-2">
                                                  Tem certeza que deseja excluir o projeto{" "}
                                                  <span className="font-semibold text-foreground">
                                                       "{deletingProject?.title}"
                                                  </span>
                                                  ?
                                                  <br />
                                                  <br />
                                                  Esta ação não pode ser desfeita e todos os dados relacionados serão permanentemente removidos.
                                             </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                             <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                             <AlertDialogAction
                                                  onClick={handleDeleteConfirm}
                                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                             >
                                                  Excluir Projeto
                                             </AlertDialogAction>
                                        </AlertDialogFooter>
                                   </AlertDialogContent>
                              </AlertDialog>
                         </main>
                    </div>
               </SidebarProvider>
          </div>
     )
}

export default Projects