import React from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
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
        className="p-2 rounded-fr hover:bg-fr-gray-100 dark:hover:bg-gray-700 transition-colors"
        title={balancesHidden ? "Mostrar saldos" : "Ocultar saldos"}
      >
        {balancesHidden ? (
          <FaEyeSlash className="w-5 h-5 text-fr-gray-600 dark:text-gray-400" />
        ) : (
          <FaEye className="w-5 h-5 text-fr-gray-600 dark:text-gray-400" />
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