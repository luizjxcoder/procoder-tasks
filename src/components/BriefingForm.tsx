import { useState } from "react"
import { Upload, X, Plus, Trash2, FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { compressImage } from "@/utils/imageUtils"

interface BriefingFormData {
     title?: string
     client_name?: string
     project_type?: string
     target_audience?: string
     design_inspiration?: string
     main_objective?: string
     brand_personality?: string
     conversion_goals?: any[]
     color_palette?: any
     typography_primary?: string
     typography_secondary?: string
     brand_voice?: string
     logo_url?: string
     brand_assets?: any[]
     status?: string
}

interface BriefingFormProps {
     formData: BriefingFormData
     onFormDataChange: (data: BriefingFormData) => void
     onSubmit: (data: BriefingFormData) => void
     onCancel: () => void
     isEdit?: boolean
}

export function BriefingForm({
     formData,
     onFormDataChange,
     onSubmit,
     onCancel,
     isEdit = false
}: BriefingFormProps) {
     const { user } = useAuth()
     const { toast } = useToast()
     const [uploading, setUploading] = useState(false)
     const [newGoal, setNewGoal] = useState({ description: '', metric: '', target: '' })
     const [newColor, setNewColor] = useState({ name: '', hex: '' })

     const handleInputChange = (field: keyof BriefingFormData, value: any) => {
          onFormDataChange({ ...formData, [field]: value })
     }

     const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0]
          if (!file || !user) return

          if (!file.type.startsWith('image/')) {
               toast({
                    title: "Arquivo inválido",
                    description: "Por favor, selecione uma imagem",
                    variant: "destructive"
               })
               return
          }

          if (file.size > 5 * 1024 * 1024) {
               toast({
                    title: "Arquivo muito grande",
                    description: "A imagem deve ter no máximo 5MB",
                    variant: "destructive"
               })
               return
          }

          setUploading(true)

          try {
               const compressedFile = await compressImage(file)
               const fileExt = file.name.split('.').pop()
               const fileName = `${user.id}/${Date.now()}.${fileExt}`

               const { error: uploadError } = await supabase.storage
                    .from('design-assets')
                    .upload(fileName, compressedFile)

               if (uploadError) throw uploadError

               const { data: { publicUrl } } = supabase.storage
                    .from('design-assets')
                    .getPublicUrl(fileName)

               handleInputChange('logo_url', publicUrl)

               toast({
                    title: "Logo enviado",
                    description: "O logo foi enviado com sucesso"
               })
          } catch (error) {
               console.error('Error uploading logo:', error)
               toast({
                    title: "Erro ao enviar logo",
                    description: "Não foi possível enviar o logo",
                    variant: "destructive"
               })
          } finally {
               setUploading(false)
          }
     }

     const removeLogo = async () => {
          if (!formData.logo_url) return

          try {
               const fileName = formData.logo_url.split('/').pop()
               if (fileName) {
                    await supabase.storage
                         .from('design-assets')
                         .remove([`${user?.id}/${fileName}`])
               }

               handleInputChange('logo_url', null)
               toast({
                    title: "Logo removido",
                    description: "O logo foi removido com sucesso"
               })
          } catch (error) {
               console.error('Error removing logo:', error)
          }
     }

     const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
          const files = e.target.files
          if (!files || files.length === 0 || !user) return

          setUploading(true)

          try {
               const uploadedDocs = []

               for (let i = 0; i < files.length; i++) {
                    const file = files[i]

                    if (file.size > 10 * 1024 * 1024) {
                         toast({
                              title: "Arquivo muito grande",
                              description: `${file.name} deve ter no máximo 10MB`,
                              variant: "destructive"
                         })
                         continue
                    }

                    const fileExt = file.name.split('.').pop()
                    const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`

                    const { error: uploadError } = await supabase.storage
                         .from('design-assets')
                         .upload(fileName, file)

                    if (uploadError) throw uploadError

                    const { data: { publicUrl } } = supabase.storage
                         .from('design-assets')
                         .getPublicUrl(fileName)

                    uploadedDocs.push({
                         id: Date.now() + i,
                         name: file.name,
                         url: publicUrl,
                         type: file.type,
                         size: file.size
                    })
               }

               const currentAssets = formData.brand_assets || []
               handleInputChange('brand_assets', [...currentAssets, ...uploadedDocs])

               toast({
                    title: "Documentos enviados",
                    description: `${uploadedDocs.length} documento(s) enviado(s) com sucesso`
               })
          } catch (error) {
               console.error('Error uploading documents:', error)
               toast({
                    title: "Erro ao enviar documentos",
                    description: "Não foi possível enviar os documentos",
                    variant: "destructive"
               })
          } finally {
               setUploading(false)
               e.target.value = ''
          }
     }

     const removeDocument = async (doc: any) => {
          try {
               const fileName = doc.url.split('/').pop()
               if (fileName) {
                    await supabase.storage
                         .from('design-assets')
                         .remove([`${user?.id}/${fileName}`])
               }

               const currentAssets = formData.brand_assets || []
               handleInputChange('brand_assets', currentAssets.filter((d: any) => d.id !== doc.id))

               toast({
                    title: "Documento removido",
                    description: "O documento foi removido com sucesso"
               })
          } catch (error) {
               console.error('Error removing document:', error)
          }
     }

     const addConversionGoal = () => {
          if (!newGoal.description || !newGoal.metric || !newGoal.target) return

          const goals = formData.conversion_goals || []
          handleInputChange('conversion_goals', [...goals, { ...newGoal, id: Date.now() }])
          setNewGoal({ description: '', metric: '', target: '' })
     }

     const removeConversionGoal = (id: number) => {
          const goals = formData.conversion_goals || []
          handleInputChange('conversion_goals', goals.filter((g: any) => g.id !== id))
     }

     const addColor = () => {
          if (!newColor.name || !newColor.hex) return

          const palette = formData.color_palette || {}
          handleInputChange('color_palette', { ...palette, [newColor.name]: newColor.hex })
          setNewColor({ name: '', hex: '' })
     }

     const removeColor = (name: string) => {
          const palette = { ...formData.color_palette }
          delete palette[name]
          handleInputChange('color_palette', palette)
     }

     const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault()
          onSubmit(formData)
     }

     return (
          <form onSubmit={handleSubmit} className="space-y-6">
               {/* Basic Information */}
               <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                              <Label htmlFor="title">Título do Briefing *</Label>
                              <Input
                                   id="title"
                                   value={formData.title || ''}
                                   onChange={(e) => handleInputChange('title', e.target.value)}
                                   placeholder="Ex: Redesign do Site Institucional"
                                   required
                              />
                         </div>

                         <div className="space-y-2">
                              <Label htmlFor="client_name">Nome do Cliente *</Label>
                              <Input
                                   id="client_name"
                                   value={formData.client_name || ''}
                                   onChange={(e) => handleInputChange('client_name', e.target.value)}
                                   placeholder="Nome da empresa ou cliente"
                                   required
                              />
                         </div>

                         <div className="space-y-2">
                              <Label htmlFor="project_type">Tipo de Projeto *</Label>
                              <Select
                                   value={formData.project_type || ''}
                                   onValueChange={(value) => handleInputChange('project_type', value)}
                              >
                                   <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="website">Website</SelectItem>
                                        <SelectItem value="landing_page">Landing Page</SelectItem>
                                        <SelectItem value="app">Aplicativo</SelectItem>
                                        <SelectItem value="branding">Branding</SelectItem>
                                        <SelectItem value="social_media">Social Media</SelectItem>
                                        <SelectItem value="print">Material Impresso</SelectItem>
                                        <SelectItem value="other">Outro</SelectItem>
                                   </SelectContent>
                              </Select>
                         </div>

                         <div className="space-y-2">
                              <Label htmlFor="status">Status</Label>
                              <Select
                                   value={formData.status || 'draft'}
                                   onValueChange={(value) => handleInputChange('status', value)}
                              >
                                   <SelectTrigger>
                                        <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="draft">Rascunho</SelectItem>
                                        <SelectItem value="in_progress">Em Progresso</SelectItem>
                                        <SelectItem value="completed">Concluído</SelectItem>
                                        <SelectItem value="approved">Aprovado</SelectItem>
                                   </SelectContent>
                              </Select>
                         </div>
                    </div>

                    <div className="space-y-2 mt-4">
                         <Label htmlFor="main_objective">Objetivo Principal do Design</Label>
                         <Textarea
                              id="main_objective"
                              value={formData.main_objective || ''}
                              onChange={(e) => handleInputChange('main_objective', e.target.value)}
                              placeholder="Descreva o objetivo principal deste projeto de design"
                              rows={3}
                         />
                    </div>
               </Card>

               {/* Target & Inspiration */}
               <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Público e Inspiração</h3>
                    <div className="space-y-4">
                         <div className="space-y-2">
                              <Label htmlFor="target_audience">Público-Alvo</Label>
                              <Textarea
                                   id="target_audience"
                                   value={formData.target_audience || ''}
                                   onChange={(e) => handleInputChange('target_audience', e.target.value)}
                                   placeholder="Descreva o público-alvo (idade, interesses, comportamento, etc.)"
                                   rows={3}
                              />
                         </div>

                         <div className="space-y-2">
                              <Label htmlFor="design_inspiration">Inspirações/Referências</Label>
                              <Textarea
                                   id="design_inspiration"
                                   value={formData.design_inspiration || ''}
                                   onChange={(e) => handleInputChange('design_inspiration', e.target.value)}
                                   placeholder="Links, descrições ou referências de design"
                                   rows={3}
                              />
                         </div>

                         <div className="space-y-2">
                              <Label htmlFor="brand_personality">Personalidade da Marca</Label>
                              <Input
                                   id="brand_personality"
                                   value={formData.brand_personality || ''}
                                   onChange={(e) => handleInputChange('brand_personality', e.target.value)}
                                   placeholder="Ex: Moderna, Confiável, Inovadora"
                              />
                         </div>
                    </div>
               </Card>

               {/* Conversion Goals */}
               <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Metas de Conversão</h3>
                    <div className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <Input
                                   placeholder="Descrição da meta"
                                   value={newGoal.description}
                                   onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                              />
                              <Input
                                   placeholder="Métrica (ex: CTR, Taxa de conversão)"
                                   value={newGoal.metric}
                                   onChange={(e) => setNewGoal({ ...newGoal, metric: e.target.value })}
                              />
                              <div className="flex gap-2">
                                   <Input
                                        placeholder="Alvo (ex: 5%)"
                                        value={newGoal.target}
                                        onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                                   />
                                   <Button type="button" onClick={addConversionGoal}>
                                        <Plus className="w-4 h-4" />
                                   </Button>
                              </div>
                         </div>

                         {formData.conversion_goals && formData.conversion_goals.length > 0 && (
                              <div className="space-y-2">
                                   {formData.conversion_goals.map((goal: any) => (
                                        <div key={goal.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                             <div>
                                                  <p className="font-medium">{goal.description}</p>
                                                  <p className="text-sm text-muted-foreground">
                                                       {goal.metric}: {goal.target}
                                                  </p>
                                             </div>
                                             <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => removeConversionGoal(goal.id)}
                                             >
                                                  <Trash2 className="w-4 h-4" />
                                             </Button>
                                        </div>
                                   ))}
                              </div>
                         )}
                    </div>
               </Card>

               {/* Brand Guidelines */}
               <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Guia de Marca</h3>
                    <div className="space-y-4">
                         {/* Logo Upload */}
                         <div className="space-y-2">
                              <Label>Logo da Marca</Label>
                              {formData.logo_url ? (
                                   <div className="relative w-full max-w-xs">
                                        <img
                                             src={formData.logo_url}
                                             alt="Logo"
                                             className="w-full h-32 object-contain bg-muted rounded-lg p-4"
                                        />
                                        <Button
                                             type="button"
                                             variant="destructive"
                                             size="sm"
                                             className="absolute top-2 right-2"
                                             onClick={removeLogo}
                                        >
                                             <X className="w-4 h-4" />
                                        </Button>
                                   </div>
                              ) : (
                                   <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                        <Label
                                             htmlFor="logo-upload"
                                             className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                                        >
                                             {uploading ? 'Enviando...' : 'Clique para fazer upload do logo'}
                                        </Label>
                                        <Input
                                             id="logo-upload"
                                             type="file"
                                             accept="image/*"
                                             className="hidden"
                                             onChange={handleLogoUpload}
                                             disabled={uploading}
                                        />
                                   </div>
                              )}
                         </div>

                         {/* Color Palette */}
                         <div className="space-y-2">
                              <Label>Paleta de Cores</Label>
                              <div className="flex gap-2">
                                   <Input
                                        placeholder="Nome da cor"
                                        value={newColor.name}
                                        onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                                   />
                                   <Input
                                        type="color"
                                        value={newColor.hex}
                                        onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                                        className="w-20"
                                   />
                                   <Input
                                        placeholder="#000000"
                                        value={newColor.hex}
                                        onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                                   />
                                   <Button type="button" onClick={addColor}>
                                        <Plus className="w-4 h-4" />
                                   </Button>
                              </div>

                              {formData.color_palette && Object.keys(formData.color_palette).length > 0 && (
                                   <div className="flex flex-wrap gap-2 mt-3">
                                        {Object.entries(formData.color_palette).map(([name, hex]) => (
                                             <div
                                                  key={name}
                                                  className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg"
                                             >
                                                  <div
                                                       className="w-6 h-6 rounded border border-border"
                                                       style={{ backgroundColor: hex as string }}
                                                  />
                                                  <span className="text-sm font-medium">{name}</span>
                                                  <span className="text-xs text-muted-foreground">{String(hex)}</span>
                                                  <Button
                                                       type="button"
                                                       variant="ghost"
                                                       size="sm"
                                                       onClick={() => removeColor(name)}
                                                  >
                                                       <X className="w-3 h-3" />
                                                  </Button>
                                             </div>
                                        ))}
                                   </div>
                              )}
                         </div>

                         {/* Typography */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                   <Label htmlFor="typography_primary">Tipografia Primária</Label>
                                   <Input
                                        id="typography_primary"
                                        value={formData.typography_primary || ''}
                                        onChange={(e) => handleInputChange('typography_primary', e.target.value)}
                                        placeholder="Ex: Inter, Roboto"
                                   />
                              </div>

                              <div className="space-y-2">
                                   <Label htmlFor="typography_secondary">Tipografia Secundária</Label>
                                   <Input
                                        id="typography_secondary"
                                        value={formData.typography_secondary || ''}
                                        onChange={(e) => handleInputChange('typography_secondary', e.target.value)}
                                        placeholder="Ex: Georgia, Serif"
                                   />
                              </div>
                         </div>

                         <div className="space-y-2">
                              <Label htmlFor="brand_voice">Tom de Voz</Label>
                              <Textarea
                                   id="brand_voice"
                                   value={formData.brand_voice || ''}
                                   onChange={(e) => handleInputChange('brand_voice', e.target.value)}
                                   placeholder="Descreva o tom de voz da marca (formal, casual, técnico, etc.)"
                                   rows={3}
                              />
                         </div>

                         {/* Documents Upload */}
                         <div className="space-y-2">
                              <Label>Documentos e Arquivos</Label>
                              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                                   <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                   <Label
                                        htmlFor="documents-upload"
                                        className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                                   >
                                        {uploading ? 'Enviando...' : 'Clique para fazer upload de documentos (PDF, DOC, XLS, etc.)'}
                                   </Label>
                                   <Input
                                        id="documents-upload"
                                        type="file"
                                        multiple
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                                        className="hidden"
                                        onChange={handleDocumentUpload}
                                        disabled={uploading}
                                   />
                                   <p className="text-xs text-muted-foreground mt-2">Máximo 10MB por arquivo</p>
                              </div>

                              {formData.brand_assets && formData.brand_assets.length > 0 && (
                                   <div className="space-y-2 mt-3">
                                        {formData.brand_assets.map((doc: any) => (
                                             <div
                                                  key={doc.id}
                                                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                             >
                                                  <div className="flex items-center gap-2">
                                                       <FileText className="w-4 h-4 text-muted-foreground" />
                                                       <div>
                                                            <p className="text-sm font-medium">{doc.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                 {(doc.size / 1024 / 1024).toFixed(2)} MB
                                                            </p>
                                                       </div>
                                                  </div>
                                                  <Button
                                                       type="button"
                                                       variant="ghost"
                                                       size="sm"
                                                       onClick={() => removeDocument(doc)}
                                                  >
                                                       <Trash2 className="w-4 h-4" />
                                                  </Button>
                                             </div>
                                        ))}
                                   </div>
                              )}
                         </div>
                    </div>
               </Card>

               {/* Actions */}
               <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onCancel}>
                         Cancelar
                    </Button>
                    <Button type="submit">
                         {isEdit ? 'Atualizar' : 'Criar'} Briefing
                    </Button>
               </div>
          </form>
     )
}
