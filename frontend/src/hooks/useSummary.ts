'use client'

import { useState, useCallback } from 'react'
import { api } from '@/lib/api'
import type { MonthlySummary } from '@/lib/types'

interface UseSummaryReturn {
    summary: MonthlySummary | null
    loading: boolean
    error: string | null
    fetchByPeriod: (period: string) => Promise<void>
}

export function useSummary(): UseSummaryReturn {
    const [summary, setSummary] = useState<MonthlySummary | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchByPeriod = useCallback(async (period: string) => {
        setLoading(true)
        setError(null)
        try {
            const data = await api.getSummary(period)
            setSummary(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar resumo')
            setSummary(null)
        } finally {
            setLoading(false)
        }
    }, [])

    return { summary, loading, error, fetchByPeriod }
}
