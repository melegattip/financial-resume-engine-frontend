import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowUp, FaArrowDown, FaDollarSign, FaChartPie, FaCalendar, FaCheckCircle, FaTimesCircle, FaChartBar, FaBullseye, FaExclamationCircle, FaRedo, FaBrain } from 'react-icons/fa';
import { 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import { formatCurrency, formatDate, formatPercentage as formatPercentageUtil, budgetsAPI, savingsGoalsAPI, recurringTransactionsAPI } from '../services/api';
import { usePeriod } from '../contexts/PeriodContext';
import { useAuth } from '../contexts/AuthContext';
import { useGamification } from '../contexts/GamificationContext';
import dataService from '../services/dataService';
import useDataRefresh from '../hooks/useDataRefresh';
import LockedWidget from '../components/LockedWidget';


import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('fecha');
  const [data, setData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    expenses: [],
    incomes: [],
    categories: [],
  });

  // Estados para las nuevas funcionalidades
  const [budgetsSummary, setBudgetsSummary] = useState(null);
  const [savingsGoalsSummary, setSavingsGoalsSummary] = useState(null);
  const [recurringTransactionsSummary, setRecurringTransactionsSummary] = useState(null);

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

  // Usar el contexto de autenticación
  const { user, isAuthenticated } = useAuth();

  // Usar el contexto de gamificación para niveles
  const { userProfile, isFeatureUnlocked, FEATURE_GATES } = useGamification();

  // Debug de autenticación
  useEffect(() => {
    console.log('🔍 Dashboard - Estado de autenticación:', {
      isAuthenticated,
      user,
      token: localStorage.getItem('auth_token') ? 'EXISTS' : 'MISSING'
    });
  }, [isAuthenticated, user]);

  const loadDashboardData = async (shouldUpdateAvailableData = true) => {
    try {
      setLoading(true);
      
      // Obtener parámetros de filtro del contexto global
      const filterParams = getFilterParams();
      
      console.log('📊 Cargando dashboard con parámetros:', filterParams);

      // Usar el servicio optimizado de datos
      const dashboardData = await dataService.loadDashboardData(
        filterParams, 
        isAuthenticated && user // Solo usar endpoints optimizados si está autenticado
      );

      setData(dashboardData);
      
      // Actualizar datos disponibles en el contexto global solo la primera vez
      if (shouldUpdateAvailableData) {
        updateAvailableData(
          dashboardData.allExpenses || dashboardData.expenses, 
          dashboardData.allIncomes || dashboardData.incomes
        );
      }

      console.log(`✅ Dashboard cargado exitosamente (${dashboardData.source})`);
      
    } catch (error) {
      console.error('❌ Error cargando dashboard:', error);
      
      // Último recurso: datos vacíos
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
      
      toast.error('Error cargando datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Cargar resúmenes de las nuevas funcionalidades
  const loadNewFeaturesSummary = async () => {
    try {
      console.log('🔄 Cargando resúmenes de nuevas funcionalidades...');
      
      const [budgetsRes, savingsRes, recurringRes] = await Promise.all([
        budgetsAPI.getDashboard().catch((err) => {
          console.warn('❌ Error cargando budgets dashboard:', err);
          return null;
        }),
        savingsGoalsAPI.getDashboard().catch((err) => {
          console.warn('❌ Error cargando savings goals dashboard:', err);
          return null;
        }),
        recurringTransactionsAPI.getDashboard().catch((err) => {
          console.warn('❌ Error cargando recurring transactions dashboard:', err);
          return null;
        })
      ]);

      console.log('📊 Respuestas recibidas:', {
        budgets: budgetsRes,
        savings: savingsRes,
        recurring: recurringRes
      });

      if (budgetsRes?.data?.data) {
        console.log('✅ Configurando budgets summary:', budgetsRes.data.data);
        setBudgetsSummary(budgetsRes.data.data);
      }
      if (savingsRes?.data?.data) {
        console.log('✅ Configurando savings goals summary:', savingsRes.data.data);
        setSavingsGoalsSummary(savingsRes.data.data);
      }
      if (recurringRes?.data?.data) {
        console.log('✅ Configurando recurring transactions summary:', recurringRes.data.data);
        setRecurringTransactionsSummary(recurringRes.data.data);
      }
    } catch (error) {
      console.error('❌ Error cargando resúmenes de nuevas funcionalidades:', error);
    }
  };

  const formatAmount = (amount) => {
    if (balancesHidden) return '••••••';
    return formatCurrency(amount);
  };

  const formatPercentage = (percentage) => {
    if (balancesHidden) {
      return '••••';
    }
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

  // Función para obtener colores por categoría
  const getCategoryColor = (categoryId) => {
    const colors = [
      { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-400', text: 'text-blue-700 dark:text-blue-300' },
      { bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-400', text: 'text-green-700 dark:text-green-300' },
      { bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-400', text: 'text-yellow-700 dark:text-yellow-300' },
      { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-400', text: 'text-purple-700 dark:text-purple-300' },
      { bg: 'bg-pink-100 dark:bg-pink-900/30', border: 'border-pink-400', text: 'text-pink-700 dark:text-pink-300' },
      { bg: 'bg-indigo-100 dark:bg-indigo-900/30', border: 'border-indigo-400', text: 'text-indigo-700 dark:text-indigo-300' },
      { bg: 'bg-cyan-100 dark:bg-cyan-900/30', border: 'border-cyan-400', text: 'text-cyan-700 dark:text-cyan-300' },
      { bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-400', text: 'text-orange-700 dark:text-orange-300' },
    ];
    
    if (!categoryId) {
      return { bg: 'bg-gray-100 dark:bg-gray-700', border: 'border-gray-400 dark:border-gray-500', text: 'text-gray-700 dark:text-gray-300' };
    }
    
    // Usar el hash del categoryId para asignar colores consistentes
    let hash = 0;
    for (let i = 0; i < categoryId.length; i++) {
      hash = categoryId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  // Usar datos de categorías pre-calculados del backend o calcular client-side
  const calculateCategoryData = () => {
    // Si tenemos datos del backend analytics, usarlos
    if (data.categoriesAnalytics && data.categoriesAnalytics.length) {
      const colors = ['#009ee3', '#00a650', '#ff6900', '#e53e3e', '#6b7280', '#8b5cf6', '#f59e0b'];
      
      console.log('🔍 Datos de categorías del backend:', data.categoriesAnalytics);
      
      const result = data.categoriesAnalytics.map((category, index) => ({
        name: category.Name || category.CategoryName || category.category_name || 'Sin nombre',
        value: category.Percentage || category.PercentageOfExpenses || category.percentage_of_expenses || 0,
        amount: category.TotalAmount || category.total_amount || 0,
        color: colors[index % colors.length]
      })).filter(item => item.value > 0);
      
      console.log('📊 Datos procesados para el gráfico:', result);
      return result;
    }

    // Fallback: calcular client-side si no hay datos del backend
    if (!data.expenses || !data.expenses.length) {
      return [];
    }

    const categoryTotals = {};
    const totalExpenses = data.expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Agrupar gastos por categoría
    data.expenses.forEach(expense => {
      const categoryId = expense.category_id || 'sin-categoria';
      const category = data.categories.find(c => c.id === categoryId);
      const categoryName = category ? category.name : 'Sin categoría';
      
      if (!categoryTotals[categoryId]) {
        categoryTotals[categoryId] = {
          name: categoryName,
          amount: 0
        };
      }
      categoryTotals[categoryId].amount += expense.amount;
    });

    // Convertir a formato del gráfico
    const colors = ['#009ee3', '#00a650', '#ff6900', '#e53e3e', '#6b7280', '#8b5cf6', '#f59e0b'];
    
    return Object.entries(categoryTotals)
      .map(([categoryId, data], index) => ({
        name: data.name,
        value: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        amount: data.amount,
        color: colors[index % colors.length]
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.amount - a.amount); // Ordenar por monto descendente
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

  // Datos para los gráficos (usando useMemo para optimizar)
  const chartData = useMemo(() => calculateChartData(), [selectedMonth, selectedYear, data.totalIncome, data.totalExpenses]);
  const pieData = useMemo(() => calculateCategoryData(), [data.expenses, data.categories, data.categoriesAnalytics]);

  // Hook para refrescar automáticamente cuando cambian los datos
  useDataRefresh(loadDashboardData, ['expense', 'income', 'recurring_transaction']);

  // Cargar datos iniciales
  useEffect(() => {
    loadDashboardData();
    loadNewFeaturesSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recargar datos cuando cambien los filtros
  useEffect(() => {
    if (selectedMonth !== null || selectedYear !== null) {
      loadDashboardData(false); // false = no recalcular meses disponibles
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

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
        <span className="ml-2 text-fr-gray-600 dark:text-gray-400">Cargando dashboard...</span>
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
              <p className="text-sm font-medium text-fr-gray-600 dark:text-gray-400">
                Balance Total
              </p>
              <p className={`text-xl lg:text-2xl font-bold ${data.balance >= 0 ? 'text-fr-secondary' : 'text-fr-error'} break-words`}>
                {formatAmount(data.balance)}
              </p>
            </div>
            <div className={`flex-shrink-0 p-2 lg:p-3 rounded-fr ${data.balance >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} ml-2`}>
              <FaDollarSign className={`w-5 h-5 lg:w-6 lg:h-6 ${data.balance >= 0 ? 'text-fr-secondary' : 'text-fr-error'}`} />
            </div>
          </div>
          <div className="mt-3 flex items-center">
            {data.balance >= 0 ? (
              <FaArrowUp className="w-4 h-4 text-fr-secondary mr-1 flex-shrink-0" />
            ) : (
              <FaArrowDown className="w-4 h-4 text-fr-error mr-1 flex-shrink-0" />
            )}
            <span className={`text-sm ${data.balance >= 0 ? 'text-fr-secondary' : 'text-fr-error'}`}>
              {data.balance >= 0 ? 'Positivo' : 'Negativo'}
            </span>
          </div>
        </div>

        {/* Total ingresos */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-fr-gray-600 dark:text-gray-400">
                Total Ingresos
              </p>
              <p className="text-xl lg:text-2xl font-bold text-fr-secondary break-words">
                {formatAmount(data.totalIncome)}
              </p>
            </div>
            <div className="flex-shrink-0 p-2 lg:p-3 rounded-fr bg-green-100 dark:bg-green-900/30 ml-2">
              <FaArrowUp className="w-5 h-5 lg:w-6 lg:h-6 text-fr-secondary" />
            </div>
          </div>
          <div className="mt-3 flex items-center">
            <FaArrowUp className="w-4 h-4 text-fr-secondary mr-1 flex-shrink-0" />
            <span className="text-sm text-fr-gray-500 dark:text-gray-400">
              {data.incomes.length} {data.incomes.length === 1 ? 'ingreso' : 'ingresos'} registrados
            </span>
          </div>
        </div>

        {/* Total gastos */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-fr-gray-600 dark:text-gray-400">
                Total Gastos
              </p>
              <p className="text-xl lg:text-2xl font-bold text-fr-gray-900 dark:text-gray-100 break-words">
                {formatAmount(data.totalExpenses)}
              </p>
            </div>
            <div className="flex-shrink-0 p-2 lg:p-3 rounded-fr bg-gray-100 dark:bg-gray-700 ml-2">
              <FaArrowDown className="w-5 h-5 lg:w-6 lg:h-6 text-fr-gray-900 dark:text-gray-300" />
            </div>
          </div>
          <div className="mt-3 flex items-center">
            <FaArrowDown className="w-4 h-4 text-fr-gray-900 dark:text-gray-300 mr-1 flex-shrink-0" />
            <span className="text-sm text-fr-gray-500 dark:text-gray-400">
              {data.expenses.length} {data.expenses.length === 1 ? 'gasto' : 'gastos'} registrados
            </span>
          </div>
        </div>

        {/* Gastos pendientes */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-fr-gray-600 dark:text-gray-400">
                Gastos Pendientes
              </p>
              <p className="text-xl lg:text-2xl font-bold text-fr-gray-900 dark:text-gray-100">
                {data.expenses.filter(e => !e.paid).length}
              </p>
            </div>
            <div className="flex-shrink-0 p-2 lg:p-3 rounded-fr bg-gray-100 dark:bg-gray-700 ml-2">
              <FaCalendar className="w-5 h-5 lg:w-6 lg:h-6 text-fr-gray-900 dark:text-gray-300" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm text-fr-gray-500 dark:text-gray-400">
              {formatAmount(data.expenses.filter(e => !e.paid).reduce((sum, e) => sum + e.amount, 0))} por pagar
            </span>
          </div>
        </div>
      </div>

      {/* Widgets de funcionalidades activas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Widget de Presupuestos (Nivel 5 requerido) */}
        {isFeatureUnlocked('BUDGETS') && budgetsSummary && (
          <div className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fr-gray-600 dark:text-gray-400">
                  Presupuestos
                </p>
                <p className="text-xl lg:text-2xl font-bold text-fr-gray-900 dark:text-gray-100 break-words">
                  {budgetsSummary.summary?.total_budgets || 0}
                </p>
              </div>
              <div className="flex-shrink-0 p-2 lg:p-3 rounded-fr bg-blue-100 dark:bg-blue-900/30 ml-2">
                <FaChartPie className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs">
                <span className="text-green-600">
                  {budgetsSummary.summary?.on_track_count || 0} en meta
                </span>
                <span className="text-yellow-600 dark:text-yellow-400">
                  {budgetsSummary.summary?.warning_count || 0} alerta
                </span>
                <span className="text-red-600 dark:text-red-400">
                  {budgetsSummary.summary?.exceeded_count || 0} excedidos
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Widget de Metas de Ahorro (Nivel 3 requerido) */}
        {isFeatureUnlocked('SAVINGS_GOALS') && savingsGoalsSummary && (
          <div className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fr-gray-600 dark:text-gray-400">
                  Metas de Ahorro
                </p>
                <p className="text-xl lg:text-2xl font-bold text-green-600 break-words">
                  {formatAmount(savingsGoalsSummary.summary?.total_saved || 0)}
                </p>
              </div>
              <div className="flex-shrink-0 p-2 lg:p-3 rounded-fr bg-green-100 dark:bg-green-900/30 ml-2">
                <FaBullseye className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-fr-gray-500 dark:text-gray-400">
                {savingsGoalsSummary.summary?.active_goals || 0} metas activas
              </span>
              <span className="text-sm text-fr-gray-500 dark:text-gray-400">
                Meta: {formatAmount(savingsGoalsSummary.summary?.total_target || 0)}
              </span>
            </div>
          </div>
        )}

        {/* Widget de IA Financiera (Nivel 7 requerido) */}
        {isFeatureUnlocked('AI_INSIGHTS') && (
          <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/insights')}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fr-gray-600 dark:text-gray-400">
                  IA Financiera
                </p>
                <p className="text-xl lg:text-2xl font-bold text-purple-600 dark:text-purple-400 break-words">
                  Activa
                </p>
              </div>
              <div className="flex-shrink-0 p-2 lg:p-3 rounded-fr bg-purple-100 dark:bg-purple-900/30 ml-2">
                <FaBrain className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-sm text-fr-gray-500 dark:text-gray-400">
                🤖 Análisis inteligente disponible
              </span>
            </div>
          </div>
        )}

        {/* Widget de Transacciones Recurrentes */}
        {recurringTransactionsSummary && (
          <div className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fr-gray-600 dark:text-gray-400">
                  Transacciones Recurrentes
                </p>
                <p className="text-xl lg:text-2xl font-bold text-fr-gray-900 dark:text-gray-100 break-words">
                  {recurringTransactionsSummary.summary?.total_active || 0}
                </p>
              </div>
              <div className="flex-shrink-0 p-2 lg:p-3 rounded-fr bg-purple-100 dark:bg-purple-900/30 ml-2">
                <FaRedo className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-green-600">
                +{formatAmount(recurringTransactionsSummary.summary?.monthly_income_total || 0)}/mes
              </span>
              <span className="text-sm text-red-600 dark:text-red-400">
                -{formatAmount(recurringTransactionsSummary.summary?.monthly_expense_total || 0)}/mes
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Widgets bloqueados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Widget de Presupuestos (Nivel 5 requerido) */}
        {!isFeatureUnlocked('BUDGETS') && (
          <LockedWidget
            mode="minimal"
            featureName="Presupuestos"
            featureIcon={<FaChartPie className="w-4 h-4" />}
            description="Controla tus gastos con límites inteligentes por categoría"
            requiredLevel={FEATURE_GATES.BUDGETS.requiredLevel}
            currentLevel={userProfile?.current_level || 0}
            currentXP={userProfile?.total_xp || 0}
            requiredXP={FEATURE_GATES.BUDGETS.xpThreshold}
            benefits={FEATURE_GATES.BUDGETS.benefits}
          />
        )}

        {/* Widget de Metas de Ahorro (Nivel 3 requerido) */}
        {!isFeatureUnlocked('SAVINGS_GOALS') && (
          <LockedWidget
            mode="minimal"
            featureName="Metas de Ahorro"
            featureIcon={<FaBullseye className="w-4 h-4" />}
            description="Crea y gestiona objetivos de ahorro personalizados"
            requiredLevel={FEATURE_GATES.SAVINGS_GOALS.requiredLevel}
            currentLevel={userProfile?.current_level || 0}
            currentXP={userProfile?.total_xp || 0}
            requiredXP={FEATURE_GATES.SAVINGS_GOALS.xpThreshold}
            benefits={FEATURE_GATES.SAVINGS_GOALS.benefits}
          />
        )}

        {/* Widget de IA Financiera (Nivel 7 requerido) */}
        {!isFeatureUnlocked('AI_INSIGHTS') && (
          <LockedWidget
            mode="minimal"
            featureName="IA Financiera"
            featureIcon={<FaBrain className="w-4 h-4" />}
            description="Análisis inteligente con IA para decisiones financieras"
            requiredLevel={FEATURE_GATES.AI_INSIGHTS.requiredLevel}
            currentLevel={userProfile?.current_level || 0}
            currentXP={userProfile?.total_xp || 0}
            requiredXP={FEATURE_GATES.AI_INSIGHTS.xpThreshold}
            benefits={FEATURE_GATES.AI_INSIGHTS.benefits}
          />
        )}
      </div>

      {/* Transacciones por mes - Dos columnas */}
      {hasActiveFilters && (data.expenses.length > 0 || data.incomes.length > 0) && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              💰 Transacciones de {getPeriodTitle()}
            </h3>
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
              {/* Dropdown de ordenamiento */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Ordenar por:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="fecha">Fecha</option>
                  <option value="monto">Monto</option>
                  <option value="categoria">Categoría</option>
                </select>
              </div>
              
              {/* Indicadores de cantidad */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-gray-600 dark:text-gray-400">Gastos ({data.expenses.length})</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-gray-600 dark:text-gray-400">Ingresos ({data.incomes.length})</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 xl:gap-8">
            {/* Columna de Gastos */}
            <div className="space-y-4">
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <FaArrowDown className="w-5 h-5 mr-2" />
                    Gastos
                  </h4>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatAmount(data.totalExpenses)}
                  </span>
                </div>
                

              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.expenses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FaArrowDown className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hay gastos en este período</p>
                  </div>
                ) : (
                  sortTransactions(data.expenses, sortBy)
                    .map((expense, index) => {
                      const category = data.categories.find(c => c.id === expense.category_id);
                      const color = getCategoryColor(expense.category_id);
                      return (
                        <div key={expense.id || index} className={`flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 hover:shadow-sm transition-shadow`}>
                          <div className="flex items-start space-x-3">
                            {/* Indicador de pago */}
                            <div className="flex-shrink-0 mt-1">
                              {expense.paid ? (
                                <FaCheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <FaTimesCircle className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
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
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              -{formatAmount(expense.amount)}
                            </p>
                            {expense.percentage && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatPercentage(expense.percentage)} del total
                              </p>
                            )}
                            {expense.amount_paid > 0 && expense.amount_paid < expense.amount && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
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
            <div className="hidden lg:block absolute left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-gray-200 dark:via-gray-600 to-transparent transform -translate-x-1/2"></div>

            {/* Columna de Ingresos */}
            <div className="space-y-4">
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-green-600 dark:text-green-400 flex items-center">
                    <FaArrowUp className="w-5 h-5 mr-2" />
                    Ingresos
                  </h4>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatAmount(data.totalIncome)}
                  </span>
                </div>

              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.incomes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FaArrowUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hay ingresos en este período</p>
                  </div>
                ) : (
                  sortTransactions(data.incomes, sortBy)
                    .map((income, index) => {
                      const color = getCategoryColor(income.category_id);
                      const category = data.categories.find(c => c.id === income.category_id);
                      return (
                        <div key={income.id || index} className={`flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 hover:shadow-sm transition-shadow`}>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                {income.description}
                              </p>
                              {category && (
                                <span className={`px-2 py-1 rounded text-xs font-medium ${color.bg} ${color.text} border ${color.border}`}>
                                  {category.name}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(income.created_at).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                          <div className="text-right ml-3">
                            <p className="font-semibold text-green-600 dark:text-green-400">
                              +{formatAmount(income.amount)}
                            </p>
                            {income.percentage && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
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
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Total gastos */}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Total gastos:</span>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-gray-100">
                      {formatAmount(data.totalExpenses)}
                    </div>
                    {data.totalIncome > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {((data.totalExpenses / data.totalIncome) * 100).toFixed(1)}% de ingresos
                      </div>
                    )}
                  </div>
                </div>

                {/* Total ingresos */}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Total ingresos:</span>
                  <div className="text-right">
                    <div className="font-bold text-green-600 dark:text-green-400">
                      {formatAmount(data.totalIncome)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      100% base
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Balance del período */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                <span className="text-gray-600 dark:text-gray-400">Balance del período:</span>
                <span className={`text-xl font-bold ${data.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {data.balance >= 0 ? '+' : ''}{formatAmount(data.balance)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {/* Métricas clave */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
                          <h3 className="text-lg font-semibold text-fr-gray-900 dark:text-gray-100">
              {hasActiveFilters ? `Métricas de ${getPeriodTitle()}` : 'Métricas del Período'}
            </h3>
            <p className="text-sm text-fr-gray-500 dark:text-gray-400 mt-1">
              Estadísticas clave de tus finanzas
            </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Total de transacciones */}
            <div className="bg-fr-gray-50 dark:bg-gray-700 rounded-fr p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-fr">
                  <FaChartBar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-fr-gray-600 dark:text-gray-400">Total Transacciones</p>
                  <p className="text-xl font-bold text-fr-gray-900 dark:text-gray-100">
                    {data.expenses.length + data.incomes.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Promedio diario */}
            <div className="bg-fr-gray-50 dark:bg-gray-700 rounded-fr p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-fr">
                  <FaCalendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-fr-gray-600 dark:text-gray-400">Promedio Diario</p>
                  <p className="text-xl font-bold text-fr-gray-900 dark:text-gray-100">
                    {(() => {
                      const totalExpenses = data.expenses.reduce((sum, exp) => sum + exp.amount, 0);
                      const daysInPeriod = hasActiveFilters ? 30 : 30; // Simplificado por ahora
                      const dailyAvg = totalExpenses / daysInPeriod;
                      return formatAmount(dailyAvg);
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Categoría top */}
            <div className="bg-fr-gray-50 dark:bg-gray-700 rounded-fr p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-fr">
                  <FaBullseye className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-fr-gray-600 dark:text-gray-400">Mayor Gasto</p>
                  <p className="text-sm font-semibold text-fr-gray-900 dark:text-gray-100">
                    {(() => {
                      const categoryExpenses = {};
                      data.expenses.forEach(expense => {
                        if (!categoryExpenses[expense.category_id]) {
                          categoryExpenses[expense.category_id] = 0;
                        }
                        categoryExpenses[expense.category_id] += expense.amount;
                      });
                      
                      const topCategoryId = Object.keys(categoryExpenses).reduce((a, b) => 
                        categoryExpenses[a] > categoryExpenses[b] ? a : b, null
                      );
                      
                      if (!topCategoryId) return 'Sin datos';
                      
                      const topCategory = data.categories.find(c => c.id === topCategoryId);
                      return topCategory ? topCategory.name : 'Sin categoría';
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Gastos pendientes */}
            <div className="bg-fr-gray-50 dark:bg-gray-700 rounded-fr p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-fr">
                  <FaExclamationCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-fr-gray-600 dark:text-gray-400">Pendientes</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {data.expenses.filter(exp => !exp.paid).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de categorías */}
        <div className="card">
          <h3 className="text-lg font-semibold text-fr-gray-900 dark:text-gray-100 mb-6">
            Gastos por Categoría{hasActiveFilters && ` - ${getPeriodTitle()}`}
          </h3>
          {pieData.length > 0 ? (
                        <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={380}>
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value, percent, midAngle, innerRadius, outerRadius, cx, cy }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 40;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      
                      return (
                        <text 
                          x={x} 
                          y={y} 
                          fill="currentColor" 
                          textAnchor={x > cx ? 'start' : 'end'} 
                          dominantBaseline="central"
                          fontSize="13"
                          fontWeight="500"
                          className="text-gray-700 dark:text-gray-200"
                        >
                          {`${name}: ${value.toFixed(1)}%`}
                        </text>
                      );
                    }}
                    labelLine={false}
                    startAngle={90}
                    endAngle={450}
                  >
                                          {pieData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value.toFixed(1)}% (${formatCurrency(props.payload.amount)})`, 
                      'Porcentaje'
                    ]}
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg)',
                      border: '1px solid var(--tooltip-border)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)',
                      color: 'var(--tooltip-text)'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FaChartPie className="w-12 h-12 text-fr-gray-400 dark:text-gray-500 mb-4" />
              <h4 className="text-lg font-medium text-fr-gray-600 dark:text-gray-400 mb-2">No hay gastos por categorías</h4>
              <p className="text-sm text-fr-gray-500 dark:text-gray-400">
                Los gastos aparecerán aquí una vez que agregues algunos gastos con categorías
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Transacciones recientes */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-fr-gray-900 dark:text-gray-100">Transacciones Recientes</h3>
          <button 
            onClick={() => navigate('/expenses')} 
            className="btn-ghost"
          >
            Ver todas
          </button>
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
                <div key={index} className={`flex items-center justify-between p-4 rounded-fr bg-fr-gray-50 dark:bg-gray-700 border-l-4 ${color.border || (isExpense ? 'border-fr-gray-900 dark:border-gray-500' : 'border-fr-secondary')}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-fr ${isExpense ? 'bg-gray-100 dark:bg-gray-600' : 'bg-green-100 dark:bg-green-900/30'}`}>
                      {isExpense ? (
                        <FaArrowDown className="w-4 h-4 text-fr-gray-900 dark:text-gray-300" />
                      ) : (
                        <FaArrowUp className="w-4 h-4 text-fr-secondary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-fr-gray-900 dark:text-gray-100">{transaction.description}</p>
                        {/* Indicador de pago solo para gastos */}
                        {isExpense && (
                          <div className="flex items-center space-x-1">
                            {transaction.paid ? (
                              <FaCheckCircle className="w-4 h-4 text-fr-secondary" />
                            ) : (
                              <FaTimesCircle className="w-4 h-4 text-fr-error" />
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
                      <p className="text-sm text-fr-gray-500 dark:text-gray-400">
                        {transaction.created_at ? formatDate(transaction.created_at) : 'Fecha no disponible'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${isExpense ? 'text-fr-gray-900 dark:text-gray-100' : 'text-fr-secondary'}`}>
                      {isExpense ? '-' : '+'}{formatAmount(transaction.amount)}
                    </p>
                    {transaction.percentage && (
                      <p className="text-sm text-fr-gray-500 dark:text-gray-400">
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