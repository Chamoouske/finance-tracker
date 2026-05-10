import { Component, computed, inject, signal, type OnInit, type OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, switchMap, takeUntil, catchError, of, tap } from 'rxjs';

import { CategoryService } from '../../core/services/category.service';
import { PageHeader } from '../../shared/components/page-header';
import { ErrorAlert } from '../../shared/components/error-alert';
import { LoadingSpinner } from '../../shared/components/loading-spinner';
import { ConfirmDialog } from '../../shared/components/confirm-dialog';
import type { CategoryGroup, CategoryGroupType, ExpenseType } from '../../core/interfaces';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeader, ErrorAlert, LoadingSpinner, ConfirmDialog],
  template: `
    <app-page-header title="Categorias" description="Gerencie grupos e categorias de lançamentos" />

    <app-error-alert [message]="error()!" (dismiss)="error.set(null)" />

    @if (loading()) {
      <app-loading-spinner message="Carregando categorias..." />
    } @else {
      <div class="space-y-6">
        <!-- Add Category Form -->
        <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">Nova Categoria</h2>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Grupo</label>
                <select
                  formControlName="groupId"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option [ngValue]="null" disabled>Selecione</option>
                  @for (g of groups(); track g.id) {
                    <option [ngValue]="g.id">{{ g.name }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  formControlName="name"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Nome da categoria"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Tipo de Despesa</label>
                <select
                  formControlName="expenseType"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option [ngValue]="null">—</option>
                  <option value="fixed">Fixa</option>
                  <option value="variable">Variável</option>
                  <option value="extra">Extra</option>
                  <option value="additional">Adicional</option>
                </select>
              </div>
              <div class="flex items-end">
                <button
                  type="submit"
                  [disabled]="form.invalid || submitting()"
                  class="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  @if (submitting()) { Salvando... } @else { Adicionar }
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- Groups List -->
        <div class="space-y-4">
          @for (group of groups(); track group.id) {
            <div class="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div class="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                <div class="flex items-center gap-2">
                  <span
                    class="inline-block h-3 w-3 rounded-full"
                    [class.bg-emerald-500]="group.type === 'revenue'"
                    [class.bg-blue-500]="group.type === 'investment'"
                    [class.bg-red-500]="group.type === 'expense'"
                  ></span>
                  <h3 class="font-semibold text-gray-900">{{ group.name }}</h3>
                  <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    {{ group.type === 'revenue' ? 'Receita' : group.type === 'investment' ? 'Investimento' : 'Despesa' }}
                  </span>
                </div>
              </div>
              <div class="divide-y divide-gray-50">
                @for (cat of group.categories; track cat.id) {
                  <div class="flex items-center justify-between px-5 py-2.5">
                    <div class="flex items-center gap-2">
                      <span
                        class="h-2 w-2 rounded-full"
                        [class.bg-green-400]="cat.active"
                        [class.bg-gray-300]="!cat.active"
                      ></span>
                      <span class="text-sm text-gray-700" [class.text-gray-400]="!cat.active">
                        {{ cat.name }}
                      </span>
                      @if (cat.expenseType) {
                        <span class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                          {{ expenseTypeLabel(cat.expenseType) }}
                        </span>
                      }
                    </div>
                    <button
                      class="rounded p-1 text-gray-400 hover:text-red-600"
                      (click)="deleteCategory(cat.id, cat.name)"
                      title="Excluir"
                    >
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    }

    <!-- Delete Confirmation -->
    <app-confirm-dialog
      [isOpen]="deleteDialogOpen()"
      title="Excluir Categoria"
      [message]="deleteMessage()"
      confirmText="Excluir"
      (confirmed)="onDeleteConfirmed()"
      (cancelled)="onDeleteCancelled()"
    />
  `,
})
export default class Categories implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);

  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly groups = signal<CategoryGroup[]>([]);
  protected readonly deleteDialogOpen = signal(false);
  protected readonly deletingId = signal<number | null>(null);
  protected readonly deletingName = signal('');
  protected readonly deleteMessage = computed(() =>
    `Tem certeza que deseja excluir "${this.deletingName()}"?`
  );

  protected readonly form = this.fb.group({
    groupId: [null as number | null, Validators.required],
    name: ['', Validators.required],
    expenseType: [null as string | null],
  });

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategories(): void {
    this.categoryService.list().pipe(
      catchError((err) => {
        this.error.set(err.message ?? 'Erro ao carregar categorias');
        this.loading.set(false);
        return of([]);
      })
    ).subscribe((groups) => {
      this.groups.set(groups);
      this.loading.set(false);
    });
  }

  protected expenseTypeLabel(type: ExpenseType): string {
    const labels: Record<ExpenseType, string> = {
      fixed: 'Fixa',
      variable: 'Variável',
      extra: 'Extra',
      additional: 'Adicional',
    };
    return labels[type] ?? type;
  }

  protected onSubmit(): void {
    if (this.form.invalid) return;

    this.submitting.set(true);
    this.error.set(null);

    const payload = {
      groupId: this.form.value.groupId!,
      name: this.form.value.name!,
      expenseType: this.form.value.expenseType as ExpenseType | undefined,
    };

    this.categoryService.create(payload).pipe(
      catchError((err) => {
        this.error.set(err.message ?? 'Erro ao criar categoria');
        this.submitting.set(false);
        return of(null);
      })
    ).subscribe((result) => {
      if (result) {
        this.form.reset();
        this.form.get('expenseType')?.setValue(null);
        this.submitting.set(false);
        this.loadCategories();
      }
    });
  }

  protected deleteCategory(id: number, name: string): void {
    this.deletingId.set(id);
    this.deletingName.set(name);
    this.deleteDialogOpen.set(true);
  }

  protected onDeleteConfirmed(): void {
    const id = this.deletingId();
    if (id === null) return;

    this.categoryService.deleteCategory(id).pipe(
      catchError((err) => {
        this.error.set(err.message ?? 'Erro ao excluir categoria');
        return of(null);
      })
    ).subscribe(() => {
      this.deleteDialogOpen.set(false);
      this.deletingId.set(null);
      this.loadCategories();
    });
  }

  protected onDeleteCancelled(): void {
    this.deleteDialogOpen.set(false);
    this.deletingId.set(null);
  }
}
