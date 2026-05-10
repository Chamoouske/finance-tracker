'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPeriod, getCurrentPeriod } from '@/lib/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface HeaderProps {
    period: string
    onPeriodChange: (period: string) => void
    onMenuClick: () => void
    periods?: string[]
}

export function Header({ period, onPeriodChange, onMenuClick, periods }: HeaderProps) {
    const currentPeriod = getCurrentPeriod()

    // Generate available periods (current month and up to 12 months back)
    const availablePeriods = periods || generatePeriods()

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={onMenuClick}
            >
                <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1">
                <h1 className="text-lg font-semibold">Controle Financeiro</h1>
            </div>

            <Select value={period} onValueChange={onPeriodChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                    {availablePeriods.map((p) => (
                        <SelectItem key={p} value={p}>
                            {formatPeriod(p)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </header>
    )
}

function generatePeriods(): string[] {
    const now = new Date()
    const periods: string[] = []
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        periods.push(`${year}-${month}`)
    }
    return periods
}
