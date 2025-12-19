import { useState, useEffect } from "react";
import { Plus, Search, Filter, Star, DollarSign, TrendingUp, Users, Calendar, FileDown, BarChart3, Eye, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TaskManagerSidebar } from "@/components/TaskManagerSidebar";
import { SalesForm } from "@/components/SalesForm";
import { SalesDetailsModal } from "@/components/SalesDetailsModal";
import { SalesReports } from "@/components/SalesReports";
import { SalesExport } from "@/components/SalesExport";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
     DropdownMenu,
     DropdownMenuContent,
     DropdownMenuItem,
     DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
     AlertDialog,
     AlertDialogAction,
     AlertDialogCancel,
     AlertDialogContent,
     AlertDialogDescription,
     AlertDialogFooter,
     AlertDialogHeader,
     AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Sale {
     id: string;
     project_name: string;
     categories: string[];
     client_name: string;
     client_phone?: string;
     client_social_media?: string;
     business_name?: string;
     sale_value: number;
     sale_date: string;
     payment_status: "paid" | "partial" | "pending";
     client_rating?: number;
     created_at: string;
     updated_at: string;
}

export default function Sales() {
     const { user } = useAuth();
     const [sales, setSales] = useState<Sale[]>([]);
     const [loading, setLoading] = useState(true);
     const [searchTerm, setSearchTerm] = useState("");
     const [showForm, setShowForm] = useState(false);
     const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
     const [showDetails, setShowDetails] = useState(false);
     const [stats, setStats] = useState([
          { label: "Total de Vendas", value: "0", icon: DollarSign, color: "text-primary" },
          { label: "Valor Total", value: "R$ 0,00", icon: TrendingUp, color: "text-success" },
          { label: "Clientes", value: "0", icon: Users, color: "text-info" },
          { label: "Este Mês", value: "0", icon: Calendar, color: "text-warning" }
     ]);

     const [saleToDelete, setSaleToDelete] = useState<string | null>(null);

     useEffect(() => {
          if (user) {
               fetchSales();
          }
     }, [user]);

     const fetchSales = async () => {
          if (!user) return

          try {
               const { data, error } = await supabase
                    .from("sales")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false });

               if (error) throw error;
               setSales(data || []);

               // Calcular estatísticas
               if (data) {
                    const totalSales = data.length;
                    const totalValue = data.reduce((sum, sale) => sum + Number(sale.sale_value), 0);
                    const uniqueClients = new Set(data.map(sale => sale.client_name)).size;

                    // Vendas deste mês
                    const currentMonth = new Date().getMonth();
                    const currentYear = new Date().getFullYear();
                    const thisMonthSales = data.filter(sale => {
                         const saleDate = new Date(sale.sale_date);
                         return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
                    }).length;

                    setStats([
                         { label: "Total de Vendas", value: totalSales.toString(), icon: DollarSign, color: "text-primary" },
                         { label: "Valor Total", value: `R$ ${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-success" },
                         { label: "Clientes", value: uniqueClients.toString(), icon: Users, color: "text-info" },
                         { label: "Este Mês", value: thisMonthSales.toString(), icon: Calendar, color: "text-warning" }
                    ]);
               }
          } catch (error) {
               console.error("Erro ao buscar vendas:", error);
               toast({
                    title: "Erro",
                    description: "Não foi possível carregar as vendas",
                    variant: "destructive",
               });
          } finally {
               setLoading(false);
          }
     };

     const handleSaleCreated = () => {
          fetchSales();
          setShowForm(false);
     };

     const handleSaleUpdated = () => {
          fetchSales();
          setShowDetails(false);
          setSelectedSale(null);
     };

     const handleEditSale = (sale: Sale) => {
          setSelectedSale(sale);
          setShowDetails(true);
     };

     const handleDeleteSale = async (saleId: string) => {
          try {
               const { error } = await supabase
                    .from("sales")
                    .delete()
                    .eq("id", saleId);

               if (error) throw error;

               setSales(sales.filter(sale => sale.id !== saleId));
               setSaleToDelete(null);
               toast({
                    title: "Sucesso",
                    description: "Venda excluída com sucesso",
               });
          } catch (error) {
               console.error("Erro ao excluir venda:", error);
               toast({
                    title: "Erro",
                    description: "Não foi possível excluir a venda",
                    variant: "destructive",
               });
          }
     };

     const confirmDeleteSale = (saleId: string) => {
          setSaleToDelete(saleId);
     };

     const getPaymentStatusBadge = (status: string) => {
          const statusMap = {
               paid: { label: "Pago", variant: "default" as const },
               partial: { label: "Parcial", variant: "secondary" as const },
               pending: { label: "Pendente", variant: "destructive" as const },
          };
          return statusMap[status as keyof typeof statusMap] || statusMap.pending;
     };

     const renderStarRating = (rating?: number) => {
          if (!rating) return null;
          return (
               <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                         <Star
                              key={star}
                              className={`h-4 w-4 ${star <= rating
                                   ? "fill-yellow-400 text-yellow-400"
                                   : "text-gray-300"
                                   }`}
                         />
                    ))}
               </div>
          );
     };

     const filteredSales = sales.filter(sale =>
          sale.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
     );

     if (loading) {
          return (
               <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                         <p className="mt-4 text-muted-foreground">Carregando vendas...</p>
                    </div>
               </div>
          );
     }

     return (
          <div className="min-h-screen bg-background">
               <SidebarProvider>
                    <div className="flex w-full">
                         <TaskManagerSidebar />

                         <main className="flex-1 p-3 sm:p-6">
                              {/* Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                                   <div className="flex items-center gap-4">
                                        <SidebarTrigger className="lg:hidden h-12 w-12 p-3 [&_svg]:w-6 [&_svg]:h-6" />
                                        <div>
                                             <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Vendas</h1>
                                             <p className="text-sm sm:text-base text-muted-foreground">
                                                  Gerencie suas vendas e clientes
                                             </p>
                                        </div>
                                   </div>
                                   <Button
                                        onClick={() => setShowForm(true)}
                                        className="bg-gradient-primary hover:bg-gradient-primary/90 w-full sm:w-auto"
                                   >
                                        <Plus className="h-4 w-4 mr-2" />
                                        <span className="hidden sm:inline">Nova Venda</span>
                                        <span className="sm:hidden">Nova</span>
                                   </Button>
                                   <SalesExport sales={sales} />
                              </div>

                              {/* Stats Cards */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                   {stats.map((stat, index) => (
                                        <div key={index} className="bg-gradient-card border border-border rounded-xl p-6 shadow-card">
                                             <div className="flex items-center justify-between">
                                                  <div>
                                                       <p className="text-sm text-muted-foreground">{stat.label}</p>
                                                       <p className="text-2xl font-bold text-card-foreground">
                                                            {loading ? "..." : stat.value}
                                                       </p>
                                                  </div>
                                                  <div className={`p-3 rounded-lg bg-secondary ${stat.color}`}>
                                                       <stat.icon className="w-6 h-6" />
                                                  </div>
                                             </div>
                                        </div>
                                   ))}
                              </div>

                              {/* Reports Section */}
                              <div className="mb-8">
                                   <SalesReports sales={sales} />
                              </div>

                              {/* Search and Filters */}
                              <div className="flex items-center gap-4 mb-6">
                                   <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                        <Input
                                             placeholder="Buscar por cliente, projeto ou comércio..."
                                             value={searchTerm}
                                             onChange={(e) => setSearchTerm(e.target.value)}
                                             className="pl-10"
                                        />
                                   </div>
                                   <Button variant="outline">
                                        <Filter className="h-4 w-4 mr-2" />
                                        Filtros
                                   </Button>
                              </div>

                              {/* Sales Grid */}
                              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                   {filteredSales.map((sale) => {
                                        const paymentBadge = getPaymentStatusBadge(sale.payment_status);

                                        return (
                                             <Card
                                                  key={sale.id}
                                                  className="cursor-pointer hover:shadow-md transition-shadow"
                                                  onClick={() => handleEditSale(sale)}
                                             >
                                                  <CardHeader className="pb-3">
                                                       <div className="flex items-start justify-between">
                                                            <div className="space-y-1">
                                                                 <CardTitle className="text-lg">{sale.client_name}</CardTitle>
                                                                 <p className="text-sm text-muted-foreground">
                                                                      {sale.project_name}
                                                                 </p>
                                                            </div>
                                                            <Badge variant={paymentBadge.variant}>
                                                                 {paymentBadge.label}
                                                            </Badge>
                                                       </div>
                                                  </CardHeader>
                                                  <CardContent className="space-y-3">
                                                       <div className="flex items-center justify-between">
                                                            <span className="text-2xl font-bold text-primary">
                                                                 R$ {sale.sale_value.toLocaleString("pt-BR", {
                                                                      minimumFractionDigits: 2,
                                                                      maximumFractionDigits: 2,
                                                                 })}
                                                            </span>
                                                            {renderStarRating(sale.client_rating)}
                                                       </div>

                                                       {sale.business_name && (
                                                            <p className="text-sm text-muted-foreground">
                                                                 <strong>Comércio:</strong> {sale.business_name}
                                                            </p>
                                                       )}

                                                       {sale.categories && sale.categories.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                 {sale.categories.slice(0, 3).map((category, index) => (
                                                                      <Badge key={index} variant="outline" className="text-xs">
                                                                           {category}
                                                                      </Badge>
                                                                 ))}
                                                                 {sale.categories.length > 3 && (
                                                                      <Badge variant="outline" className="text-xs">
                                                                           +{sale.categories.length - 3}
                                                                      </Badge>
                                                                 )}
                                                            </div>
                                                       )}

                                                       <p className="text-xs text-muted-foreground">
                                                            {new Date(sale.sale_date).toLocaleDateString("pt-BR")}
                                                       </p>

                                                       <div className="flex items-center justify-end gap-2 mt-4 pt-2 border-t">
                                                            <Button
                                                                 variant="ghost"
                                                                 size="sm"
                                                                 onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      handleEditSale(sale);
                                                                 }}
                                                                 className="px-2"
                                                            >
                                                                 <Eye className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                 variant="ghost"
                                                                 size="sm"
                                                                 onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      handleEditSale(sale);
                                                                 }}
                                                                 className="px-2"
                                                            >
                                                                 <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                 variant="ghost"
                                                                 size="sm"
                                                                 onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      confirmDeleteSale(sale.id);
                                                                 }}
                                                                 className="px-2 text-destructive hover:text-destructive"
                                                            >
                                                                 <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                       </div>
                                                  </CardContent>
                                             </Card>
                                        );
                                   })}
                              </div>

                              {/* Empty State */}
                              {filteredSales.length === 0 && (
                                   <div className="text-center py-12">
                                        <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                                             <Plus className="h-12 w-12 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">Nenhuma venda encontrada</h3>
                                        <p className="text-muted-foreground mb-4">
                                             {searchTerm ? "Tente ajustar sua busca" : "Comece criando sua primeira venda"}
                                        </p>
                                        {!searchTerm && (
                                             <Button
                                                  onClick={() => setShowForm(true)}
                                                  className="bg-gradient-primary hover:bg-gradient-primary/90"
                                             >
                                                  <Plus className="h-4 w-4 mr-2" />
                                                  Nova Venda
                                             </Button>
                                        )}
                                   </div>
                              )}

                              <SalesForm
                                   open={showForm}
                                   onOpenChange={setShowForm}
                                   onSaleCreated={handleSaleCreated}
                              />

                              <SalesDetailsModal
                                   sale={selectedSale}
                                   open={showDetails}
                                   onOpenChange={setShowDetails}
                                   onSaleUpdated={handleSaleUpdated}
                                   onSaleDeleted={confirmDeleteSale}
                              />

                              <AlertDialog open={!!saleToDelete} onOpenChange={(open) => !open && setSaleToDelete(null)}>
                                   <AlertDialogContent>
                                        <AlertDialogHeader>
                                             <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                             <AlertDialogDescription>
                                                  Tem certeza que deseja excluir esta venda? Esta operação é irreversível e todos os dados associados serão permanentemente removidos.
                                             </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                             <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                             <AlertDialogAction
                                                  onClick={() => saleToDelete && handleDeleteSale(saleToDelete)}
                                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                             >
                                                  Excluir
                                             </AlertDialogAction>
                                        </AlertDialogFooter>
                                   </AlertDialogContent>
                              </AlertDialog>
                         </main>
                    </div>
               </SidebarProvider>
          </div>
     );
}