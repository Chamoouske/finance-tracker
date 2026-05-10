export type CategoryType = 'revenue' | 'investment' | 'expense'
export type TransactionType = 'income' | 'investment' | 'expense'
export type ExpenseType = 'fixed' | 'variable' | 'extra' | 'additional'

export interface Period {
    id: number
    year: number
    month: number
    closedAt: string | null
    createdAt: string
    updatedAt: string
}

export interface CategoryGroup {
    id: number
    name: string
    type: CategoryType
    sortOrder: number
    createdAt: string
    categories: Category[]
}

export interface Category {
    id: number
    groupId: number
    name: string
    expenseType: ExpenseType | null
    sortOrder: number
    active: boolean
    createdAt: string
    updatedAt: string
}

export interface Transaction {
    id: number
    periodId: number
    categoryId: number
    date: string
    amount: number
    type: TransactionType
    note: string
    createdAt: string
    updatedAt: string
    period?: Period
    category?: Category
}

export interface MonthlySummary {
    id: number
    periodId: number
    revenueTotal: number
    investmentTotal: number
    fixedExpenseTotal: number
    variableExpenseTotal: number
    extraExpenseTotal: number
    additionalExpenseTotal: number
    balance: number
    createdAt: string
    updatedAt: string
}

export interface CreateTransactionPayload {
    categoryId: number
    date: string
    amount: number
    type: TransactionType
    note: string
}

export interface UpdateTransactionPayload {
    categoryId?: number
    date?: string
    amount?: number
    type?: TransactionType
    note?: string
}

export interface CreateCategoryPayload {
    groupId: number
    name: string
    expenseType?: ExpenseType | null
    sortOrder?: number
}

export interface UpdateCategoryPayload {
    name?: string
    expenseType?: ExpenseType | null
    sortOrder?: number
    active?: boolean
}

export interface APIResponse<T> {
    success: boolean
    data?: T
    error?: {
        code: string
        message: string
    }
}
