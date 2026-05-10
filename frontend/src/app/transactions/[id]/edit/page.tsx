'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { getCurrentPeriod } from '@/lib/utils'
import { api } from '@/lib/api'
import type { Transaction } from '@/lib/types'
import { toast } from 'sonner'

export default function EditTransactionPage() {
    const params = useParams()
    const [period, setPeriod] = useState(getCurrentPeriod())
    const [transaction, setTransaction] = useState<Transaction | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            if (!params.id) return
            try {
                const transactions = await api.getTransactions()
                const tx = transactions.find((t) => t.id === Number(params.id))
                if (tx) {
                    setTransaction(tx)
                } else {
                    toast.error('Transação não encontrada')
                }
            } catch (err) {
                toast.error('Erro ao carregar transação')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [params.id])

    return (
        <DashboardLayout period={period} onPeriodChange={setPeriod}>
            <div className="mx-auto max-w-2xl">
                {loading ? (
                    <div className="space-y-4">
                        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
                        <div className="h-96 animate-pulse rounded bg-muted" />
                    </div>
                ) : (
                    <TransactionForm transaction={transaction} />
                )}
            </div>
        </DashboardLayout>
    )
}
