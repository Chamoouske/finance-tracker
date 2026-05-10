import type {
    Transaction,
    MonthlySummary,
    CategoryGroup,
    Period,
    CreateTransactionPayload,
    UpdateTransactionPayload,
    CreateCategoryPayload,
    UpdateCategoryPayload,
} from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

class ApiClient {
    private baseUrl: string

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl
    }

    private async request<T>(path: string, options?: RequestInit): Promise<T> {
        const url = `${this.baseUrl}${path}`
        const res = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            ...options,
        })

        const json = await res.json()

        if (!res.ok) {
            let errorMessage = `Erro ${res.status}`
            if (json?.error?.message) {
                errorMessage = json.error.message
            } else if (json?.message) {
                errorMessage = json.message
            }
            throw new Error(errorMessage)
        }

        // Handle wrapped API response: { success: true, data: ... }
        if (json && typeof json.success === 'boolean') {
            if (!json.success) {
                throw new Error(json.error?.message || 'Erro desconhecido')
            }
            return json.data as T
        }

        return json as T
    }

    // ─── Transactions ────────────────────────────────────────

    async getTransactions(period?: string): Promise<Transaction[]> {
        const params = period ? `?period=${period}` : ''
        const result = await this.request<{
            transactions: Transaction[]
            total: number
            period: string
        }>(`/transactions${params}`)
        return result.transactions || []
    }

    async createTransaction(
        data: CreateTransactionPayload
    ): Promise<{ transaction: Transaction; summary: MonthlySummary }> {
        return this.request<{ transaction: Transaction; summary: MonthlySummary }>(
            '/transactions',
            {
                method: 'POST',
                body: JSON.stringify(data),
            }
        )
    }

    async updateTransaction(
        id: number,
        data: UpdateTransactionPayload
    ): Promise<{ transaction: Transaction; summary: MonthlySummary }> {
        return this.request<{ transaction: Transaction; summary: MonthlySummary }>(
            `/transactions/${id}`,
            {
                method: 'PATCH',
                body: JSON.stringify(data),
            }
        )
    }

    async deleteTransaction(id: number): Promise<{ summary: MonthlySummary }> {
        return this.request<{ summary: MonthlySummary }>(
            `/transactions/${id}`,
            { method: 'DELETE' }
        )
    }

    // ─── Summary ─────────────────────────────────────────────

    async getSummary(period: string): Promise<MonthlySummary> {
        const result = await this.request<{
            summary: MonthlySummary
            period: string
        }>(`/summary?period=${period}`)
        return result.summary
    }

    // ─── Categories ──────────────────────────────────────────

    async getCategories(): Promise<CategoryGroup[]> {
        const result = await this.request<{ groups: CategoryGroup[] }>('/categories')
        return result.groups || []
    }

    async createCategory(data: CreateCategoryPayload): Promise<any> {
        return this.request<any>('/categories', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    async updateCategory(
        id: number,
        data: UpdateCategoryPayload
    ): Promise<any> {
        return this.request<any>(`/categories/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        })
    }

    async deleteCategory(id: number): Promise<void> {
        return this.request<void>(`/categories/${id}`, { method: 'DELETE' })
    }

    // ─── Periods ─────────────────────────────────────────────

    async getPeriods(): Promise<Period[]> {
        const result = await this.request<{ periods: Period[] }>('/periods')
        return result.periods || []
    }

    async closePeriod(year: number, month: number): Promise<void> {
        return this.request<void>('/periods/close', {
            method: 'POST',
            body: JSON.stringify({ year, month }),
        })
    }
}

export const api = new ApiClient(API_BASE)
