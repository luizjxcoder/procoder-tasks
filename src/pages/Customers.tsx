import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { TaskManagerSidebar } from "@/components/TaskManagerSidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Star, Plus, Trash2, Edit2, Eye, Users as UsersIcon, MoreVertical } from "lucide-react"
import { CustomerDetailsModal } from "@/components/CustomerDetailsModal"
import { useIsMobile } from "@/hooks/use-mobile"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
     Table,
     TableBody,
     TableCell,
     TableHead,
     TableHeader,
     TableRow,
} from "@/components/ui/table"
import {
     Dialog,
     DialogContent,
     DialogDescription,
     DialogHeader,
     DialogTitle,
     DialogTrigger,
} from "@/components/ui/dialog"
import {
     AlertDialog,
     AlertDialogAction,
     AlertDialogCancel,
     AlertDialogContent,
     AlertDialogDescription,
     AlertDialogFooter,
     AlertDialogHeader,
     AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Customer {
     id: string
     user_id: string
     name: string
     phone: string | null
     email: string | null
     social_media: string | null
     company_name: string | null
     segment: string | null
     cpf_cnpj: string | null
     rating: number | null
     created_at: string
     updated_at: string
}

interface CustomerFormData {
     name: string
     phone: string
     email: string
     social_media: string
     company_name: string
     segment: string
     cpf_cnpj: string
     rating: number
}

export default function Customers() {
     const { user } = useAuth()
     const { toast } = useToast()
     const isMobile = useIsMobile()
     const [customers, setCustomers] = useState<Customer[]>([])
     const [loading, setLoading] = useState(true)
     const [isDialogOpen, setIsDialogOpen] = useState(false)
     const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
     const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null)
     const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null)
     const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
     const [formData, setFormData] = useState<CustomerFormData>({
          name: "",
          phone: "",
          email: "",
          social_media: "",
          company_name: "",
          segment: "",
          cpf_cnpj: "",
          rating: 3
     })

     useEffect(() => {
          if (user) {
               fetchCustomers()
          }
     }, [user])

     const fetchCustomers = async () => {
          try {
               const { data, error } = await supabase
                    .from("customers")
                    .select("*")
                    .order("created_at", { ascending: false })

               if (error) throw error
               setCustomers(data || [])
          } catch (error) {
               console.error("Error fetching customers:", error)
               toast({
                    title: "Erro ao carregar clientes",
                    description: "Não foi possível carregar os clientes",
                    variant: "destructive"
               })
          } finally {
               setLoading(false)
          }
     }

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault()

          if (!user) return

          try {
               const customerData = {
                    user_id: user.id,
                    name: formData.name,
                    phone: formData.phone || null,
                    email: formData.email || null,
                    social_media: formData.social_media || null,
                    company_name: formData.company_name || null,
                    segment: formData.segment || null,
                    cpf_cnpj: formData.cpf_cnpj || null,
                    rating: formData.rating
               }

               if (editingCustomer) {
                    const { error } = await supabase
                         .from("customers")
                         .update(customerData)
                         .eq("id", editingCustomer.id)

                    if (error) throw error

                    toast({
                         title: "Cliente atualizado",
                         description: "Cliente atualizado com sucesso"
                    })
               } else {
                    const { error } = await supabase
                         .from("customers")
                         .insert([customerData])

                    if (error) throw error

                    toast({
                         title: "Cliente cadastrado",
                         description: "Cliente cadastrado com sucesso"
                    })
               }

               setIsDialogOpen(false)
               resetForm()
               fetchCustomers()
          } catch (error) {
               console.error("Error saving customer:", error)
               toast({
                    title: "Erro ao salvar cliente",
                    description: "Não foi possível salvar o cliente",
                    variant: "destructive"
               })
          }
     }

     const handleView = (customer: Customer) => {
          setViewingCustomer(customer)
          setIsDetailsModalOpen(true)
     }

     const handleEdit = (customer: Customer) => {
          setEditingCustomer(customer)
          setFormData({
               name: customer.name,
               phone: customer.phone || "",
               email: customer.email || "",
               social_media: customer.social_media || "",
               company_name: customer.company_name || "",
               segment: customer.segment || "",
               cpf_cnpj: customer.cpf_cnpj || "",
               rating: customer.rating || 3
          })
          setIsDialogOpen(true)
     }

     const handleDelete = async () => {
          if (!deleteCustomerId) return

          try {
               const { error } = await supabase
                    .from("customers")
                    .delete()
                    .eq("id", deleteCustomerId)

               if (error) throw error

               toast({
                    title: "Cliente excluído",
                    description: "Cliente excluído com sucesso"
               })

               fetchCustomers()
          } catch (error) {
               console.error("Error deleting customer:", error)
               toast({
                    title: "Erro ao excluir cliente",
                    description: "Não foi possível excluir o cliente",
                    variant: "destructive"
               })
          } finally {
               setDeleteCustomerId(null)
          }
     }

     const resetForm = () => {
          setFormData({
               name: "",
               phone: "",
               email: "",
               social_media: "",
               company_name: "",
               segment: "",
               cpf_cnpj: "",
               rating: 3
          })
          setEditingCustomer(null)
     }

     const handleDialogChange = (open: boolean) => {
          setIsDialogOpen(open)
          if (!open) {
               resetForm()
          }
     }

     const renderStars = (rating: number, onChange?: (rating: number) => void) => {
          return (
               <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                         <Star
                              key={star}
                              className={`w-5 h-5 ${star <= rating
                                   ? "fill-yellow-400 text-yellow-400"
                                   : "text-muted-foreground"
                                   } ${onChange ? "cursor-pointer" : ""}`}
                              onClick={() => onChange?.(star)}
                         />
                    ))}
               </div>
          )
     }

     // Mobile Card Component
     const CustomerCard = ({ customer }: { customer: Customer }) => (
          <Card className="border border-border">
               <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                         <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm text-card-foreground truncate">
                                   {customer.name}
                              </h3>
                              {customer.company_name && (
                                   <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                        <UsersIcon className="w-3 h-3" />
                                        <span className="truncate">{customer.company_name}</span>
                                   </div>
                              )}
                         </div>
                         <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                   <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                        <MoreVertical className="w-3.5 h-3.5" />
                                   </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="z-50">
                                   <DropdownMenuItem onClick={() => handleView(customer)}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        Ver detalhes
                                   </DropdownMenuItem>
                                   <DropdownMenuItem onClick={() => handleEdit(customer)}>
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        Editar
                                   </DropdownMenuItem>
                                   <DropdownMenuItem
                                        onClick={() => setDeleteCustomerId(customer.id)}
                                        className="text-destructive focus:text-destructive"
                                   >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Excluir
                                   </DropdownMenuItem>
                              </DropdownMenuContent>
                         </DropdownMenu>
                    </div>

                    <div className="space-y-2">
                         {customer.email && (
                              <div className="flex items-center gap-1 text-xs">
                                   <span className="text-muted-foreground">Email:</span>
                                   <span className="font-medium truncate">{customer.email}</span>
                              </div>
                         )}

                         {customer.phone && (
                              <div className="flex items-center gap-1 text-xs">
                                   <span className="text-muted-foreground">Telefone:</span>
                                   <span className="font-medium">{customer.phone}</span>
                              </div>
                         )}

                         {customer.segment && (
                              <div className="flex items-center gap-1 text-xs">
                                   <span className="text-muted-foreground">Segmento:</span>
                                   <span className="font-medium truncate">{customer.segment}</span>
                              </div>
                         )}

                         {customer.rating && (
                              <div className="flex items-center gap-1 pt-1">
                                   {renderStars(customer.rating)}
                              </div>
                         )}
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
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                                   <div className="flex items-center gap-4">
                                        <SidebarTrigger className="lg:hidden" />
                                        <div>
                                             <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                                                  <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                                  Clientes
                                             </h1>
                                             <p className="text-sm sm:text-base text-muted-foreground">Gerencie seus clientes</p>
                                        </div>
                                   </div>

                                   <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                                        <DialogTrigger asChild>
                                             <Button className="w-full sm:w-auto">
                                                  <Plus className="w-4 h-4 mr-2" />
                                                  <span className="hidden sm:inline">Novo Cliente</span>
                                                  <span className="sm:hidden">Novo</span>
                                             </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                                             <DialogHeader>
                                                  <DialogTitle>
                                                       {editingCustomer ? "Editar Cliente" : "Novo Cliente"}
                                                  </DialogTitle>
                                                  <DialogDescription>
                                                       Preencha os dados do cliente
                                                  </DialogDescription>
                                             </DialogHeader>
                                             <form onSubmit={handleSubmit} className="space-y-4">
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                       <div className="space-y-2">
                                                            <Label htmlFor="name">Nome *</Label>
                                                            <Input
                                                                 id="name"
                                                                 value={formData.name}
                                                                 onChange={(e) =>
                                                                      setFormData({ ...formData, name: e.target.value })
                                                                 }
                                                                 required
                                                            />
                                                       </div>
                                                       <div className="space-y-2">
                                                            <Label htmlFor="phone">Telefone</Label>
                                                            <Input
                                                                 id="phone"
                                                                 type="tel"
                                                                 value={formData.phone}
                                                                 onChange={(e) =>
                                                                      setFormData({ ...formData, phone: e.target.value })
                                                                 }
                                                            />
                                                       </div>
                                                       <div className="space-y-2">
                                                            <Label htmlFor="email">Email</Label>
                                                            <Input
                                                                 id="email"
                                                                 type="email"
                                                                 value={formData.email}
                                                                 onChange={(e) =>
                                                                      setFormData({ ...formData, email: e.target.value })
                                                                 }
                                                            />
                                                       </div>
                                                       <div className="space-y-2">
                                                            <Label htmlFor="social_media">Redes Sociais</Label>
                                                            <Input
                                                                 id="social_media"
                                                                 placeholder="Instagram, Facebook, LinkedIn (separados por vírgula)"
                                                                 value={formData.social_media}
                                                                 onChange={(e) =>
                                                                      setFormData({
                                                                           ...formData,
                                                                           social_media: e.target.value
                                                                      })
                                                                 }
                                                            />
                                                       </div>
                                                       <div className="space-y-2">
                                                            <Label htmlFor="company_name">Nome da Empresa</Label>
                                                            <Input
                                                                 id="company_name"
                                                                 value={formData.company_name}
                                                                 onChange={(e) =>
                                                                      setFormData({
                                                                           ...formData,
                                                                           company_name: e.target.value
                                                                      })
                                                                 }
                                                            />
                                                       </div>
                                                       <div className="space-y-2">
                                                            <Label htmlFor="segment">Segmento</Label>
                                                            <Input
                                                                 id="segment"
                                                                 placeholder="Ex: Varejo, Tecnologia, Serviços"
                                                                 value={formData.segment}
                                                                 onChange={(e) =>
                                                                      setFormData({ ...formData, segment: e.target.value })
                                                                 }
                                                            />
                                                       </div>
                                                       <div className="space-y-2">
                                                            <Label htmlFor="cpf_cnpj">CPF ou CNPJ</Label>
                                                            <Input
                                                                 id="cpf_cnpj"
                                                                 value={formData.cpf_cnpj}
                                                                 onChange={(e) =>
                                                                      setFormData({ ...formData, cpf_cnpj: e.target.value })
                                                                 }
                                                            />
                                                       </div>
                                                       <div className="space-y-2">
                                                            <Label>Avaliação</Label>
                                                            {renderStars(formData.rating, (rating) =>
                                                                 setFormData({ ...formData, rating })
                                                            )}
                                                       </div>
                                                  </div>
                                                  <div className="flex justify-end gap-2 pt-4">
                                                       <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => setIsDialogOpen(false)}
                                                       >
                                                            Cancelar
                                                       </Button>
                                                       <Button type="submit">
                                                            {editingCustomer ? "Atualizar" : "Cadastrar"}
                                                       </Button>
                                                  </div>
                                             </form>
                                        </DialogContent>
                                   </Dialog>
                              </div>

                              {/* Customers List */}
                              <Card className="bg-gradient-card border border-border shadow-card">
                                   <CardHeader>
                                        <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                             <span>Lista de Clientes</span>
                                             <span className="text-sm text-muted-foreground">{customers.length} {customers.length === 1 ? 'cliente' : 'clientes'}</span>
                                        </CardTitle>
                                   </CardHeader>
                                   <CardContent>
                                        {loading ? (
                                             <div className="flex items-center justify-center py-8">
                                                  <div className="text-muted-foreground">Carregando clientes...</div>
                                             </div>
                                        ) : customers.length === 0 ? (
                                             <div className="flex flex-col items-center justify-center py-12 text-center">
                                                  <div className="mb-4 text-muted-foreground">
                                                       Nenhum cliente cadastrado
                                                  </div>
                                                  <Button
                                                       onClick={() => setIsDialogOpen(true)}
                                                       variant="outline"
                                                  >
                                                       <Plus className="w-4 h-4 mr-2" />
                                                       Cadastrar Primeiro Cliente
                                                  </Button>
                                             </div>
                                        ) : isMobile ? (
                                             // Mobile Card View
                                             <div className="space-y-4">
                                                  {customers.map((customer) => (
                                                       <CustomerCard key={customer.id} customer={customer} />
                                                  ))}
                                             </div>
                                        ) : (
                                             // Desktop Table View
                                             <div className="overflow-x-auto">
                                                  <Table>
                                                       <TableHeader>
                                                            <TableRow>
                                                                 <TableHead>Nome</TableHead>
                                                                 <TableHead>Empresa</TableHead>
                                                                 <TableHead>Email</TableHead>
                                                                 <TableHead>Telefone</TableHead>
                                                                 <TableHead>Segmento</TableHead>
                                                                 <TableHead>Avaliação</TableHead>
                                                                 <TableHead className="text-right">Ações</TableHead>
                                                            </TableRow>
                                                       </TableHeader>
                                                       <TableBody>
                                                            {customers.map((customer) => (
                                                                 <TableRow key={customer.id}>
                                                                      <TableCell className="font-medium">
                                                                           {customer.name}
                                                                      </TableCell>
                                                                      <TableCell>
                                                                           {customer.company_name || "-"}
                                                                      </TableCell>
                                                                      <TableCell>{customer.email || "-"}</TableCell>
                                                                      <TableCell>{customer.phone || "-"}</TableCell>
                                                                      <TableCell>{customer.segment || "-"}</TableCell>
                                                                      <TableCell>
                                                                           {customer.rating
                                                                                ? renderStars(customer.rating)
                                                                                : "-"}
                                                                      </TableCell>
                                                                      <TableCell className="text-right">
                                                                           <div className="flex justify-end gap-2">
                                                                                <Button
                                                                                     variant="ghost"
                                                                                     size="icon"
                                                                                     onClick={() => handleView(customer)}
                                                                                     title="Visualizar"
                                                                                >
                                                                                     <Eye className="w-4 h-4" />
                                                                                </Button>
                                                                                <Button
                                                                                     variant="ghost"
                                                                                     size="icon"
                                                                                     onClick={() => handleEdit(customer)}
                                                                                     title="Editar"
                                                                                >
                                                                                     <Edit2 className="w-4 h-4" />
                                                                                </Button>
                                                                                <Button
                                                                                     variant="ghost"
                                                                                     size="icon"
                                                                                     onClick={() => setDeleteCustomerId(customer.id)}
                                                                                     title="Excluir"
                                                                                >
                                                                                     <Trash2 className="w-4 h-4 text-destructive" />
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
                         </main>
                    </div>

                    <CustomerDetailsModal
                         customer={viewingCustomer}
                         open={isDetailsModalOpen}
                         onOpenChange={setIsDetailsModalOpen}
                    />

                    <AlertDialog
                         open={deleteCustomerId !== null}
                         onOpenChange={() => setDeleteCustomerId(null)}
                    >
                         <AlertDialogContent>
                              <AlertDialogHeader>
                                   <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                   <AlertDialogDescription>
                                        Tem certeza que deseja excluir este cliente? Esta ação não pode ser
                                        desfeita.
                                   </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                   <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                   <AlertDialogAction
                                        onClick={handleDelete}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                   >
                                        Excluir
                                   </AlertDialogAction>
                              </AlertDialogFooter>
                         </AlertDialogContent>
                    </AlertDialog>
               </SidebarProvider>
          </div>
     )
}
