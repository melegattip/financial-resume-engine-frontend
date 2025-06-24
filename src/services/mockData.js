// Datos mock para desarrollo cuando el backend no está disponible
export const mockCategories = [
  { id: 1, name: 'Alimentación', description: 'Gastos en comida y bebidas', user_id: 'user123' },
  { id: 2, name: 'Transporte', description: 'Gastos en movilidad', user_id: 'user123' },
  { id: 3, name: 'Entretenimiento', description: 'Gastos en ocio y diversión', user_id: 'user123' },
  { id: 4, name: 'Salario', description: 'Ingresos por trabajo', user_id: 'user123' },
  { id: 5, name: 'Servicios', description: 'Gastos en servicios públicos', user_id: 'user123' },
];

export const mockExpenses = [
  {
    id: 1,
    user_id: 'user123',
    description: 'Supermercado',
    amount: 12500,
    category_id: 1,
    due_date: '2025-01-20',
    paid: false,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z'
  },
  {
    id: 2,
    user_id: 'user123',
    description: 'Uber',
    amount: 3200,
    category_id: 2,
    due_date: null,
    paid: true,
    created_at: '2025-01-14T15:30:00Z',
    updated_at: '2025-01-14T15:30:00Z'
  },
  {
    id: 3,
    user_id: 'user123',
    description: 'Netflix',
    amount: 2800,
    category_id: 3,
    due_date: '2025-01-25',
    paid: true,
    created_at: '2025-01-12T09:15:00Z',
    updated_at: '2025-01-12T09:15:00Z'
  },
  {
    id: 4,
    user_id: 'user123',
    description: 'Luz y Gas',
    amount: 8500,
    category_id: 5,
    due_date: '2025-01-30',
    paid: false,
    created_at: '2025-01-10T12:00:00Z',
    updated_at: '2025-01-10T12:00:00Z'
  }
];

export const mockIncomes = [
  {
    id: 1,
    user_id: 'user123',
    description: 'Salario Enero',
    amount: 250000,
    category_id: 4,
    created_at: '2025-01-01T08:00:00Z',
    updated_at: '2025-01-01T08:00:00Z'
  },
  {
    id: 2,
    user_id: 'user123',
    description: 'Freelance - Proyecto Web',
    amount: 45000,
    category_id: 4,
    created_at: '2025-01-10T14:00:00Z',
    updated_at: '2025-01-10T14:00:00Z'
  }
];

export const mockDashboardData = {
  balance: 268000,
  totalIncome: 295000,
  totalExpenses: 27000,
  expenses: mockExpenses,
  incomes: mockIncomes,
  categories: mockCategories,
  categoriesAnalytics: [
    {
      Name: 'Alimentación',
      TotalAmount: 12500,
      Percentage: 46.3,
      category_id: 1
    },
    {
      Name: 'Servicios',
      TotalAmount: 8500,
      Percentage: 31.5,
      category_id: 5
    },
    {
      Name: 'Transporte',
      TotalAmount: 3200,
      Percentage: 11.9,
      category_id: 2
    },
    {
      Name: 'Entretenimiento',
      TotalAmount: 2800,
      Percentage: 10.4,
      category_id: 3
    }
  ]
};

export const mockReportData = {
  total_income: 295000,
  total_expenses: 27000,
  transactions: [...mockExpenses, ...mockIncomes.map(income => ({ ...income, type: 'income' }))],
  category_summary: [
    { category_name: 'Alimentación', total_amount: 12500, percentage: 46.3, category_id: 1 },
    { category_name: 'Servicios', total_amount: 8500, percentage: 31.5, category_id: 5 },
    { category_name: 'Transporte', total_amount: 3200, percentage: 11.9, category_id: 2 },
    { category_name: 'Entretenimiento', total_amount: 2800, percentage: 10.4, category_id: 3 }
  ]
};

// Función helper para simular delay de red
export const simulateNetworkDelay = (ms = 500) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Mock data para AI Insights que coincide con la UI
export const mockAIInsights = {
  ai_powered: false,
  insights: [
    {
      id: 'insight-1',
      title: 'Los gastos representan el 68% de los ingresos',
      description: 'Es importante analizar y reducir los gastos para aumentar la rentabilidad.',
      category: 'Gastos',
      impact: 'high',
      percentage: 68
    },
    {
      id: 'insight-2', 
      title: 'Los ingresos superan los gastos en $152,000.00',
      description: 'Mantener un balance positivo es clave para la estabilidad financiera.',
      category: 'Balance',
      impact: 'high',
      amount: 152000
    },
    {
      id: 'insight-3',
      title: 'El balance actual es sólido',
      description: 'Contar con un balance positivo es positivo para futuras inversiones o imprevistos.',
      category: 'Ahorro',
      impact: 'medium'
    }
  ],
  summary: {
    total_insights: 3,
    high_impact_count: 2, 
    medium_impact_count: 1,
    low_impact_count: 0,
    potential_savings: 0,
    top_categories: ['Gastos', 'Balance', 'Ahorro']
  },
  suggestions: [
    {
      id: 'suggestion-1',
      title: 'Acción para Los gastos representan el 68% de los ingresos',
      description: 'Basado en el insight: Es importante analizar y reducir los gastos para aumentar la rentabilidad.',
      action_type: 'reduce',
      priority: 'high',
      estimated_impact: 0
    },
    {
      id: 'suggestion-2',
      title: 'Acción para Los ingresos superan los gastos en $152,000.00',
      description: 'Basado en el insight: Mantener un balance positivo es clave para la estabilidad financiera.',
      action_type: 'optimize',
      priority: 'medium',
      estimated_impact: 0
    },
    {
      id: 'suggestion-3',
      title: 'Acción para El balance actual es sólido',
      description: 'Basado en el insight: Contar con un balance positivo es positivo para futuras inversiones o imprevistos.',
      action_type: 'review',
      priority: 'low',
      estimated_impact: 0
    }
  ],
  period: 'Enero 2025',
  generated_at: new Date().toISOString()
};

// Mock data para AI Patterns
export const mockAIPatterns = {
  ai_powered: false,
  patterns: [],
  anomalies: [],
  trends: [
    {
      category: 'Alimentación',
      direction: 'stable',
      percentage: 0,
      description: 'Los gastos en alimentación se mantienen estables en comparación con los ingresos totales.'
    },
    {
      category: 'Transporte',
      direction: 'stable', 
      percentage: 0,
      description: 'Los gastos en transporte se mantienen estables en comparación con los ingresos totales.'
    }
  ],
  predictions: [],
  period: 'Enero 2025',
  generated_at: new Date().toISOString()
};

// Mock API responses con estructura correcta
export const createMockResponse = (data) => ({
  data: data,
  status: 200,
  statusText: 'OK'
}); 