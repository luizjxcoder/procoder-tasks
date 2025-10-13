import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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

interface SalesExportProps {
  sales: Sale[];
}

export function SalesExport({ sales }: SalesExportProps) {
  const exportToCSV = () => {
    if (sales.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há vendas para exportar",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'Data da Venda',
      'Cliente',
      'Projeto',
      'Comércio',
      'Valor',
      'Status Pagamento',
      'Avaliação',
      'Telefone',
      'Rede Social',
      'Categorias'
    ];

    const csvContent = [
      headers.join(','),
      ...sales.map(sale => [
        new Date(sale.sale_date).toLocaleDateString("pt-BR"),
        `"${sale.client_name}"`,
        `"${sale.project_name}"`,
        `"${sale.business_name || ''}"`,
        sale.sale_value.toFixed(2).replace('.', ','),
        sale.payment_status === 'paid' ? 'Pago' : 
        sale.payment_status === 'partial' ? 'Parcial' : 'Pendente',
        sale.client_rating || '',
        `"${sale.client_phone || ''}"`,
        `"${sale.client_social_media || ''}"`,
        `"${sale.categories?.join('; ') || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vendas-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Vendas exportadas com sucesso",
    });
  };

  return (
    <Button 
      onClick={exportToCSV}
      variant="outline"
      className="gap-2"
    >
      <FileDown className="h-4 w-4" />
      Exportar CSV
    </Button>
  );
}