import { Injectable } from '@angular/core';
import { type Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Category, CategoryGroup, CreateCategoryPayload, UpdateCategoryPayload } from '../interfaces';
import { BaseApiService } from './base-api.service';

/**
 * CategoryService
 * SRP: Responsabilidade única — operações de CRUD de categorias.
 * LSP: Pode ser substituída por qualquer implementação que estenda BaseApiService.
 * ISP: Interface pequena e coesa, apenas métodos relacionados a categorias.
 *
 * Endpoints:
 *   GET    /api/categories          → { groups: CategoryGroup[] }
 *   POST   /api/categories          → Category
 *   PATCH  /api/categories/:id      → Category
 *   DELETE /api/categories/:id      → { message: string }
 */
@Injectable({ providedIn: 'root' })
export class CategoryService extends BaseApiService {
    protected readonly basePath = '/api/categories';

    /**
     * Lists all category groups with their categories.
     */
    list(): Observable<CategoryGroup[]> {
        return this.get<{ groups: CategoryGroup[] }>().pipe(
            map((response) => response.groups)
        );
    }

    /**
     * Creates a new category.
     */
    create(payload: CreateCategoryPayload): Observable<Category> {
        return this.post<Category>(this.toSnakeCase(payload));
    }

    /**
     * Updates an existing category.
     */
    update(id: number, payload: UpdateCategoryPayload): Observable<Category> {
        return this.patch<Category>(id, this.toSnakeCase(payload));
    }

    /**
     * Deletes a category.
     */
    deleteCategory(id: number): Observable<{ message: string }> {
        return this.deleteRequest<{ message: string }>(id);
    }

    /**
     * Converts camelCase keys to snake_case for the API.
     */
    private toSnakeCase(payload: CreateCategoryPayload | UpdateCategoryPayload): Record<string, unknown> {
        const result: Record<string, unknown> = {};
        if ('groupId' in payload) result['group_id'] = payload.groupId;
        if ('name' in payload) result['name'] = payload.name;
        if ('expenseType' in payload && payload.expenseType !== undefined) {
            result['expense_type'] = payload.expenseType;
        }
        if ('sortOrder' in payload && payload.sortOrder !== undefined) {
            result['sort_order'] = payload.sortOrder;
        }
        if ('active' in payload && payload.active !== undefined) {
            result['active'] = payload.active;
        }
        return result;
    }
}
