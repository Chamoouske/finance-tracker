import { Component, inject, signal, type OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { TransactionService } from '../../core/services/transaction.service';
import { CategoryService } from '../../core/services/category.service';
import { PeriodNavigationService } from '../../core/services/period-navigation.service';
import { PageHeader } from '../../shared/components/page-header';
import { ErrorAlert } from '../../shared/components/error-alert';
import { LoadingSpinner } from '../../shared/components/loading-spinner';
import { DateUtils } from '../../core/utils';
import type { CategoryGroup, TransactionType } from '../../core/interfaces';

@Component({
    selector: 'app-transaction-form',
    standalone: true,
    imports: [ReactiveFormsModule, RouterLink, PageHeader, ErrorAlert, LoadingSpinner],
    template: `
    <app-page-header title="Nova Transação" description="Registre um novo lançamento financeiro" />

    <app-error-alert [message]="error()!" (dismiss)="error.set(null)" />

    @if (categoriesLoading()) {
      <app-loading-spinner message="Carregando categorias..." />
    } @else {
      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="max-w-2xl space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <!-- Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Tipo</label>
          <div class="mt-2 grid grid-cols-3 gap-3">
            @for (opt of typeOptions; track opt.value) {
              <button
                type="button"
                class="rounded-lg border px-4 py-3 text-sm font-medium transition-colors"
                [class.border-indigo-600]="form.get('type')?.value === opt.value"
                [class.bg-indigo-50]="form.get('type')?.value === opt.value"
                [class.text-indigo-700]="form.get('type')?.value === opt.value"
                [class.border-gray-200]="form.get('type')?.value !== opt.value"
                [class.text-gray-700]="form.get('type')?.value !== opt.value"
                [class.hover:bg-gray-50]="form.get('type')?.value !== opt.value"
                (click)="form.get('type')?.setValue(opt.value)"
              >
                {{ opt.label }}
              </button>
            }
          </div>
          @if (form.get('type')?.invalid && form.get('type')?.touched) {
            <p class="mt-1 text-sm text-red-600">Selecione um tipo</p>
          }
        </div>

        <!-- Category -->
        <div>
          <label for="categoryId" class="block text-sm font-medium text-gray-700">Categoria</label>
          <select
            id="categoryId"
            formControlName="categoryId"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option [ngValue]="null" disabled>Selecione uma categoria</option>
            @for (group of filteredGroups(); track group.id) {
              <optgroup [label]="group.name">
                @for (cat of group.categories; track cat.id) {
                  <option [ngValue]="cat.id">{{ cat.name }}</option>
                }
              </optgroup>
            }
          </select>
          @if (form.get('categoryId')?.invalid && form.get('categoryId')?.touched) {
            <p class="mt-1 text-sm text-red-600">Selecione uma categoria</p>
          }
        </div>

        <!-- Date -->
        <div>
          <label for="date" class="block text-sm font-medium text-gray-700">Data</label>
          <input
            id="date"
            type="date"
            formControlName="date"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          @if (form.get('date')?.invalid && form.get('date')?.touched) {
            <p class="mt-1 text-sm text-red-600">Data é obrigatória</p>
          }
        </div>

        <!-- Amount -->
        <div>
          <label for="amount" class="block text-sm font-medium text-gray-700">Valor (em centavos)</label>
          <input
            id="amount"
            type="number"
            formControlName="amount"
            min="1"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Ex: 150000 para R$ 1.500,00"
          />
          <p class="mt-1 text-xs text-gray-400">
            Informe o valor em centavos (ex: 150000 = R$ 1.500,00)
          </p>
          @if (form.get('amount')?.invalid && form.get('amount')?.touched) {
            <p class="mt-1 text-sm text-red-600">Valor deve ser positivo</p>
          }
        </div>

        <!-- Note -->
        <div>
          <label for="note" class="block text-sm font-medium text-gray-700">Descrição</label>
          <textarea
            id="note"
            formControlName="note"
            rows="3"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Descreva a transação..."
          ></textarea>
          @if (form.get('note')?.invalid && form.get('note')?.touched) {
            <p class="mt-1 text-sm text-red-600">Descrição é obrigatória</p>
          }
        </div>

        <!-- Submit -->
        <div class="flex items-center gap-3">
          <button
            type="submit"
            [disabled]="form.invalid || submitting()"
            class="inline-flex items-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            @if (submitting()) {
              <svg class="-ml-1 mr-2 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Salvando...
            } @else {
              Salvar Transação
            }
          </button>
          <a
            routerLink="/transactions"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </a>
        </div>
      </form>
    }
  `,
})
export default class TransactionForm implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly transactionService = inject(TransactionService);
    private readonly categoryService = inject(CategoryService);
    private readonly periodNav = inject(PeriodNavigationService);

    protected readonly categoriesLoading = signal(true);
    protected readonly submitting = signal(false);
    protected readonly error = signal<string | null>(null);
    protected readonly groups = signal<CategoryGroup[]>([]);
    protected readonly filteredGroups = signal<CategoryGroup[]>([]);

    protected readonly typeOptions = [
        { value: 'income' as TransactionType, label: 'Receita' },
        { value: 'expense' as TransactionType, label: 'Despesa' },
        { value: 'investment' as TransactionType, label: 'Investimento' },
    ];

    protected readonly form = this.fb.group({
        type: ['', Validators.required],
        categoryId: [null as number | null, Validators.required],
        date: [DateUtils.todayISO(), Validators.required],
        amount: [null as number | null, [Validators.required, Validators.min(1)]],
        note: ['', [Validators.required, Validators.minLength(1)]],
    });

    ngOnInit(): void {
        this.loadCategories();

        // Filter categories when type changes
        this.form.get('type')?.valueChanges.subscribe(() => {
            this.filterCategoriesByType();
            this.form.get('categoryId')?.setValue(null);
        });
    }

    private loadCategories(): void {
        this.categoryService.list().pipe(
            catchError((err) => {
                this.error.set(err.message ?? 'Erro ao carregar categorias');
                this.categoriesLoading.set(false);
                return of([]);
            })
        ).subscribe((groups) => {
            this.groups.set(groups);
            this.categoriesLoading.set(false);
            this.filterCategoriesByType();
        });
    }

    private filterCategoriesByType(): void {
        const type = this.form.get('type')?.value;
        if (!type) {
            this.filteredGroups.set([]);
            return;
        }

        const groupTypeMap: Record<string, string> = {
            income: 'revenue',
            investment: 'investment',
            expense: 'expense',
        };

        const targetGroupType = groupTypeMap[type];
        if (!targetGroupType) {
            this.filteredGroups.set([]);
            return;
        }

        this.filteredGroups.set(
            this.groups()
                .filter((g) => g.type === targetGroupType)
                .map((g) => ({
                    ...g,
                    categories: g.categories.filter((c) => c.active),
                }))
        );
    }

    protected onSubmit(): void {
        if (this.form.invalid) return;

        this.submitting.set(true);
        this.error.set(null);

        const payload = {
            categoryId: this.form.value.categoryId!,
            date: this.form.value.date!,
            amount: this.form.value.amount!,
            type: this.form.value.type! as TransactionType,
            note: this.form.value.note!,
        };

        this.transactionService.create(payload).pipe(
            catchError((err) => {
                this.error.set(err.message ?? 'Erro ao criar transação');
                this.submitting.set(false);
                return of(null);
            })
        ).subscribe((result) => {
            if (result) {
                this.router.navigate(['/transactions']);
            }
        });
    }
}
