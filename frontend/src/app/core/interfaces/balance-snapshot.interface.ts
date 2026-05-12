export interface BalanceSnapshot {
    id: string;
    total_balance: number;
    total_income: number;
    total_expense: number;
    total_credit: number;
    total_debit: number;
    month_count: number;
    calculated_at: string;
    created_at: string;
}
