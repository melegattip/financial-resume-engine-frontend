import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckCircle,
  XCircle
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
import { expensesAPI, incomesAPI, categoriesAPI, dashboardAPI, analyticsAPI, formatCurrency, formatDate, formatPercentage as formatPercentageUtil } from '../services/api';
import { usePeriod } from '../contexts/PeriodContext';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('fecha'); // nuevo estado para ordenamiento
  const [data, setData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    expenses: [],
    incomes: [],
    categories: [],
  });

  // Usar el contexto global de período
  const {
    selectedYear,
    selectedMonth,
    hasActiveFilters,
    balancesHidden,
    getFilterParams,
    getPeriodTitle,
    updateAvailableData,
  } = usePeriod();

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recargar datos cuando cambien los filtros del contexto global
  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);



  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Obtener parámetros de filtro del contexto global
      const filterParams = getFilterParams();

      let data = {};

      try {
        // Intentar usar los nuevos endpoints del backend
        const [dashboardResponse, expensesResponse, incomesResponse, categoriesResponse, oldCategoriesResponse] = await Promise.all([
          dashboardAPI.overview(filterParams),
          analyticsAPI.expenses({ ...filterParams, sort: 'date', order: 'desc', limit: 50 }),
          analyticsAPI.incomes({ ...filterParams, sort: 'date', order: 'desc', limit: 50 }),
          analyticsAPI.categories(filterParams),
          categoriesAPI.list(), // Mantener para dropdown de filtros
        ]);

        // Extraer datos de las respuestas del backend
        const dashboard = dashboardResponse.data || {};
        const expensesData = expensesResponse.data || {};
        const incomesData = incomesResponse.data || {};
        const categoriesData = categoriesResponse.data || {};
        const categoriesForDropdown = oldCategoriesResponse.data?.data || oldCategoriesResponse.data || [];



        // Normalizar datos del backend (convertir PascalCase a camelCase)
        const normalizedExpenses = (expensesData.Expenses || []).map(expense => ({
          id: expense.ID || expense.id,
          user_id: expense.UserID || expense.user_id,
          amount: expense.Amount || expense.amount,
          amount_paid: expense.AmountPaid || expense.amount_paid,
          pending_amount: expense.PendingAmount || expense.pending_amount,
          description: expense.Description || expense.description,
          category_id: expense.CategoryID || expense.category_id,
          paid: expense.Paid !== undefined ? expense.Paid : expense.paid,
          due_date: expense.DueDate || expense.due_date,
          percentage: expense.PercentageOfIncome || expense.percentage,
          created_at: expense.CreatedAt || expense.created_at,
          updated_at: expense.UpdatedAt || expense.updated_at
        }));

        const normalizedIncomes = (incomesData.Incomes || []).map(income => ({
          id: income.ID || income.id,
          user_id: income.UserID || income.user_id,
          amount: income.Amount || income.amount,
          description: income.Description || income.description,
          category_id: income.CategoryID || income.category_id,
          created_at: income.CreatedAt || income.created_at,
          updated_at: income.UpdatedAt || income.updated_at
        }));

        // Usar datos pre-calculados del backend
        data = {
          // Métricas del dashboard (pre-calculadas por backend)
          totalIncome: dashboard.Metrics?.TotalIncome || 0,
          totalExpenses: dashboard.Metrics?.TotalExpenses || 0,
          balance: dashboard.Metrics?.Balance || 0,
          
          // Transacciones normalizadas con porcentajes calculados por backend
          expenses: normalizedExpenses,
          incomes: normalizedIncomes,
          
          // Categorías para dropdown de filtros
          categories: Array.isArray(categoriesForDropdown) ? categoriesForDropdown : [],
          
          // Datos adicionales del backend
          dashboardMetrics: dashboard.Metrics || {},
          expensesSummary: expensesData.Summary || {},
          categoriesAnalytics: categoriesData.Categories || [],
        };

        console.log('✅ Usando nuevos endpoints del backend');
      } catch (newEndpointsError) {
        console.warn('⚠️ Nuevos endpoints no disponibles, usando endpoints legacy:', newEndpointsError.message);
        
        // Fallback a endpoints viejos con cálculos client-side
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

        // Filtrar datos client-side si hay filtros activos
        const filteredExpenses = filterDataByMonthAndYear(expenses, selectedMonth, selectedYear);
        const filteredIncomes = filterDataByMonthAndYear(incomes, selectedMonth, selectedYear);

        const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalIncome = filteredIncomes.reduce((sum, income) => sum + income.amount, 0);

        data = {
          totalIncome,
          totalExpenses,
          balance: totalIncome - totalExpenses,
          expenses: filteredExpenses,
          incomes: filteredIncomes,
          categories,
          dashboardMetrics: {},
          expensesSummary: {},
          categoriesAnalytics: [],
        };

        console.log('✅ Usando endpoints legacy con cálculos client-side');
      }

      setData(data);
      
      // Actualizar datos disponibles en el contexto global
      updateAvailableData(data.expenses, data.incomes);
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
        dashboardMetrics: {},
        expensesSummary: {},
        categoriesAnalytics: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    if (balancesHidden) return '••••••';
    return formatCurrency(amount);
  };

  const formatPercentage = (percentage) => {
    return formatPercentageUtil(percentage);
  };

  // Función para filtrar datos client-side (fallback cuando nuevos endpoints no disponibles)
  const filterDataByMonthAndYear = (dataArray, monthFilter, yearFilter) => {
    if (!hasActiveFilters) return dataArray;
    
    return dataArray.filter(item => {
      // Validar que tenga fecha válida
      if (!item.created_at) return false;
      
      const itemDate = new Date(item.created_at);
      
      // Validar que la fecha sea válida
      if (isNaN(itemDate.getTime())) return false;
      
      // Filtrar por año si está seleccionado
      if (yearFilter && itemDate.getFullYear().toString() !== yearFilter) {
        return false;
      }
      
      // Filtrar por mes si está seleccionado
      if (monthFilter) {
        const itemMonth = itemDate.toISOString().slice(0, 7);
        return itemMonth === monthFilter;
      }
      
      return true;
    });
  };
  


  const formatMonthLabel = (monthString) => {
    // Evitar problemas de zona horaria usando constructor numérico
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1); // month es 0-indexed
    const formatted = date.toLocaleDateString('es-AR', { 
      year: 'numeric', 
      month: 'long' 
    });
    // Capitalizar la primera letra del mes
    const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    return capitalized;
  };

  // Función para formatear solo el mes (sin año) para el dropdown
  const formatMonthOnly = (monthString) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const formatted = date.toLocaleDateString('es-AR', { 
      month: 'long' 
    });
    // Capitalizar la primera letra del mes
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  // Función para obtener colores por categoría
  const getCategoryColor = (categoryId) => {
    const colors = [
      { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
      { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' },
      { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700' },
      { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700' },
      { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-700' },
      { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-700' },
      { bg: 'bg-cyan-100', border: 'border-cyan-400', text: 'text-cyan-700' },
      { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' },
    ];
    
    if (!categoryId) {
      return { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' };
    }
    
    // Usar el hash del categoryId para asignar colores consistentes
    let hash = 0;
    for (let i = 0; i < categoryId.length; i++) {
      hash = categoryId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  // Usar datos de categorías pre-calculados del backend
  const calculateCategoryData = () => {
    if (!data.categoriesAnalytics || !data.categoriesAnalytics.length) {
      return [];
    }

    // Los datos ya vienen del backend con cálculos completos
    const colors = ['#009ee3', '#00a650', '#ff6900', '#e53e3e', '#6b7280', '#8b5cf6', '#f59e0b'];
    
    return data.categoriesAnalytics.map((category, index) => ({
      name: category.Name,
      value: category.Percentage,
      amount: category.TotalAmount,
      color: colors[index % colors.length]
    })).filter(item => item.value > 0); // Solo mostrar categorías con gastos
  };

  // Datos simplificados del gráfico usando métricas del backend
  const calculateChartData = () => {
    let periodLabel = 'Total';
    
    if (selectedMonth && selectedYear) {
      periodLabel = formatMonthLabel(selectedMonth);
    } else if (selectedMonth) {
      periodLabel = new Date(selectedMonth + '-01').toLocaleDateString('es-AR', { month: 'short' });
    } else if (selectedYear) {
      periodLabel = selectedYear;
    }
    
    return [{
      name: periodLabel,
      ingresos: data.totalIncome,
      gastos: data.totalExpenses
    }];
  };

  // Datos para los gráficos
  const chartData = calculateChartData();
  const pieData = calculateCategoryData();

  // Función para ordenar transacciones
  const sortTransactions = (transactions, sortType) => {
    const sorted = [...transactions];
    
    switch (sortType) {
      case 'fecha':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          
          // Manejar fechas inválidas - ponerlas al final
          if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
          if (isNaN(dateA.getTime())) return 1;
          if (isNaN(dateB.getTime())) return -1;
          
          return dateB - dateA;
        });
      case 'monto':
        return sorted.sort((a, b) => {
          const amountA = Number(a.amount) || 0;
          const amountB = Number(b.amount) || 0;
          return amountB - amountA;
        });
      case 'categoria':
        return sorted.sort((a, b) => {
          const categoryA = data.categories.find(c => c.id === a.category_id)?.name || 'Sin categoría';
          const categoryB = data.categories.find(c => c.id === b.category_id)?.name || 'Sin categoría';
          return categoryA.localeCompare(categoryB);
        });
      default:
        return sorted;
    }
  };

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


      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Balance total */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-mp-gray-600">
                Balance Total
              </p>
              <p className={`text-xl lg:text-2xl font-bold ${data.balance >= 0 ? 'text-mp-secondary' : 'text-mp-error'} break-words`}>
                {formatAmount(data.balance)}
              </p>
            </div>
            <div className={`flex-shrink-0 p-2 lg:p-3 rounded-mp ${data.balance >= 0 ? 'bg-green-100' : 'bg-red-100'} ml-2`}>
              <DollarSign className={`w-5 h-5 lg:w-6 lg:h-6 ${data.balance >= 0 ? 'text-mp-secondary' : 'text-mp-error'}`} />
            </div>
          </div>
          <div className="mt-3 flex items-center">
            {data.balance >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-mp-secondary mr-1 flex-shrink-0" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-mp-error mr-1 flex-shrink-0" />
            )}
            <span className={`text-sm ${data.balance >= 0 ? 'text-mp-secondary' : 'text-mp-error'}`}>
              {data.balance >= 0 ? 'Positivo' : 'Negativo'}
            </span>
          </div>
        </div>

        {/* Total ingresos */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-mp-gray-600">
                Total Ingresos
              </p>
              <p className="text-xl lg:text-2xl font-bold text-mp-secondary break-words">
                {formatAmount(data.totalIncome)}
              </p>
            </div>
            <div className="flex-shrink-0 p-2 lg:p-3 rounded-mp bg-green-100 ml-2">
              <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-mp-secondary" />
            </div>
          </div>
          <div className="mt-3 flex items-center">
            <TrendingUp className="w-4 h-4 text-mp-secondary mr-1 flex-shrink-0" />
            <span className="text-sm text-mp-gray-500">
              {data.incomes.length} {data.incomes.length === 1 ? 'ingreso' : 'ingresos'} registrados
            </span>
          </div>
        </div>

        {/* Total gastos */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-mp-gray-600">
                Total Gastos
              </p>
              <p className="text-xl lg:text-2xl font-bold text-mp-gray-900 break-words">
                {formatAmount(data.totalExpenses)}
              </p>
            </div>
            <div className="flex-shrink-0 p-2 lg:p-3 rounded-mp bg-gray-100 ml-2">
              <TrendingDown className="w-5 h-5 lg:w-6 lg:h-6 text-mp-gray-900" />
            </div>
          </div>
          <div className="mt-3 flex items-center">
            <TrendingDown className="w-4 h-4 text-mp-gray-900 mr-1 flex-shrink-0" />
            <span className="text-sm text-mp-gray-500">
              {data.expenses.length} {data.expenses.length === 1 ? 'gasto' : 'gastos'} registrados
            </span>
          </div>
        </div>

        {/* Gastos pendientes */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-mp-gray-600">
                Gastos Pendientes
              </p>
              <p className="text-xl lg:text-2xl font-bold text-mp-gray-900">
                {data.expenses.filter(e => !e.paid).length}
              </p>
            </div>
            <div className="flex-shrink-0 p-2 lg:p-3 rounded-mp bg-gray-100 ml-2">
              <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-mp-gray-900" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm text-mp-gray-500">
              {formatAmount(data.expenses.filter(e => !e.paid).reduce((sum, e) => sum + e.amount, 0))} por pagar
            </span>
          </div>
        </div>
      </div>

      {/* Transacciones por mes - Dos columnas */}
      {hasActiveFilters && (data.expenses.length > 0 || data.incomes.length > 0) && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-mp-gray-900">
              💰 Transacciones de {getPeriodTitle()}
            </h3>
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
              {/* Dropdown de ordenamiento */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-mp-gray-600">Ordenar por:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-mp-gray-300 rounded-mp px-3 py-1 focus:outline-none focus:ring-2 focus:ring-mp-primary focus:border-transparent"
                >
                  <option value="fecha">Fecha</option>
                  <option value="monto">Monto</option>
                  <option value="categoria">Categoría</option>
                </select>
              </div>
              
              {/* Indicadores de cantidad */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-mp-error rounded-full mr-2"></div>
                  <span className="text-mp-gray-600">Gastos ({data.expenses.length})</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-mp-secondary rounded-full mr-2"></div>
                  <span className="text-mp-gray-600">Ingresos ({data.incomes.length})</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 xl:gap-8">
            {/* Columna de Gastos */}
            <div className="space-y-4">
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-mp-gray-900 flex items-center">
                    <TrendingDown className="w-5 h-5 mr-2" />
                    Gastos
                  </h4>
                  <span className="text-lg font-bold text-mp-gray-900">
                    {formatAmount(data.totalExpenses)}
                  </span>
                </div>
                

              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.expenses.length === 0 ? (
                  <div className="text-center py-8 text-mp-gray-500">
                    <TrendingDown className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hay gastos en este período</p>
                  </div>
                ) : (
                  sortTransactions(data.expenses, sortBy)
                    .map((expense, index) => {
                      const category = data.categories.find(c => c.id === expense.category_id);
                      const color = getCategoryColor(expense.category_id);
                      return (
                        <div key={expense.id || index} className={`flex items-center justify-between p-3 rounded-mp bg-white border border-mp-gray-100 hover:shadow-sm transition-shadow`}>
                          <div className="flex items-start space-x-3">
                            {/* Indicador de pago */}
                            <div className="flex-shrink-0 mt-1">
                              {expense.paid ? (
                                <CheckCircle className="w-5 h-5 text-mp-secondary" />
                              ) : (
                                <XCircle className="w-5 h-5 text-mp-error" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-mp-gray-900 text-sm">
                                  {expense.description}
                                </p>
                                {!expense.paid && (
                                  <span className="badge-error text-xs">Pendiente</span>
                                )}
                                {category && (
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${color.bg} ${color.text} border ${color.border}`}>
                                    {category.name}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-mp-gray-500 mt-1">
                                {new Date(expense.created_at).toLocaleDateString('es-AR')}
                                {expense.due_date && (
                                  <span className="ml-2">
                                    • Vence: {new Date(expense.due_date).toLocaleDateString('es-AR')}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right ml-3">
                            <p className="font-semibold text-mp-gray-900">
                              -{formatAmount(expense.amount)}
                            </p>
                            {expense.percentage && (
                              <p className="text-xs text-mp-gray-500">
                                {formatPercentage(expense.percentage)} del total
                              </p>
                            )}
                            {expense.amount_paid > 0 && expense.amount_paid < expense.amount && (
                              <p className="text-xs text-mp-gray-500">
                                Pagado: {formatAmount(expense.amount_paid)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Separador vertical - Solo visible en desktop */}
            <div className="hidden lg:block absolute left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-mp-gray-200 to-transparent transform -translate-x-1/2"></div>

            {/* Columna de Ingresos */}
            <div className="space-y-4">
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-mp-secondary flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Ingresos
                  </h4>
                  <span className="text-lg font-bold text-mp-secondary">
                    {formatAmount(data.totalIncome)}
                  </span>
                </div>

              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.incomes.length === 0 ? (
                  <div className="text-center py-8 text-mp-gray-500">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hay ingresos en este período</p>
                  </div>
                ) : (
                  sortTransactions(data.incomes, sortBy)
                    .map((income, index) => {
                      const color = getCategoryColor(income.category_id);
                      const category = data.categories.find(c => c.id === income.category_id);
                      return (
                        <div key={income.id || index} className={`flex items-center justify-between p-3 rounded-mp bg-white border border-mp-gray-100 hover:shadow-sm transition-shadow`}>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-mp-gray-900 text-sm">
                                {income.description}
                              </p>
                              {category && (
                                <span className={`px-2 py-1 rounded text-xs font-medium ${color.bg} ${color.text} border ${color.border}`}>
                                  {category.name}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-mp-gray-500 mt-1">
                              {new Date(income.created_at).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                          <div className="text-right ml-3">
                            <p className="font-semibold text-mp-secondary">
                              +{formatAmount(income.amount)}
                            </p>
                            {income.percentage && (
                              <p className="text-xs text-mp-gray-500">
                                {formatPercentage(income.percentage)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>

          {/* Resumen de totales del período */}
          {(data.expenses.length > 0 || data.incomes.length > 0) && (
            <div className="mt-6 pt-4 border-t border-mp-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Total gastos */}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-mp-gray-600">Total gastos:</span>
                  <div className="text-right">
                    <div className="font-bold text-mp-gray-900">
                      {formatAmount(data.totalExpenses)}
                    </div>
                    {data.totalIncome > 0 && (
                      <div className="text-xs text-mp-gray-500">
                        {((data.totalExpenses / data.totalIncome) * 100).toFixed(1)}% de ingresos
                      </div>
                    )}
                  </div>
                </div>

                {/* Total ingresos */}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-mp-gray-600">Total ingresos:</span>
                  <div className="text-right">
                    <div className="font-bold text-mp-secondary">
                      {formatAmount(data.totalIncome)}
                    </div>
                    <div className="text-xs text-mp-gray-500">
                      100% base
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Balance del período */}
              <div className="flex items-center justify-between pt-3 border-t border-mp-gray-200">
                <span className="text-mp-gray-600">Balance del período:</span>
                <span className={`text-xl font-bold ${data.balance >= 0 ? 'text-mp-secondary' : 'text-mp-error'}`}>
                  {data.balance >= 0 ? '+' : ''}{formatAmount(data.balance)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {/* Gráfico de tendencias */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-mp-gray-900">
                {hasActiveFilters ? `Datos de ${getPeriodTitle()}` : 'Tendencia Mensual'}
              </h3>
              <p className="text-sm text-mp-gray-500 mt-1">
                {hasActiveFilters 
                  ? 'Resumen del período seleccionado' 
                  : 'Datos del mes actual (histórico próximamente)'
                }
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
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
          <ResponsiveContainer width="100%" height={250}>
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
          <h3 className="text-lg font-semibold text-mp-gray-900 mb-6">
            Gastos por Categoría{hasActiveFilters && ` - ${getPeriodTitle()}`}
          </h3>
          {pieData.length > 0 ? (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={false}
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
          {(() => {
            const allTransactions = [...data.expenses.slice(0, 3), ...data.incomes.slice(0, 2)];
            const sortedTransactions = allTransactions
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .slice(0, 5);
            
            return sortedTransactions.map((transaction, index) => {
              const isExpense = transaction.hasOwnProperty('paid');
              const color = getCategoryColor(transaction.category_id);
              const category = data.categories.find(c => c.id === transaction.category_id);
              return (
                <div key={index} className={`flex items-center justify-between p-4 rounded-mp bg-mp-gray-50 border-l-4 ${color.border || (isExpense ? 'border-mp-gray-900' : 'border-mp-secondary')}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-mp ${isExpense ? 'bg-gray-100' : 'bg-green-100'}`}>
                      {isExpense ? (
                        <TrendingDown className="w-4 h-4 text-mp-gray-900" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-mp-secondary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-mp-gray-900">{transaction.description}</p>
                        {/* Indicador de pago solo para gastos */}
                        {isExpense && (
                          <div className="flex items-center space-x-1">
                            {transaction.paid ? (
                              <CheckCircle className="w-4 h-4 text-mp-secondary" />
                            ) : (
                              <XCircle className="w-4 h-4 text-mp-error" />
                            )}
                            {!transaction.paid && (
                              <span className="badge-error text-xs">Pendiente</span>
                            )}
                          </div>
                        )}
                        {/* Badge de categoría */}
                        {category && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${color.bg} ${color.text} border ${color.border}`}>
                            {category.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-mp-gray-500">
                        {transaction.created_at ? formatDate(transaction.created_at) : 'Fecha no disponible'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${isExpense ? 'text-mp-gray-900' : 'text-mp-secondary'}`}>
                      {isExpense ? '-' : '+'}{formatAmount(transaction.amount)}
                    </p>
                    {transaction.percentage && (
                      <p className="text-sm text-mp-gray-500">
                        {formatPercentage(transaction.percentage)} del total
                      </p>
                    )}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 