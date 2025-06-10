import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Función para actualizar los datos disponibles y auto-seleccionar el último período
  const updateAvailableData = (expenses = [], incomes = []) => {
    const years = new Set();
    const months = new Set();
    
    // Procesar todas las transacciones
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
    
    setAvailableYears(sortedYears);
    setAvailableMonths(sortedMonths);
    
    // Auto-seleccionar el último mes si no hay selección actual
    if (!selectedMonth && sortedMonths.length > 0) {
      const latestMonth = sortedMonths[0];
      const [latestYear] = latestMonth.split('-');
      
      setSelectedMonth(latestMonth);
      setSelectedYear(latestYear);
    }
  };

  // Función para obtener meses disponibles para el año seleccionado
  const getMonthsForSelectedYear = () => {
    if (!selectedYear) return availableMonths;
    
    return availableMonths.filter(month => {
      const [year] = month.split('-');
      return year === selectedYear;
    });
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setSelectedYear('');
    setSelectedMonth('');
  };

  // Función para obtener parámetros de filtro para las APIs
  const getFilterParams = () => {
    const params = {};
    
    if (selectedYear) params.year = selectedYear;
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      params.year = year;
      params.month = month;
    }
    
    return params;
  };

  // Función para obtener el título del período seleccionado
  const getPeriodTitle = () => {
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
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = selectedMonth || selectedYear;

  // Función para alternar visibilidad de saldos
  const toggleBalancesVisibility = () => {
    setBalancesHidden(!balancesHidden);
  };

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