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
import { Settings as SettingsIcon, Save, Monitor, Bell, Database, Download, Upload, Phone, Mail, Clock, AlertCircle } from "lucide-react"

const { useState } = React

export default function Settings() {
     const { systemName, setSystemName, userName, setUserName } = useSettings()
     const { themeColor, setThemeColor } = useTheme()
     const { user } = useAuth()
     const { toast } = useToast()
     const [tempSystemName, setTempSystemName] = useState(systemName)
     const [tempUserName, setTempUserName] = useState(userName)
     const [alertEmail, setAlertEmail] = useState("")
     const [alertPhone, setAlertPhone] = useState("")
     const [autoBackupEnabled, setAutoBackupEnabled] = useState(true)
     const [backupOnChanges, setBackupOnChanges] = useState(true)
     const [backupFrequency, setBackupFrequency] = useState("daily")
     const [lastBackup, setLastBackup] = useState<string | null>(null)
     const [backupLogs, setBackupLogs] = useState<any[]>([])
     const [loading, setLoading] = useState(false)

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

     const handleSaveAlerts = () => {
          // Salvar configurações de alertas no localStorage
          localStorage.setItem("alert-email", alertEmail)
          localStorage.setItem("alert-phone", alertPhone)
          toast({
               title: "Alertas configurados",
               description: "Configurações de alertas salvas com sucesso"
          })
     }

     const handleManualBackup = async () => {
          if (!user) return

          setLoading(true)
          try {
               const { data, error } = await supabase.functions.invoke('auto-backup', {
                    body: {
                         backupType: 'manual',
                         userId: user.id
                    }
               })

               if (error) throw error

               toast({
                    title: "Backup realizado",
                    description: "Backup manual criado com sucesso"
               })

               loadBackupSettings() // Recarregar configurações
          } catch (error) {
               console.error('Erro no backup:', error)
               toast({
                    title: "Erro no backup",
                    description: "Não foi possível realizar o backup",
                    variant: "destructive"
               })
          } finally {
               setLoading(false)
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

               // Carregar logs de backup
               const { data: logs } = await supabase
                    .from('backup_logs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(5)

               if (logs) {
                    setBackupLogs(logs)
               }
          } catch (error) {
               console.error('Erro ao carregar configurações:', error)
          }
     }

     const handleExportData = () => {
          // Exportar dados do sistema
          const systemData = {
               systemName,
               alertEmail,
               alertPhone,
               exportDate: new Date().toISOString(),
               version: "1.0.0"
          }

          const dataStr = JSON.stringify(systemData, null, 2)
          const dataBlob = new Blob([dataStr], { type: "application/json" })
          const url = URL.createObjectURL(dataBlob)
          const link = document.createElement("a")
          link.href = url
          link.download = `system-backup-${new Date().toISOString().split('T')[0]}.json`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)

          toast({
               title: "Dados exportados",
               description: "Backup dos dados baixado com sucesso"
          })
     }

     const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0]
          if (!file) return

          const reader = new FileReader()
          reader.onload = (e) => {
               try {
                    const content = e.target?.result as string
                    const importedData = JSON.parse(content)

                    // Validar estrutura do arquivo
                    if (!importedData.systemName && !importedData.version) {
                         throw new Error("Arquivo de backup inválido")
                    }

                    // Restaurar dados
                    if (importedData.systemName) {
                         setSystemName(importedData.systemName)
                         setTempSystemName(importedData.systemName)
                    }

                    if (importedData.alertEmail) {
                         setAlertEmail(importedData.alertEmail)
                         localStorage.setItem("alert-email", importedData.alertEmail)
                    }

                    if (importedData.alertPhone) {
                         setAlertPhone(importedData.alertPhone)
                         localStorage.setItem("alert-phone", importedData.alertPhone)
                    }

                    toast({
                         title: "Backup restaurado",
                         description: "Dados importados com sucesso do arquivo JSON"
                    })
               } catch (error) {
                    toast({
                         title: "Erro na importação",
                         description: "Arquivo JSON inválido ou corrompido",
                         variant: "destructive"
                    })
               }
          }
          reader.readAsText(file)

          // Limpar input
          event.target.value = ""
     }

     // Carregar configurações salvas no localStorage e do banco
     React.useEffect(() => {
          const savedEmail = localStorage.getItem("alert-email")
          const savedPhone = localStorage.getItem("alert-phone")
          if (savedEmail) setAlertEmail(savedEmail)
          if (savedPhone) setAlertPhone(savedPhone)

          if (user) {
               loadBackupSettings()
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
               title: "Alertas e Notificações",
               description: "Configure alertas por email e telefone",
               icon: Bell,
               items: [
                    {
                         label: "Email para Alertas",
                         description: "Email que receberá notificações importantes do sistema",
                         component: (
                              <div className="space-y-3">
                                   <div className="flex items-center space-x-2">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                        <Input
                                             type="email"
                                             value={alertEmail}
                                             onChange={(e) => setAlertEmail(e.target.value)}
                                             placeholder="Digite seu email"
                                             className="max-w-xs"
                                        />
                                   </div>
                              </div>
                         )
                    },
                    {
                         label: "Telefone para Alertas",
                         description: "Número de telefone para receber alertas via SMS",
                         component: (
                              <div className="space-y-3">
                                   <div className="flex items-center space-x-2">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        <Input
                                             type="tel"
                                             value={alertPhone}
                                             onChange={(e) => setAlertPhone(e.target.value)}
                                             placeholder="(11) 99999-9999"
                                             className="max-w-xs"
                                        />
                                   </div>
                                   <Button
                                        onClick={handleSaveAlerts}
                                        className="bg-gradient-primary hover:bg-gradient-primary/90"
                                        size="sm"
                                   >
                                        <Save className="w-4 h-4 mr-2" />
                                        Salvar Alertas
                                   </Button>
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
                         description: "Baixe todos os seus dados em formato JSON",
                         component: (
                              <Button
                                   onClick={handleExportData}
                                   variant="outline"
                                   className="flex items-center gap-2"
                              >
                                   <Download className="w-4 h-4" />
                                   Exportar Dados
                              </Button>
                         )
                    },
                    {
                         label: "Importar Dados",
                         description: "Restaurar dados de um arquivo JSON local",
                         component: (
                              <div className="space-y-3">
                                   <div className="flex items-center gap-2">
                                        <Button
                                             variant="outline"
                                             className="flex items-center gap-2"
                                             onClick={() => document.getElementById('import-file')?.click()}
                                        >
                                             <Upload className="w-4 h-4" />
                                             Importar Backup
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
                                        Selecione um arquivo JSON exportado anteriormente para restaurar suas configurações.
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
                    },
                    {
                         label: "Backup Manual",
                         description: "Realizar backup imediatamente",
                         component: (
                              <div className="space-y-3">
                                   <Button
                                        onClick={handleManualBackup}
                                        disabled={loading}
                                        variant="outline"
                                        className="flex items-center gap-2"
                                   >
                                        <Upload className="w-4 h-4" />
                                        {loading ? "Realizando..." : "Backup Manual"}
                                   </Button>
                                   {backupLogs.length > 0 && (
                                        <div className="space-y-2">
                                             <p className="text-xs font-medium text-card-foreground">Últimos backups:</p>
                                             {backupLogs.slice(0, 3).map((log, index) => (
                                                  <div key={index} className="flex items-center gap-2 text-xs">
                                                       <Clock className="w-3 h-3" />
                                                       <span className="text-muted-foreground">
                                                            {new Date(log.created_at).toLocaleString('pt-BR')} -
                                                       </span>
                                                       <Badge
                                                            variant={log.status === 'success' ? 'default' : 'destructive'}
                                                            className="text-xs"
                                                       >
                                                            {log.status === 'success' ? 'Sucesso' : 'Erro'}
                                                       </Badge>
                                                  </div>
                                             ))}
                                        </div>
                                   )}
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
                                             <div>
                                                  <span className="font-medium text-card-foreground">Alertas Email:</span>
                                                  <span className="ml-2 text-muted-foreground">{alertEmail || "Não configurado"}</span>
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