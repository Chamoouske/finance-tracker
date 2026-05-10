export interface Period {
    id: number;
    year: number;
    month: number;
    label?: string;
    closedAt: string | null;
    createdAt: string;
    updatedAt: string;
    transactionCount?: number;
    balance?: number;
    expectedRevenue?: number;
    actualRevenue?: number;
    totalExpenses?: number;
    totalInvestments?: number;
}

export interface ClosePeriodPayload {
    year: number;
    month: number;
}
