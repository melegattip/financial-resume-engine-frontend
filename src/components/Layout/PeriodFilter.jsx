import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { usePeriod } from '../../contexts/PeriodContext';

const PeriodFilter = () => {
  const {
    selectedYear,
    selectedMonth,
    availableYears,
    balancesHidden,
    setSelectedYear,
    setSelectedMonth,
    getMonthsForSelectedYear,
    toggleBalancesVisibility,
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
      {/* Botón para ocultar/mostrar saldos */}
      <button
        onClick={toggleBalancesVisibility}
        className="p-2 rounded-mp hover:bg-mp-gray-100 transition-colors"
        title={balancesHidden ? "Mostrar saldos" : "Ocultar saldos"}
      >
        {balancesHidden ? (
          <EyeOff className="w-5 h-5 text-mp-gray-600" />
        ) : (
          <Eye className="w-5 h-5 text-mp-gray-600" />
        )}
      </button>

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
              {formatMonthOnly(month)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default PeriodFilter; 