import { Star } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
     Dialog,
     DialogContent,
     DialogHeader,
     DialogTitle,
} from "@/components/ui/dialog";

interface Customer {
     id: string;
     user_id: string;
     name: string;
     phone: string | null;
     email: string | null;
     social_media: string | null;
     company_name: string | null;
     segment: string | null;
     cpf_cnpj: string | null;
     rating: number | null;
     created_at: string;
     updated_at: string;
}

interface CustomerDetailsModalProps {
     customer: Customer | null;
     open: boolean;
     onOpenChange: (open: boolean) => void;
}

export function CustomerDetailsModal({
     customer,
     open,
     onOpenChange,
}: CustomerDetailsModalProps) {
     const renderStars = (rating: number) => {
          return (
               <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                         <Star
                              key={star}
                              className={`w-5 h-5 ${star <= rating
                                   ? "fill-yellow-400 text-yellow-400"
                                   : "text-muted-foreground"
                                   }`}
                         />
                    ))}
               </div>
          );
     };

     if (!customer) return null;

     return (
          <Dialog open={open} onOpenChange={onOpenChange}>
               <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                         <DialogTitle>Detalhes do Cliente</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                   <Label className="text-muted-foreground">Nome</Label>
                                   <p className="text-foreground font-medium">{customer.name}</p>
                              </div>

                              <div className="space-y-2">
                                   <Label className="text-muted-foreground">Email</Label>
                                   <p className="text-foreground font-medium">
                                        {customer.email || "-"}
                                   </p>
                              </div>

                              <div className="space-y-2">
                                   <Label className="text-muted-foreground">Telefone</Label>
                                   <p className="text-foreground font-medium">
                                        {customer.phone || "-"}
                                   </p>
                              </div>

                              <div className="space-y-2">
                                   <Label className="text-muted-foreground">Nome da Empresa</Label>
                                   <p className="text-foreground font-medium">
                                        {customer.company_name || "-"}
                                   </p>
                              </div>

                              <div className="space-y-2">
                                   <Label className="text-muted-foreground">Segmento</Label>
                                   <p className="text-foreground font-medium">
                                        {customer.segment || "-"}
                                   </p>
                              </div>

                              <div className="space-y-2">
                                   <Label className="text-muted-foreground">CPF/CNPJ</Label>
                                   <p className="text-foreground font-medium">
                                        {customer.cpf_cnpj || "-"}
                                   </p>
                              </div>
                         </div>

                         <div className="space-y-2">
                              <Label className="text-muted-foreground">Redes Sociais</Label>
                              <p className="text-foreground font-medium">
                                   {customer.social_media || "-"}
                              </p>
                         </div>

                         {customer.rating && (
                              <div className="space-y-2">
                                   <Label className="text-muted-foreground">Avaliação</Label>
                                   {renderStars(customer.rating)}
                              </div>
                         )}

                         <div className="pt-4 border-t border-border">
                              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                                   <div>
                                        <Label className="text-muted-foreground">Cadastrado em</Label>
                                        <p className="text-foreground">
                                             {new Date(customer.created_at).toLocaleDateString("pt-BR")}
                                        </p>
                                   </div>
                                   <div>
                                        <Label className="text-muted-foreground">Última atualização</Label>
                                        <p className="text-foreground">
                                             {new Date(customer.updated_at).toLocaleDateString("pt-BR")}
                                        </p>
                                   </div>
                              </div>
                         </div>
                    </div>
               </DialogContent>
          </Dialog>
     );
}
