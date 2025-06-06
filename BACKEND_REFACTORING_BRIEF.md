# Backend Refactoring Brief: Financial Dashboard Architecture

## CONTEXT & PROBLEM

**Current State**: Frontend (`src/pages/Dashboard.jsx`) contains business logic that should be in backend:
- All data filtering happens client-side in `filterDataByMonthAndYear()`
- Financial calculations performed in React components
- Category aggregation in `calculateCategoryData()`
- Transaction sorting in `sortTransactions()`

**Impact**: Poor scalability, high client-side load, architectural violation.

**Goal**: Move business logic to backend, create efficient API endpoints.

---

## CURRENT FRONTEND DATA FLOW

```javascript
// CURRENT (BAD) - Frontend does everything:
const expenses = await expensesAPI.list(); // Gets ALL data
const filtered = filterDataByMonthAndYear(expenses, month, year);
const totals = calculateTotals(filtered);
const categories = calculateCategoryData(filtered);
```

```javascript
// TARGET (GOOD) - Backend preprocesses:
const dashboard = await dashboardAPI.get({year, month}); // Gets processed data
// Frontend just displays dashboard.totals, dashboard.categories, etc.
```

---

## API ENDPOINTS TO IMPLEMENT

### 1. Dashboard Overview
```http
GET /api/v1/dashboard
Query Parameters: ?year=2025&month=04
Headers: x-caller-id: user123
```

**Response Schema:**
```json
{
  "period": {
    "year": "2025",
    "month": "04",
    "label": "April 2025",
    "has_data": true
  },
  "metrics": {
    "total_income": 150000,
    "total_expenses": 108500,
    "balance": 41500,
    "pending_expenses": 25000,
    "pending_expenses_count": 3
  },
  "counts": {
    "income_transactions": 5,
    "expense_transactions": 12,
    "categories_used": 6
  },
  "trends": {
    "expense_percentage_of_income": 72.3,
    "month_over_month_change": 5.2
  }
}
```

### 2. Expenses with Calculations
```http
GET /api/v1/expenses/summary
Query Parameters: ?year=2025&month=04&sort_by=date&order=desc&limit=50
```

**Response Schema:**
```json
{
  "expenses": [
    {
      "id": "exp_abril_01",
      "description": "Supermercado semanal",
      "amount": 45000,
      "amount_paid": 0,
      "pending_amount": 45000,
      "percentage_of_income": 30.0,
      "category_id": "cat_aliment",
      "category_name": "Alimentación",
      "paid": true,
      "due_date": "2025-04-05",
      "created_at": "2025-04-05T09:30:00Z",
      "days_until_due": null
    }
  ],
  "summary": {
    "total_amount": 108500,
    "paid_amount": 83500,
    "pending_amount": 25000,
    "average_transaction": 9041.67,
    "percentage_of_total_income": 72.3
  },
  "pagination": {
    "total": 12,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

### 3. Category Analytics
```http
GET /api/v1/categories/analytics
Query Parameters: ?year=2025&month=04
```

**Response Schema:**
```json
{
  "categories": [
    {
      "category_id": "cat_aliment",
      "category_name": "Alimentación",
      "total_amount": 77000,
      "percentage_of_expenses": 70.9,
      "percentage_of_income": 51.3,
      "transaction_count": 8,
      "average_per_transaction": 9625,
      "color_seed": 0
    }
  ],
  "summary": {
    "total_categories": 6,
    "largest_category": "Alimentación",
    "smallest_category": "Entretenimiento",
    "total_amount": 108500
  }
}
```

### 4. Income Summary
```http
GET /api/v1/incomes/summary
Query Parameters: ?year=2025&month=04&sort_by=date&order=desc
```

---

## CALCULATION REQUIREMENTS

### Percentage Calculations
```sql
-- For each expense:
expense.percentage_of_income = (expense.amount / total_period_income) * 100

-- For each category:
category.percentage_of_expenses = (category_total / total_period_expenses) * 100
category.percentage_of_income = (category_total / total_period_income) * 100
```

### Period Filtering Logic
```sql
-- Month + Year specified:
WHERE YEAR(created_at) = :year AND MONTH(created_at) = :month

-- Only Year specified:
WHERE YEAR(created_at) = :year

-- No filters:
WHERE user_id = :user_id (no date filter)
```

### Sorting Options
- `date`: ORDER BY created_at DESC
- `amount`: ORDER BY amount DESC  
- `category`: ORDER BY category_name ASC, created_at DESC

---

## FRONTEND ADAPTATION REQUIRED

### Functions to Remove/Simplify
```javascript
// REMOVE these from src/pages/Dashboard.jsx:
- filterDataByMonthAndYear() // Backend handles filtering
- calculateCategoryData() // Use /categories/analytics
- calculateChartData() // Use dashboard metrics
- sortTransactions() // Backend handles sorting

// KEEP these (formatting only):
- formatAmount()
- formatMonthLabel()
- getCategoryColor()
```

### New API Service Functions Needed
```javascript
// Add to src/services/api.js:
export const dashboardAPI = {
  overview: (params) => api.get('/dashboard', { params }),
};

export const analyticsAPI = {
  expenses: (params) => api.get('/expenses/summary', { params }),
  incomes: (params) => api.get('/incomes/summary', { params }),
  categories: (params) => api.get('/categories/analytics', { params }),
};
```

---

## DATA MODELS REFERENCE

### Current Frontend Data Structure
```javascript
// From current loadDashboardData():
const data = {
  totalIncome: 150000,
  totalExpenses: 108500,
  balance: 41500,
  expenses: [/* array of expense objects */],
  incomes: [/* array of income objects */],
  categories: [/* array of category objects */]
};
```

### Current Expense Object (from API)
```javascript
{
  "id": "exp_abril_01",
  "user_id": "user123", 
  "amount": 45000,
  "amount_paid": 0,
  "pending_amount": 0,
  "description": "Supermercado semanal",
  "category_id": "cat_aliment",
  "paid": true,
  "due_date": "2025-04-05",
  "created_at": "2025-04-05T09:30:00Z",
  "updated_at": "2025-06-06T19:19:15Z"
  // MISSING: percentage, category_name
}
```

---

## IMPLEMENTATION PRIORITIES

1. **CRITICAL**: `/api/v1/dashboard` - Powers main metrics cards
2. **HIGH**: `/api/v1/expenses/summary` - Most complex calculations  
3. **MEDIUM**: `/api/v1/categories/analytics` - For pie charts
4. **LOW**: `/api/v1/incomes/summary` - Simpler, less used

---

## TESTING SCENARIOS

```bash
# Test cases to implement:
curl -H "x-caller-id: user123" "/api/v1/dashboard"
curl -H "x-caller-id: user123" "/api/v1/dashboard?year=2025"  
curl -H "x-caller-id: user123" "/api/v1/dashboard?year=2025&month=04"
curl -H "x-caller-id: user123" "/api/v1/expenses/summary?sort_by=amount&limit=5"
```

**Expected Performance**: 
- Dashboard load < 200ms
- Handle 10,000+ transactions efficiently
- Support concurrent users

---

## SUCCESS CRITERIA

✅ **Backend Handles**: Filtering, sorting, aggregations, calculations  
✅ **Frontend Handles**: Display, formatting, UI state, routing  
✅ **Performance**: Fast response times, reduced payload sizes  
✅ **Scalability**: Works with large datasets  
✅ **Maintainability**: Business logic centralized in backend  

---

## ARCHITECTURAL NOTES

- **Authentication**: Continue using `x-caller-id` header pattern
- **Error Handling**: Return consistent error format across new endpoints  
- **Caching**: Consider caching dashboard data for performance
- **Database**: Add indexes on `user_id`, `created_at` for filtering
- **Validation**: Validate year/month parameters (reasonable ranges)

**Current User ID**: `user123` (mock for development)

---

## 📋 REQUIRED RESPONSE FOR FRONTEND TEAM

**Please create a response document (`BACKEND_IMPLEMENTATION_RESPONSE.md`) with the following information:**

### Implementation Plan
```markdown
## IMPLEMENTATION STATUS

### Timeline & Order:
- [ ] `/api/v1/dashboard` - ETA: [DATE]
- [ ] `/api/v1/expenses/summary` - ETA: [DATE] 
- [ ] `/api/v1/categories/analytics` - ETA: [DATE]
- [ ] `/api/v1/incomes/summary` - ETA: [DATE]

### Technical Decisions:
- **Endpoint paths**: [Any changes to proposed paths?]
- **Response schemas**: [Any modifications to JSON structures?]
- **Parameter names**: [Keeping year/month or different approach?]
- **Database changes**: [New indexes, schema changes needed?]

### Compatibility & Migration:
- **Existing endpoints**: [Will /expenses, /incomes remain unchanged?]
- **Migration strategy**: [Gradual rollout or all-at-once?]
- **Breaking changes**: [Any changes that affect current frontend?]

### Testing & Documentation:
- **API documentation**: [Swagger/OpenAPI generation plan?]
- **Test endpoints**: [When will they be available for testing?]
- **Sample responses**: [Any example responses to share?]

### Frontend Integration Points:
- **Authentication**: [Any changes to x-caller-id pattern?]
- **Error handling**: [Any new error codes/formats?]
- **Performance**: [Expected response times achieved?]

### Questions for Frontend:
- [Any clarifications needed about current frontend logic?]
- [Any additional endpoints or features you think we need?]
- [Any concerns about the proposed architecture?]

## NEXT STEPS FOR FRONTEND
- [ ] Update src/services/api.js with new endpoints
- [ ] Refactor Dashboard.jsx to use new APIs  
- [ ] Remove client-side calculation functions
- [ ] Test integration with new backend endpoints
- [ ] Update error handling for new response formats

### Ready to Start Frontend Changes: YES/NO
### Estimated Frontend Refactoring Time: [X days/weeks]
```

**This response will help the frontend team plan the integration timeline and coordinate the refactoring efforts.**

---

This refactoring will transform the frontend from a "thick client" doing database-like operations to a proper presentation layer, following clean architecture principles. 