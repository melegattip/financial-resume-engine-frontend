import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Loader2, 
  WifiOff, 
  RefreshCw, 
  Sparkles, 
  Lightbulb, 
  ShoppingCart, 
  Check, 
  ThumbsUp, 
  ChevronRight, 
  Trophy,
  Calculator,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { aiAPI, formatCurrency } from '../services/api';
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
  const [healthScore, setHealthScore] = useState(773);
  const [lastEvaluationDate, setLastEvaluationDate] = useState(null);
  
  // Estados para el análisis de compra
  const [purchaseForm, setPurchaseForm] = useState({
    itemName: '',
    amount: '',
    description: '',
    paymentType: 'contado',
    isNecessary: false,
    currentBalance: 152000,
    monthlyIncome: 475000,
    monthlyExpenses: 323000,
    savingsGoal: 50000
  });

  // Estados para gamificación
  const [viewedInsights, setViewedInsights] = useState(new Set());
  const [understoodInsights, setUnderstoodInsights] = useState(new Set());

  const paymentTypes = [
    { value: 'contado', label: 'Pago de contado' },
    { value: 'cuotas', label: 'Plan de pagos/cuotas' },
    { value: 'ahorro', label: 'Necesito ahorrar para esto' }

  ];

  useEffect(() => {
    if (!isAuthenticated) {
      console.warn('⚠️ Usuario no autenticado, no se cargarán insights de IA');
      setError('Debes iniciar sesión para ver insights de IA');
      return;
    }
    loadAIInsightsWithCache();
  }, [isAuthenticated]);

  // Función para verificar si necesita nueva evaluación (TTL de 20 horas)
  const needsNewEvaluation = () => {
    const cachedData = localStorage.getItem('ai_insights_cache');
    if (!cachedData) return true;
    
    try {
      const { timestamp } = JSON.parse(cachedData);
      const twentyHours = 20 * 60 * 60 * 1000; // 20 horas en milisegundos
      return Date.now() - timestamp > twentyHours;
    } catch (error) {
      return true;
    }
  };

  // Función para cargar insights con cache
  const loadAIInsightsWithCache = async () => {
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para ver insights de IA');
      return;
    }

    // Intentar cargar desde cache primero
    const cachedData = localStorage.getItem('ai_insights_cache');
    if (cachedData && !needsNewEvaluation()) {
      try {
        const { insights: cachedInsights, timestamp, evaluationDate } = JSON.parse(cachedData);
        setInsights(cachedInsights);
        setLastEvaluationDate(new Date(evaluationDate));
        console.log('🗄️ Cargando insights desde cache');
        return;
      } catch (error) {
        console.warn('Error al cargar cache, evaluando nuevamente');
      }
    }

    // Si no hay cache válido, hacer nueva evaluación
    await loadAIInsights();
  };

  const loadAIInsights = async () => {
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para ver insights de IA');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Loading AI insights for user:', user?.email);
      const response = await aiAPI.getInsights();
      const newInsights = response.insights || [];
      setInsights(newInsights);
      
      // Guardar en cache con timestamp
      const evaluationDate = new Date();
      setLastEvaluationDate(evaluationDate);
      localStorage.setItem('ai_insights_cache', JSON.stringify({
        insights: newInsights,
        timestamp: Date.now(),
        evaluationDate: evaluationDate.toISOString()
      }));
      console.log('💾 Insights guardados en cache');
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
        }
      ];
      setInsights(fallbackInsights);
      
      // Guardar datos de ejemplo en cache también
      const evaluationDate = new Date();
      setLastEvaluationDate(evaluationDate);
      localStorage.setItem('ai_insights_cache', JSON.stringify({
        insights: fallbackInsights,
        timestamp: Date.now(),
        evaluationDate: evaluationDate.toISOString()
      }));
    } finally {
      setLoading(false);
    }
  };

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

  const getScoreLabel = (score) => {
    if (score >= 800) return 'Excelente';
    if (score >= 600) return 'Bueno';
    if (score >= 400) return 'Regular';
    return 'Mejorable';
  };

  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'high': return '🔥';
      case 'medium': return '⚡';
      case 'low': return '💡';
      default: return '📊';
    }
  };

  // Componente de salud financiera simple y limpio
  const HealthScoreDisplay = ({ score, maxScore = 1000 }) => {
    const percentage = (score / maxScore) * 100;
    
    const getScoreLevel = (score) => {
      if (score >= 800) return { level: 'Excelente', message: '¡Tu salud financiera es excepcional!', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
      if (score >= 600) return { level: 'Bueno', message: 'Tu situación financiera es sólida', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
      if (score >= 400) return { level: 'Regular', message: 'Hay oportunidades de mejora', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
      return { level: 'Mejorable', message: 'Enfócate en las recomendaciones', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
    };

    const { level, message, color, bgColor, borderColor } = getScoreLevel(score);

    return (
      <div className="max-w-md mx-auto">
        {/* Score principal */}
        <div className="text-center mb-6">
          <div className="text-8xl font-bold text-gray-800 mb-2">{score}</div>
          <div className="text-lg text-gray-500 mb-4">/ {maxScore}</div>
          <div className={`inline-flex items-center px-4 py-2 rounded-full font-semibold text-lg ${color} ${bgColor} ${borderColor} border`}>
            {level}
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-400 via-yellow-400 via-blue-400 to-green-400 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span>250</span>
            <span>500</span>
            <span>750</span>
            <span>1000</span>
          </div>
        </div>

        {/* Mensaje */}
        <div className="text-center">
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header con estilo MercadoPago */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Insights Financieros</h2>
              <p className="text-blue-100">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Powered by GPT-4</span>
                </span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{healthScore}</div>
            <div className="text-blue-100 text-sm">Score promedio</div>
          </div>
        </div>
      </div>

      {/* Barra Semicircular de Salud Financiera */}
      <div className="p-8 bg-white border-b border-gray-100">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Tu salud financiera</h3>
          <p className="text-gray-600">Basada en tus hábitos y análisis</p>
        </div>
        <HealthScoreDisplay score={healthScore} />
      </div>

      {/* Contenido en dos columnas */}
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Columna izquierda: Recomendaciones */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Lightbulb className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">Recomendaciones</h3>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                <span className="text-gray-600">Analizando...</span>
              </div>
            ) : error && insights.length === 0 ? (
              <div className="text-center py-8">
                <WifiOff className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={loadAIInsights}
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all cursor-pointer"
                    onMouseEnter={() => handleViewInsight(index, insight.title)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{getImpactIcon(insight.impact)}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {insight.title}
                        </h4>
                        <p className="text-gray-600 text-sm leading-relaxed mb-3">
                          {insight.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                            📊 {insight.category}
                          </div>
                          <div className={`text-sm font-bold ${getScoreColor(insight.score)}`}>
                            {insight.score} pts
                          </div>
                        </div>
                        {!understoodInsights.has(index) && (
                          <button
                            onClick={() => handleUnderstandInsight(index, insight.title)}
                            className="mt-2 inline-flex items-center px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Revisado
                          </button>
                        )}
                        {understoodInsights.has(index) && (
                          <div className="mt-2 inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-xs rounded-lg">
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            ¡Revisado!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Columna derecha: ¿Puedo comprarlo? */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900">¿Puedo comprarlo?</h3>
            </div>
            
            {/* Formulario de análisis de compra */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ¿Qué quieres comprar?
                </label>
                <input
                  type="text"
                  value={purchaseForm.itemName}
                  onChange={(e) => setPurchaseForm({...purchaseForm, itemName: e.target.value})}
                  placeholder="Ej: iPhone 15, Notebook, Vacaciones..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={purchaseForm.description}
                  onChange={(e) => setPurchaseForm({...purchaseForm, description: e.target.value})}
                  placeholder="Describe por qué quieres esto, para qué lo usarás, etc."
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto
                </label>
                <input
                  type="number"
                  value={purchaseForm.amount}
                  onChange={(e) => setPurchaseForm({...purchaseForm, amount: e.target.value})}
                  placeholder="150000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de pago
                </label>
                <div className="space-y-2">
                  {paymentTypes.map(type => (
                    <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentType"
                        value={type.value}
                        checked={purchaseForm.paymentType === type.value}
                        onChange={(e) => setPurchaseForm({...purchaseForm, paymentType: e.target.value})}
                        className="text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={purchaseForm.isNecessary}
                    onChange={(e) => setPurchaseForm({...purchaseForm, isNecessary: e.target.checked})}
                    className="text-blue-500 focus:ring-blue-500 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Lo necesito (urgente/esencial)
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Marca esto si es una necesidad real, no un deseo
                </p>
              </div>
              
              <button
                onClick={analyzePurchase}
                disabled={purchaseLoading || !purchaseForm.itemName || !purchaseForm.amount}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm font-medium"
              >
                {purchaseLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analizando...</span>
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4" />
                    <span>Analizar Compra</span>
                  </>
                )}
              </button>
            </div>

            {/* Resultado del análisis */}
            {purchaseError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 text-sm">{purchaseError}</span>
                </div>
              </div>
            )}

            {purchaseAnalysis && (
              <div className={`rounded-xl p-4 border-2 ${
                purchaseAnalysis.can_buy 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center space-x-3 mb-3">
                  {purchaseAnalysis.can_buy ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  )}
                  <div>
                    <h4 className={`font-semibold ${
                      purchaseAnalysis.can_buy ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {purchaseAnalysis.can_buy ? '✅ ¡Puedes comprarlo!' : '❌ Te recomendamos esperar'}
                    </h4>
                    <p className={`text-sm ${
                      purchaseAnalysis.can_buy ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Confianza: {Math.round(purchaseAnalysis.confidence * 100)}%
                    </p>
                  </div>
                </div>
                
                <p className={`text-sm mb-4 ${
                  purchaseAnalysis.can_buy ? 'text-green-700' : 'text-red-700'
                }`}>
                  {purchaseAnalysis.reasoning}
                </p>
                
                {purchaseAnalysis.alternatives && purchaseAnalysis.alternatives.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Alternativas:</h5>
                    <ul className="space-y-1">
                      {purchaseAnalysis.alternatives.map((alt, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                          <ChevronRight className="w-3 h-3" />
                          <span>{alt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Impacto en tu presupuesto: {purchaseAnalysis.impact_score} pts
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Información sobre evaluación */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
              <Brain className="w-4 h-4 mr-2" />
              <span>
                Evaluamos tu perfil financiero una vez por día
                {lastEvaluationDate && (
                  <span className="ml-1">
                    • Última evaluación: {lastEvaluationDate.toLocaleDateString('es-ES', { 
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
      </div>
    </div>
  );
};

export default AIInsights; 