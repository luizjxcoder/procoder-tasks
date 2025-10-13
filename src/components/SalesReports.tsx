import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { BarChart3 } from "lucide-react";

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

interface SalesReportsProps {
  sales: Sale[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function SalesReports({ sales }: SalesReportsProps) {
  const reportsData = useMemo(() => {
    // Vendas por mês
    const salesByMonth = sales.reduce((acc, sale) => {
      const month = new Date(sale.sale_date).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
      acc[month] = (acc[month] || 0) + Number(sale.sale_value);
      return acc;
    }, {} as Record<string, number>);

    const monthlyData = Object.entries(salesByMonth).map(([month, value]) => ({
      month,
      value: Number(value.toFixed(2))
    }));

    // Status de pagamento
    const paymentData = sales.reduce((acc, sale) => {
      const status = sale.payment_status === 'paid' ? 'Pago' : 
                    sale.payment_status === 'partial' ? 'Parcial' : 'Pendente';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const paymentChartData = Object.entries(paymentData).map(([status, count]) => ({
      name: status,
      value: count
    }));

    // Categorias mais vendidas
    const categoryData = sales.reduce((acc, sale) => {
      sale.categories?.forEach(category => {
        acc[category] = (acc[category] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryData)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        count
      }));

    return {
      monthlyData,
      paymentChartData,
      topCategories
    };
  }, [sales]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Relatórios de Vendas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monthly">Vendas Mensais</TabsTrigger>
            <TabsTrigger value="payment">Status Pagamento</TabsTrigger>
            <TabsTrigger value="categories">Top Categorias</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly" className="space-y-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportsData.monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <Tooltip 
                    formatter={(value) => [`R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 'Valor']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="basis" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportsData.paymentChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    innerRadius={20}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportsData.paymentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportsData.topCategories} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                  <XAxis 
                    dataKey="category" 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))" 
                    radius={[2, 2, 0, 0]}
                    opacity={0.8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}