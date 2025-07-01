import React, { useState, useEffect, useCallback } from 'react';
import { 
  Brain, 
  Loader2, 
  WifiOff, 
  RefreshCw, 
  Sparkles, 
  Lightbulb, 
  ShoppingCart, 
  Check, 
  ChevronRight, 
  Calculator,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Target
} from 'lucide-react';
import { aiAPI, dashboardAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import gamificationService from '../services/gamificationServiceSimple';

const AIInsights = () => {
  const { user, isAuthenticated } = useAuth();
  const [insights, setInsights] = useState([]);
  const [purchaseAnalysis, setPurchaseAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [error, setError] = useState(null);
  const [purchaseError, setPurchaseError] = useState(null);
  const [healthScore, setHealthScore] = useState(0);
  const [healthScoreLoading, setHealthScoreLoading] = useState(false);
  const [lastEvaluationDate, setLastEvaluationDate] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  
  // Estados para Progressive Disclosure
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'purchase'
  
  // Estados para el análisis de compra - ahora se inicializan dinámicamente
  const [purchaseForm, setPurchaseForm] = useState({
    itemName: '',
    amount: '',
    description: '',
    paymentType: 'contado',
    isNecessary: false,
    currentBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savingsGoal: 0
  });

  // Estados para gamificación
  const [viewedInsights, setViewedInsights] = useState(new Set());
  const [understoodInsights, setUnderstoodInsights] = useState(new Set());

  const paymentTypes = [
    { value: 'contado', label: 'Pago de contado' },
    { value: 'cuotas', label: 'Plan de pagos/cuotas' },
    { value: 'ahorro', label: 'Necesito ahorrar para esto' }
  ];

  // Cargar datos del dashboard para obtener información financiera real
  const loadDashboardData = useCallback(async () => {
    try {
      const response = await dashboardAPI.overview();
      const data = response.data || response;
      setDashboardData(data);
      
      // Actualizar el formulario de compra con datos reales
      const metrics = data?.Metrics || data?.metrics;
      const newFormData = {
        currentBalance: metrics?.Balance || metrics?.balance || 0,
        monthlyIncome: metrics?.TotalIncome || metrics?.total_income || 0,
        monthlyExpenses: metrics?.TotalExpenses || metrics?.total_expenses || 0,
        savingsGoal: data?.savings_goal || 50000
      };
      
      setPurchaseForm(prev => ({
        ...prev,
        ...newFormData
      }));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Mantener valores por defecto en caso de error
    }
  }, []);

  // Cache removido - el backend maneja su propio cache de 20 horas

  // Función para cargar el health score
  const loadHealthScore = useCallback(async () => {
    if (!isAuthenticated) return;

    setHealthScoreLoading(true);
    try {
      const response = await aiAPI.getHealthScore();
      setHealthScore(response.health_score || 0);
    } catch (err) {
      console.error('Error loading health score:', err.message);
      // Mantener el valor por defecto de 0 en caso de error
      setHealthScore(0);
    } finally {
      setHealthScoreLoading(false);
    }
  }, [isAuthenticated, user?.email]);

  const loadAIInsights = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para ver el análisis inteligente');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Cargando análisis inteligente para usuario:', user?.email);
      const response = await aiAPI.getInsights();
      const newInsights = response.insights || [];
      setInsights(newInsights);
      
      // Usar el timestamp del backend (generated_at)
      const backendTimestamp = response.generated_at ? new Date(response.generated_at) : new Date();
      setLastEvaluationDate(backendTimestamp);
      console.log('💾 Análisis cargado desde backend - Timestamp:', backendTimestamp.toISOString());
    } catch (err) {
      console.error('Error loading AI insights:', err.message);
      setError('Error conectando con GPT-4. Usando datos de ejemplo.');
      // Usar datos de ejemplo
      const fallbackInsights = [
        {
          title: "Excelente capacidad de ahorro",
          description: "Estás ahorrando 32% de tus ingresos, superando el promedio nacional. Considera explorar opciones de inversión para hacer crecer tu dinero.",
          impact: "high",
          score: 920,
          action_type: "invest",
          category: "ahorro"
        },
        {
          title: "Mayor gasto: Alimentación",
          description: "La Alimentación representa 42.4% de tus gastos ($137,000). Revisa si hay oportunidades de optimización en esta categoría.",
          impact: "medium",
          score: 400,
          action_type: "optimize",
          category: "Alimentación"
        },
        {
          title: "Ingresos variables",
          description: "Tus ingresos muestran variabilidad. Considera diversificar fuentes de ingresos o crear un fondo de emergencia más robusto.",
          impact: "medium",
          score: 600,
          action_type: "save",
          category: "ingresos"
        },
        {
          title: "Oportunidad de inversión",
          description: "Tienes $50,000 disponibles que podrías invertir en instrumentos de bajo riesgo para generar ingresos pasivos.",
          impact: "high",
          score: 850,
          action_type: "invest",
          category: "inversión"
        },
        {
          title: "Control de gastos hormiga",
          description: "Los pequeños gastos diarios suman $15,000 mensuales. Considera usar una app de control de gastos.",
          impact: "low",
          score: 300,
          action_type: "optimize",
          category: "gastos"
        }
      ];
      setInsights(fallbackInsights);
      
      // Usar timestamp actual para datos de fallback
      const fallbackTimestamp = new Date();
      setLastEvaluationDate(fallbackTimestamp);
      console.log('💾 Usando datos de fallback - Timestamp:', fallbackTimestamp.toISOString());
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.email]);

  // Función simplificada - siempre llama al backend (que tiene su propio cache de 20h)
  const loadAIInsightsSimple = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para ver el análisis inteligente');
      return;
    }

    // Siempre llamar al backend - él maneja su propio cache de 20 horas
    await loadAIInsights();
  }, [isAuthenticated, loadAIInsights]);

  useEffect(() => {
    if (!isAuthenticated) {
      console.warn('⚠️ Usuario no autenticado, no se cargarán insights de IA');
      setError('Debes iniciar sesión para ver el análisis inteligente');
      return;
    }
    // Cache del frontend deshabilitado - confiamos en el cache del backend (20 horas)
    // if (process.env.NODE_ENV === 'development') {
    //   localStorage.removeItem('ai_insights_cache');
    //   localStorage.removeItem('health_score_cache');
    //   console.log('🧹 Cache limpiado para desarrollo');
    // }
    loadAIInsightsSimple();
    loadHealthScore();
    loadDashboardData();
  }, [isAuthenticated, loadAIInsightsSimple, loadHealthScore, loadDashboardData]);

  const analyzePurchase = async () => {
    if (!purchaseForm.itemName || !purchaseForm.amount) {
      setPurchaseError('Por favor completa el nombre del artículo y el monto');
      return;
    }

    setPurchaseLoading(true);
    setPurchaseError(null);
    try {
      const response = await aiAPI.canIBuy({
        item_name: purchaseForm.itemName,
        amount: parseFloat(purchaseForm.amount),
        description: purchaseForm.description,
        payment_type: purchaseForm.paymentType,
        is_necessary: purchaseForm.isNecessary,
        current_balance: purchaseForm.currentBalance,
        monthly_income: purchaseForm.monthlyIncome,
        monthly_expenses: purchaseForm.monthlyExpenses,
        savings_goal: purchaseForm.savingsGoal
      });
      setPurchaseAnalysis(response);
      
      // 🎮 Registrar acción de gamificación
      await gamificationService.recordPurchaseAnalysisUsed(
        purchaseForm.itemName, 
        purchaseForm.amount
      );
      
    } catch (err) {
      console.error('Error analyzing purchase:', err.message);
      setPurchaseError('Error conectando con GPT-4. Usando análisis básico.');
      // Usar datos de ejemplo
      const amount = parseFloat(purchaseForm.amount);
      const available = purchaseForm.monthlyIncome - purchaseForm.monthlyExpenses;
      const canAfford = amount <= available * 0.3;
      
      setPurchaseAnalysis({
        can_buy: canAfford,
        confidence: 0.8,
        reasoning: canAfford 
          ? `Puedes permitirte esta compra. Representa ${((amount/available)*100).toFixed(1)}% de tu dinero disponible mensual.`
          : `Esta compra representa ${((amount/available)*100).toFixed(1)}% de tu dinero disponible. Considera esperar o buscar alternativas.`,
        alternatives: ["Buscar ofertas", "Comprar usado", "Esperar a fin de mes"],
        impact_score: Math.round((amount / purchaseForm.monthlyIncome) * 1000)
      });
    } finally {
      setPurchaseLoading(false);
    }
  };

  // 🎮 Funciones de gamificación mejoradas
  const handleViewInsight = async (insightId, insightTitle) => {
    if (!viewedInsights.has(insightId)) {
      setViewedInsights(prev => new Set([...prev, insightId]));
      
      // Registrar en gamificación
      await gamificationService.recordInsightViewed(insightId, insightTitle);
    }
  };

  const handleUnderstandInsight = async (insightId, insightTitle) => {
    if (!understoodInsights.has(insightId)) {
      setUnderstoodInsights(prev => new Set([...prev, insightId]));
      
      // Registrar en gamificación
      await gamificationService.recordInsightUnderstood(insightId, insightTitle);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 800) return 'text-green-600';
    if (score >= 600) return 'text-blue-600';
    if (score >= 400) return 'text-yellow-600';
    return 'text-red-600';
  };



  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'high': return '🔥';
      case 'medium': return '⚡';
      case 'low': return '💡';
      default: return '📊';
    }
  };

  // Progressive Disclosure: mostrar solo los primeros 3 insights
  const displayedInsights = showAllInsights ? insights : insights.slice(0, 3);

  // Componente de salud financiera optimizado
  const HealthScoreDisplay = ({ score, maxScore = 1000, loading = false }) => {
    const percentage = (score / maxScore) * 100;
    
    const getScoreLevel = (score) => {
      if (score >= 800) return { level: 'Excelente', message: '¡Tu salud financiera es excepcional!', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
      if (score >= 600) return { level: 'Bueno', message: 'Tu situación financiera es sólida', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
      if (score >= 400) return { level: 'Regular', message: 'Hay oportunidades de mejora', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
      return { level: 'Mejorable', message: 'Enfócate en las recomendaciones', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
    };

    const { level, message, color, bgColor, borderColor } = getScoreLevel(score);

    if (loading) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full animate-pulse mx-auto mb-2"></div>
            <div className="w-12 h-4 bg-gray-300 rounded animate-pulse mx-auto mb-2"></div>
            <div className="w-20 h-6 bg-gray-300 rounded-full animate-pulse mx-auto"></div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div className="h-full bg-gray-300 rounded-full animate-pulse w-1/2"></div>
          </div>
          <div className="flex justify-between text-xs text-gray-300 mb-4">
            <span>0</span><span>250</span><span>500</span><span>750</span><span>1000</span>
          </div>
          <div className="text-center">
            <div className="w-48 h-4 bg-gray-300 rounded animate-pulse mx-auto"></div>
          </div>
        </div>
      );
    }

    return (
      <div className={`${bgColor} ${borderColor} border rounded-xl p-6`}>
        {/* Score principal */}
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-gray-900 mb-1">{score}</div>
          <div className="text-gray-500 text-sm">/ {maxScore}</div>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${color} ${bgColor}`}>
            {level}
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Etiquetas de referencia */}
        <div className="flex justify-between text-xs text-gray-500 mb-4">
          <span>0</span>
          <span>250</span>
          <span>500</span>
          <span>750</span>
          <span>1000</span>
        </div>

        {/* Mensaje */}
        <div className="text-center">
          <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        </div>
      </div>
    );
  };

  // Loading Skeleton Component
  const InsightSkeleton = () => (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 animate-pulse">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-gray-300 rounded"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 rounded w-full"></div>
          <div className="h-3 bg-gray-300 rounded w-5/6"></div>
          <div className="flex justify-between items-center mt-3">
            <div className="h-6 bg-gray-300 rounded w-20"></div>
            <div className="h-4 bg-gray-300 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Hero Section - Puntuación Financiera */}
      <div className="bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold">Análisis Inteligente</h1>
              <p className="text-blue-100 flex items-center justify-center md:justify-start space-x-1 mt-1">
                <Sparkles className="w-4 h-4" />
                <span>Powered by GPT-4</span>
              </p>
            </div>
          </div>
          <div className="text-center">
            {healthScoreLoading ? (
              <div className="text-4xl md:text-5xl font-bold animate-pulse">
                <Loader2 className="w-12 h-12 mx-auto animate-spin" />
              </div>
            ) : (
              <div className="text-4xl md:text-5xl font-bold">{healthScore}</div>
            )}
            <div className="text-blue-100 text-sm">Puntuación financiera</div>
            <button
              onClick={() => {
                loadAIInsights();
                loadHealthScore();
              }}
              className="mt-2 text-xs text-blue-100 hover:text-white underline flex items-center justify-center space-x-1"
              title="Actualizar análisis con datos más recientes"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Salud Financiera */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">Tu salud financiera</h2>
          <p className="text-gray-600">Basada en tus hábitos y análisis</p>
        </div>
        <HealthScoreDisplay score={healthScore} loading={healthScoreLoading} />
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('insights')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'insights'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-4 h-4" />
                <span>Recomendaciones</span>
                {insights.length > 0 && (
                  <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                    {insights.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('purchase')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'purchase'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4" />
                <span>¿Puedo comprarlo?</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'insights' && (
            <div className="space-y-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <InsightSkeleton key={i} />
                  ))}
                </div>
              ) : error && insights.length === 0 ? (
                <div className="text-center py-12">
                  <WifiOff className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sin conexión</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
                  <button
                    onClick={loadAIInsights}
                    className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reintentar análisis
                  </button>
                </div>
              ) : insights.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">¡Perfecto!</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Tu situación financiera está tan bien que no tenemos recomendaciones urgentes. 
                    Sigue así y revisa periódicamente.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-4">
                    {displayedInsights.map((insight, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                        onMouseEnter={() => handleViewInsight(index, insight.title)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl group-hover:scale-110 transition-transform">
                            {getImpactIcon(insight.impact)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                              {insight.title}
                            </h3>
                            <p className="text-gray-600 text-sm leading-relaxed mb-3">
                              {insight.description}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                              <div className="flex items-center space-x-3">
                                <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                                  📊 {insight.category}
                                </span>
                                <span className={`text-sm font-bold ${getScoreColor(insight.score)}`}>
                                  {insight.score} pts
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {!understoodInsights.has(index) && (
                                  <button
                                    onClick={() => handleUnderstandInsight(index, insight.title)}
                                    className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors font-medium"
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Marcar como revisado
                                  </button>
                                )}
                                {understoodInsights.has(index) && (
                                  <div className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded-lg font-medium">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    ¡Revisado!
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Progressive Disclosure */}
                  {insights.length > 3 && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => setShowAllInsights(!showAllInsights)}
                        className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        {showAllInsights ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            Mostrar menos recomendaciones
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            Ver todas las recomendaciones ({insights.length - 3} más)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'purchase' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Análisis de Compra Inteligente</h3>
                <p className="text-gray-600">Te ayudamos a tomar decisiones financieras informadas</p>
              </div>

              {/* Información financiera automática */}
              {dashboardData ? (
                <div className="bg-blue-50 rounded-xl p-4 mb-4">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                    <Calculator className="w-4 h-4 mr-2" />
                    Datos financieros actuales (automáticos)
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Balance actual:</span>
                      <p className="font-semibold text-blue-900">${(dashboardData?.Metrics?.Balance || dashboardData?.metrics?.balance || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-blue-700">Ingresos mensuales:</span>
                      <p className="font-semibold text-blue-900">${(dashboardData?.Metrics?.TotalIncome || dashboardData?.metrics?.total_income || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-blue-700">Gastos mensuales:</span>
                      <p className="font-semibold text-blue-900">${(dashboardData?.Metrics?.TotalExpenses || dashboardData?.metrics?.total_expenses || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-blue-700">Disponible/mes:</span>
                      <p className="font-semibold text-green-700">${((dashboardData?.Metrics?.TotalIncome || dashboardData?.metrics?.total_income || 0) - (dashboardData?.Metrics?.TotalExpenses || dashboardData?.metrics?.total_expenses || 0)).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-blue-600">
                      💡 Estos datos se calculan automáticamente basándose en tus transacciones
                    </p>
                    <button
                      onClick={loadDashboardData}
                      className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                    >
                      🔄 Actualizar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-center space-x-2 text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Cargando datos financieros...</span>
                  </div>
                </div>
              )}

              {/* Formulario optimizado para móvil */}
              <div className="bg-gray-50 rounded-xl p-4 md:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Qué quieres comprar? *
                  </label>
                  <input
                    type="text"
                    value={purchaseForm.itemName}
                    onChange={(e) => setPurchaseForm({...purchaseForm, itemName: e.target.value})}
                    placeholder="Ej: iPhone 15, Notebook, Vacaciones..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={purchaseForm.amount}
                      onChange={(e) => setPurchaseForm({...purchaseForm, amount: e.target.value})}
                      placeholder="150000"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={purchaseForm.description}
                    onChange={(e) => setPurchaseForm({...purchaseForm, description: e.target.value})}
                    placeholder="¿Para qué lo necesitas? ¿Es urgente?"
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo de pago
                  </label>
                  <div className="space-y-2">
                    {paymentTypes.map(type => (
                      <label key={type.value} className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <input
                          type="radio"
                          name="paymentType"
                          value={type.value}
                          checked={purchaseForm.paymentType === type.value}
                          onChange={(e) => setPurchaseForm({...purchaseForm, paymentType: e.target.value})}
                          className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 font-medium">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={purchaseForm.isNecessary}
                      onChange={(e) => setPurchaseForm({...purchaseForm, isNecessary: e.target.checked})}
                      className="w-4 h-4 text-blue-500 focus:ring-blue-500 rounded mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        Es una necesidad urgente
                      </span>
                      <p className="text-xs text-gray-600 mt-1">
                        Marca esto solo si es esencial para tu trabajo, salud o seguridad
                      </p>
                    </div>
                  </label>
                </div>
                
                <button
                  onClick={analyzePurchase}
                  disabled={purchaseLoading || !purchaseForm.itemName || !purchaseForm.amount}
                  className="w-full px-6 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-base font-medium shadow-lg"
                >
                  {purchaseLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analizando con IA...</span>
                    </>
                  ) : (
                    <>
                      <Calculator className="w-5 h-5" />
                      <span>Analizar compra</span>
                    </>
                  )}
                </button>
              </div>

              {/* Resultado del análisis mejorado */}
              {purchaseError && (
                <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
                  <div className="flex">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-red-700 font-medium">Error en el análisis</p>
                      <p className="text-red-600 text-sm mt-1">{purchaseError}</p>
                    </div>
                  </div>
                </div>
              )}

              {purchaseAnalysis && (
                <div className={`rounded-xl p-6 border-2 shadow-lg ${
                  purchaseAnalysis.can_buy 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start space-x-4 mb-4">
                    {purchaseAnalysis.can_buy ? (
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    ) : (
                      <div className="p-2 bg-red-100 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className={`text-lg font-bold mb-1 ${
                        purchaseAnalysis.can_buy ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {purchaseAnalysis.can_buy ? '✅ ¡Puedes comprarlo!' : '❌ Te recomendamos esperar'}
                      </h4>
                      <p className={`text-sm ${
                        purchaseAnalysis.can_buy ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Confianza del análisis: {Math.round(purchaseAnalysis.confidence * 100)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className={`bg-white rounded-lg p-4 mb-4 ${
                    purchaseAnalysis.can_buy ? 'border border-green-200' : 'border border-red-200'
                  }`}>
                    <p className="text-gray-700 leading-relaxed">
                      {purchaseAnalysis.reasoning}
                    </p>
                  </div>
                  
                  {purchaseAnalysis.alternatives && purchaseAnalysis.alternatives.length > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                        Alternativas sugeridas
                      </h5>
                      <ul className="space-y-2">
                        {purchaseAnalysis.alternatives.map((alt, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <ChevronRight className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{alt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Impacto en tu presupuesto</span>
                      <span className="font-medium">{purchaseAnalysis.impact_score} pts</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer con información de actualización */}
      <div className="text-center">
        <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
          <Brain className="w-4 h-4 mr-2" />
          <span>
            Analizamos tu situación financiera una vez por día
            {lastEvaluationDate && (
              <span className="ml-1">
                • Último análisis: {lastEvaluationDate.toLocaleDateString('es-ES', { 
                  day: 'numeric', 
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AIInsights; 