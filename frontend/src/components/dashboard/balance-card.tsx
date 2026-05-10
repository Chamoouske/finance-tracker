'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface BalanceCardProps {
    balance: number
    loading?: boolean
}

export function BalanceCard({ balance, loading }: BalanceCardProps) {
    const isPositive = balance > 0
    const isNegative = balance < 0

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Saldo do Mês</CardTitle>
                {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                ) : isNegative ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                    <Minus className="h-4 w-4 text-muted-foreground" />
                )}
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-8 w-32 animate-pulse rounded bg-muted" />
                ) : (
                    <div
                        className={cn(
                            'text-3xl font-bold',
                            isPositive && 'text-green-600',
                            isNegative && 'text-red-600',
                            !isPositive && !isNegative && 'text-foreground'
                        )}
                    >
                        {formatCurrency(balance)}
                    </div>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                    {isPositive
                        ? 'Receitas superam despesas'
                        : isNegative
                            ? 'Despesas superam receitas'
                            : 'Nenhum lançamento no período'}
                </p>
            </CardContent>
        </Card>
    )
}
