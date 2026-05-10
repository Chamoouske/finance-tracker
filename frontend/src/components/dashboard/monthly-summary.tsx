'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { formatCurrency, cn } from '@/lib/utils'
import type { MonthlySummary } from '@/lib/types'

interface MonthlySummaryProps {
    summary: MonthlySummary | null
    loading?: boolean
}

export function MonthlySummaryView({ summary, loading }: MonthlySummaryProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Resumo do Mês</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="h-5 animate-pulse rounded bg-muted" />
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
                    <CardTitle>Resumo do Mês</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Selecione um período para ver o resumo.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const revenue = summary.revenueTotal

    const items = [
        {
            label: 'Receitas',
            value: summary.revenueTotal,
            positive: true,
            color: 'text-green-600',
        },
        {
            label: 'Investimentos',
            value: summary.investmentTotal,
            positive: true,
            color: 'text-blue-600',
        },
        {
            label: 'Despesas Fixas',
            value: summary.fixedExpenseTotal,
            positive: false,
            color: 'text-red-600',
        },
        {
            label: 'Despesas Variáveis',
            value: summary.variableExpenseTotal,
            positive: false,
            color: 'text-orange-600',
        },
        {
            label: 'Despesas Extras',
            value: summary.extraExpenseTotal,
            positive: false,
            color: 'text-yellow-600',
        },
        {
            label: 'Despesas Adicionais',
            value: summary.additionalExpenseTotal,
            positive: false,
            color: 'text-purple-600',
        },
    ]

    return (
        <Card>
            <CardHeader>
                <CardTitle>Resumo do Mês</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Categoria</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            {revenue > 0 && (
                                <TableHead className="text-right">% da Receita</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => {
                            const percentage =
                                revenue > 0 && !item.positive
                                    ? ((item.value / revenue) * 100).toFixed(1)
                                    : null
                            return (
                                <TableRow key={item.label}>
                                    <TableCell className="font-medium">{item.label}</TableCell>
                                    <TableCell
                                        className={cn(
                                            'text-right font-mono',
                                            item.value > 0 ? item.color : 'text-muted-foreground'
                                        )}
                                    >
                                        {formatCurrency(item.value)}
                                    </TableCell>
                                    {revenue > 0 && (
                                        <TableCell className="text-right text-muted-foreground">
                                            {percentage !== null ? `${percentage}%` : '-'}
                                        </TableCell>
                                    )}
                                </TableRow>
                            )
                        })}
                        <TableRow>
                            <TableCell className="font-bold">Balanço</TableCell>
                            <TableCell
                                className={cn(
                                    'text-right font-mono font-bold',
                                    summary.balance > 0 && 'text-green-600',
                                    summary.balance < 0 && 'text-red-600'
                                )}
                            >
                                {formatCurrency(summary.balance)}
                            </TableCell>
                            {revenue > 0 && <TableCell />}
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
