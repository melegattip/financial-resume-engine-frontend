import React from 'react';
import AIInsights from '../components/AIInsights';

const FinancialInsights = () => {
  return (
    <div className="space-y-6">
      {/* Header de la página */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-fr-gray-900">Insights Financieros</h1>
            <p className="text-fr-gray-600 mt-1">
              Análisis inteligente de tus finanzas con IA
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-fr-gray-500">Powered by</div>
            <div className="text-lg font-semibold text-blue-600">GPT-4</div>
          </div>
        </div>
      </div>

      {/* Componente principal de insights */}
      <AIInsights />
    </div>
  );
};

export default FinancialInsights; 