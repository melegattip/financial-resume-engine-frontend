import React, { createContext, useContext, useState, useCallback } from 'react';

// Crear el contexto
const PeriodContext = createContext();

// Hook personalizado para usar el contexto
export const usePeriod = () => {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error('usePeriod debe ser usado dentro de un PeriodProvider');
  }
  return context;
};

// Provider del contexto
export const PeriodProvider = ({ children }) => {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [balancesHidden, setBalancesHidden] = useState(false);

  // Función para actualizar los datos disponibles (solo se ejecuta una vez al cargar)
  const updateAvailableData = useCallback((expenses = [], incomes = []) => {
    const years = new Set();
    const months = new Set();
    
    // Procesar todas las transacciones sin filtrar
    [...expenses, ...incomes].forEach(item => {
      if (item.created_at) {
        const date = new Date(item.created_at);
        
        // Validar que la fecha sea válida
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear().toString();
          const month = date.toISOString().slice(0, 7);
          
          years.add(year);
          months.add(month);
        }
      }
    });
    
    // Siempre incluir el año y mes actual
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear().toString();
    const currentMonth = currentDate.toISOString().slice(0, 7);
    
    years.add(currentYear);
    months.add(currentMonth);
    
    // Convertir a arrays ordenados
    const sortedYears = Array.from(years).sort().reverse();
    const sortedMonths = Array.from(months).sort().reverse();
    
    // SOLO actualizar si realmente hay cambios para evitar loops infinitos
    setAvailableYears(prevYears => {
      const yearsChanged = JSON.stringify(prevYears) !== JSON.stringify(sortedYears);
      return yearsChanged ? sortedYears : prevYears;
    });
    
    setAvailableMonths(prevMonths => {
      const monthsChanged = JSON.stringify(prevMonths) !== JSON.stringify(sortedMonths);
      return monthsChanged ? sortedMonths : prevMonths;
    });
    
    // Auto-seleccionar el último mes del último año por defecto
    if (!selectedMonth && sortedMonths.length > 0) {
      const latestMonth = sortedMonths[0]; // sortedMonths ya está ordenado por fecha más reciente
      const [latestYear] = latestMonth.split('-');
      
      console.log(`🗓️ [PeriodContext] Auto-seleccionando período por defecto: ${latestMonth}`);
      setSelectedMonth(latestMonth);
      setSelectedYear(latestYear);
    }
  }, [selectedMonth]); // Incluir selectedMonth para la auto-selección

  // Función para obtener meses disponibles para el año seleccionado
  const getMonthsForSelectedYear = useCallback(() => {
    if (!selectedYear) return availableMonths;
    
    return availableMonths.filter(month => {
      const [year] = month.split('-');
      return year === selectedYear;
    });
  }, [selectedYear, availableMonths]);

  // Función para limpiar filtros
  const clearFilters = useCallback(() => {
    setSelectedYear('');
    setSelectedMonth('');
  }, []);

  // Función para obtener parámetros de filtro para las APIs
  const getFilterParams = useCallback(() => {
    const params = {};
    
    if (selectedYear) params.year = selectedYear;
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      params.year = year;
      params.month = month;
    }
    
    return params;
  }, [selectedYear, selectedMonth]);

  // Función para obtener el título del período seleccionado
  const getPeriodTitle = useCallback(() => {
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      const formatted = date.toLocaleDateString('es-AR', { 
        year: 'numeric', 
        month: 'long' 
      });
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } else if (selectedYear) {
      return `Año ${selectedYear}`;
    }
    return 'Todos los períodos';
  }, [selectedMonth, selectedYear]);

  // Verificar si hay filtros activos
  const hasActiveFilters = selectedMonth || selectedYear;

  // Función para alternar visibilidad de saldos
  const toggleBalancesVisibility = useCallback(() => {
    setBalancesHidden(!balancesHidden);
  }, [balancesHidden]);

  const value = {
    // Estado
    selectedYear,
    selectedMonth,
    availableYears,
    availableMonths,
    hasActiveFilters,
    balancesHidden,
    
    // Acciones
    setSelectedYear,
    setSelectedMonth,
    updateAvailableData,
    clearFilters,
    toggleBalancesVisibility,
    
    // Utilidades
    getFilterParams,
    getPeriodTitle,
    getMonthsForSelectedYear,
  };

  return (
    <PeriodContext.Provider value={value}>
      {children}
    </PeriodContext.Provider>
  );
}; 