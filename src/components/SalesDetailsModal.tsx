import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Star, X, Plus, Edit2, Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const salesSchema = z.object({
  project_name: z.string().min(1, "Nome do projeto é obrigatório"),
  client_name: z.string().min(1, "Nome do cliente é obrigatório"),
  client_phone: z.string().optional(),
  client_social_media: z.string().optional(),
  business_name: z.string().optional(),
  sale_value: z.number().min(0, "Valor deve ser maior que zero"),
  sale_date: z.date({
    required_error: "Data da venda é obrigatória",
  }),
  payment_status: z.enum(["paid", "partial", "pending"]),
  client_rating: z.number().min(1).max(5).optional(),
});

type SalesFormData = z.infer<typeof salesSchema>;

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

interface SalesDetailsModalProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaleUpdated: () => void;
  onSaleDeleted: (saleId: string) => void;
}

export function SalesDetailsModal({
  sale,
  open,
  onOpenChange,
  onSaleUpdated,
}: SalesDetailsModalProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SalesFormData>({
    resolver: zodResolver(salesSchema),
    defaultValues: {
      project_name: "",
      client_name: "",
      client_phone: "",
      client_social_media: "",
      business_name: "",
      sale_value: 0,
      payment_status: "pending",
    },
  });

  useEffect(() => {
    if (sale) {
      setCategories(sale.categories || []);
      form.reset({
        project_name: sale.project_name,
        client_name: sale.client_name,
        client_phone: sale.client_phone || "",
        client_social_media: sale.client_social_media || "",
        business_name: sale.business_name || "",
        sale_value: sale.sale_value,
        sale_date: new Date(sale.sale_date),
        payment_status: sale.payment_status,
        client_rating: sale.client_rating,
      });
    }
  }, [sale, form]);

  const getPaymentStatusLabel = (status: string) => {
    const statusMap = {
      paid: "Pago",
      partial: "Pago Parcial",
      pending: "Pendente",
    };
    return statusMap[status as keyof typeof statusMap] || "Pendente";
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory("");
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    setCategories(categories.filter(cat => cat !== categoryToRemove));
  };

  const onSubmit = async (data: SalesFormData) => {
    if (!sale) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("sales")
        .update({
          project_name: data.project_name,
          categories: categories,
          client_name: data.client_name,
          client_phone: data.client_phone,
          client_social_media: data.client_social_media,
          business_name: data.business_name,
          sale_value: data.sale_value,
          sale_date: data.sale_date.toISOString().split('T')[0],
          payment_status: data.payment_status,
          client_rating: data.client_rating,
        })
        .eq("id", sale.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Venda atualizada com sucesso",
      });

      setIsEditing(false);
      onSaleUpdated();
    } catch (error) {
      console.error("Erro ao atualizar venda:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a venda",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (value?: number, onChange?: (value: number) => void) => {
    if (!isEditing && !value) return null;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => isEditing && onChange?.(star)}
            disabled={!isEditing}
            className={cn(
              "focus:outline-none",
              isEditing && "cursor-pointer"
            )}
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                star <= (value || 0)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              } ${isEditing && star > (value || 0) && "hover:text-yellow-200"}`}
            />
          </button>
        ))}
        {isEditing && value && (
          <button
            type="button"
            onClick={() => onChange?.(0)}
            className="ml-2 text-xs text-muted-foreground hover:text-destructive"
          >
            Limpar
          </button>
        )}
      </div>
    );
  };

  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{isEditing ? "Editar Venda" : "Detalhes da Venda"}</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                  // Reset form to original values
                  if (sale) {
                    form.reset({
                      project_name: sale.project_name,
                      client_name: sale.client_name,
                      client_phone: sale.client_phone || "",
                      client_social_media: sale.client_social_media || "",
                      business_name: sale.business_name || "",
                      sale_value: sale.sale_value,
                      sale_date: new Date(sale.sale_date),
                      payment_status: sale.payment_status,
                      client_rating: sale.client_rating,
                    });
                    setCategories(sale.categories || []);
                  }
                } else {
                  setIsEditing(true);
                }
              }}
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="project_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Projeto *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Website Corporativo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="client_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Cliente *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: João Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <Label>Categorias</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Digite uma categoria"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
                  />
                  <Button type="button" onClick={addCategory} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {categories.map((category) => (
                      <Badge key={category} variant="secondary" className="flex items-center gap-1">
                        {category}
                        <button
                          type="button"
                          onClick={() => removeCategory(category)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone do Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="client_social_media"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rede Social do Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="@cliente ou link" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Comércio</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Loja ABC Ltda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="sale_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da Venda *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sale_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Venda *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status do Pagamento *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="partial">Pago Parcial</SelectItem>
                          <SelectItem value="paid">Pago</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="client_rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avaliação do Cliente</FormLabel>
                    <FormControl>
                      <div>
                        {renderStarRating(field.value, field.onChange)}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    if (sale) {
                      form.reset({
                        project_name: sale.project_name,
                        client_name: sale.client_name,
                        client_phone: sale.client_phone || "",
                        client_social_media: sale.client_social_media || "",
                        business_name: sale.business_name || "",
                        sale_value: sale.sale_value,
                        sale_date: new Date(sale.sale_date),
                        payment_status: sale.payment_status,
                        client_rating: sale.client_rating,
                      });
                      setCategories(sale.categories || []);
                    }
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>Salvando...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Projeto</Label>
                <p className="text-lg font-semibold">{sale.project_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Cliente</Label>
                <p className="text-lg font-semibold">{sale.client_name}</p>
              </div>
            </div>

            {categories.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Categorias</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {categories.map((category) => (
                    <Badge key={category} variant="outline">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sale.client_phone && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                  <p>{sale.client_phone}</p>
                </div>
              )}
              {sale.client_social_media && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Rede Social</Label>
                  <p>{sale.client_social_media}</p>
                </div>
              )}
            </div>

            {sale.business_name && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Comércio</Label>
                <p>{sale.business_name}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Valor</Label>
                <p className="text-xl font-bold text-primary">
                  R$ {sale.sale_value.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Data da Venda</Label>
                <p>{new Date(sale.sale_date).toLocaleDateString("pt-BR")}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <p>{getPaymentStatusLabel(sale.payment_status)}</p>
              </div>
            </div>

            {sale.client_rating && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Avaliação do Cliente</Label>
                <div className="mt-2">
                  {renderStarRating(sale.client_rating)}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Criado em: {new Date(sale.created_at).toLocaleString("pt-BR")}
              {sale.updated_at !== sale.created_at && (
                <span> • Atualizado em: {new Date(sale.updated_at).toLocaleString("pt-BR")}</span>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}