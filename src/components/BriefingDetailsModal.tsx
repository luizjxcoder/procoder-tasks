import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"

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
}

interface BriefingDetailsModalProps {
     briefing: Briefing
     open: boolean
     onOpenChange: (open: boolean) => void
}

export function BriefingDetailsModal({
     briefing,
     open,
     onOpenChange
}: BriefingDetailsModalProps) {
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

     const handleDownloadDocument = async (doc: any) => {
          try {
               const response = await fetch(doc.url)
               const blob = await response.blob()
               const blobUrl = URL.createObjectURL(blob)
               const link = document.createElement('a')
               link.href = blobUrl
               link.download = doc.name
               document.body.appendChild(link)
               link.click()
               document.body.removeChild(link)
               URL.revokeObjectURL(blobUrl)
          } catch (error) {
               console.error('Erro ao baixar documento', error)
          }
     }

     return (
          <Dialog open={open} onOpenChange={onOpenChange}>
               <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                         <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-0">
                              <div className="flex-1 min-w-0 w-full">
                                   <DialogTitle className="text-xl sm:text-2xl break-words">{briefing.title}</DialogTitle>
                                   <p className="text-muted-foreground mt-1 text-sm sm:text-base">{briefing.client_name}</p>
                              </div>
                              <Badge className={`${getStatusColor(briefing.status)} whitespace-nowrap self-start`}>
                                   {getStatusLabel(briefing.status)}
                              </Badge>
                         </div>
                    </DialogHeader>

                    <div className="space-y-4 sm:space-y-6">
                         {/* Logo */}
                         {briefing.logo_url && (
                              <Card className="p-4 sm:p-6">
                                   <h3 className="font-semibold mb-3 text-sm sm:text-base">Logo</h3>
                                   <img
                                        src={briefing.logo_url}
                                        alt="Logo"
                                        className="w-full max-w-xs h-24 sm:h-32 object-contain bg-muted rounded-lg p-3 sm:p-4"
                                   />
                              </Card>
                         )}

                         {/* Basic Info */}
                         <Card className="p-4 sm:p-6">
                              <h3 className="font-semibold mb-3 text-sm sm:text-base">Informações Básicas</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                   <div>
                                        <p className="text-sm text-muted-foreground">Tipo de Projeto</p>
                                        <p className="font-medium">{briefing.project_type}</p>
                                   </div>
                                   {briefing.brand_personality && (
                                        <div>
                                             <p className="text-sm text-muted-foreground">Personalidade da Marca</p>
                                             <p className="font-medium">{briefing.brand_personality}</p>
                                        </div>
                                   )}
                              </div>
                              {briefing.main_objective && (
                                   <>
                                        <Separator className="my-4" />
                                        <div>
                                             <p className="text-sm text-muted-foreground mb-2">Objetivo Principal</p>
                                             <p className="text-foreground">{briefing.main_objective}</p>
                                        </div>
                                   </>
                              )}
                         </Card>

                         {/* Target & Inspiration */}
                         {(briefing.target_audience || briefing.design_inspiration) && (
                              <Card className="p-4 sm:p-6">
                                   <h3 className="font-semibold mb-3 text-sm sm:text-base">Público e Inspiração</h3>
                                   {briefing.target_audience && (
                                        <div className="mb-4">
                                             <p className="text-sm text-muted-foreground mb-2">Público-Alvo</p>
                                             <p className="text-foreground">{briefing.target_audience}</p>
                                        </div>
                                   )}
                                   {briefing.design_inspiration && (
                                        <div>
                                             <p className="text-sm text-muted-foreground mb-2">Inspirações/Referências</p>
                                             <p className="text-foreground">{briefing.design_inspiration}</p>
                                        </div>
                                   )}
                              </Card>
                         )}

                         {/* Conversion Goals */}
                         {briefing.conversion_goals && briefing.conversion_goals.length > 0 && (
                              <Card className="p-4 sm:p-6">
                                   <h3 className="font-semibold mb-3 text-sm sm:text-base">Metas de Conversão</h3>
                                   <div className="space-y-2">
                                        {briefing.conversion_goals.map((goal: any, index: number) => (
                                             <div key={index} className="p-3 bg-muted rounded-lg">
                                                  <p className="font-medium">{goal.description}</p>
                                                  <p className="text-sm text-muted-foreground">
                                                       {goal.metric}: {goal.target}
                                                  </p>
                                             </div>
                                        ))}
                                   </div>
                              </Card>
                         )}

                         {/* Brand Guidelines */}
                         <Card className="p-4 sm:p-6">
                              <h3 className="font-semibold mb-3 text-sm sm:text-base">Guia de Marca</h3>

                              {/* Color Palette */}
                              {briefing.color_palette && Object.keys(briefing.color_palette).length > 0 && (
                                   <div className="mb-4">
                                        <p className="text-sm text-muted-foreground mb-2">Paleta de Cores</p>
                                        <div className="flex flex-wrap gap-2">
                                             {Object.entries(briefing.color_palette).map(([name, hex]) => (
                                                  <div
                                                       key={name}
                                                       className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-muted rounded-lg min-w-0"
                                                  >
                                                       <div
                                                            className="w-6 h-6 rounded border border-border flex-shrink-0"
                                                            style={{ backgroundColor: hex as string }}
                                                       />
                                                       <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-1 min-w-0 w-full">
                                                            <span className="text-xs sm:text-sm font-medium break-words">{name}</span>
                                                            <span className="text-xs text-muted-foreground break-all">{String(hex)}</span>
                                                       </div>
                                                  </div>
                                             ))}
                                        </div>
                                   </div>
                              )}

                              {/* Typography */}
                              {(briefing.typography_primary || briefing.typography_secondary) && (
                                   <div className="mb-4">
                                        <p className="text-sm text-muted-foreground mb-2">Tipografia</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                             {briefing.typography_primary && (
                                                  <div>
                                                       <p className="text-xs text-muted-foreground">Primária</p>
                                                       <p className="font-medium">{briefing.typography_primary}</p>
                                                  </div>
                                             )}
                                             {briefing.typography_secondary && (
                                                  <div>
                                                       <p className="text-xs text-muted-foreground">Secundária</p>
                                                       <p className="font-medium">{briefing.typography_secondary}</p>
                                                  </div>
                                             )}
                                        </div>
                                   </div>
                              )}

                              {/* Brand Voice */}
                              {briefing.brand_voice && (
                                   <div>
                                        <p className="text-sm text-muted-foreground mb-2">Tom de Voz</p>
                                        <p className="text-foreground">{briefing.brand_voice}</p>
                                   </div>
                              )}
                         </Card>

                         {/* Documents Section */}
                         {briefing.brand_assets && Array.isArray(briefing.brand_assets) && briefing.brand_assets.length > 0 && (
                              <Card className="p-4 sm:p-6">
                                   <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                                        Documentos e Arquivos
                                   </h3>
                                   <div className="space-y-2">
                                        {briefing.brand_assets.map((doc: any) => (
                                             <div
                                                  key={doc.id}
                                                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                             >
                                                  <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0 w-full">
                                                       <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0 mt-0.5 sm:mt-0" />
                                                       <div className="min-w-0 flex-1">
                                                            <p className="text-xs sm:text-sm font-medium break-words">{doc.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                 {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'Tamanho desconhecido'}
                                                            </p>
                                                       </div>
                                                  </div>
                                                  <div className="flex gap-2 w-full sm:w-auto">
                                                       <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDownloadDocument(doc)}
                                                            title="Baixar documento"
                                                            className="flex-1 sm:flex-none"
                                                       >
                                                            <Download className="w-4 h-4 mr-2" />
                                                            Baixar
                                                       </Button>
                                                  </div>
                                             </div>
                                        ))}
                                   </div>
                              </Card>
                         )}

                         {/* Metadata */}
                         <Card className="p-4 sm:p-6">
                              <h3 className="font-semibold mb-3 text-sm sm:text-base">Informações do Sistema</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                                   <div>
                                        <p className="text-muted-foreground">Criado em</p>
                                        <p className="font-medium">
                                             {new Date(briefing.created_at).toLocaleDateString('pt-BR')}
                                        </p>
                                   </div>
                              </div>
                         </Card>
                    </div>
               </DialogContent>
          </Dialog>
     )
}
