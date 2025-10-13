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
import { Loader2, UserPlus, Shield, User } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface Profile {
  id: string
  user_id: string
  email: string
  full_name: string | null
  created_at: string
  roles: string[]
}

const UserManagement = () => {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [createLoading, setCreateLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<"admin" | "user">("user")

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

      // Buscar roles para cada usuário
      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: userRoles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.user_id)

          return {
            ...profile,
            roles: userRoles?.map((r) => r.role) || []
          }
        })
      )

      setUsers(usersWithRoles)
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
      // Criar usuário via edge function
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email,
          password,
          fullName,
          role
        }
      })

      if (error) throw error

      toast({
        title: "Usuário criado com sucesso!",
        description: `${email} foi adicionado ao sistema`
      })

      // Resetar form
      setEmail("")
      setPassword("")
      setFullName("")
      setRole("user")
      setIsDialogOpen(false)
      
      // Recarregar lista
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
                <SidebarTrigger className="lg:hidden" />
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
          <DialogContent className="sm:max-w-[425px] w-[95vw] sm:w-full">
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
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
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
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead>Criado em</TableHead>
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
                          {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden space-y-4">
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
                        <p className="text-xs text-muted-foreground mb-1">Criado em</p>
                        <p className="text-sm">{new Date(profile.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
          </main>
        </div>
      </SidebarProvider>
    </div>
  )
}

export default UserManagement