import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TaskManagerSidebar } from "@/components/TaskManagerSidebar"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRoles } from "@/hooks/useRoles"
import { Loader2, UserPlus, Shield, User, Pencil, Trash2, HardDrive, Database, Server } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useAuth } from "@/hooks/useAuth"
import { Progress } from "@/components/ui/progress"

type StoragePlan = 'simples' | 'pro' | 'ultra'

interface StorageQuota {
     plan: StoragePlan
     storage_used: number
}

interface Profile {
     id: string
     user_id: string
     email: string
     full_name: string | null
     created_at: string
     roles: string[]
     storage_quota?: StorageQuota
}

const STORAGE_LIMITS: Record<StoragePlan, number> = {
     simples: 104857600,    // 100 MB
     pro: 524288000,        // 500 MB
     ultra: 2147483648      // 2 GB
}

const STORAGE_LABELS: Record<StoragePlan, string> = {
     simples: '100 MB',
     pro: '500 MB',
     ultra: '2 GB'
}

const formatBytes = (bytes: number): string => {
     if (bytes === 0) return '0 B'
     const k = 1024
     const sizes = ['B', 'KB', 'MB', 'GB']
     const i = Math.floor(Math.log(bytes) / Math.log(k))
     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const UserManagement = () => {
     const [users, setUsers] = useState<Profile[]>([])
     const [loading, setLoading] = useState(true)
     const [createLoading, setCreateLoading] = useState(false)
     const [isDialogOpen, setIsDialogOpen] = useState(false)
     const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
     const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
     const [selectedUser, setSelectedUser] = useState<Profile | null>(null)

     const [email, setEmail] = useState("")
     const [password, setPassword] = useState("")
     const [fullName, setFullName] = useState("")
     const [role, setRole] = useState<"admin" | "user">("user")
     const [storagePlan, setStoragePlan] = useState<StoragePlan>("simples")

     const [editEmail, setEditEmail] = useState("")
     const [editPassword, setEditPassword] = useState("")
     const [editFullName, setEditFullName] = useState("")
     const [editRole, setEditRole] = useState<"admin" | "user">("user")
     const [editStoragePlan, setEditStoragePlan] = useState<StoragePlan>("simples")
     const [editLoading, setEditLoading] = useState(false)
     const [deleteLoading, setDeleteLoading] = useState(false)

     const { toast } = useToast()
     const { isAdmin, loading: rolesLoading } = useRoles()
     const { user } = useAuth()

     const fetchUsers = async () => {
          try {
               const { data: profiles, error: profilesError } = await supabase
                    .from("profiles")
                    .select(`
          id,
          user_id,
          email,
          full_name,
          created_at
        `)
                    .order("created_at", { ascending: false })

               if (profilesError) throw profilesError

               // Buscar roles e quotas para cada usuário
               const usersWithRolesAndQuotas = await Promise.all(
                    profiles.map(async (profile) => {
                         const [rolesResult, quotaResult] = await Promise.all([
                              supabase
                                   .from("user_roles")
                                   .select("role")
                                   .eq("user_id", profile.user_id),
                              supabase
                                   .from("storage_quotas")
                                   .select("plan, storage_used")
                                   .eq("user_id", profile.user_id)
                                   .maybeSingle()
                         ])

                         return {
                              ...profile,
                              roles: rolesResult.data?.map((r) => r.role) || [],
                              storage_quota: quotaResult.data as StorageQuota | undefined
                         }
                    })
               )

               setUsers(usersWithRolesAndQuotas)
          } catch (error) {
               console.error("Error fetching users:", error)
               toast({
                    title: "Erro",
                    description: "Erro ao carregar usuários",
                    variant: "destructive"
               })
          } finally {
               setLoading(false)
          }
     }

     useEffect(() => {
          if (!rolesLoading && isAdmin) {
               fetchUsers()
          }
     }, [isAdmin, rolesLoading])

     const createUser = async (e: React.FormEvent) => {
          e.preventDefault()
          setCreateLoading(true)

          try {
               const { data, error } = await supabase.functions.invoke('create-user', {
                    body: {
                         email,
                         password,
                         fullName,
                         role,
                         storagePlan
                    }
               })

               if (error) throw error

               toast({
                    title: "Usuário criado com sucesso!",
                    description: `${email} foi adicionado ao sistema com plano ${storagePlan}`
               })

               setEmail("")
               setPassword("")
               setFullName("")
               setRole("user")
               setStoragePlan("simples")
               setIsDialogOpen(false)

               fetchUsers()
          } catch (error: any) {
               console.error('Create user error:', error)
               toast({
                    title: "Erro ao criar usuário",
                    description: error.message || "Erro interno do servidor",
                    variant: "destructive"
               })
          } finally {
               setCreateLoading(false)
          }
     }

     const openEditDialog = (profile: Profile) => {
          setSelectedUser(profile)
          setEditEmail(profile.email)
          setEditFullName(profile.full_name || "")
          setEditRole(profile.roles.includes("admin") ? "admin" : "user")
          setEditStoragePlan(profile.storage_quota?.plan || "simples")
          setEditPassword("")
          setIsEditDialogOpen(true)
     }

     const updateUser = async (e: React.FormEvent) => {
          e.preventDefault()
          if (!selectedUser) return

          setEditLoading(true)

          try {
               const updateData: any = {
                    userId: selectedUser.user_id,
                    email: editEmail,
                    fullName: editFullName,
                    role: editRole,
                    storagePlan: editStoragePlan
               }

               if (editPassword) {
                    updateData.password = editPassword
               }

               const { error } = await supabase.functions.invoke('update-user', {
                    body: updateData
               })

               if (error) throw error

               toast({
                    title: "Usuário atualizado!",
                    description: `${editEmail} foi atualizado com sucesso`
               })

               setIsEditDialogOpen(false)
               setSelectedUser(null)
               fetchUsers()
          } catch (error: any) {
               console.error('Update user error:', error)
               toast({
                    title: "Erro ao atualizar usuário",
                    description: error.message || "Erro interno do servidor",
                    variant: "destructive"
               })
          } finally {
               setEditLoading(false)
          }
     }

     const openDeleteDialog = (profile: Profile) => {
          setSelectedUser(profile)
          setIsDeleteDialogOpen(true)
     }

     const deleteUser = async () => {
          if (!selectedUser) return

          setDeleteLoading(true)

          try {
               const { error } = await supabase.functions.invoke('delete-user', {
                    body: { userId: selectedUser.user_id }
               })

               if (error) throw error

               toast({
                    title: "Usuário excluído!",
                    description: `${selectedUser.email} foi removido do sistema`
               })

               setIsDeleteDialogOpen(false)
               setSelectedUser(null)
               fetchUsers()
          } catch (error: any) {
               console.error('Delete user error:', error)
               toast({
                    title: "Erro ao excluir usuário",
                    description: error.message || "Erro interno do servidor",
                    variant: "destructive"
               })
          } finally {
               setDeleteLoading(false)
          }
     }

     const getStoragePlanBadge = (plan: StoragePlan) => {
          const variants: Record<StoragePlan, { variant: "default" | "secondary" | "outline", icon: React.ReactNode, className: string }> = {
               simples: { variant: "secondary", icon: <HardDrive className="h-3 w-3 mr-1" />, className: "" },
               pro: { variant: "default", icon: <Database className="h-3 w-3 mr-1" />, className: "bg-blue-500 hover:bg-blue-600" },
               ultra: { variant: "default", icon: <Server className="h-3 w-3 mr-1" />, className: "bg-purple-500 hover:bg-purple-600" }
          }
          const config = variants[plan]
          return (
               <Badge variant={config.variant} className={config.className}>
                    {config.icon}
                    {plan.charAt(0).toUpperCase() + plan.slice(1)}
               </Badge>
          )
     }

     const getStorageUsageInfo = (quota?: StorageQuota) => {
          if (!quota) return null

          const limit = STORAGE_LIMITS[quota.plan]
          const percentage = Math.min((quota.storage_used / limit) * 100, 100)

          return (
               <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                         <span>{formatBytes(quota.storage_used)}</span>
                         <span>{STORAGE_LABELS[quota.plan]}</span>
                    </div>
                    <Progress value={percentage} className="h-1.5" />
                    <div className="text-xs text-muted-foreground text-right">
                         {percentage.toFixed(1)}%
                    </div>
               </div>
          )
     }

     if (rolesLoading) {
          return (
               <div className="min-h-screen bg-background">
                    <SidebarProvider>
                         <div className="flex w-full">
                              <TaskManagerSidebar />
                              <div className="flex-1 flex items-center justify-center">
                                   <Loader2 className="h-8 w-8 animate-spin" />
                              </div>
                         </div>
                    </SidebarProvider>
               </div>
          )
     }

     if (!isAdmin) {
          return (
               <div className="min-h-screen bg-background">
                    <SidebarProvider>
                         <div className="flex w-full">
                              <TaskManagerSidebar />
                              <main className="flex-1 p-6">
                                   <Card>
                                        <CardContent className="pt-6">
                                             <div className="text-center">
                                                  <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                                  <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
                                                  <p className="text-muted-foreground">
                                                       Você não tem permissão para acessar esta página.
                                                  </p>
                                             </div>
                                        </CardContent>
                                   </Card>
                              </main>
                         </div>
                    </SidebarProvider>
               </div>
          )
     }

     return (
          <div className="min-h-screen bg-background">
               <SidebarProvider>
                    <div className="flex w-full">
                         <TaskManagerSidebar />

                         <main className="flex-1 p-3 sm:p-6">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                   <div className="flex items-center gap-2 sm:gap-4">
                                        <SidebarTrigger className="lg:hidden h-12 w-12 p-3 [&_svg]:w-6 [&_svg]:h-6" />
                                        <div>
                                             <h1 className="text-2xl sm:text-3xl font-bold">Gerenciar Usuários</h1>
                                             <p className="text-sm sm:text-base text-muted-foreground">
                                                  Crie e gerencie contas de usuário do sistema
                                             </p>
                                        </div>
                                   </div>

                                   <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                        <DialogTrigger asChild>
                                             <Button className="w-full sm:w-auto">
                                                  <UserPlus className="h-4 w-4 mr-2" />
                                                  Criar Usuário
                                             </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px] w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
                                             <DialogHeader>
                                                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                                                  <DialogDescription>
                                                       Adicione um novo usuário ao sistema
                                                  </DialogDescription>
                                             </DialogHeader>
                                             <form onSubmit={createUser} className="space-y-4">
                                                  <div className="space-y-2">
                                                       <Label htmlFor="email">Email</Label>
                                                       <Input
                                                            id="email"
                                                            type="email"
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            placeholder="usuario@exemplo.com"
                                                            required
                                                       />
                                                  </div>
                                                  <div className="space-y-2">
                                                       <Label htmlFor="password">Senha</Label>
                                                       <Input
                                                            id="password"
                                                            type="password"
                                                            value={password}
                                                            onChange={(e) => setPassword(e.target.value)}
                                                            placeholder="••••••••"
                                                            required
                                                            minLength={6}
                                                       />
                                                  </div>
                                                  <div className="space-y-2">
                                                       <Label htmlFor="fullName">Nome Completo</Label>
                                                       <Input
                                                            id="fullName"
                                                            type="text"
                                                            value={fullName}
                                                            onChange={(e) => setFullName(e.target.value)}
                                                            placeholder="Nome do usuário"
                                                            required
                                                       />
                                                  </div>
                                                  <div className="space-y-2">
                                                       <Label>Papel</Label>
                                                       <Select value={role} onValueChange={(value: "admin" | "user") => setRole(value)}>
                                                            <SelectTrigger>
                                                                 <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                 <SelectItem value="user">
                                                                      <div className="flex items-center gap-2">
                                                                           <User className="h-4 w-4" />
                                                                           Usuário
                                                                      </div>
                                                                 </SelectItem>
                                                                 <SelectItem value="admin">
                                                                      <div className="flex items-center gap-2">
                                                                           <Shield className="h-4 w-4" />
                                                                           Administrador
                                                                      </div>
                                                                 </SelectItem>
                                                            </SelectContent>
                                                       </Select>
                                                  </div>
                                                  <div className="space-y-2">
                                                       <Label>Plano de Armazenamento</Label>
                                                       <Select value={storagePlan} onValueChange={(value: StoragePlan) => setStoragePlan(value)}>
                                                            <SelectTrigger>
                                                                 <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                 <SelectItem value="simples">
                                                                      <div className="flex items-center gap-2">
                                                                           <HardDrive className="h-4 w-4" />
                                                                           Simples (100 MB)
                                                                      </div>
                                                                 </SelectItem>
                                                                 <SelectItem value="pro">
                                                                      <div className="flex items-center gap-2">
                                                                           <Database className="h-4 w-4 text-blue-500" />
                                                                           Pro (500 MB)
                                                                      </div>
                                                                 </SelectItem>
                                                                 <SelectItem value="ultra">
                                                                      <div className="flex items-center gap-2">
                                                                           <Server className="h-4 w-4 text-purple-500" />
                                                                           Ultra (2 GB)
                                                                      </div>
                                                                 </SelectItem>
                                                            </SelectContent>
                                                       </Select>
                                                  </div>
                                                  <Button type="submit" className="w-full" disabled={createLoading}>
                                                       {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                       Criar Usuário
                                                  </Button>
                                             </form>
                                        </DialogContent>
                                   </Dialog>
                              </div>

                              <Card>
                                   <CardHeader>
                                        <CardTitle>Usuários do Sistema</CardTitle>
                                        <CardDescription>
                                             Lista de todos os usuários cadastrados
                                        </CardDescription>
                                   </CardHeader>
                                   <CardContent>
                                        {loading ? (
                                             <div className="flex items-center justify-center p-8">
                                                  <Loader2 className="h-8 w-8 animate-spin" />
                                             </div>
                                        ) : (
                                             <>
                                                  {/* Desktop Table */}
                                                  <div className="hidden lg:block overflow-x-auto">
                                                       <Table>
                                                            <TableHeader>
                                                                 <TableRow>
                                                                      <TableHead>Nome</TableHead>
                                                                      <TableHead>Email</TableHead>
                                                                      <TableHead>Papel</TableHead>
                                                                      <TableHead>Armazenamento</TableHead>
                                                                      <TableHead>Uso</TableHead>
                                                                      <TableHead>Criado em</TableHead>
                                                                      <TableHead className="text-right">Ações</TableHead>
                                                                 </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                 {users.map((profile) => (
                                                                      <TableRow key={profile.id}>
                                                                           <TableCell className="font-medium">
                                                                                {profile.full_name || "Não informado"}
                                                                           </TableCell>
                                                                           <TableCell>{profile.email}</TableCell>
                                                                           <TableCell>
                                                                                <div className="flex gap-1">
                                                                                     {profile.roles.map((role) => (
                                                                                          <Badge
                                                                                               key={role}
                                                                                               variant={role === "admin" ? "default" : "secondary"}
                                                                                          >
                                                                                               {role === "admin" ? (
                                                                                                    <><Shield className="h-3 w-3 mr-1" /> Admin</>
                                                                                               ) : (
                                                                                                    <><User className="h-3 w-3 mr-1" /> Usuário</>
                                                                                               )}
                                                                                          </Badge>
                                                                                     ))}
                                                                                </div>
                                                                           </TableCell>
                                                                           <TableCell>
                                                                                {profile.storage_quota && getStoragePlanBadge(profile.storage_quota.plan)}
                                                                           </TableCell>
                                                                           <TableCell className="min-w-[120px]">
                                                                                {getStorageUsageInfo(profile.storage_quota)}
                                                                           </TableCell>
                                                                           <TableCell>
                                                                                {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                                                                           </TableCell>
                                                                           <TableCell className="text-right">
                                                                                <div className="flex justify-end gap-2">
                                                                                     <Button
                                                                                          variant="ghost"
                                                                                          size="icon"
                                                                                          onClick={() => openEditDialog(profile)}
                                                                                     >
                                                                                          <Pencil className="h-4 w-4" />
                                                                                     </Button>
                                                                                     <Button
                                                                                          variant="ghost"
                                                                                          size="icon"
                                                                                          onClick={() => openDeleteDialog(profile)}
                                                                                          disabled={profile.user_id === user?.id}
                                                                                     >
                                                                                          <Trash2 className="h-4 w-4" />
                                                                                     </Button>
                                                                                </div>
                                                                           </TableCell>
                                                                      </TableRow>
                                                                 ))}
                                                            </TableBody>
                                                       </Table>
                                                  </div>

                                                  {/* Mobile/Tablet Cards */}
                                                  <div className="lg:hidden space-y-4">
                                                       {users.map((profile) => (
                                                            <Card key={profile.id}>
                                                                 <CardContent className="pt-4 space-y-3">
                                                                      <div>
                                                                           <p className="text-xs text-muted-foreground mb-1">Nome</p>
                                                                           <p className="font-medium">{profile.full_name || "Não informado"}</p>
                                                                      </div>
                                                                      <div>
                                                                           <p className="text-xs text-muted-foreground mb-1">Email</p>
                                                                           <p className="text-sm break-all">{profile.email}</p>
                                                                      </div>
                                                                      <div className="flex gap-4">
                                                                           <div>
                                                                                <p className="text-xs text-muted-foreground mb-2">Papel</p>
                                                                                <div className="flex gap-1 flex-wrap">
                                                                                     {profile.roles.map((role) => (
                                                                                          <Badge
                                                                                               key={role}
                                                                                               variant={role === "admin" ? "default" : "secondary"}
                                                                                          >
                                                                                               {role === "admin" ? (
                                                                                                    <><Shield className="h-3 w-3 mr-1" /> Admin</>
                                                                                               ) : (
                                                                                                    <><User className="h-3 w-3 mr-1" /> Usuário</>
                                                                                               )}
                                                                                          </Badge>
                                                                                     ))}
                                                                                </div>
                                                                           </div>
                                                                           <div>
                                                                                <p className="text-xs text-muted-foreground mb-2">Plano</p>
                                                                                {profile.storage_quota && getStoragePlanBadge(profile.storage_quota.plan)}
                                                                           </div>
                                                                      </div>
                                                                      <div>
                                                                           <p className="text-xs text-muted-foreground mb-2">Uso de Armazenamento</p>
                                                                           {getStorageUsageInfo(profile.storage_quota)}
                                                                      </div>
                                                                      <div>
                                                                           <p className="text-xs text-muted-foreground mb-1">Criado em</p>
                                                                           <p className="text-sm">{new Date(profile.created_at).toLocaleDateString("pt-BR")}</p>
                                                                      </div>
                                                                      <div className="flex gap-2 pt-2">
                                                                           <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => openEditDialog(profile)}
                                                                                className="flex-1"
                                                                           >
                                                                                <Pencil className="h-4 w-4 mr-2" />
                                                                                Editar
                                                                           </Button>
                                                                           <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => openDeleteDialog(profile)}
                                                                                disabled={profile.user_id === user?.id}
                                                                                className="flex-1"
                                                                           >
                                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                                Excluir
                                                                           </Button>
                                                                      </div>
                                                                 </CardContent>
                                                            </Card>
                                                       ))}
                                                  </div>
                                             </>
                                        )}
                                   </CardContent>
                              </Card>

                              {/* Edit Dialog */}
                              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                   <DialogContent className="sm:max-w-[425px] w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                             <DialogTitle>Editar Usuário</DialogTitle>
                                             <DialogDescription>
                                                  Atualize os dados do usuário
                                             </DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={updateUser} className="space-y-4">
                                             <div className="space-y-2">
                                                  <Label htmlFor="editEmail">Email</Label>
                                                  <Input
                                                       id="editEmail"
                                                       type="email"
                                                       value={editEmail}
                                                       onChange={(e) => setEditEmail(e.target.value)}
                                                       required
                                                  />
                                             </div>
                                             <div className="space-y-2">
                                                  <Label htmlFor="editPassword">Nova Senha (opcional)</Label>
                                                  <Input
                                                       id="editPassword"
                                                       type="password"
                                                       value={editPassword}
                                                       onChange={(e) => setEditPassword(e.target.value)}
                                                       placeholder="Deixe em branco para não alterar"
                                                       minLength={6}
                                                  />
                                             </div>
                                             <div className="space-y-2">
                                                  <Label htmlFor="editFullName">Nome Completo</Label>
                                                  <Input
                                                       id="editFullName"
                                                       type="text"
                                                       value={editFullName}
                                                       onChange={(e) => setEditFullName(e.target.value)}
                                                       required
                                                  />
                                             </div>
                                             <div className="space-y-2">
                                                  <Label>Papel</Label>
                                                  <Select value={editRole} onValueChange={(value: "admin" | "user") => setEditRole(value)}>
                                                       <SelectTrigger>
                                                            <SelectValue />
                                                       </SelectTrigger>
                                                       <SelectContent>
                                                            <SelectItem value="user">
                                                                 <div className="flex items-center gap-2">
                                                                      <User className="h-4 w-4" />
                                                                      Usuário
                                                                 </div>
                                                            </SelectItem>
                                                            <SelectItem value="admin">
                                                                 <div className="flex items-center gap-2">
                                                                      <Shield className="h-4 w-4" />
                                                                      Administrador
                                                                 </div>
                                                            </SelectItem>
                                                       </SelectContent>
                                                  </Select>
                                             </div>
                                             <div className="space-y-2">
                                                  <Label>Plano de Armazenamento</Label>
                                                  <Select value={editStoragePlan} onValueChange={(value: StoragePlan) => setEditStoragePlan(value)}>
                                                       <SelectTrigger>
                                                            <SelectValue />
                                                       </SelectTrigger>
                                                       <SelectContent>
                                                            <SelectItem value="simples">
                                                                 <div className="flex items-center gap-2">
                                                                      <HardDrive className="h-4 w-4" />
                                                                      Simples (100 MB)
                                                                 </div>
                                                            </SelectItem>
                                                            <SelectItem value="pro">
                                                                 <div className="flex items-center gap-2">
                                                                      <Database className="h-4 w-4 text-blue-500" />
                                                                      Pro (500 MB)
                                                                 </div>
                                                            </SelectItem>
                                                            <SelectItem value="ultra">
                                                                 <div className="flex items-center gap-2">
                                                                      <Server className="h-4 w-4 text-purple-500" />
                                                                      Ultra (2 GB)
                                                                 </div>
                                                            </SelectItem>
                                                       </SelectContent>
                                                  </Select>
                                             </div>
                                             <Button type="submit" className="w-full" disabled={editLoading}>
                                                  {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                  Salvar Alterações
                                             </Button>
                                        </form>
                                   </DialogContent>
                              </Dialog>

                              {/* Delete Confirmation Dialog */}
                              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                   <AlertDialogContent>
                                        <AlertDialogHeader>
                                             <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                             <AlertDialogDescription>
                                                  Esta ação não pode ser desfeita. O usuário <strong>{selectedUser?.email}</strong> será permanentemente excluído do sistema.
                                             </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                             <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                             <AlertDialogAction
                                                  onClick={deleteUser}
                                                  disabled={deleteLoading}
                                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                             >
                                                  {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                  Excluir
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

export default UserManagement
