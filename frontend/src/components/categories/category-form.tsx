'use client'

import { useState } from 'react'
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
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { api } from '@/lib/api'
import type {
    CategoryGroup,
    Category,
    ExpenseType,
    CreateCategoryPayload,
} from '@/lib/types'
import { toast } from 'sonner'

interface CategoryFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    groups: CategoryGroup[]
    category?: Category | null
    onSuccess: () => Promise<void>
}

const expenseTypeOptions: { value: ExpenseType; label: string }[] = [
    { value: 'fixed', label: 'Fixa' },
    { value: 'variable', label: 'Variável' },
    { value: 'extra', label: 'Extra' },
    { value: 'additional', label: 'Adicional' },
]

export function CategoryForm({
    open,
    onOpenChange,
    groups,
    category,
    onSuccess,
}: CategoryFormProps) {
    const isEditing = !!category
    const [name, setName] = useState(category?.name || '')
    const [groupId, setGroupId] = useState(
        category?.groupId?.toString() || ''
    )
    const [expenseType, setExpenseType] = useState<string>(
        category?.expenseType || ''
    )
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const selectedGroup = groups.find((g) => g.id.toString() === groupId)
    const isExpense = selectedGroup?.type === 'expense'

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (!name.trim()) {
            setError('Nome é obrigatório')
            return
        }
        if (!groupId) {
            setError('Grupo é obrigatório')
            return
        }

        setSubmitting(true)
        try {
            const payload: CreateCategoryPayload = {
                groupId: parseInt(groupId),
                name: name.trim(),
                sortOrder: category?.sortOrder || 0,
            }

            if (isExpense) {
                payload.expenseType = (expenseType as ExpenseType) || undefined
            }

            if (isEditing && category) {
                await api.updateCategory(category.id, payload)
                toast.success('Categoria atualizada com sucesso!')
            } else {
                await api.createCategory(payload)
                toast.success('Categoria criada com sucesso!')
            }

            onOpenChange(false)
            await onSuccess()
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Erro ao salvar categoria'
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="cat-name">
                            Nome <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="cat-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome da categoria"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cat-group">
                            Grupo <span className="text-red-500">*</span>
                        </Label>
                        <Select value={groupId} onValueChange={setGroupId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o grupo" />
                            </SelectTrigger>
                            <SelectContent>
                                {groups.map((g) => (
                                    <SelectItem key={g.id} value={g.id.toString()}>
                                        {g.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {isExpense && (
                        <div className="space-y-2">
                            <Label htmlFor="cat-expense-type">
                                Tipo de Despesa <span className="text-red-500">*</span>
                            </Label>
                            <Select value={expenseType} onValueChange={setExpenseType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {expenseTypeOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting
                                ? 'Salvando...'
                                : isEditing
                                    ? 'Atualizar'
                                    : 'Criar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
