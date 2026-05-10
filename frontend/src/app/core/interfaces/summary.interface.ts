export interface CategorySummary {
    categoryId: number;
    categoryName: string;
    amount: number;
}

export interface ExpenseTypeSummary {
    total: number;
    categories: CategorySummary[];
    count: number;
}

export interface RevenueSummary {
    total: number;
    categories: CategorySummary[];
    count: number;
}

export interface InvestmentsSummary {
    total: number;
    categories: CategorySummary[];
    count: number;
}

export interface ExpensesSummary {
    total: number;
    fixed: ExpenseTypeSummary;
    variable: ExpenseTypeSummary;
    extra: ExpenseTypeSummary;
    additional: ExpenseTypeSummary;
}

export interface DetailedSummary {
    period: string;
    periodId: number;
    closed: boolean;
    revenue: RevenueSummary;
    investments: InvestmentsSummary;
    expenses: ExpensesSummary;
    balance: number;
    summary: MonthlySummary;
}

export interface MonthlySummary {
    id: number;
    periodId: number;
    revenueTotal: number;
    investmentTotal: number;
    fixedExpenseTotal: number;
    variableExpenseTotal: number;
    extraExpenseTotal: number;
    additionalExpenseTotal: number;
    balance: number;
    createdAt: string;
    updatedAt: string;
}
