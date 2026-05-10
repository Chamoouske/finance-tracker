import { Component, computed, inject, signal, type OnInit, type OnDestroy } from '@angular/core';
import { Subject, switchMap, takeUntil, catchError, of, tap } from 'rxjs';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';

import { PeriodNavigationService } from '../../core/services/period-navigation.service';
import { TransactionService, type TransactionListResponse } from '../../core/services/transaction.service';
import { CurrencyBRLPipe } from '../../shared/pipes/currency.pipe';
import { LoadingSpinner } from '../../shared/components/loading-spinner';
import { ErrorAlert } from '../../shared/components/error-alert';
import { EmptyState } from '../../shared/components/empty-state';
import { ConfirmDialog } from '../../shared/components/confirm-dialog';
import { PageHeader } from '../../shared/components/page-header';
import { DateUtils } from '../../core/utils';
import type { Transaction } from '../../core/interfaces';

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [
    RouterLink, AsyncPipe, CurrencyBRLPipe,
    LoadingSpinner, ErrorAlert, EmptyState, ConfirmDialog, PageHeader,
  ],
  template: `
    <app-page-header title="Transações" description="Gerencie os lançamentos financeiros do período" />

    <app-error-alert [message]="error()!" (dismiss)="error.set(null)" />

    <div class="mb-4 flex items-center justify-between">
      <p class="text-sm text-gray-500">
        @if (data(); as d) {
          {{ d.total }} transação(ões) — {{ period$ | async }}
        }
      </p>
      <a
        routerLink="/transactions/new"
        class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Nova Transação
      </a>
    </div>

    @if (loading()) {
      <app-loading-spinner message="Carregando transações..." />
    } @else if (data()?.transactions; as transactions) {
      @if (transactions.length === 0) {
        <app-empty-state
          title="Nenhuma transação encontrada"
          message="Crie sua primeira transação para começar."
        >
          <a
            routerLink="/transactions/new"
            class="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Criar Transação
          </a>
        </app-empty-state>
      } @else {
        <div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Data</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tipo</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Categoria</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Descrição</th>
                <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Valor</th>
                <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (t of transactions; track t.id) {
                <tr class="hover:bg-gray-50">
                  <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {{ DateUtils.toDisplayDate(t.date) }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3">
                    <span
                      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      [class.bg-emerald-100]="t.type === 'income'"
                      [class.text-emerald-800]="t.type === 'income'"
                      [class.bg-blue-100]="t.type === 'investment'"
                      [class.text-blue-800]="t.type === 'investment'"
                      [class.bg-red-100]="t.type === 'expense'"
                      [class.text-red-800]="t.type === 'expense'"
                    >
                      {{ typeLabel(t.type) }}
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {{ t.categoryName || '—' }}
                  </td>
                  <td class="max-w-xs truncate px-4 py-3 text-sm text-gray-900">
                    {{ t.note }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-right text-sm font-medium"
                    [class.text-emerald-600]="t.type === 'income'"
                    [class.text-blue-600]="t.type === 'investment'"
                    [class.text-red-600]="t.type === 'expense'"
                  >
                    {{ t.type === 'income' || t.type === 'investment' ? '+' : '-' }}{{ t.amount | currencyBRL }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        class="rounded p-1 text-gray-400 hover:text-indigo-600"
                        (click)="editTransaction(t)"
                        title="Editar"
                      >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button
                        class="rounded p-1 text-gray-400 hover:text-red-600"
                        (click)="confirmDelete(t)"
                        title="Excluir"
                      >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    }

    <!-- Delete Confirmation Dialog -->
    <app-confirm-dialog
      [isOpen]="deleteDialogOpen()"
      title="Excluir Transação"
      [message]="deleteMessage()"
      confirmText="Excluir"
      cancelText="Cancelar"
      (confirmed)="onDeleteConfirmed()"
      (cancelled)="onDeleteCancelled()"
    />
  `,
})
export default class TransactionsList implements OnInit, OnDestroy {
  private readonly periodNav = inject(PeriodNavigationService);
  private readonly transactionService = inject(TransactionService);

  protected readonly DateUtils = DateUtils;
  protected readonly period$ = this.periodNav.currentPeriod$;

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly data = signal<TransactionListResponse | null>(null);
  protected readonly deleteDialogOpen = signal(false);
  protected readonly deletingTransaction = signal<Transaction | null>(null);
  protected readonly deleteMessage = computed(() =>
    `Tem certeza que deseja excluir a transação "${this.deletingTransaction()?.note ?? ''}"?`
  );

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.periodNav.currentPeriod$
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap((period) =>
          this.transactionService.list(period).pipe(
            catchError((err) => {
              this.error.set(err.message ?? 'Erro ao carregar transações');
              this.loading.set(false);
              return of(null);
            })
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((result) => {
        if (result) {
          this.data.set(result);
        }
        this.loading.set(false);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected typeLabel(type: string): string {
    const labels: Record<string, string> = {
      income: 'Receita',
      investment: 'Investimento',
      expense: 'Despesa',
    };
    return labels[type] ?? type;
  }

  protected editTransaction(t: Transaction): void {
    // Navigate to edit page (could be implemented as a modal or route)
    // For now, we'll use the router
    // this.router.navigate(['/transactions', t.id, 'edit']);
  }

  protected confirmDelete(t: Transaction): void {
    this.deletingTransaction.set(t);
    this.deleteDialogOpen.set(true);
  }

  protected onDeleteConfirmed(): void {
    const t = this.deletingTransaction();
    if (!t) return;

    this.transactionService.deleteTransaction(t.id).pipe(
      catchError((err) => {
        this.error.set(err.message ?? 'Erro ao excluir transação');
        return of(null);
      })
    ).subscribe(() => {
      this.deleteDialogOpen.set(false);
      this.deletingTransaction.set(null);
      // Refresh the list
      this.loading.set(true);
      this.periodNav.goTo(this.periodNav.currentPeriod);
    });
  }

  protected onDeleteCancelled(): void {
    this.deleteDialogOpen.set(false);
    this.deletingTransaction.set(null);
  }
}
