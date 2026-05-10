'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { CategoryForm } from './category-form'
import { api } from '@/lib/api'
import type { CategoryGroup, Category } from '@/lib/types'
import { Plus, Pencil, Trash2, Power, PowerOff } from 'lucide-react'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { AlertTriangle } from 'lucide-react'

interface CategoryManagerProps {
    groups: CategoryGroup[]
    loading?: boolean
    onRefresh: () => Promise<void>
}

export function CategoryManager({
    groups,
    loading,
    onRefresh,
}: CategoryManagerProps) {
    const [formOpen, setFormOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [deleting, setDeleting] = useState(false)

    async function handleToggleActive(category: Category) {
        try {
            await api.updateCategory(category.id, { active: !category.active })
            toast.success(
                category.active
                    ? 'Categoria desativada'
                    : 'Categoria ativada'
            )
            await onRefresh()
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Erro ao atualizar'
            )
        }
    }

    async function handleDelete() {
        if (deleteId === null) return
        setDeleting(true)
        try {
            await api.deleteCategory(deleteId)
            toast.success('Categoria excluída com sucesso')
            setDeleteId(null)
            await onRefresh()
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Erro ao excluir'
            )
        } finally {
            setDeleting(false)
        }
    }

    function openEdit(category: Category) {
        setEditingCategory(category)
        setFormOpen(true)
    }

    function openNew() {
        setEditingCategory(null)
        setFormOpen(true)
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {Array.from({ length: 2 }).map((_, j) => (
                                    <div
                                        key={j}
                                        className="h-8 animate-pulse rounded bg-muted"
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (groups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg font-medium text-muted-foreground">
                    Nenhuma categoria encontrada
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Crie categorias para organizar seus lançamentos.
                </p>
                <Button className="mt-4" onClick={openNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Categoria
                </Button>
                <CategoryForm
                    open={formOpen}
                    onOpenChange={setFormOpen}
                    groups={groups}
                    category={editingCategory}
                    onSuccess={onRefresh}
                />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Categorias</h2>
                    <p className="text-sm text-muted-foreground">
                        Gerencie suas categorias de lançamentos
                    </p>
                </div>
                <Button onClick={openNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Categoria
                </Button>
            </div>

            <div className="space-y-4">
                {groups.map((group) => (
                    <Card key={group.id}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">{group.name}</CardTitle>
                            <CardDescription>
                                {group.type === 'revenue'
                                    ? 'Receitas'
                                    : group.type === 'investment'
                                        ? 'Investimentos'
                                        : 'Despesas'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {group.categories.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Nenhuma categoria neste grupo.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {group.categories.map((cat) => (
                                        <div
                                            key={cat.id}
                                            className="flex items-center justify-between rounded-lg border px-3 py-2"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={
                                                        cat.active ? '' : 'text-muted-foreground line-through'
                                                    }
                                                >
                                                    {cat.name}
                                                </span>
                                                {cat.expenseType && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {cat.expenseType === 'fixed'
                                                            ? 'Fixa'
                                                            : cat.expenseType === 'variable'
                                                                ? 'Variável'
                                                                : cat.expenseType === 'extra'
                                                                    ? 'Extra'
                                                                    : 'Adicional'}
                                                    </Badge>
                                                )}
                                                {!cat.active && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs"
                                                    >
                                                        Inativa
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleToggleActive(cat)}
                                                    title={
                                                        cat.active
                                                            ? 'Desativar'
                                                            : 'Ativar'
                                                    }
                                                >
                                                    {cat.active ? (
                                                        <Power className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <PowerOff className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEdit(cat)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteId(cat.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <CategoryForm
                open={formOpen}
                onOpenChange={setFormOpen}
                groups={groups}
                category={editingCategory}
                onSuccess={onRefresh}
            />

            <Dialog
                open={deleteId !== null}
                onOpenChange={(open) => {
                    if (!open) setDeleteId(null)
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Confirmar Exclusão
                        </DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir esta categoria?
                            <br />
                            Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? 'Excluindo...' : 'Excluir'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
