import { useState, useEffect } from "react";
import { Plus, Search, Filter, TrendingDown, Wallet, CreditCard, Calendar, BarChart3, Eye, Edit, Trash2, LayoutGrid, List, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TaskManagerSidebar } from "@/components/TaskManagerSidebar";
import { InvestmentForm } from "@/components/InvestmentForm";
import { InvestmentDetailsModal } from "@/components/InvestmentDetailsModal";
import { InvestmentsChart } from "@/components/InvestmentsChart";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface Investment {
     id: string;
     title: string;
     description?: string;
     category: string;
     amount: number;
     investment_date: string;
     payment_type: "one_time" | "subscription" | "installment";
     recurrence?: string;
     status: "active" | "cancelled" | "completed";
     vendor?: string;
     invoice_url?: string;
     tags?: string[];
     created_at: string;
     updated_at: string;
}

const categoryLabels: Record<string, { label: string; color: string }> = {
     software: { label: "Software/Ferramentas", color: "bg-blue-500/20 text-blue-600 dark:text-blue-400" },
     assets: { label: "Ativos Digitais", color: "bg-purple-500/20 text-purple-600 dark:text-purple-400" },
     subscription: { label: "Assinaturas", color: "bg-green-500/20 text-green-600 dark:text-green-400" },
     hardware: { label: "Hardware", color: "bg-orange-500/20 text-orange-600 dark:text-orange-400" },
     stock: { label: "Banco de Imagens", color: "bg-pink-500/20 text-pink-600 dark:text-pink-400" },
     fonts: { label: "Fontes", color: "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" },
     plugins: { label: "Plugins/Extensões", color: "bg-teal-500/20 text-teal-600 dark:text-teal-400" },
     training: { label: "Cursos/Treinamentos", color: "bg-amber-500/20 text-amber-600 dark:text-amber-400" },
     other: { label: "Outros", color: "bg-gray-500/20 text-gray-600 dark:text-gray-400" },
};

export default function Investments() {
     const { user } = useAuth();
     const [investments, setInvestments] = useState<Investment[]>([]);
     const [loading, setLoading] = useState(true);
     const [searchTerm, setSearchTerm] = useState("");
     const [showForm, setShowForm] = useState(false);
     const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
     const [showDetails, setShowDetails] = useState(false);
     const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
     const [investmentToDelete, setInvestmentToDelete] = useState<Investment | null>(null);
     const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
     const [filterCategory, setFilterCategory] = useState<string>("all");
     const [filterPaymentType, setFilterPaymentType] = useState<string>("all");
     const [filterStatus, setFilterStatus] = useState<string>("all");
     const [filterOpen, setFilterOpen] = useState(false);
     const [stats, setStats] = useState([
          { label: "Total Investido", value: "R$ 0,00", icon: Wallet, color: "text-primary" },
          { label: "Assinaturas Ativas", value: "0", icon: CreditCard, color: "text-warning" },
          { label: "Este Mês", value: "R$ 0,00", icon: Calendar, color: "text-info" },
          { label: "Categorias", value: "0", icon: BarChart3, color: "text-success" }
     ]);

     useEffect(() => {
          if (user) {
               fetchInvestments();
          }
     }, [user]);

     const fetchInvestments = async () => {
          if (!user) return;

          try {
               const { data, error } = await supabase
                    .from("investments")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false });

               if (error) throw error;
               setInvestments(data || []);

               if (data) {
                    const totalAmount = data.reduce((sum, inv) => sum + Number(inv.amount), 0);
                    const activeSubscriptions = data.filter(inv => inv.payment_type === "subscription" && inv.status === "active").length;

                    const currentMonth = new Date().getMonth();
                    const currentYear = new Date().getFullYear();
                    const thisMonthAmount = data.filter(inv => {
                         const invDate = new Date(inv.investment_date);
                         return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
                    }).reduce((sum, inv) => sum + Number(inv.amount), 0);

                    const uniqueCategories = new Set(data.map(inv => inv.category)).size;

                    setStats([
                         { label: "Total Investido", value: `R$ ${totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: Wallet, color: "text-primary" },
                         { label: "Assinaturas Ativas", value: activeSubscriptions.toString(), icon: CreditCard, color: "text-warning" },
                         { label: "Este Mês", value: `R$ ${thisMonthAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: Calendar, color: "text-info" },
                         { label: "Categorias", value: uniqueCategories.toString(), icon: BarChart3, color: "text-success" }
                    ]);
               }
          } catch (error) {
               console.error("Erro ao buscar investimentos:", error);
               toast({
                    title: "Erro",
                    description: "Não foi possível carregar os investimentos",
                    variant: "destructive",
               });
          } finally {
               setLoading(false);
          }
     };

     const handleInvestmentCreated = () => {
          fetchInvestments();
          setShowForm(false);
     };

     const handleInvestmentUpdated = () => {
          fetchInvestments();
          setShowDetails(false);
          setSelectedInvestment(null);
     };

     const handleViewInvestment = (investment: Investment) => {
          setSelectedInvestment(investment);
          setShowDetails(true);
     };

     const confirmDelete = (investment: Investment) => {
          setInvestmentToDelete(investment);
          setDeleteConfirmOpen(true);
     };

     const handleDeleteInvestment = async () => {
          if (!investmentToDelete) return;

          try {
               const { error } = await supabase
                    .from("investments")
                    .delete()
                    .eq("id", investmentToDelete.id);

               if (error) throw error;

               setInvestments(investments.filter(inv => inv.id !== investmentToDelete.id));
               toast({
                    title: "Sucesso",
                    description: "Investimento excluído com sucesso",
               });
          } catch (error) {
               console.error("Erro ao excluir investimento:", error);
               toast({
                    title: "Erro",
                    description: "Não foi possível excluir o investimento",
                    variant: "destructive",
               });
          } finally {
               setDeleteConfirmOpen(false);
               setInvestmentToDelete(null);
          }
     };

     const getCategoryBadge = (category: string) => {
          const cat = categoryLabels[category] || categoryLabels.other;
          return <Badge className={`${cat.color} border-0`}>{cat.label}</Badge>;
     };

     const getPaymentTypeBadge = (type: string) => {
          const types: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
               one_time: { label: "Pagamento Único", variant: "outline" },
               subscription: { label: "Assinatura", variant: "secondary" },
               installment: { label: "Parcelado", variant: "default" },
          };
          const t = types[type] || types.one_time;
          return <Badge variant={t.variant}>{t.label}</Badge>;
     };

     const getStatusBadge = (status: string) => {
          const statuses: Record<string, { label: string; color: string }> = {
               active: { label: "Ativo", color: "bg-success/20 text-success" },
               cancelled: { label: "Cancelado", color: "bg-destructive/20 text-destructive" },
               completed: { label: "Concluído", color: "bg-muted text-muted-foreground" },
          };
          const s = statuses[status] || statuses.active;
          return <Badge className={`${s.color} border-0`}>{s.label}</Badge>;
     };

     const activeFiltersCount = [filterCategory, filterPaymentType, filterStatus].filter(f => f !== "all").length;

     const clearFilters = () => {
          setFilterCategory("all");
          setFilterPaymentType("all");
          setFilterStatus("all");
     };

     const filteredInvestments = investments.filter(inv => {
          const matchesSearch = inv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
               inv.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               inv.category.toLowerCase().includes(searchTerm.toLowerCase());

          const matchesCategory = filterCategory === "all" || inv.category === filterCategory;
          const matchesPaymentType = filterPaymentType === "all" || inv.payment_type === filterPaymentType;
          const matchesStatus = filterStatus === "all" || inv.status === filterStatus;

          return matchesSearch && matchesCategory && matchesPaymentType && matchesStatus;
     });

     if (loading) {
          return (
               <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                         <p className="mt-4 text-muted-foreground">Carregando investimentos...</p>
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
                                             <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                                                  <TrendingDown className="h-7 w-7 text-primary" />
                                                  Investimentos / Custos
                                             </h1>
                                             <p className="text-sm sm:text-base text-muted-foreground">
                                                  Gerencie seus investimentos em ferramentas e ativos
                                             </p>
                                        </div>
                                   </div>
                                   <Button
                                        onClick={() => setShowForm(true)}
                                        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 w-full sm:w-auto"
                                   >
                                        <Plus className="h-4 w-4 mr-2" />
                                        <span className="hidden sm:inline">Novo Investimento</span>
                                        <span className="sm:hidden">Novo</span>
                                   </Button>
                              </div>

                              {/* Stats Cards */}
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                                   {stats.map((stat, index) => (
                                        <Card key={index} className="bg-gradient-card border border-border shadow-card overflow-hidden">
                                             <CardContent className="p-4 sm:p-6">
                                                  <div className="flex items-center justify-between">
                                                       <div className="min-w-0">
                                                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</p>
                                                            <p className="text-lg sm:text-2xl font-bold text-card-foreground truncate">
                                                                 {loading ? "..." : stat.value}
                                                            </p>
                                                       </div>
                                                       <div className={`p-2 sm:p-3 rounded-lg bg-secondary ${stat.color} flex-shrink-0`}>
                                                            <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                                       </div>
                                                  </div>
                                             </CardContent>
                                        </Card>
                                   ))}
                              </div>

                              {/* Search and View Toggle */}
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
                                   <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                        <Input
                                             placeholder="Buscar por título, fornecedor ou categoria..."
                                             value={searchTerm}
                                             onChange={(e) => setSearchTerm(e.target.value)}
                                             className="pl-10"
                                        />
                                   </div>
                                   <div className="flex gap-2">
                                        <div className="flex border rounded-lg">
                                             <Button
                                                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                                                  size="sm"
                                                  onClick={() => setViewMode('cards')}
                                                  className="rounded-r-none"
                                             >
                                                  <LayoutGrid className="h-4 w-4" />
                                             </Button>
                                             <Button
                                                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                                                  size="sm"
                                                  onClick={() => setViewMode('list')}
                                                  className="rounded-l-none"
                                             >
                                                  <List className="h-4 w-4" />
                                             </Button>
                                        </div>
                                        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                                             <PopoverTrigger asChild>
                                                  <Button variant="outline" className="w-full sm:w-auto relative">
                                                       <Filter className="h-4 w-4 mr-2" />
                                                       Filtros
                                                       {activeFiltersCount > 0 && (
                                                            <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                                                                 {activeFiltersCount}
                                                            </Badge>
                                                       )}
                                                  </Button>
                                             </PopoverTrigger>
                                             <PopoverContent className="w-72 bg-popover border border-border shadow-lg z-50" align="end">
                                                  <div className="space-y-4">
                                                       <div className="flex items-center justify-between">
                                                            <h4 className="font-medium text-sm">Filtros</h4>
                                                            {activeFiltersCount > 0 && (
                                                                 <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-1 text-xs">
                                                                      <X className="h-3 w-3 mr-1" />
                                                                      Limpar
                                                                 </Button>
                                                            )}
                                                       </div>

                                                       <div className="space-y-2">
                                                            <Label className="text-xs">Categoria</Label>
                                                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                                                 <SelectTrigger className="bg-background">
                                                                      <SelectValue placeholder="Todas" />
                                                                 </SelectTrigger>
                                                                 <SelectContent className="bg-popover border border-border z-50">
                                                                      <SelectItem value="all">Todas</SelectItem>
                                                                      <SelectItem value="software">Software/Ferramentas</SelectItem>
                                                                      <SelectItem value="assets">Ativos Digitais</SelectItem>
                                                                      <SelectItem value="subscription">Assinaturas</SelectItem>
                                                                      <SelectItem value="hardware">Hardware</SelectItem>
                                                                      <SelectItem value="stock">Banco de Imagens</SelectItem>
                                                                      <SelectItem value="fonts">Fontes</SelectItem>
                                                                      <SelectItem value="plugins">Plugins/Extensões</SelectItem>
                                                                      <SelectItem value="training">Cursos/Treinamentos</SelectItem>
                                                                      <SelectItem value="other">Outros</SelectItem>
                                                                 </SelectContent>
                                                            </Select>
                                                       </div>

                                                       <div className="space-y-2">
                                                            <Label className="text-xs">Tipo de Pagamento</Label>
                                                            <Select value={filterPaymentType} onValueChange={setFilterPaymentType}>
                                                                 <SelectTrigger className="bg-background">
                                                                      <SelectValue placeholder="Todos" />
                                                                 </SelectTrigger>
                                                                 <SelectContent className="bg-popover border border-border z-50">
                                                                      <SelectItem value="all">Todos</SelectItem>
                                                                      <SelectItem value="one_time">Pagamento Único</SelectItem>
                                                                      <SelectItem value="subscription">Assinatura</SelectItem>
                                                                      <SelectItem value="installment">Parcelado</SelectItem>
                                                                 </SelectContent>
                                                            </Select>
                                                       </div>

                                                       <div className="space-y-2">
                                                            <Label className="text-xs">Status</Label>
                                                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                                                 <SelectTrigger className="bg-background">
                                                                      <SelectValue placeholder="Todos" />
                                                                 </SelectTrigger>
                                                                 <SelectContent className="bg-popover border border-border z-50">
                                                                      <SelectItem value="all">Todos</SelectItem>
                                                                      <SelectItem value="active">Ativo</SelectItem>
                                                                      <SelectItem value="cancelled">Cancelado</SelectItem>
                                                                      <SelectItem value="completed">Concluído</SelectItem>
                                                                 </SelectContent>
                                                            </Select>
                                                       </div>
                                                  </div>
                                             </PopoverContent>
                                        </Popover>
                                   </div>
                              </div>

                              {/* Investments Chart */}
                              <InvestmentsChart investments={investments} />

                              {/* Investments Display */}
                              {viewMode === 'cards' ? (
                                   // Cards View - Compact
                                   <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                        {filteredInvestments.map((investment) => (
                                             <Card
                                                  key={investment.id}
                                                  className="group hover:shadow-md transition-all duration-300 border-l-4 border-l-primary"
                                             >
                                                  <CardContent className="p-3">
                                                       <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div className="min-w-0 flex-1">
                                                                 <h3 className="font-semibold text-sm truncate">{investment.title}</h3>
                                                                 {investment.vendor && (
                                                                      <p className="text-xs text-muted-foreground truncate">{investment.vendor}</p>
                                                                 )}
                                                            </div>
                                                            {getStatusBadge(investment.status)}
                                                       </div>

                                                       <div className="flex items-center justify-between mb-2">
                                                            <span className="text-lg font-bold text-primary">
                                                                 R$ {Number(investment.amount).toLocaleString("pt-BR", {
                                                                      minimumFractionDigits: 2,
                                                                      maximumFractionDigits: 2,
                                                                 })}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                 {new Date(investment.investment_date).toLocaleDateString("pt-BR")}
                                                            </span>
                                                       </div>

                                                       <div className="flex flex-wrap gap-1 mb-2">
                                                            {getCategoryBadge(investment.category)}
                                                            {getPaymentTypeBadge(investment.payment_type)}
                                                       </div>

                                                       <div className="flex items-center justify-end gap-1 pt-2 border-t">
                                                            <TooltipProvider>
                                                                 <Tooltip>
                                                                      <TooltipTrigger asChild>
                                                                           <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => handleViewInvestment(investment)}
                                                                                className="h-8 w-8 p-0"
                                                                           >
                                                                                <Eye className="w-4 h-4" />
                                                                           </Button>
                                                                      </TooltipTrigger>
                                                                      <TooltipContent><p>Visualizar</p></TooltipContent>
                                                                 </Tooltip>
                                                                 <Tooltip>
                                                                      <TooltipTrigger asChild>
                                                                           <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                     setSelectedInvestment(investment);
                                                                                     setShowDetails(true);
                                                                                }}
                                                                                className="h-8 w-8 p-0"
                                                                           >
                                                                                <Edit className="w-4 h-4" />
                                                                           </Button>
                                                                      </TooltipTrigger>
                                                                      <TooltipContent><p>Editar</p></TooltipContent>
                                                                 </Tooltip>
                                                                 <Tooltip>
                                                                      <TooltipTrigger asChild>
                                                                           <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => confirmDelete(investment)}
                                                                                className="h-8 w-8 p-0 text-destructive"
                                                                           >
                                                                                <Trash2 className="w-4 h-4" />
                                                                           </Button>
                                                                      </TooltipTrigger>
                                                                      <TooltipContent><p>Excluir</p></TooltipContent>
                                                                 </Tooltip>
                                                            </TooltipProvider>
                                                       </div>
                                                  </CardContent>
                                             </Card>
                                        ))}
                                   </div>
                              ) : (
                                   // List View
                                   <Card className="overflow-hidden">
                                        <div className="divide-y divide-border">
                                             {filteredInvestments.map((investment) => (
                                                  <div
                                                       key={investment.id}
                                                       className="px-3 py-2 hover:bg-muted/50 transition-colors border-l-4 border-l-primary"
                                                  >
                                                       <div className="flex items-center justify-between gap-2 sm:gap-3">
                                                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                                                 <div className="flex-1 min-w-0">
                                                                      {/* Mobile layout: title + category below */}
                                                                      <div className="sm:hidden">
                                                                           <div className="flex items-center gap-2">
                                                                                <h3 className="font-semibold text-sm truncate">{investment.title}</h3>
                                                                                {getStatusBadge(investment.status)}
                                                                           </div>
                                                                           <div className="mt-1">
                                                                                {getCategoryBadge(investment.category)}
                                                                           </div>
                                                                      </div>

                                                                      {/* Desktop layout: full info */}
                                                                      <div className="hidden sm:block">
                                                                           <div className="flex items-center gap-2">
                                                                                <h3 className="font-semibold text-sm truncate">{investment.title}</h3>
                                                                                {getStatusBadge(investment.status)}
                                                                           </div>
                                                                           <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                                                {investment.vendor && (
                                                                                     <span className="truncate max-w-[150px]">{investment.vendor}</span>
                                                                                )}
                                                                                {investment.vendor && <span>•</span>}
                                                                                <span>{new Date(investment.investment_date).toLocaleDateString("pt-BR")}</span>
                                                                                <span>•</span>
                                                                                {getCategoryBadge(investment.category)}
                                                                           </div>
                                                                      </div>
                                                                 </div>

                                                                 <span className="text-base sm:text-lg font-bold text-primary whitespace-nowrap">
                                                                      R$ {Number(investment.amount).toLocaleString("pt-BR", {
                                                                           minimumFractionDigits: 2,
                                                                      })}
                                                                 </span>
                                                            </div>

                                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                                 <TooltipProvider>
                                                                      <Tooltip>
                                                                           <TooltipTrigger asChild>
                                                                                <Button
                                                                                     variant="ghost"
                                                                                     size="sm"
                                                                                     onClick={() => handleViewInvestment(investment)}
                                                                                     className="h-8 w-8 p-0"
                                                                                >
                                                                                     <Eye className="w-4 h-4" />
                                                                                </Button>
                                                                           </TooltipTrigger>
                                                                           <TooltipContent><p>Visualizar</p></TooltipContent>
                                                                      </Tooltip>
                                                                      <Tooltip>
                                                                           <TooltipTrigger asChild>
                                                                                <Button
                                                                                     variant="ghost"
                                                                                     size="sm"
                                                                                     onClick={() => {
                                                                                          setSelectedInvestment(investment);
                                                                                          setShowDetails(true);
                                                                                     }}
                                                                                     className="h-8 w-8 p-0"
                                                                                >
                                                                                     <Edit className="w-4 h-4" />
                                                                                </Button>
                                                                           </TooltipTrigger>
                                                                           <TooltipContent><p>Editar</p></TooltipContent>
                                                                      </Tooltip>
                                                                      <Tooltip>
                                                                           <TooltipTrigger asChild>
                                                                                <Button
                                                                                     variant="ghost"
                                                                                     size="sm"
                                                                                     onClick={() => confirmDelete(investment)}
                                                                                     className="h-8 w-8 p-0 text-destructive"
                                                                                >
                                                                                     <Trash2 className="w-4 h-4" />
                                                                                </Button>
                                                                           </TooltipTrigger>
                                                                           <TooltipContent><p>Excluir</p></TooltipContent>
                                                                      </Tooltip>
                                                                 </TooltipProvider>
                                                            </div>
                                                       </div>
                                                  </div>
                                             ))}
                                        </div>
                                   </Card>
                              )}

                              {/* Empty State */}
                              {filteredInvestments.length === 0 && (
                                   <div className="text-center py-12">
                                        <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                                             <Wallet className="h-12 w-12 text-primary" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">Nenhum investimento encontrado</h3>
                                        <p className="text-muted-foreground mb-4">
                                             {searchTerm ? "Tente ajustar sua busca" : "Comece registrando seu primeiro investimento"}
                                        </p>
                                        {!searchTerm && (
                                             <Button
                                                  onClick={() => setShowForm(true)}
                                                  className="bg-gradient-to-r from-primary to-primary/80"
                                             >
                                                  <Plus className="h-4 w-4 mr-2" />
                                                  Novo Investimento
                                             </Button>
                                        )}
                                   </div>
                              )}

                              {/* Form Modal */}
                              <InvestmentForm
                                   open={showForm}
                                   onOpenChange={setShowForm}
                                   onInvestmentCreated={handleInvestmentCreated}
                              />

                              {/* Details Modal */}
                              <InvestmentDetailsModal
                                   investment={selectedInvestment}
                                   open={showDetails}
                                   onOpenChange={setShowDetails}
                                   onInvestmentUpdated={handleInvestmentUpdated}
                                   onInvestmentDeleted={(id) => {
                                        setInvestments(investments.filter(inv => inv.id !== id));
                                        setShowDetails(false);
                                   }}
                              />

                              {/* Delete Confirmation */}
                              <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                                   <AlertDialogContent>
                                        <AlertDialogHeader>
                                             <AlertDialogTitle className="flex items-center gap-2">
                                                  <Trash2 className="h-5 w-5 text-destructive" />
                                                  Confirmar Exclusão
                                             </AlertDialogTitle>
                                             <AlertDialogDescription>
                                                  Tem certeza que deseja excluir o investimento "{investmentToDelete?.title}"?
                                                  Esta ação não pode ser desfeita.
                                             </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                             <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                             <AlertDialogAction
                                                  onClick={handleDeleteInvestment}
                                                  className="bg-destructive hover:bg-destructive/90"
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
