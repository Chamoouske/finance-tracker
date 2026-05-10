'use client'

import { useState, useCallback } from 'react'
import { api } from '@/lib/api'
import type { CategoryGroup, Category, CreateCategoryPayload, UpdateCategoryPayload } from '@/lib/types'

interface UseCategoriesReturn {
    groups: CategoryGroup[]
    loading: boolean
    error: string | null
    fetchAll: () => Promise<void>
    create: (data: CreateCategoryPayload) => Promise<Category>
    update: (id: number, data: UpdateCategoryPayload) => Promise<Category>
    remove: (id: number) => Promise<void>
}

export function useCategories(): UseCategoriesReturn {
    const [groups, setGroups] = useState<CategoryGroup[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchAll = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await api.getCategories()
            setGroups(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar categorias')
        } finally {
            setLoading(false)
        }
    }, [])

    const create = useCallback(async (data: CreateCategoryPayload) => {
        setError(null)
        try {
            const result = await api.createCategory(data)
            return result
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao criar categoria'
            setError(message)
            throw new Error(message)
        }
    }, [])

    const update = useCallback(async (id: number, data: UpdateCategoryPayload) => {
        setError(null)
        try {
            const result = await api.updateCategory(id, data)
            return result
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao atualizar categoria'
            setError(message)
            throw new Error(message)
        }
    }, [])

    const remove = useCallback(async (id: number) => {
        setError(null)
        try {
            await api.deleteCategory(id)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao excluir categoria'
            setError(message)
            throw new Error(message)
        }
    }, [])

    return { groups, loading, error, fetchAll, create, update, remove }
}
