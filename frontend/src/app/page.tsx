'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { BalanceCard } from '@/components/dashboard/balance-card'
import { MonthlySummaryView } from '@/components/dashboard/monthly-summary'
import { CategoryBreakdown } from '@/components/dashboard/category-breakdown'
import { TransactionList } from '@/components/transactions/transaction-list'
import { useTransactions } from '@/hooks/useTransactions'
import { useSummary } from '@/hooks/useSummary'
import { getCurrentPeriod, formatCurrency } from '@/lib/utils'

export default function DashboardPage() {
  const [period, setPeriod] = useState(getCurrentPeriod())
  const { summary, loading: summaryLoading, fetchByPeriod } = useSummary()
  const { transactions, loading: txLoading, fetchByPeriod: fetchTx, remove } = useTransactions()

  const loadData = useCallback(async () => {
    await Promise.all([fetchByPeriod(period), fetchTx(period)])
  }, [period, fetchByPeriod, fetchTx])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDelete = useCallback(async (id: number) => {
    await remove(id)
  }, [remove])

  const totalExpenses = summary
    ? summary.fixedExpenseTotal +
    summary.variableExpenseTotal +
    summary.extraExpenseTotal +
    summary.additionalExpenseTotal
    : 0

  return (
    <DashboardLayout period={period} onPeriodChange={setPeriod}>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <BalanceCard
            balance={summary?.balance ?? 0}
            loading={summaryLoading}
          />
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <p className="text-sm font-medium text-muted-foreground">
              Total Receitas
            </p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {summary ? formatCurrency(summary.revenueTotal) : '---'}
            </p>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <p className="text-sm font-medium text-muted-foreground">
              Total Despesas
            </p>
            <p className="text-2xl font-bold text-red-600 mt-2">
              {summary ? formatCurrency(totalExpenses) : '---'}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <MonthlySummaryView summary={summary} loading={summaryLoading} />
          <CategoryBreakdown summary={summary} loading={summaryLoading} />
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold">Últimas Transações</h2>
          <TransactionList
            transactions={transactions}
            loading={txLoading}
            onDelete={handleDelete}
            onRefresh={loadData}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
