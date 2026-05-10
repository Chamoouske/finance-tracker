'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { getCurrentPeriod } from '@/lib/utils'
import { useState } from 'react'

export default function NewTransactionPage() {
    const [period, setPeriod] = useState(getCurrentPeriod())

    return (
        <DashboardLayout period={period} onPeriodChange={setPeriod}>
            <div className="mx-auto max-w-2xl">
                <TransactionForm />
            </div>
        </DashboardLayout>
    )
}
