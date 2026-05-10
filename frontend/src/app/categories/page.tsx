'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { CategoryManager } from '@/components/categories/category-manager'
import { useCategories } from '@/hooks/useCategories'
import { getCurrentPeriod } from '@/lib/utils'

export default function CategoriesPage() {
    const [period, setPeriod] = useState(getCurrentPeriod())
    const { groups, loading, fetchAll } = useCategories()

    useEffect(() => {
        fetchAll()
    }, [fetchAll])

    return (
        <DashboardLayout period={period} onPeriodChange={setPeriod}>
            <CategoryManager
                groups={groups}
                loading={loading}
                onRefresh={fetchAll}
            />
        </DashboardLayout>
    )
}
