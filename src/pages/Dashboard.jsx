import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { expensesAPI, incomesAPI, categoriesAPI, formatCurrency, formatPercentage } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [showAmounts, setShowAmounts] = useState(true);
  const [data, setData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    expenses: [],
    incomes: [],
    categories: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [expensesResponse, incomesResponse, categoriesResponse] = await Promise.all([
        expensesAPI.list(),
        incomesAPI.list(),
        categoriesAPI.list(),
      ]);

      // Asegurar que siempre sean arrays
      const expensesData = expensesResponse.data?.expenses || expensesResponse.data || [];
      const incomesData = incomesResponse.data?.incomes || incomesResponse.data || [];
      const categoriesData = categoriesResponse.data?.data || categoriesResponse.data || [];
      
      const expenses = Array.isArray(expensesData) ? expensesData : [];
      const incomes = Array.isArray(incomesData) ? incomesData : [];
      const categories = Array.isArray(categoriesData) ? categoriesData : [];

      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);

      setData({
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        expenses,
        incomes,
        categories,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error al cargar los datos del dashboard');
      setData({
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        expenses: [],
        incomes: [],
        categories: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    if (!showAmounts) return '••••••';
    return formatCurrency(amount);
  };

  // Función para calcular datos reales del gráfico de torta por categorías
  const calculateCategoryData = () => {
    if (!data.expenses.length || !data.categories.length) {
      return [];
    }

    // Agrupar gastos por categoría
    const categoryTotals = {};
    data.expenses.forEach(expense => {
      const categoryId = expense.category_id || 'sin_categoria';
      if (!categoryTotals[categoryId]) {
        categoryTotals[categoryId] = 0;
      }
      categoryTotals[categoryId] += expense.amount;
    });

    // Convertir a array con nombres y porcentajes
    const colors = ['#009ee3', '#00a650', '#ff6900', '#e53e3e', '#6b7280', '#8b5cf6', '#f59e0b'];
    let colorIndex = 0;

    return Object.entries(categoryTotals).map(([categoryId, amount]) => {
      const category = data.categories.find(c => c.id === categoryId);
      const name = category ? category.name : 'Sin categoría';
      const percentage = data.totalExpenses > 0 ? Math.round((amount / data.totalExpenses) * 100) : 0;
      
      return {
        name,
        value: percentage,
        amount,
        color: colors[colorIndex++ % colors.length]
      };
    }).filter(item => item.value > 0); // Solo mostrar categorías con gastos
  };

  // Función para calcular datos del gráfico de área (versión simplificada)
  const calculateChartData = () => {
    // Como no tenemos datos históricos, mostramos una tendencia simple desde 0
    const currentMonth = new Date().toLocaleDateString('es-AR', { month: 'short' });
    const currentYear = new Date().getFullYear();
    
    // Crear algunos puntos anteriores en 0 para mostrar el crecimiento actual
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentMonthIndex = new Date().getMonth();
    
    const chartData = [];
    
    // Agregar 2-3 meses anteriores en 0
    for (let i = Math.max(0, currentMonthIndex - 2); i < currentMonthIndex; i++) {
      chartData.push({
        name: months[i],
        ingresos: 0,
        gastos: 0
      });
    }
    
    // Agregar el mes actual con datos reales
    chartData.push({
      name: currentMonth,
      ingresos: data.totalIncome,
      gastos: data.totalExpenses
    });
    
    return chartData;
  };

  // Datos para el gráfico de área
  const chartData = calculateChartData();

  // Datos para el gráfico de torta (categorías de gastos)
  const pieData = calculateCategoryData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
        <span className="ml-2 text-mp-gray-600">Cargando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con toggle de visibilidad */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-mp-gray-900">Dashboard</h1>
          <p className="text-mp-gray-600">Resumen de tu actividad financiera</p>
        </div>
        <button
          onClick={() => setShowAmounts(!showAmounts)}
          className="btn-ghost flex items-center space-x-2"
        >
          {showAmounts ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{showAmounts ? 'Ocultar' : 'Mostrar'} montos</span>
        </button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Balance total */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-mp-gray-600">Balance Total</p>
              <p className={`text-2xl font-bold ${data.balance >= 0 ? 'text-mp-secondary' : 'text-mp-error'}`}>
                {formatAmount(data.balance)}
              </p>
            </div>
            <div className={`p-3 rounded-mp ${data.balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <DollarSign className={`w-6 h-6 ${data.balance >= 0 ? 'text-mp-secondary' : 'text-mp-error'}`} />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {data.balance >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-mp-secondary mr-1" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-mp-error mr-1" />
            )}
            <span className={`text-sm ${data.balance >= 0 ? 'text-mp-secondary' : 'text-mp-error'}`}>
              {data.balance >= 0 ? 'Positivo' : 'Negativo'}
            </span>
          </div>
        </div>

        {/* Total ingresos */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-mp-gray-600">Total Ingresos</p>
              <p className="text-2xl font-bold text-mp-secondary">
                {formatAmount(data.totalIncome)}
              </p>
            </div>
            <div className="p-3 rounded-mp bg-green-100">
              <TrendingUp className="w-6 h-6 text-mp-secondary" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-mp-secondary mr-1" />
            <span className="text-sm text-mp-gray-500">
              {data.incomes.length} {data.incomes.length === 1 ? 'ingreso registrado' : 'ingresos registrados'}
            </span>
          </div>
        </div>

        {/* Total gastos */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-mp-gray-600">Total Gastos</p>
              <p className="text-2xl font-bold text-mp-accent">
                {formatAmount(data.totalExpenses)}
              </p>
            </div>
            <div className="p-3 rounded-mp bg-orange-100">
              <TrendingDown className="w-6 h-6 text-mp-accent" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingDown className="w-4 h-4 text-mp-accent mr-1" />
            <span className="text-sm text-mp-gray-500">
              {data.expenses.length} {data.expenses.length === 1 ? 'gasto registrado' : 'gastos registrados'}
            </span>
          </div>
        </div>

        {/* Gastos pendientes */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-mp-gray-600">Gastos Pendientes</p>
              <p className="text-2xl font-bold text-mp-error">
                {data.expenses.filter(e => !e.paid).length}
              </p>
            </div>
            <div className="p-3 rounded-mp bg-red-100">
              <Calendar className="w-6 h-6 text-mp-error" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-mp-gray-500">
              {formatAmount(data.expenses.filter(e => !e.paid).reduce((sum, e) => sum + e.amount, 0))} por pagar
            </span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de tendencias */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-mp-gray-900">Tendencia Mensual</h3>
              <p className="text-sm text-mp-gray-500 mt-1">
                Datos del mes actual (histórico próximamente)
              </p>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-mp-secondary rounded-full mr-2"></div>
                <span className="text-mp-gray-600">Ingresos</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-mp-accent rounded-full mr-2"></div>
                <span className="text-mp-gray-600">Gastos</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                formatter={(value) => [formatCurrency(value)]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)',
                }}
              />
              <Area
                type="monotone"
                dataKey="ingresos"
                stackId="1"
                stroke="#00a650"
                fill="#00a650"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="gastos"
                stackId="2"
                stroke="#ff6900"
                fill="#ff6900"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de categorías */}
        <div className="card">
          <h3 className="text-lg font-semibold text-mp-gray-900 mb-6">Gastos por Categoría</h3>
          {pieData.length > 0 ? (
            <>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value}% (${formatCurrency(props.payload.amount)})`, 
                        'Porcentaje'
                      ]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)',
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-mp-gray-600">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-mp-gray-900">{item.value}%</span>
                      <div className="text-xs text-mp-gray-500">{formatCurrency(item.amount)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <PieChart className="w-12 h-12 text-mp-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-mp-gray-600 mb-2">No hay gastos por categorías</h4>
              <p className="text-sm text-mp-gray-500">
                Los gastos aparecerán aquí una vez que agregues algunos gastos con categorías
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Transacciones recientes */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-mp-gray-900">Transacciones Recientes</h3>
          <button className="btn-ghost">Ver todas</button>
        </div>
        <div className="space-y-4">
          {[...data.expenses.slice(0, 3), ...data.incomes.slice(0, 2)]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5)
            .map((transaction, index) => {
              const isExpense = transaction.hasOwnProperty('paid');
              return (
                <div key={index} className="flex items-center justify-between p-4 rounded-mp bg-mp-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-mp ${isExpense ? 'bg-red-100' : 'bg-green-100'}`}>
                      {isExpense ? (
                        <TrendingDown className="w-4 h-4 text-mp-error" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-mp-secondary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-mp-gray-900">{transaction.description}</p>
                      <p className="text-sm text-mp-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${isExpense ? 'text-mp-error' : 'text-mp-secondary'}`}>
                      {isExpense ? '-' : '+'}{formatAmount(transaction.amount)}
                    </p>
                    {transaction.percentage && (
                      <p className="text-sm text-mp-gray-500">
                        {formatPercentage(transaction.percentage)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 