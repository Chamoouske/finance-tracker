'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TransactionFilters } from '@/components/transactions/transaction-filters'
import { TransactionList } from '@/components/transactions/transaction-list'
import { Button } from '@/components/ui/button'
import { useTransactions } from '@/hooks/useTransactions'
import { getCurrentPeriod } from '@/lib/utils'
import { Plus } from 'lucide-react'

export default function TransactionsPage() {
    const router = useRouter()
    const [period, setPeriod] = useState(getCurrentPeriod())
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const { transactions, loading, fetchByPeriod, remove } = useTransactions()

    const loadData = useCallback(async () => {
        await fetchByPeriod(period)
    }, [period, fetchByPeriod])

    useEffect(() => {
        loadData()
    }, [loadData])

    const filteredTransactions = transactions.filter((tx) => {
        const matchesSearch =
            !search ||
            tx.note?.toLowerCase().includes(search.toLowerCase())
        const matchesType =
            typeFilter === 'all' || tx.type === typeFilter
        return matchesSearch && matchesType
    })

    const handleDelete = useCallback(async (id: number) => {
        await remove(id)
    }, [remove])

    return (
        <DashboardLayout period={period} onPeriodChange={setPeriod}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Transações</h2>
                        <p className="text-sm text-muted-foreground">
                            Gerencie seus lançamentos financeiros
                        </p>
                    </div>
                    <Button onClick={() => router.push('/transactions/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Lançamento
                    </Button>
                </div>

                <TransactionFilters
                    search={search}
                    onSearchChange={setSearch}
                    typeFilter={typeFilter}
                    onTypeFilterChange={setTypeFilter}
                />

                <TransactionList
                    transactions={filteredTransactions}
                    loading={loading}
                    onDelete={handleDelete}
                    onRefresh={loadData}
                />
            </div>
        </DashboardLayout>
    )
}
