'use client'

import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import type { TransactionType } from '@/lib/types'

interface TransactionFiltersProps {
    search: string
    onSearchChange: (value: string) => void
    typeFilter: string
    onTypeFilterChange: (value: string) => void
}

export function TransactionFilters({
    search,
    onSearchChange,
    typeFilter,
    onTypeFilterChange,
}: TransactionFiltersProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Buscar na observação..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>
            <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="income">Receitas</SelectItem>
                    <SelectItem value="investment">Investimentos</SelectItem>
                    <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
