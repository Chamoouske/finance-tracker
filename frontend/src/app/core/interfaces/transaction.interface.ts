export type TransactionType = 'income' | 'investment' | 'expense';

export interface Transaction {
    id: number;
    periodId: number;
    categoryId: number;
    date: string;
    amount: number;
    type: TransactionType;
    note: string;
    createdAt: string;
    updatedAt: string;
    categoryName?: string;
    periodLabel?: string;
    category?: { id: number; name: string; expenseType?: string | null };
    period?: { id: number; year: number; month: number; closedAt?: string | null };
}

export interface CreateTransactionPayload {
    categoryId: number;
    date: string;
    amount: number;
    type: TransactionType;
    note: string;
}

export type UpdateTransactionPayload = Partial<CreateTransactionPayload>;
