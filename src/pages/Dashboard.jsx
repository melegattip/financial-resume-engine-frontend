import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { FaArrowUp, FaArrowDown, FaDollarSign, FaChartPie, FaCalendar, FaCheckCircle, FaTimesCircle, FaChartBar, FaBullseye, FaExclamationCircle, FaRedo, FaBrain } from 'react-icons/fa';
import { 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import { formatCurrency, formatDate, formatPercentage as formatPercentageUtil, budgetsAPI, savingsGoalsAPI, recurringTransactionsAPI, expensesAPI } from '../services/api';
import { usePeriod } from '../contexts/PeriodContext';
import { useAuth } from '../contexts/AuthContext';
import { useGamification } from '../contexts/GamificationContext';
import dataService from '../services/dataService';
import useDataRefresh from '../hooks/useDataRefresh';
import LockedWidget from '../components/LockedWidget';
import toast from 'react-hot-toast';
import { useOptimizedAPI } from '../hooks/useOptimizedAPI';


const Resumen = () => {
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

  // Estados para el modal de pago
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payingExpense, setPayingExpense] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

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

  // Usar el hook optimizado para operaciones API
  const { 
    expenses: expensesAPI, 
    categories: categoriesAPI
  } = useOptimizedAPI();

  // Hook de gamificación para registrar acciones
  const { recordCreateExpense, recordUpdateExpense, recordDeleteExpense } = useGamification();

  // Debug de autenticación
  useEffect(() => {
    console.log('🔍 Resumen - Estado de autenticación:', {
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
      
      console.log('📊 Cargando resumen con parámetros:', filterParams);

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

      console.log(`✅ Resumen cargado exitosamente (${dashboardData.source})`);
      
    } catch (error) {
      console.error('❌ Error cargando resumen:', error);
      
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
      
      toast.error('Error cargando datos del resumen');
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

  // Funciones de navegación para los widgets
  const navigateToExpenses = (filter = 'all') => {
    const params = new URLSearchParams();
    if (filter === 'pending') {
      params.set('status', 'pending');
    }
    navigate(`/expenses?${params.toString()}`);
  };

  const navigateToIncomes = () => {
    navigate('/incomes');
  };

  const navigateToBudgets = () => {
    navigate('/budgets');
  };

  const navigateToSavingsGoals = () => {
    navigate('/savings-goals');
  };

  const navigateToRecurringTransactions = () => {
    navigate('/recurring-transactions');
  };

  const navigateToAI = () => {
    navigate('/insights');
  };

  // Funciones para manejar pagos desde el dashboard
  const togglePaid = async (expense) => {
    console.log('🔍 [Dashboard] togglePaid llamado con:', expense);
    
    // Guardar la posición actual de scroll y el elemento activo
    const currentScrollPosition = window.scrollY;
    const activeElement = document.activeElement;
    
    if (expense.paid) {
      // Si ya está pagado, permitir marcarlo como no pagado
      console.log('🔍 [Dashboard] Marcando gasto como pendiente:', expense.description);
      try {
        const updateData = { paid: false };
        await expensesAPI.update(expense.id, updateData);
        toast.success('Gasto marcado como pendiente');
        
        // Recargar datos para mostrar cambios
        await loadDashboardData(false);
        
        // Restaurar la posición de scroll después de que el contenido se actualice
        setTimeout(() => {
          // Verificar que la posición no sea mayor que el contenido actual
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          const targetPosition = Math.min(currentScrollPosition, maxScroll);
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
          
          // Restaurar el foco si había un elemento activo
          if (activeElement && activeElement.focus) {
            activeElement.focus();
          }
        }, 150);
      } catch (error) {
        console.error('❌ [Dashboard] Error en togglePaid (marcar como pendiente):', error);
      }
    } else {
      // Si no está pagado, abrir modal de pago
      console.log('🔍 [Dashboard] Abriendo modal de pago para gasto:', expense.description);
      setPayingExpense(expense);
      const pendingAmount = expense.pending_amount || (expense.amount - (expense.amount_paid || 0));
      setPaymentAmount(pendingAmount.toString());
      setShowPaymentModal(true);
    }
  };

  const handlePayment = async (paymentType) => {
    console.log('🔍 [Dashboard] handlePayment llamado con paymentType:', paymentType);
    console.log('🔍 [Dashboard] payingExpense:', payingExpense);
    console.log('🔍 [Dashboard] paymentAmount:', paymentAmount);
    
    // Guardar la posición actual de scroll y el elemento activo
    const currentScrollPosition = window.scrollY;
    const activeElement = document.activeElement;
    
    try {
      if (paymentType === 'total') {
        // Pago total - marcar como pagado
        const updateData = { paid: true };
        console.log('🔍 [Dashboard] Actualizando gasto como pagado:', payingExpense.id);
        await expensesAPI.update(payingExpense.id, updateData);
        toast.success('Gasto pagado completamente');
      } else if (paymentType === 'partial') {
        // Pago parcial - enviar payment_amount
        const paymentAmt = parseFloat(paymentAmount);
        if (paymentAmt <= 0 || paymentAmt > payingExpense.amount) {
          toast.error('Monto de pago inválido');
          return;
        }
        
        const updateData = { payment_amount: paymentAmt };
        console.log('🔍 [Dashboard] Actualizando gasto con pago parcial:', paymentAmt);
        await expensesAPI.update(payingExpense.id, updateData);
        
        // Verificar si el pago cubre el total
        const remaining = payingExpense.amount - (payingExpense.amount_paid || 0) - paymentAmt;
        if (remaining <= 0) {
          toast.success('Gasto pagado completamente');
        } else {
          toast.success(`Pago parcial registrado. Quedan ${formatCurrency(remaining)} pendientes`);
        }
      }
      
      setShowPaymentModal(false);
      setPayingExpense(null);
      setPaymentAmount('');
      
      // Recargar datos para mostrar cambios
      console.log('🔍 [Dashboard] Recargando datos después del pago');
      await loadDashboardData(false);
      
      // Restaurar la posición de scroll después de que el contenido se actualice
      setTimeout(() => {
        // Verificar que la posición no sea mayor que el contenido actual
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const targetPosition = Math.min(currentScrollPosition, maxScroll);
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        // Restaurar el foco si había un elemento activo
        if (activeElement && activeElement.focus) {
          activeElement.focus();
        }
      }, 150);
      
    } catch (error) {
      // useOptimizedAPI ya maneja el error base, pero estos son casos especiales
      console.error('❌ [Dashboard] Error en handlePayment:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
        <span className="ml-2 text-fr-gray-600 dark:text-gray-400">Cargando resumen...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {/* Balance total */}
        <div className="card p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-fr-gray-600 dark:text-gray-400 mb-1">
                Balance Total
              </p>
              <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${data.balance >= 0 ? 'text-fr-secondary' : 'text-fr-error'} break-words leading-tight`}>
                {formatAmount(data.balance)}
              </p>
            </div>
            <div className={`flex-shrink-0 p-2 sm:p-3 rounded-fr ${data.balance >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} ml-2 sm:ml-3`}>
              <FaDollarSign className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${data.balance >= 0 ? 'text-fr-secondary' : 'text-fr-error'}`} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-center">
            {data.balance >= 0 ? (
              <FaArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-fr-secondary mr-1 flex-shrink-0" />
            ) : (
              <FaArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-fr-error mr-1 flex-shrink-0" />
            )}
            <span className={`text-xs sm:text-sm ${data.balance >= 0 ? 'text-fr-secondary' : 'text-fr-error'} font-medium`}>
              {data.balance >= 0 ? 'Positivo' : 'Negativo'}
            </span>
          </div>
        </div>

        {/* Total ingresos */}
        <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={navigateToIncomes}>
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
        <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigateToExpenses('all')}>
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
        <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigateToExpenses('pending')}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-fr-gray-600 dark:text-gray-400">
                Gastos Pendientes
              </p>
              <p className="text-xl lg:text-2xl font-bold text-fr-gray-900 dark:text-gray-100">
                {data.expenses?.filter(e => !e.paid)?.length || 0}
              </p>
            </div>
            <div className="flex-shrink-0 p-2 lg:p-3 rounded-fr bg-gray-100 dark:bg-gray-700 ml-2">
              <FaCalendar className="w-5 h-5 lg:w-6 lg:h-6 text-fr-gray-900 dark:text-gray-300" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm text-fr-gray-500 dark:text-gray-400">
              {formatAmount(data.expenses?.filter(e => !e.paid)?.reduce((sum, e) => sum + e.amount, 0) || 0)} por pagar
            </span>
          </div>
        </div>
      </div>

      {/* Widgets de funcionalidades activas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Widget de Presupuestos (Nivel 5 requerido) */}
        {isFeatureUnlocked('BUDGETS') && budgetsSummary && (
          <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={navigateToBudgets}>
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
          <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={navigateToSavingsGoals}>
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
          <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={navigateToAI}>
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
          <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={navigateToRecurringTransactions}>
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
            <div className="mt-3 space-y-1">
              <div className="text-sm text-green-600">
                +{formatAmount(recurringTransactionsSummary.summary?.monthly_income_total || 0)}/mes
              </div>
              <div className="text-sm text-red-600">
                -{formatAmount(recurringTransactionsSummary.summary?.monthly_expense_total || 0)}/mes
              </div>
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
                              <button
                                onClick={() => togglePaid(expense)}
                                className="hover:scale-110 transition-transform cursor-pointer"
                                title={expense.paid ? "Marcar como pendiente" : "Hacer pago"}
                              >
                                {expense.paid ? (
                                  <FaCheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <FaTimesCircle className="w-5 h-5 text-red-500" />
                                )}
                              </button>
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
                    {data.expenses?.filter(exp => !exp.paid)?.length || 0}
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

      {/* Modal de Pago */}
      {showPaymentModal && payingExpense && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-fr-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-fr-gray-900 dark:text-gray-100 mb-6">
              Registrar Pago
            </h2>

            {/* Información del gasto */}
            <div className="bg-fr-gray-50 dark:bg-gray-700 rounded-fr p-4 mb-6">
              <h3 className="font-medium text-fr-gray-900 dark:text-gray-100 mb-2">{payingExpense.description}</h3>
              <div className="space-y-1">
                <p className="text-lg font-bold text-fr-gray-900 dark:text-gray-100">
                  Monto total: {formatAmount(payingExpense.amount)}
                </p>
                {payingExpense.amount_paid > 0 && (
                  <>
                    <p className="text-sm text-fr-secondary dark:text-green-400">
                      Ya pagado: {formatAmount(payingExpense.amount_paid)}
                    </p>
                    <p className="text-lg font-bold text-fr-accent dark:text-yellow-400">
                      Pendiente: {formatAmount(payingExpense.pending_amount || (payingExpense.amount - payingExpense.amount_paid))}
                    </p>
                  </>
                )}
              </div>
              {payingExpense.due_date && (
                <p className="text-sm text-fr-gray-600 dark:text-gray-400 mt-1">
                  Vence: {new Date(payingExpense.due_date).toLocaleDateString('es-AR')}
                </p>
              )}
            </div>

            {/* Opciones de pago */}
            <div className="space-y-4">
              {/* Pago Total */}
              <button
                onClick={() => handlePayment('total')}
                className="w-full p-4 border-2 border-fr-secondary dark:border-green-600 rounded-fr hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-fr-gray-900 dark:text-gray-100">💰 Pago Total</h4>
                    <p className="text-sm text-fr-gray-600 dark:text-gray-400">Marcar como completamente pagado</p>
                  </div>
                  <p className="font-bold text-fr-secondary dark:text-green-400">
                    {formatAmount(payingExpense.pending_amount || (payingExpense.amount - (payingExpense.amount_paid || 0)))}
                  </p>
                </div>
              </button>

              {/* Pago Parcial */}
              <div className="border-2 border-fr-accent dark:border-yellow-600 rounded-fr p-4">
                <h4 className="font-medium text-fr-gray-900 dark:text-gray-100 mb-3">💸 Pago Parcial</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-fr-gray-700 dark:text-gray-300 mb-2">
                      Monto a pagar
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      max={payingExpense.pending_amount || (payingExpense.amount - (payingExpense.amount_paid || 0))}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="text-sm text-fr-gray-600 dark:text-gray-400">
                    <p>Quedarían pendientes: <span className="font-medium">
                      {formatAmount(Math.max(0, (payingExpense.pending_amount || (payingExpense.amount - (payingExpense.amount_paid || 0))) - (parseFloat(paymentAmount) || 0)))}
                    </span></p>
                  </div>
                  <button
                    onClick={() => handlePayment('partial')}
                    disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Registrar Pago Parcial
                  </button>
                </div>
              </div>
            </div>

            {/* Botón de cancelar */}
            <div className="mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPayingExpense(null);
                  setPaymentAmount('');
                }}
                className="w-full btn-outline"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Resumen; 