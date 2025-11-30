import * as React from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TaskManagerSidebar } from "@/components/TaskManagerSidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useSettings } from "@/contexts/SettingsContext"
import { useTheme, type ThemeColor } from "@/contexts/ThemeContext"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Settings as SettingsIcon, Save, Monitor, Database, Download, Upload } from "lucide-react"
import { uploadCompressedImage } from "@/utils/imageUtils"

const { useState } = React

export default function Settings() {
     const { systemName, setSystemName, userName, setUserName, logoUrl, setLogoUrl } = useSettings()
     const { themeColor, setThemeColor } = useTheme()
     const { user } = useAuth()
     const { toast } = useToast()
     const [tempSystemName, setTempSystemName] = useState(systemName)
     const [tempUserName, setTempUserName] = useState(userName)
     const [autoBackupEnabled, setAutoBackupEnabled] = useState(true)
     const [backupOnChanges, setBackupOnChanges] = useState(true)
     const [backupFrequency, setBackupFrequency] = useState("daily")
     const [lastBackup, setLastBackup] = useState<string | null>(null)
     const [loading, setLoading] = useState(false)
     const [uploadingLogo, setUploadingLogo] = useState(false)

     const handleSaveSystemName = () => {
          if (tempSystemName.trim()) {
               setSystemName(tempSystemName.trim())
               toast({
                    title: "Configurações salvas",
                    description: "Nome do sistema atualizado com sucesso"
               })
          } else {
               toast({
                    title: "Erro",
                    description: "O nome do sistema não pode estar vazio",
                    variant: "destructive"
               })
          }
     }

     const handleSaveUserName = () => {
          setUserName(tempUserName.trim())
          toast({
               title: "Configurações salvas",
               description: "Nome do usuário atualizado com sucesso"
          })
     }

     const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0]
          if (!file || !user) return

          // Validar tipo de arquivo
          if (!file.type.startsWith('image/')) {
               toast({
                    title: "Erro",
                    description: "Por favor, selecione apenas arquivos de imagem",
                    variant: "destructive"
               })
               return
          }

          // Validar tamanho (máx 2MB)
          if (file.size > 2 * 1024 * 1024) {
               toast({
                    title: "Erro",
                    description: "O arquivo deve ter no máximo 2MB",
                    variant: "destructive"
               })
               return
          }

          setUploadingLogo(true)
          try {
               // Deletar logo anterior se existir
               if (logoUrl) {
                    // Extrair o path completo da URL do Supabase Storage
                    // URL format: https://{project}.supabase.co/storage/v1/object/public/user-logos/{user_id}/logo-xxx.jpg
                    const urlParts = logoUrl.split('/user-logos/')
                    if (urlParts[1]) {
                         const oldFilePath = urlParts[1]
                         console.log('Deletando logo anterior:', oldFilePath)
                         const { error: deleteError } = await supabase.storage
                              .from('user-logos')
                              .remove([oldFilePath])

                         if (deleteError) {
                              console.warn('Erro ao deletar logo anterior:', deleteError)
                         }
                    }
               }

               // Upload do novo logo com compressão
               const fileName = `logo-${Date.now()}.jpg`
               const filePath = `${user.id}/${fileName}`

               console.log('Iniciando upload da nova logo para:', filePath)

               const publicUrl = await uploadCompressedImage(
                    file,
                    'user-logos',
                    filePath,
                    supabase
               )

               if (!publicUrl) {
                    throw new Error('Falha ao obter URL pública do logo')
               }

               // Atualizar profile no banco
               const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ logo_url: publicUrl })
                    .eq('user_id', user.id)

               if (updateError) throw updateError

               // Atualizar estado local
               setLogoUrl(publicUrl)

               toast({
                    title: "Logo atualizado",
                    description: "Seu logotipo foi atualizado e comprimido com sucesso"
               })
          } catch (error) {
               console.error('Erro ao fazer upload do logo:', error)
               toast({
                    title: "Erro",
                    description: error instanceof Error ? error.message : "Não foi possível fazer upload do logo",
                    variant: "destructive"
               })
          } finally {
               setUploadingLogo(false)
               event.target.value = ""
          }
     }

     const handleRemoveLogo = async () => {
          if (!user || !logoUrl) return

          setUploadingLogo(true)
          try {
               // Deletar do storage - extrair path completo da URL
               const urlParts = logoUrl.split('/user-logos/')
               if (urlParts[1]) {
                    const filePath = urlParts[1]
                    console.log('Removendo logo:', filePath)
                    const { error: deleteError } = await supabase.storage
                         .from('user-logos')
                         .remove([filePath])

                    if (deleteError) {
                         console.warn('Erro ao deletar logo do storage:', deleteError)
                    }
               }

               // Atualizar profile no banco
               const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ logo_url: null })
                    .eq('user_id', user.id)

               if (updateError) throw updateError

               // Limpar estado local
               setLogoUrl("")

               toast({
                    title: "Logo removido",
                    description: "Seu logotipo foi removido com sucesso"
               })
          } catch (error) {
               console.error('Erro ao remover logo:', error)
               toast({
                    title: "Erro",
                    description: "Não foi possível remover o logo",
                    variant: "destructive"
               })
          } finally {
               setUploadingLogo(false)
          }
     }

     const handleSaveBackupSettings = async () => {
          if (!user) return

          try {
               const { error } = await supabase
                    .from('backup_settings')
                    .upsert({
                         user_id: user.id,
                         auto_backup_enabled: autoBackupEnabled,
                         backup_on_changes: backupOnChanges,
                         backup_frequency: backupFrequency
                    })

               if (error) throw error

               toast({
                    title: "Configurações salvas",
                    description: "Configurações de backup atualizadas com sucesso"
               })
          } catch (error) {
               console.error('Erro ao salvar configurações:', error)
               toast({
                    title: "Erro",
                    description: "Não foi possível salvar as configurações",
                    variant: "destructive"
               })
          }
     }

     const loadBackupSettings = async () => {
          if (!user) return

          try {
               // Carregar configurações de backup
               const { data: settings } = await supabase
                    .from('backup_settings')
                    .select('*')
                    .eq('user_id', user.id)
                    .single()

               if (settings) {
                    setAutoBackupEnabled(settings.auto_backup_enabled)
                    setBackupOnChanges(settings.backup_on_changes)
                    setBackupFrequency(settings.backup_frequency)
                    setLastBackup(settings.last_backup_at)
               }
          } catch (error) {
               console.error('Erro ao carregar configurações:', error)
          }
     }

     const handleExportData = async () => {
          if (!user) {
               toast({
                    title: "Erro",
                    description: "Usuário não autenticado",
                    variant: "destructive"
               })
               return
          }

          setLoading(true)
          try {
               // Buscar todos os dados do usuário
               const [tasksData, projectsData, customersData, salesData, briefingsData, notesData, profileData] = await Promise.all([
                    supabase.from('tasks').select('*').eq('user_id', user.id),
                    supabase.from('projects').select('*').eq('user_id', user.id),
                    supabase.from('customers').select('*').eq('user_id', user.id),
                    supabase.from('sales').select('*').eq('user_id', user.id),
                    supabase.from('design_briefings').select('*').eq('user_id', user.id),
                    supabase.from('notes').select('*').eq('user_id', user.id),
                    supabase.from('profiles').select('*').eq('user_id', user.id).single()
               ])

               // Estruturar dados para exportação
               const systemData = {
                    version: "1.0.0",
                    exportDate: new Date().toISOString(),
                    systemName,
                    userName,
                    user_id: user.id,
                    profile: profileData.data,
                    data: {
                         tasks: tasksData.data || [],
                         projects: projectsData.data || [],
                         customers: customersData.data || [],
                         sales: salesData.data || [],
                         design_briefings: briefingsData.data || [],
                         notes: notesData.data || []
                    },
                    counts: {
                         tasks: tasksData.data?.length || 0,
                         projects: projectsData.data?.length || 0,
                         customers: customersData.data?.length || 0,
                         sales: salesData.data?.length || 0,
                         design_briefings: briefingsData.data?.length || 0,
                         notes: notesData.data?.length || 0
                    }
               }

               const dataStr = JSON.stringify(systemData, null, 2)
               const dataBlob = new Blob([dataStr], { type: "application/json" })
               const url = URL.createObjectURL(dataBlob)
               const link = document.createElement("a")
               link.href = url
               link.download = `backup-completo-${new Date().toISOString().split('T')[0]}.json`
               document.body.appendChild(link)
               link.click()
               document.body.removeChild(link)
               URL.revokeObjectURL(url)

               toast({
                    title: "Exportação completa",
                    description: `${systemData.counts.tasks + systemData.counts.projects + systemData.counts.customers + systemData.counts.sales + systemData.counts.design_briefings + systemData.counts.notes} registros exportados com sucesso`
               })
          } catch (error) {
               console.error('Erro na exportação:', error)
               toast({
                    title: "Erro na exportação",
                    description: "Não foi possível exportar os dados",
                    variant: "destructive"
               })
          } finally {
               setLoading(false)
          }
     }

     const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0]
          if (!file) return

          if (!user) {
               toast({
                    title: "Erro",
                    description: "Usuário não autenticado",
                    variant: "destructive"
               })
               return
          }

          setLoading(true)
          const reader = new FileReader()
          reader.onload = async (e) => {
               try {
                    const content = e.target?.result as string
                    const importedData = JSON.parse(content)

                    // Validar estrutura do arquivo
                    if (!importedData.version || !importedData.data) {
                         throw new Error("Arquivo de backup inválido")
                    }

                    let totalImported = 0

                    // Importar dados para o banco
                    if (importedData.data.tasks?.length > 0) {
                         const tasksToImport = importedData.data.tasks.map((task: any) => ({
                              ...task,
                              user_id: user.id,
                              created_at: task.created_at,
                              updated_at: new Date().toISOString()
                         }))
                         const { error } = await supabase.from('tasks').upsert(tasksToImport)
                         if (!error) totalImported += tasksToImport.length
                    }

                    if (importedData.data.projects?.length > 0) {
                         const projectsToImport = importedData.data.projects.map((project: any) => ({
                              ...project,
                              user_id: user.id,
                              created_at: project.created_at,
                              updated_at: new Date().toISOString()
                         }))
                         const { error } = await supabase.from('projects').upsert(projectsToImport)
                         if (!error) totalImported += projectsToImport.length
                    }

                    if (importedData.data.customers?.length > 0) {
                         const customersToImport = importedData.data.customers.map((customer: any) => ({
                              ...customer,
                              user_id: user.id,
                              created_at: customer.created_at,
                              updated_at: new Date().toISOString()
                         }))
                         const { error } = await supabase.from('customers').upsert(customersToImport)
                         if (!error) totalImported += customersToImport.length
                    }

                    if (importedData.data.sales?.length > 0) {
                         const salesToImport = importedData.data.sales.map((sale: any) => ({
                              ...sale,
                              user_id: user.id,
                              created_at: sale.created_at,
                              updated_at: new Date().toISOString()
                         }))
                         const { error } = await supabase.from('sales').upsert(salesToImport)
                         if (!error) totalImported += salesToImport.length
                    }

                    if (importedData.data.design_briefings?.length > 0) {
                         const briefingsToImport = importedData.data.design_briefings.map((briefing: any) => ({
                              ...briefing,
                              user_id: user.id,
                              created_at: briefing.created_at,
                              updated_at: new Date().toISOString()
                         }))
                         const { error } = await supabase.from('design_briefings').upsert(briefingsToImport)
                         if (!error) totalImported += briefingsToImport.length
                    }

                    if (importedData.data.notes?.length > 0) {
                         const notesToImport = importedData.data.notes.map((note: any) => ({
                              ...note,
                              user_id: user.id,
                              created_at: note.created_at,
                              updated_at: new Date().toISOString()
                         }))
                         const { error } = await supabase.from('notes').upsert(notesToImport)
                         if (!error) totalImported += notesToImport.length
                    }

                    // Restaurar configurações locais
                    if (importedData.systemName) {
                         setSystemName(importedData.systemName)
                         setTempSystemName(importedData.systemName)
                    }

                    if (importedData.userName) {
                         setUserName(importedData.userName)
                         setTempUserName(importedData.userName)
                    }

                    toast({
                         title: "Importação completa",
                         description: `${totalImported} registros importados com sucesso`
                    })
               } catch (error) {
                    console.error('Erro na importação:', error)
                    toast({
                         title: "Erro na importação",
                         description: "Arquivo JSON inválido ou erro ao importar dados",
                         variant: "destructive"
                    })
               } finally {
                    setLoading(false)
               }
          }
          reader.readAsText(file)

          // Limpar input
          event.target.value = ""
     }

     // Carregar configurações salvas do banco
     React.useEffect(() => {
          if (user) {
               loadBackupSettings()
               // Carregar logo do usuário
               supabase
                    .from('profiles')
                    .select('logo_url')
                    .eq('user_id', user.id)
                    .single()
                    .then(({ data }) => {
                         if (data?.logo_url) {
                              setLogoUrl(data.logo_url)
                         }
                    })
          }
     }, [user])

     const colorOptions = [
          { value: 'default', label: 'Padrão (Laranja)', color: '#FF6B35', hex: '#FF6B35' },
          { value: 'green', label: 'Verde', color: '#18CA8F', hex: '#18CA8F' },
          { value: 'blue', label: 'Azul', color: '#00D4FF', hex: '#00D4FF' },
          { value: 'purple', label: 'Roxo', color: '#8B5CF6', hex: '#8B5CF6' }
     ]

     const handleThemeColorChange = (color: ThemeColor) => {
          setThemeColor(color)
          toast({
               title: "Tema alterado",
               description: `Cor do sistema alterada para ${colorOptions.find(c => c.value === color)?.label}`,
          })
     }

     const settingsSections = [
          {
               title: "Aparência",
               description: "Personalize a aparência do sistema",
               icon: Monitor,
               items: [
                    {
                         label: "Nome do Sistema",
                         description: "Nome que aparece no cabeçalho da aplicação",
                         component: (
                              <div className="space-y-3">
                                   <Input
                                        value={tempSystemName}
                                        onChange={(e) => setTempSystemName(e.target.value)}
                                        placeholder="Digite o nome do sistema"
                                        className="max-w-xs"
                                   />
                                   <Button
                                        onClick={handleSaveSystemName}
                                        className="bg-gradient-primary hover:bg-gradient-primary/90"
                                        size="sm"
                                   >
                                        <Save className="w-4 h-4 mr-2" />
                                        Salvar
                                   </Button>
                              </div>
                         )
                    },
                    {
                         label: "Nome do Usuário",
                         description: "Nome que aparece na página principal do dashboard",
                         component: (
                              <div className="space-y-3">
                                   <Input
                                        value={tempUserName}
                                        onChange={(e) => setTempUserName(e.target.value)}
                                        placeholder="Digite seu nome"
                                        className="max-w-xs"
                                   />
                                   <Button
                                        onClick={handleSaveUserName}
                                        className="bg-gradient-primary hover:bg-gradient-primary/90"
                                        size="sm"
                                   >
                                        <Save className="w-4 h-4 mr-2" />
                                        Salvar
                                   </Button>
                              </div>
                         )
                    },
                    {
                         label: "Logotipo",
                         description: "Personalize o logotipo que aparece no menu lateral (área de 40x40px)",
                         component: (
                              <div className="space-y-4">
                                   <div className="flex items-center gap-4">
                                        {logoUrl ? (
                                             <div className="w-40 h-40 rounded-lg border-2 border-border overflow-hidden flex items-center justify-center bg-muted">
                                                  <img
                                                       src={logoUrl}
                                                       alt="Logo atual"
                                                       className="w-full h-full object-contain"
                                                  />
                                             </div>
                                        ) : (
                                             <div className="w-40 h-40 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted">
                                                  <p className="text-sm text-muted-foreground">Sem logo</p>
                                             </div>
                                        )}
                                   </div>
                                   <div className="flex gap-2">
                                        <Button
                                             variant="outline"
                                             disabled={uploadingLogo}
                                             onClick={() => document.getElementById('logo-upload')?.click()}
                                        >
                                             <Upload className="w-4 h-4 mr-2" />
                                             {uploadingLogo ? "Enviando..." : logoUrl ? "Trocar Logo" : "Enviar Logo"}
                                        </Button>
                                        {logoUrl && (
                                             <Button
                                                  variant="outline"
                                                  disabled={uploadingLogo}
                                                  onClick={handleRemoveLogo}
                                             >
                                                  Remover
                                             </Button>
                                        )}
                                        <input
                                             id="logo-upload"
                                             type="file"
                                             accept="image/*"
                                             onChange={handleLogoUpload}
                                             className="hidden"
                                        />
                                   </div>
                                   <p className="text-xs text-muted-foreground">
                                        Formatos aceitos: PNG, JPG, SVG, WEBP. Tamanho máximo: 2MB.
                                   </p>
                              </div>
                         )
                    },
                    {
                         label: "Cores do Sistema",
                         description: "Personalize as cores dos botões, barras de progresso e elementos selecionados",
                         component: (
                              <div className="space-y-4">
                                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {colorOptions.map((option) => (
                                             <button
                                                  key={option.value}
                                                  onClick={() => handleThemeColorChange(option.value as ThemeColor)}
                                                  className={`relative p-3 rounded-lg border-2 transition-all hover:scale-105 ${themeColor === option.value
                                                       ? 'border-primary shadow-primary'
                                                       : 'border-border hover:border-muted-foreground'
                                                       }`}
                                             >
                                                  <div
                                                       className="w-8 h-8 rounded-full mx-auto mb-2 shadow-lg"
                                                       style={{ backgroundColor: option.color }}
                                                  />
                                                  <p className="text-xs font-medium text-card-foreground text-center">
                                                       {option.label}
                                                  </p>
                                                  {themeColor === option.value && (
                                                       <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                                                  )}
                                             </button>
                                        ))}
                                   </div>
                                   <p className="text-xs text-muted-foreground">
                                        Clique em uma cor para aplicar o tema. As mudanças são aplicadas imediatamente.
                                   </p>
                              </div>
                         )
                    }
               ]
          },
          {
               title: "Gerenciamento de Dados",
               description: "Exporte e faça backup dos seus dados",
               icon: Database,
               items: [
                    {
                         label: "Exportar Dados",
                         description: "Baixe todos os dados do sistema (tarefas, projetos, clientes, vendas, briefings e notas)",
                         component: (
                              <div className="space-y-3">
                                   <Button
                                        onClick={handleExportData}
                                        disabled={loading}
                                        variant="outline"
                                        className="flex items-center gap-2"
                                   >
                                        <Download className="w-4 h-4" />
                                        {loading ? "Exportando..." : "Exportar Todos os Dados"}
                                   </Button>
                                   <p className="text-xs text-muted-foreground">
                                        Exporta todos os registros cadastrados no sistema em formato JSON estruturado.
                                   </p>
                              </div>
                         )
                    },
                    {
                         label: "Importar Dados",
                         description: "Restaurar todos os dados de um backup completo",
                         component: (
                              <div className="space-y-3">
                                   <div className="flex items-center gap-2">
                                        <Button
                                             variant="outline"
                                             disabled={loading}
                                             className="flex items-center gap-2"
                                             onClick={() => document.getElementById('import-file')?.click()}
                                        >
                                             <Upload className="w-4 h-4" />
                                             {loading ? "Importando..." : "Importar Backup Completo"}
                                        </Button>
                                        <input
                                             id="import-file"
                                             type="file"
                                             accept=".json"
                                             onChange={handleImportData}
                                             className="hidden"
                                        />
                                   </div>
                                   <p className="text-xs text-muted-foreground">
                                        Importa todos os dados (tarefas, projetos, clientes, vendas, briefings e notas) de um arquivo JSON exportado anteriormente. Os dados serão vinculados ao seu usuário.
                                   </p>
                              </div>
                         )
                    },
                    {
                         label: "Backup Automático",
                         description: "Ativar backup automático diário às 2:00 AM",
                         component: (
                              <div className="space-y-3">
                                   <div className="flex items-center space-x-2">
                                        <Switch
                                             checked={autoBackupEnabled}
                                             onCheckedChange={setAutoBackupEnabled}
                                        />
                                        <span className="text-sm">Backup automático ativado</span>
                                   </div>
                                   {lastBackup && (
                                        <p className="text-xs text-muted-foreground">
                                             Último backup: {new Date(lastBackup).toLocaleString('pt-BR')}
                                        </p>
                                   )}
                              </div>
                         )
                    },
                    {
                         label: "Backup em Mudanças",
                         description: "Realizar backup quando houver alterações no sistema",
                         component: (
                              <div className="space-y-3">
                                   <div className="flex items-center space-x-2">
                                        <Switch
                                             checked={backupOnChanges}
                                             onCheckedChange={setBackupOnChanges}
                                        />
                                        <span className="text-sm">Backup em alterações</span>
                                   </div>
                                   <Button
                                        onClick={handleSaveBackupSettings}
                                        className="bg-gradient-primary hover:bg-gradient-primary/90"
                                        size="sm"
                                   >
                                        <Save className="w-4 h-4 mr-2" />
                                        Salvar Configurações
                                   </Button>
                              </div>
                         )
                    }
               ]
          }
     ]

     return (
          <div className="min-h-screen bg-background">
               <SidebarProvider>
                    <div className="flex w-full">
                         <TaskManagerSidebar />

                         <main className="flex-1 p-6">
                              {/* Header */}
                              <div className="flex items-center gap-4 mb-8">
                                   <SidebarTrigger className="lg:hidden h-12 w-12 p-3 [&_svg]:w-6 [&_svg]:h-6" />
                                   <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gradient-primary">
                                             <SettingsIcon className="w-6 h-6 text-primary-foreground" />
                                        </div>
                                        <div>
                                             <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
                                             <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
                                        </div>
                                   </div>
                              </div>

                              {/* Settings Sections */}
                              <div className="space-y-6">
                                   {settingsSections.map((section, index) => (
                                        <Card key={index} className="bg-gradient-card border border-border shadow-card">
                                             <CardHeader>
                                                  <div className="flex items-center gap-3">
                                                       <div className="p-2 rounded-lg bg-secondary">
                                                            <section.icon className="w-5 h-5 text-secondary-foreground" />
                                                       </div>
                                                       <div>
                                                            <CardTitle className="text-card-foreground">{section.title}</CardTitle>
                                                            <CardDescription>{section.description}</CardDescription>
                                                       </div>
                                                  </div>
                                             </CardHeader>
                                             <CardContent className="space-y-6">
                                                  {section.items.map((item, itemIndex) => (
                                                       <div key={itemIndex}>
                                                            <div className="flex flex-col space-y-3">
                                                                 <div>
                                                                      <Label className="text-sm font-medium text-card-foreground">
                                                                           {item.label}
                                                                      </Label>
                                                                      <p className="text-sm text-muted-foreground">
                                                                           {item.description}
                                                                      </p>
                                                                 </div>
                                                                 {item.component}
                                                            </div>
                                                            {itemIndex < section.items.length - 1 && (
                                                                 <Separator className="mt-6" />
                                                            )}
                                                       </div>
                                                  ))}
                                             </CardContent>
                                        </Card>
                                   ))}
                              </div>

                              {/* System Info */}
                              <Card className="mt-6 bg-gradient-card border border-border shadow-card">
                                   <CardHeader>
                                        <CardTitle className="text-card-foreground">Informações do Sistema</CardTitle>
                                        <CardDescription>Detalhes sobre a versão e configuração atual</CardDescription>
                                   </CardHeader>
                                   <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                             <div>
                                                  <span className="font-medium text-card-foreground">Versão:</span>
                                                  <span className="ml-2 text-muted-foreground">1.0.0</span>
                                             </div>
                                             <div>
                                                  <span className="font-medium text-card-foreground">Desenvolvido por:</span>
                                                  <span className="ml-2 text-muted-foreground">JXCoder-development</span>
                                             </div>
                                             <div>
                                                  <span className="font-medium text-card-foreground">Nome Atual:</span>
                                                  <span className="ml-2 text-muted-foreground">{systemName}</span>
                                             </div>
                                             <div>
                                                  <span className="font-medium text-card-foreground">Última Atualização:</span>
                                                  <span className="ml-2 text-muted-foreground">{new Date().toLocaleDateString('pt-BR')}</span>
                                             </div>
                                             <div>
                                                  <span className="font-medium text-card-foreground">Status:</span>
                                                  <Badge variant="default" className="ml-2">Ativo</Badge>
                                             </div>
                                        </div>
                                   </CardContent>
                              </Card>
                         </main>
                    </div>
               </SidebarProvider>
          </div>
     )
}