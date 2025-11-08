import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { uploadCompressedImage } from "@/utils/imageUtils"
import { Upload, X, Image as ImageIcon } from "lucide-react"

interface ProjectFormData {
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
}

interface ProjectFormProps {
     formData: ProjectFormData
     onFormDataChange: (field: string, value: any) => void
     onSubmit: () => void
     onCancel: () => void
     isEdit?: boolean
}

export const ProjectForm = ({ formData, onFormDataChange, onSubmit, onCancel, isEdit = false }: ProjectFormProps) => {
     const { toast } = useToast()
     const [uploadingImage, setUploadingImage] = useState(false)
     const [previewImage, setPreviewImage] = useState<string | null>(formData.image_url || null)

     const handleInputChange = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          onFormDataChange(field, e.target.value)
     }, [onFormDataChange])

     const handleNumberChange = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
          onFormDataChange(field, field === 'progress' || field === 'total_tasks' || field === 'completed_tasks' ? parseInt(e.target.value) || 0 : e.target.value)
     }, [onFormDataChange])

     const handleSelectChange = useCallback((field: string) => (value: any) => {
          onFormDataChange(field, value)
     }, [onFormDataChange])

     const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0]
          if (!file) return

          try {
               setUploadingImage(true)

               // Verificar se o usuário está autenticado PRIMEIRO
               const { data: { user }, error: authError } = await supabase.auth.getUser()
               if (authError || !user) {
                    console.error('Erro de autenticação:', authError)
                    toast({
                         title: "Autenticação necessária",
                         description: "Você precisa estar logado para fazer upload de imagens. Faça login primeiro.",
                         variant: "destructive"
                    })
                    return
               }

               console.log('Usuário autenticado:', user.id)

               // Verificações básicas antes de processar
               if (file.size > 10 * 1024 * 1024) {
                    toast({
                         title: "Arquivo muito grande",
                         description: "Por favor, selecione uma imagem com menos de 10MB",
                         variant: "destructive"
                    })
                    return
               }

               if (!file.type.startsWith('image/')) {
                    toast({
                         title: "Formato inválido",
                         description: "Por favor, selecione apenas arquivos de imagem (PNG, JPG, GIF, WebP)",
                         variant: "destructive"
                    })
                    return
               }

               // Criar nome único e limpo para o arquivo
               const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
               const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50)
               const fileName = `${user.id}/${Date.now()}-${cleanFileName}.${fileExtension}`

               console.log('Iniciando upload da imagem:', fileName)

               // Upload da imagem comprimida usando a função utilitária
               const imageUrl = await uploadCompressedImage(file, 'project-images', fileName, supabase)

               if (!imageUrl) {
                    throw new Error('Falha ao obter URL da imagem após upload')
               }

               // Atualizar form data com a URL da imagem
               onFormDataChange('image_url', imageUrl)
               setPreviewImage(imageUrl)

               toast({
                    title: "Imagem carregada",
                    description: "Imagem foi comprimida e carregada com sucesso!"
               })
          } catch (error: any) {
               console.error('Erro detalhado no upload:', error)

               // Tratamento de erros específicos
               let errorMessage = "Não foi possível carregar a imagem. Tente novamente."

               if (error.message?.includes('row-level security')) {
                    errorMessage = "Erro de permissão. Verifique se você está logado corretamente."
               } else if (error.message?.includes('bucket')) {
                    errorMessage = "Configuração de armazenamento inválida. Entre em contato com o suporte."
               } else if (error.message?.includes('network')) {
                    errorMessage = "Erro de conexão. Verifique sua internet e tente novamente."
               } else if (error.message) {
                    errorMessage = error.message
               }

               toast({
                    title: "Erro no upload",
                    description: errorMessage,
                    variant: "destructive"
               })
          } finally {
               setUploadingImage(false)
               // Limpar o input para permitir reselecionar o mesmo arquivo
               if (event.target) {
                    event.target.value = ''
               }
          }
     }

     const removeImage = async () => {
          if (formData.image_url) {
               try {
                    // Extrair o path completo da URL
                    const url = new URL(formData.image_url)
                    const pathParts = url.pathname.split('/')
                    const objectIndex = pathParts.findIndex(part => part === 'object')

                    if (objectIndex !== -1 && objectIndex < pathParts.length - 2) {
                         // Reconstruir o path correto: bucket/path
                         const bucketName = pathParts[objectIndex + 1]
                         const filePath = pathParts.slice(objectIndex + 2).join('/')

                         console.log('Removendo arquivo:', filePath, 'do bucket:', bucketName)

                         // Remover do storage
                         const { error } = await supabase.storage
                              .from('project-images')
                              .remove([filePath])

                         if (error) {
                              console.error('Erro ao remover arquivo:', error)
                         } else {
                              console.log('Arquivo removido com sucesso')
                         }
                    }
               } catch (error) {
                    console.error('Erro ao remover imagem:', error)
               }
          }

          onFormDataChange('image_url', '')
          setPreviewImage(null)

          toast({
               title: "Imagem removida",
               description: "A imagem foi removida do projeto"
          })
     }

     return (
          <div className="space-y-4">
               {/* Upload de Imagem */}
               <div>
                    <Label htmlFor="image">Imagem do Projeto</Label>
                    {previewImage ? (
                         <div className="mt-2 relative">
                              <img
                                   src={previewImage}
                                   alt="Preview"
                                   className="w-full h-40 sm:h-48 object-cover rounded-lg border"
                              />
                              <Button
                                   type="button"
                                   variant="destructive"
                                   size="sm"
                                   className="absolute top-2 right-2"
                                   onClick={removeImage}
                              >
                                   <X className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                         </div>
                    ) : (
                         <div className="mt-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-6">
                              <div className="text-center">
                                   <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-2 sm:mb-4" />
                                   <div className="space-y-1 sm:space-y-2">
                                        <p className="text-xs sm:text-sm text-muted-foreground">
                                             Clique para carregar uma imagem do projeto
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                             PNG, JPG até 10MB (será comprimida automaticamente)
                                        </p>
                                   </div>
                                   <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                        className="mt-3 sm:mt-4 cursor-pointer text-xs sm:text-sm"
                                   />
                                   {uploadingImage && (
                                        <div className="mt-2 flex items-center justify-center gap-2">
                                             <Upload className="w-4 h-4 animate-spin" />
                                             <span className="text-xs sm:text-sm">Carregando e comprimindo...</span>
                                        </div>
                                   )}
                              </div>
                         </div>
                    )}
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                         <Label htmlFor="title">Título *</Label>
                         <Input
                              id="title"
                              value={formData.title}
                              onChange={handleInputChange('title')}
                              placeholder="Nome do projeto"
                              required
                         />
                    </div>
                    <div>
                         <Label htmlFor="company">Empresa</Label>
                         <Input
                              id="company"
                              value={formData.company}
                              onChange={handleInputChange('company')}
                              placeholder="Nome da empresa"
                         />
                    </div>
               </div>

               <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                         id="description"
                         value={formData.description}
                         onChange={handleInputChange('description')}
                         placeholder="Descrição do projeto"
                         rows={3}
                    />
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                         <Label htmlFor="status">Status</Label>
                         <Select value={formData.status} onValueChange={handleSelectChange('status')}>
                              <SelectTrigger>
                                   <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                   <SelectItem value="active">Ativo</SelectItem>
                                   <SelectItem value="completed">Concluído</SelectItem>
                                   <SelectItem value="on-hold">Pausado</SelectItem>
                                   <SelectItem value="cancelled">Cancelado</SelectItem>
                              </SelectContent>
                         </Select>
                    </div>
                    <div>
                         <Label htmlFor="priority">Prioridade</Label>
                         <Select value={formData.priority} onValueChange={handleSelectChange('priority')}>
                              <SelectTrigger>
                                   <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                   <SelectItem value="high">Alta</SelectItem>
                                   <SelectItem value="medium">Média</SelectItem>
                                   <SelectItem value="low">Baixa</SelectItem>
                              </SelectContent>
                         </Select>
                    </div>
                    <div className="sm:col-span-2">
                         <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                   <Label htmlFor="progress">Progresso</Label>
                                   <span className="text-sm font-medium">{formData.progress}%</span>
                              </div>
                              <Slider
                                   id="progress"
                                   min={0}
                                   max={100}
                                   step={1}
                                   value={[formData.progress]}
                                   onValueChange={(value) => onFormDataChange('progress', value[0])}
                                   className="w-full"
                              />
                         </div>
                    </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                         <Label htmlFor="total_tasks">Total de Tarefas</Label>
                         <Input
                              id="total_tasks"
                              type="number"
                              min="0"
                              value={formData.total_tasks}
                              onChange={handleNumberChange('total_tasks')}
                         />
                    </div>
                    <div>
                         <Label htmlFor="completed_tasks">Tarefas Concluídas</Label>
                         <Input
                              id="completed_tasks"
                              type="number"
                              min="0"
                              value={formData.completed_tasks}
                              onChange={handleNumberChange('completed_tasks')}
                         />
                    </div>
                    <div>
                         <Label htmlFor="budget">Orçamento</Label>
                         <Input
                              id="budget"
                              type="number"
                              step="0.01"
                              value={formData.budget}
                              onChange={handleInputChange('budget')}
                              placeholder="0.00"
                         />
                    </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                         <Label htmlFor="start_date">Data de Início</Label>
                         <Input
                              id="start_date"
                              type="date"
                              value={formData.start_date}
                              onChange={handleInputChange('start_date')}
                         />
                    </div>
                    <div>
                         <Label htmlFor="due_date">Data de Entrega</Label>
                         <Input
                              id="due_date"
                              type="date"
                              value={formData.due_date}
                              onChange={handleInputChange('due_date')}
                         />
                    </div>
               </div>

               <div className="flex flex-col sm:flex-row justify-end gap-2">
                    <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                         Cancelar
                    </Button>
                    <Button onClick={onSubmit} className="w-full sm:w-auto">
                         {isEdit ? 'Atualizar' : 'Criar'} Projeto
                    </Button>
               </div>
          </div>
     )
}