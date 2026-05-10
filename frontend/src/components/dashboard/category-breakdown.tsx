'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, cn } from '@/lib/utils'
import type { MonthlySummary } from '@/lib/types'

interface CategoryBreakdownProps {
    summary: MonthlySummary | null
    loading?: boolean
}

interface BreakdownItem {
    label: string
    value: number
    color: string
    total: number
}

export function CategoryBreakdown({ summary, loading }: CategoryBreakdownProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Distribuição de Despesas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!summary) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Distribuição de Despesas</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Nenhum dado disponível para o período.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const revenue = summary.revenueTotal
    const totalExpenses =
        summary.fixedExpenseTotal +
        summary.variableExpenseTotal +
        summary.extraExpenseTotal +
        summary.additionalExpenseTotal

    if (totalExpenses === 0 || revenue === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Distribuição de Despesas</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {revenue === 0
                            ? 'Registre receitas para ver a distribuição.'
                            : 'Nenhuma despesa registrada no período.'}
                    </p>
                </CardContent>
            </Card>
        )
    }

    const items: BreakdownItem[] = [
        {
            label: 'Despesas Fixas',
            value: summary.fixedExpenseTotal,
            color: 'bg-red-500',
            total: revenue,
        },
        {
            label: 'Despesas Variáveis',
            value: summary.variableExpenseTotal,
            color: 'bg-orange-500',
            total: revenue,
        },
        {
            label: 'Despesas Extras',
            value: summary.extraExpenseTotal,
            color: 'bg-yellow-500',
            total: revenue,
        },
        {
            label: 'Despesas Adicionais',
            value: summary.additionalExpenseTotal,
            color: 'bg-purple-500',
            total: revenue,
        },
    ]

    return (
        <Card>
            <CardHeader>
                <CardTitle>Distribuição de Despesas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Total bar */}
                <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium">Total sobre Receita</span>
                        <span className="font-mono text-muted-foreground">
                            {formatCurrency(totalExpenses)} / {formatCurrency(revenue)}
                        </span>
                    </div>
                    <div className="flex h-6 w-full overflow-hidden rounded-full bg-muted">
                        {items
                            .filter((item) => item.value > 0)
                            .map((item) => {
                                const width = (item.value / revenue) * 100
                                return (
                                    <div
                                        key={item.label}
                                        className={cn(item.color, 'transition-all')}
                                        style={{ width: `${Math.max(width, 2)}%` }}
                                        title={`${item.label}: ${formatCurrency(item.value)}`}
                                    />
                                )
                            })}
                    </div>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-3">
                    {items.map((item) => {
                        const percentage = ((item.value / revenue) * 100).toFixed(1)
                        return (
                            <div key={item.label} className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                    <div
                                        className={cn('h-3 w-3 rounded-full', item.color)}
                                    />
                                    <span className="text-muted-foreground">{item.label}</span>
                                </div>
                                <div className="pl-5">
                                    <div className="font-mono text-sm font-medium">
                                        {formatCurrency(item.value)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {percentage}% da receita
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
