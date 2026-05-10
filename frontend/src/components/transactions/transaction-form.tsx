'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import type {
    Transaction,
    CategoryGroup,
    TransactionType,
    Category,
} from '@/lib/types'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TransactionFormProps {
    transaction?: Transaction | null
}

const typeOptions: { value: TransactionType; label: string }[] = [
    { value: 'income', label: 'Receita' },
    { value: 'investment', label: 'Investimento' },
    { value: 'expense', label: 'Despesa' },
]

export function TransactionForm({ transaction }: TransactionFormProps) {
    const router = useRouter()
    const isEditing = !!transaction

    const [groups, setGroups] = useState<CategoryGroup[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [type, setType] = useState<TransactionType>(
        transaction?.type || 'expense'
    )
    const [categoryId, setCategoryId] = useState<string>(
        transaction?.categoryId?.toString() || ''
    )
    const [date, setDate] = useState(
        transaction?.date || new Date().toISOString().split('T')[0]
    )
    const [amount, setAmount] = useState(
        transaction ? String(transaction.amount / 100) : ''
    )
    const [note, setNote] = useState(transaction?.note || '')
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [noteTouched, setNoteTouched] = useState(false)

    // Load categories
    useEffect(() => {
        async function load() {
            try {
                const data = await api.getCategories()
                setGroups(data)
            } catch (err) {
                toast.error('Erro ao carregar categorias')
            }
        }
        load()
    }, [])

    // Filter categories by selected type
    useEffect(() => {
        const group = groups.find((g) => {
            if (type === 'income') return g.type === 'revenue'
            if (type === 'investment') return g.type === 'investment'
            if (type === 'expense') return g.type === 'expense'
            return false
        })
        setCategories(group?.categories || [])
        // Reset category if not in the new list
        if (
            categoryId &&
            !group?.categories.some(
                (c) => c.id.toString() === categoryId
            )
        ) {
            setCategoryId('')
        }
    }, [type, groups])

    function validate(): boolean {
        const newErrors: Record<string, string> = {}

        if (!date) newErrors.date = 'Data é obrigatória'
        if (!categoryId) newErrors.categoryId = 'Categoria é obrigatória'
        if (!amount || parseFloat(amount) <= 0)
            newErrors.amount = 'Valor deve ser positivo'
        if (!note || note.trim().length === 0) {
            newErrors.note = 'Observação é obrigatória'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!validate()) return

        setSubmitting(true)
        try {
            const amountCents = Math.round(parseFloat(amount) * 100)

            if (isEditing && transaction) {
                await api.updateTransaction(transaction.id, {
                    categoryId: parseInt(categoryId),
                    date,
                    amount: amountCents,
                    type,
                    note: note.trim(),
                })
                toast.success('Transação atualizada com sucesso!')
            } else {
                await api.createTransaction({
                    categoryId: parseInt(categoryId),
                    date,
                    amount: amountCents,
                    type,
                    note: note.trim(),
                })
                toast.success('Transação criada com sucesso!')
            }

            router.push('/transactions')
            router.refresh()
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Erro ao salvar transação'
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>
                        {isEditing ? 'Editar Lançamento' : 'Novo Lançamento'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Date */}
                    <div className="space-y-2">
                        <Label htmlFor="date">
                            Data <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className={errors.date ? 'border-red-500' : ''}
                        />
                        {errors.date && (
                            <p className="text-sm text-red-500">{errors.date}</p>
                        )}
                    </div>

                    {/* Type */}
                    <div className="space-y-2">
                        <Label htmlFor="type">
                            Tipo <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={type}
                            onValueChange={(v) => setType(v as TransactionType)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                {typeOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label htmlFor="category">
                            Categoria <span className="text-red-500">*</span>
                        </Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger
                                className={errors.categoryId ? 'border-red-500' : ''}
                            >
                                <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.length === 0 && (
                                    <SelectItem value="-" disabled>
                                        Nenhuma categoria disponível para este tipo
                                    </SelectItem>
                                )}
                                {categories
                                    .filter((c) => c.active)
                                    .map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                        {errors.categoryId && (
                            <p className="text-sm text-red-500">{errors.categoryId}</p>
                        )}
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="amount">
                            Valor (R$) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0,00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className={cn(
                                'font-mono text-lg',
                                errors.amount ? 'border-red-500' : ''
                            )}
                        />
                        {errors.amount && (
                            <p className="text-sm text-red-500">{errors.amount}</p>
                        )}
                    </div>

                    {/* Note - Destaque visual */}
                    <div className="space-y-2">
                        <Label htmlFor="note">
                            Observação <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <textarea
                                id="note"
                                placeholder="Ex: Salário referente a maio/2026"
                                value={note}
                                onChange={(e) => {
                                    setNote(e.target.value)
                                    if (!noteTouched) setNoteTouched(true)
                                }}
                                className={cn(
                                    'flex min-h-[120px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm transition-colors',
                                    'placeholder:text-muted-foreground',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                                    'resize-y',
                                    noteTouched && note.trim().length > 0
                                        ? 'border-green-500 focus-visible:ring-green-500'
                                        : errors.note
                                            ? 'border-red-500 focus-visible:ring-red-500'
                                            : 'border-input focus-visible:ring-ring'
                                )}
                                style={{ minHeight: '120px' }}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                Descreva o propósito deste lançamento de forma clara e
                                detalhada.
                            </p>
                            {noteTouched && note.trim().length === 0 && (
                                <p className="flex items-center gap-1 text-xs text-red-500">
                                    <AlertCircle className="h-3 w-3" />
                                    Este campo é obrigatório
                                </p>
                            )}
                        </div>
                        {errors.note && (
                            <p className="text-sm text-red-500">{errors.note}</p>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting
                                ? 'Salvando...'
                                : isEditing
                                    ? 'Atualizar'
                                    : 'Criar Lançamento'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    )
}
