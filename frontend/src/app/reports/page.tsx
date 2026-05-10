'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MonthlySummaryView } from '@/components/dashboard/monthly-summary'
import { TransactionList } from '@/components/transactions/transaction-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { useSummary } from '@/hooks/useSummary'
import { useTransactions } from '@/hooks/useTransactions'
import { api } from '@/lib/api'
import { getCurrentPeriod } from '@/lib/utils'
import { Lock, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export default function ReportsPage() {
    const [period, setPeriod] = useState(getCurrentPeriod())
    const { summary, loading: summaryLoading, fetchByPeriod } = useSummary()
    const { transactions, loading: txLoading, fetchByPeriod: fetchTx, remove } = useTransactions()
    const [closeDialogOpen, setCloseDialogOpen] = useState(false)
    const [closing, setClosing] = useState(false)

    const loadData = useCallback(async () => {
        await Promise.all([fetchByPeriod(period), fetchTx(period)])
    }, [period, fetchByPeriod, fetchTx])

    useEffect(() => {
        loadData()
    }, [loadData])

    async function handleClosePeriod() {
        setClosing(true)
        try {
            const [year, month] = period.split('-').map(Number)
            await api.closePeriod(year, month)
            toast.success('Período fechado com sucesso!')
            setCloseDialogOpen(false)
            await loadData()
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Erro ao fechar período'
            )
        } finally {
            setClosing(false)
        }
    }

    const handleDelete = useCallback(async (id: number) => {
        await remove(id)
    }, [remove])

    return (
        <DashboardLayout period={period} onPeriodChange={setPeriod}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Relatório Mensal</h2>
                        <p className="text-sm text-muted-foreground">
                            Resumo completo e fechamento do período
                        </p>
                    </div>

                    <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="default">
                                <Lock className="mr-2 h-4 w-4" />
                                Fechar Mês
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    Fechar Período
                                </DialogTitle>
                                <DialogDescription>
                                    Tem certeza que deseja fechar o período{' '}
                                    <strong>{period}</strong>?
                                    <br />
                                    Após fechado, não será possível adicionar, editar ou excluir
                                    transações deste mês.
                                    <br />
                                    <span className="font-medium">
                                        Esta ação não pode ser desfeita.
                                    </span>
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setCloseDialogOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={handleClosePeriod}
                                    disabled={closing}
                                >
                                    {closing ? 'Fechando...' : 'Confirmar Fechamento'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <MonthlySummaryView summary={summary} loading={summaryLoading} />

                <Card>
                    <CardHeader>
                        <CardTitle>Transações do Período</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TransactionList
                            transactions={transactions}
                            loading={txLoading}
                            onDelete={handleDelete}
                            onRefresh={loadData}
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
