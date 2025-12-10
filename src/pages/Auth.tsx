import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft, Mail } from "lucide-react"

const Auth = () => {
     const [email, setEmail] = useState("")
     const [password, setPassword] = useState("")
     const [loading, setLoading] = useState(false)
     const [forgotPasswordMode, setForgotPasswordMode] = useState(false)
     const [resetEmail, setResetEmail] = useState("")
     const navigate = useNavigate()
     const { toast } = useToast()

     useEffect(() => {
          // Check if user is already logged in
          const checkUser = async () => {
               const { data: { session } } = await supabase.auth.getSession()
               if (session) {
                    navigate("/")
               }
          }
          checkUser()
     }, [navigate])

     const handleAuth = async (e: React.FormEvent) => {
          e.preventDefault()
          setLoading(true)

          try {
               const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
               })

               if (error) throw error

               toast({
                    title: "Login realizado com sucesso!",
                    description: "Bem-vindo de volta!"
               })
               navigate("/")
          } catch (error: any) {
               let errorMessage = "Ocorreu um erro inesperado"

               if (error.message.includes("Invalid login credentials")) {
                    errorMessage = "Email ou senha incorretos"
               } else if (error.message.includes("User already registered")) {
                    errorMessage = "Este email já está cadastrado"
               } else if (error.message.includes("Password should be at least 6 characters")) {
                    errorMessage = "A senha deve ter pelo menos 6 caracteres"
               } else if (error.message.includes("Unable to validate email address")) {
                    errorMessage = "Email inválido"
               }

               toast({
                    title: "Erro de autenticação",
                    description: errorMessage,
                    variant: "destructive"
               })
          } finally {
               setLoading(false)
          }
     }

     const handleForgotPassword = async (e: React.FormEvent) => {
          e.preventDefault()
          setLoading(true)

          try {
               const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                    redirectTo: `${window.location.origin}/reset-password`
               })

               if (error) throw error

               toast({
                    title: "Email enviado!",
                    description: "Verifique sua caixa de entrada para redefinir sua senha"
               })
               setForgotPasswordMode(false)
               setResetEmail("")
          } catch (error: any) {
               toast({
                    title: "Erro",
                    description: "Não foi possível enviar o email de recuperação. Verifique se o email está correto.",
                    variant: "destructive"
               })
          } finally {
               setLoading(false)
          }
     }

     if (forgotPasswordMode) {
          return (
               <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4">
                    <Card className="w-full max-w-md mx-2 sm:mx-0">
                         <CardHeader className="text-center p-4 sm:p-6">
                              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                   <Mail className="w-6 h-6 text-primary" />
                              </div>
                              <CardTitle className="text-xl sm:text-2xl font-bold">
                                   Esqueceu sua senha?
                              </CardTitle>
                              <CardDescription>
                                   Digite seu email para receber um link de recuperação
                              </CardDescription>
                         </CardHeader>
                         <CardContent className="p-4 sm:p-6 pt-0">
                              <form onSubmit={handleForgotPassword} className="space-y-4">
                                   <div className="space-y-2">
                                        <Label htmlFor="resetEmail">Email</Label>
                                        <Input
                                             id="resetEmail"
                                             type="email"
                                             value={resetEmail}
                                             onChange={(e) => setResetEmail(e.target.value)}
                                             placeholder="seu@email.com"
                                             required
                                        />
                                   </div>
                                   <Button
                                        type="submit"
                                        className="w-full bg-gradient-primary hover:bg-gradient-primary/90"
                                        disabled={loading}
                                   >
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Enviar Link de Recuperação
                                   </Button>
                                   <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full"
                                        onClick={() => {
                                             setForgotPasswordMode(false)
                                             setResetEmail("")
                                        }}
                                   >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Voltar para o login
                                   </Button>
                              </form>
                         </CardContent>
                    </Card>
               </div>
          )
     }

     return (
          <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4">
               <Card className="w-full max-w-md mx-2 sm:mx-0">
                    <CardHeader className="text-center p-4 sm:p-6">
                         <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                              Task Manager
                         </CardTitle>
                         <CardDescription>
                              Entre na sua conta
                         </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                         <Tabs value="login" className="w-full">

                              <TabsContent value="login" className="space-y-4">
                                   <form onSubmit={handleAuth} className="space-y-4">
                                        <div className="space-y-2">
                                             <Label htmlFor="email">Email</Label>
                                             <Input
                                                  id="email"
                                                  type="email"
                                                  value={email}
                                                  onChange={(e) => setEmail(e.target.value)}
                                                  placeholder="seu@email.com"
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
                                             />
                                        </div>
                                        <Button
                                             type="submit"
                                             className="w-full bg-gradient-primary hover:bg-gradient-primary/90"
                                             disabled={loading}
                                        >
                                             {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                             Entrar
                                        </Button>
                                        <div className="text-center">
                                             <Button
                                                  type="button"
                                                  variant="link"
                                                  className="text-sm text-muted-foreground hover:text-primary"
                                                  onClick={() => setForgotPasswordMode(true)}
                                             >
                                                  Esqueceu sua senha?
                                             </Button>
                                        </div>
                                   </form>
                              </TabsContent>
                         </Tabs>
                    </CardContent>
               </Card>
          </div>
     )
}

export default Auth