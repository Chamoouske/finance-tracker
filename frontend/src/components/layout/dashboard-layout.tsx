'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { Toaster } from 'sonner'

interface DashboardLayoutProps {
    children: React.ReactNode
    period: string
    onPeriodChange: (period: string) => void
    periods?: string[]
}

export function DashboardLayout({
    children,
    period,
    onPeriodChange,
    periods,
}: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex min-h-screen">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex flex-1 flex-col">
                <Header
                    period={period}
                    onPeriodChange={onPeriodChange}
                    onMenuClick={() => setSidebarOpen(true)}
                    periods={periods}
                />
                <main className="flex-1 p-4 lg:p-6">
                    {children}
                </main>
            </div>
            <Toaster position="top-right" richColors />
        </div>
    )
}
