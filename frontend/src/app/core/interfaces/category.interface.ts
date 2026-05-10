export type CategoryGroupType = 'revenue' | 'investment' | 'expense';

export type ExpenseType = 'fixed' | 'variable' | 'extra' | 'additional';

export interface CategoryGroup {
    id: number;
    name: string;
    type: CategoryGroupType;
    sortOrder: number;
    createdAt: string;
    categories: Category[];
}

export interface Category {
    id: number;
    groupId: number;
    name: string;
    expenseType: ExpenseType | null;
    sortOrder: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCategoryPayload {
    groupId: number;
    name: string;
    expenseType?: ExpenseType | null;
    sortOrder?: number;
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload> & {
    active?: boolean;
};
