'use client'

import { useState, useCallback } from 'react'
import { api } from '@/lib/api'
import type { Transaction, CreateTransactionPayload, UpdateTransactionPayload } from '@/lib/types'

interface UseTransactionsReturn {
    transactions: Transaction[]
    loading: boolean
    error: string | null
    fetchByPeriod: (period: string) => Promise<void>
    create: (data: CreateTransactionPayload) => Promise<void>
    update: (id: number, data: UpdateTransactionPayload) => Promise<void>
    remove: (id: number) => Promise<void>
}

export function useTransactions(): UseTransactionsReturn {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchByPeriod = useCallback(async (period: string) => {
        setLoading(true)
        setError(null)
        try {
            const data = await api.getTransactions(period)
            setTransactions(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar transações')
        } finally {
            setLoading(false)
        }
    }, [])

    const create = useCallback(async (data: CreateTransactionPayload) => {
        setError(null)
        try {
            await api.createTransaction(data)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao criar transação'
            setError(message)
            throw new Error(message)
        }
    }, [])

    const update = useCallback(async (id: number, data: UpdateTransactionPayload) => {
        setError(null)
        try {
            await api.updateTransaction(id, data)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao atualizar transação'
            setError(message)
            throw new Error(message)
        }
    }, [])

    const remove = useCallback(async (id: number) => {
        setError(null)
        try {
            await api.deleteTransaction(id)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao excluir transação'
            setError(message)
            throw new Error(message)
        }
    }, [])

    return { transactions, loading, error, fetchByPeriod, create, update, remove }
}
