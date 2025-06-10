import React from 'react';
import { Calendar, X } from 'lucide-react';
import { usePeriod } from '../../contexts/PeriodContext';

const PeriodFilter = () => {
  const {
    selectedYear,
    selectedMonth,
    availableYears,
    availableMonths,
    hasActiveFilters,
    setSelectedYear,
    setSelectedMonth,
    clearFilters,
    getPeriodTitle,
    getMonthsForSelectedYear,
  } = usePeriod();

  const formatMonthOnly = (monthString) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const formatted = date.toLocaleDateString('es-AR', { 
      month: 'long' 
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Indicador de período activo */}
      {hasActiveFilters && (
        <div className="flex items-center space-x-2 bg-mp-primary/10 text-mp-primary px-3 py-1 rounded-full text-sm font-medium">
          <Calendar className="w-4 h-4" />
          <span>{getPeriodTitle()}</span>
          <button
            onClick={clearFilters}
            className="ml-1 hover:bg-mp-primary/20 rounded-full p-1 transition-colors"
            title="Limpiar filtros"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Selector de año */}
      <div className="relative">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="input-sm w-auto min-w-[120px] text-sm"
        >
          <option value="">Todos los años</option>
          {availableYears.map(year => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Selector de mes */}
      <div className="relative">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="input-sm w-auto min-w-[140px] text-sm"
        >
          <option value="">Todos los meses</option>
          {getMonthsForSelectedYear().map(month => (
            <option key={month} value={month}>
              {formatMonthOnly(month)} {month.split('-')[0]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default PeriodFilter; 