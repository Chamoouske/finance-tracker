'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Pencil, Trash2, AlertTriangle } from 'lucide-react'
import type { Transaction } from '@/lib/types'
import { toast } from 'sonner'

interface TransactionListProps {
    transactions: Transaction[]
    loading?: boolean
    onDelete: (id: number) => Promise<void>
    onRefresh: () => Promise<void>
}

const typeLabels: Record<string, string> = {
    income: 'Receita',
    investment: 'Investimento',
    expense: 'Despesa',
}

const typeVariants: Record<string, 'income' | 'investment' | 'expense'> = {
    income: 'income',
    investment: 'investment',
    expense: 'expense',
}

export function TransactionList({
    transactions,
    loading,
    onDelete,
    onRefresh,
}: TransactionListProps) {
    const router = useRouter()
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [deleting, setDeleting] = useState(false)

    async function handleDelete() {
        if (deleteId === null) return
        setDeleting(true)
        try {
            await onDelete(deleteId)
            toast.success('Transação excluída com sucesso')
            setDeleteId(null)
            await onRefresh()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao excluir')
        } finally {
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded bg-muted" />
                ))}
            </div>
        )
    }

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg font-medium text-muted-foreground">
                    Nenhuma transação encontrada
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Crie um novo lançamento para começar.
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="max-w-[200px]">Observação</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((tx) => {
                            const categoryName = tx.category?.name || '-'
                            return (
                                <TableRow key={tx.id}>
                                    <TableCell className="font-medium">
                                        {formatDate(tx.date)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={typeVariants[tx.type] || 'outline'}>
                                            {typeLabels[tx.type] || tx.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{categoryName}</TableCell>
                                    <TableCell className="font-mono text-right">
                                        {formatCurrency(tx.amount)}
                                    </TableCell>
                                    <TableCell className="max-w-[200px]">
                                        <p className="truncate text-muted-foreground" title={tx.note}>
                                            {tx.note || '-'}
                                        </p>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => router.push(`/transactions/${tx.id}/edit`)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Dialog
                                                open={deleteId === tx.id}
                                                onOpenChange={(open) => {
                                                    if (!open) setDeleteId(null)
                                                }}
                                            >
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteId(tx.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle className="flex items-center gap-2">
                                                            <AlertTriangle className="h-5 w-5 text-red-500" />
                                                            Confirmar Exclusão
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            Tem certeza que deseja excluir esta transação?
                                                            <br />
                                                            <span className="font-medium">
                                                                {formatCurrency(tx.amount)} - {tx.note}
                                                            </span>
                                                            <br />
                                                            Esta ação não pode ser desfeita.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <DialogFooter>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setDeleteId(null)}
                                                        >
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
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </>
    )
}
