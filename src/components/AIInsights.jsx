import React, { useState, useEffect, useCallback } from 'react';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Target,
  Zap,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { aiAPI, formatCurrency } from '../services/api';
import { usePeriod } from '../contexts/PeriodContext';
import toast from 'react-hot-toast';

const AIInsights = () => {
  const [insights, setInsights] = useState(null);
  const [patterns, setPatterns] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('insights');
  const [error, setError] = useState(null);
  
  const { getFilterParams } = usePeriod();

  const loadAIData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filterParams = getFilterParams();
      
      console.log('🧠 Loading AI data with params:', filterParams);
      
      // Crear promises con timeout más corto
      const timeoutPromise = (promise, timeout = 10000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);
      };

      try {
        // Hacer requests secuenciales para evitar timeouts
        console.log('🧠 Loading AI insights...');
        const insightsResponse = await timeoutPromise(aiAPI.getInsights(filterParams), 8000);
        console.log('✅ AI Insights loaded:', insightsResponse.data);
        setInsights(insightsResponse.data);
        
        console.log('🧠 Loading AI patterns...');
        const patternsResponse = await timeoutPromise(aiAPI.getPatterns(filterParams), 8000);
        console.log('✅ AI Patterns loaded:', patternsResponse.data);
        setPatterns(patternsResponse.data);
      } catch (timeoutError) {
        console.log('⚠️ AI request timeout, using fallback data');
        
        // Fallback data cuando AI no responde
        const fallbackInsights = {
          ai_powered: false,
          insights: [
            {
              id: 'fallback-1',
              title: 'Análisis Básico Disponible',
              description: 'Los insights de IA están temporalmente no disponibles. Mostrando análisis básico de tus finanzas.',
              category: 'Sistema',
              impact: 'low'
            }
          ],
          summary: {
            total_insights: 1,
            potential_savings: 0
          },
          suggestions: []
        };

        const fallbackPatterns = {
          ai_powered: false,
          patterns: [],
          anomalies: [],
          trends: { overall_trend: 'stable' }
        };

        setInsights(fallbackInsights);
        setPatterns(fallbackPatterns);
      }
      
    } catch (error) {
      console.error('❌ Error loading AI data:', error);
      setError('Error cargando datos de IA');
      
      // Set fallback data on error
      setInsights({
        ai_powered: false,
        insights: [],
        summary: { total_insights: 0, potential_savings: 0 },
        suggestions: []
      });
      setPatterns({
        ai_powered: false,
        patterns: [],
        anomalies: [],
        trends: {}
      });
    } finally {
      setLoading(false);
    }
  }, [getFilterParams]);

  useEffect(() => {
    loadAIData();
  }, [loadAIData]);

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <TrendingUp className="w-4 h-4" />;
      case 'low': return <Target className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  // Mostrar estado de loading
  if (loading && !insights && !patterns) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Generando insights con IA... (puede tomar hasta 30 segundos)</span>
        </div>
      </div>
    );
  }

  // Mostrar estado de error
  if (error && !insights && !patterns) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <WifiOff className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error cargando IA</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadAIData}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div 
        className="p-6 border-b border-gray-200 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Financial Insights</h2>
              <p className="text-sm text-gray-500">
                {insights?.ai_powered ? (
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Powered by GPT-4</span>
                  </span>
                ) : (
                  'Análisis básico disponible'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {loading && (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            )}
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-6">
          {/* Error message */}
          {error && (insights || patterns) && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Algunos datos pueden estar desactualizados: {error}
                </span>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
            <button
              onClick={() => setActiveTab('insights')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'insights'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Lightbulb className="w-4 h-4" />
                <span>Insights</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('patterns')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'patterns'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Patrones</span>
              </div>
            </button>
          </div>

          {/* Insights Tab */}
          {activeTab === 'insights' && insights && (
            <div className="space-y-4">
              {/* Summary */}
              {insights.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {insights.summary.total_insights}
                    </div>
                    <div className="text-sm text-blue-600">Total Insights</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {insights.summary.high_impact_count}
                    </div>
                    <div className="text-sm text-red-600">Alto Impacto</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {insights.summary.medium_impact_count}
                    </div>
                    <div className="text-sm text-yellow-600">Medio Impacto</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(insights.summary.potential_savings)}
                    </div>
                    <div className="text-sm text-green-600">Ahorro Potencial</div>
                  </div>
                </div>
              )}

              {/* Insights List */}
              {insights.insights && insights.insights.length > 0 ? (
                <div className="space-y-3">
                  {insights.insights.map((insight, index) => (
                    <div
                      key={insight.id || index}
                      className={`p-4 rounded-lg border ${getImpactColor(insight.impact)}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getImpactIcon(insight.impact)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {insight.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {insight.description}
                          </p>
                          {insight.amount && (
                            <div className="text-sm font-medium text-gray-900">
                              Impacto estimado: {formatCurrency(insight.amount)}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                            insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {insight.impact === 'high' ? 'Alto' :
                             insight.impact === 'medium' ? 'Medio' : 'Bajo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay insights disponibles en este momento</p>
                </div>
              )}

              {/* Suggestions */}
              {insights.suggestions && insights.suggestions.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <span>Acciones Recomendadas</span>
                  </h3>
                  <div className="space-y-3">
                    {insights.suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.id || index}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            <Target className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">
                              {suggestion.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {suggestion.description}
                            </p>
                            {suggestion.estimated_impact > 0 && (
                              <p className="text-sm font-medium text-green-600 mt-2">
                                Impacto estimado: {formatCurrency(suggestion.estimated_impact)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Patterns Tab */}
          {activeTab === 'patterns' && patterns && (
            <div className="space-y-6">
              {/* Trends */}
              {patterns.trends && patterns.trends.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tendencias</h3>
                  <div className="space-y-3">
                    {patterns.trends.map((trend, index) => (
                      <div key={index} className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">{trend.category}</h4>
                            <p className="text-sm text-gray-600">{trend.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Patterns */}
              {patterns.patterns && patterns.patterns.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Patrones Detectados</h3>
                  <div className="space-y-3">
                    {patterns.patterns.map((pattern, index) => (
                      <div key={pattern.id || index} className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {pattern.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {pattern.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Frecuencia: {pattern.frequency}</span>
                          {pattern.amount && (
                            <span>Promedio: {formatCurrency(pattern.amount)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No patterns message */}
              {(!patterns.patterns || patterns.patterns.length === 0) && 
               (!patterns.trends || patterns.trends.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No se detectaron patrones en este período</p>
                </div>
              )}
            </div>
          )}

          {/* Refresh Button */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={loadAIData}
              disabled={loading}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analizando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Actualizar Insights</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights; 