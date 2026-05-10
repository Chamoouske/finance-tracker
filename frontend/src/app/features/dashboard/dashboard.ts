import { Component, inject, signal, type OnInit, type OnDestroy } from '@angular/core';
import { Subject, switchMap, takeUntil, tap, catchError, of } from 'rxjs';

import { PeriodNavigationService } from '../../core/services/period-navigation.service';
import { SummaryService } from '../../core/services/summary.service';
import { TransactionService } from '../../core/services/transaction.service';
import { CurrencyBRLPipe } from '../../shared/pipes/currency.pipe';
import { LoadingSpinner } from '../../shared/components/loading-spinner';
import { ErrorAlert } from '../../shared/components/error-alert';
import { CurrencyUtils, DateUtils } from '../../core/utils';
import type { DetailedSummary, Transaction } from '../../core/interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyBRLPipe, LoadingSpinner, ErrorAlert],
  template: `
    <div class="space-y-6">
      <!-- Summary Cards -->
      @if (loading()) {
        <app-loading-spinner message="Carregando resumo..." />
      } @else if (error()) {
        <app-error-alert [message]="error()!" (dismiss)="error.set(null)" />
      } @else if (summary(); as s) {
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Revenue Card -->
          <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-gray-500">Receitas</p>
            <p class="mt-2 text-2xl font-bold text-emerald-600">
              {{ s.summary.revenueTotal | currencyBRL }}
            </p>
            <p class="mt-1 text-xs text-gray-400">{{ s.revenue.count }} lançamento(s)</p>
          </div>

          <!-- Expenses Card -->
          <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-gray-500">Despesas</p>
            <p class="mt-2 text-2xl font-bold text-red-600">
              {{ s.expenses.total | currencyBRL }}
            </p>
            <p class="mt-1 text-xs text-gray-400">{{ s.expenses.fixed.count + s.expenses.variable.count + s.expenses.extra.count + s.expenses.additional.count }} lançamento(s)</p>
          </div>

          <!-- Investments Card -->
          <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-gray-500">Investimentos</p>
            <p class="mt-2 text-2xl font-bold text-blue-600">
              {{ s.investments.total | currencyBRL }}
            </p>
            <p class="mt-1 text-xs text-gray-400">{{ s.investments.count }} lançamento(s)</p>
          </div>

          <!-- Balance Card -->
          <div class="rounded-lg border p-5 shadow-sm" [class.border-emerald-200]="s.balance >= 0" [class.bg-emerald-50]="s.balance >= 0" [class.border-red-200]="s.balance < 0" [class.bg-red-50]="s.balance < 0">
            <p class="text-sm font-medium text-gray-500">Saldo</p>
            <p class="mt-2 text-2xl font-bold" [class.text-emerald-700]="s.balance >= 0" [class.text-red-700]="s.balance < 0">
              {{ s.summary.balance | currencyBRL }}
            </p>
            @if (s.closed) {
              <span class="mt-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                Fechado
              </span>
            }
          </div>
        </div>

        <!-- Expense Breakdown -->
        <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">Detalhamento de Despesas</h2>
          <div class="space-y-3">
            @for (item of expenseBreakdown(s); track item.label) {
              <div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-700">{{ item.label }}</span>
                  <span class="font-medium text-gray-900">{{ item.total | currencyBRL }}</span>
                </div>
                <div class="mt-1 h-2 w-full rounded-full bg-gray-100">
                  <div
                    class="h-2 rounded-full transition-all"
                    [style.width.%]="s.expenses.total > 0 ? (item.total / s.expenses.total * 100) : 0"
                    [class.bg-red-400]="item.type === 'fixed'"
                    [class.bg-orange-400]="item.type === 'variable'"
                    [class.bg-yellow-400]="item.type === 'extra'"
                    [class.bg-purple-400]="item.type === 'additional'"
                  ></div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Recent Transactions -->
      <div class="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 class="text-lg font-semibold text-gray-900">Transações Recentes</h2>
          <a routerLink="/transactions" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Ver todas
          </a>
        </div>

        @if (transactionsLoading()) {
          <app-loading-spinner size="sm" />
        } @else if (recentTransactions().length === 0) {
          <div class="px-5 py-8 text-center text-sm text-gray-500">
            Nenhuma transação neste período.
            <a routerLink="/transactions/new" class="ml-1 text-indigo-600 hover:underline">Criar primeira</a>
          </div>
        } @else {
          <div class="divide-y divide-gray-100">
            @for (t of recentTransactions(); track t.id) {
              <div class="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                <div class="flex items-center gap-3">
                  <span
                    class="inline-block h-2.5 w-2.5 rounded-full"
                    [class.bg-emerald-500]="t.type === 'income'"
                    [class.bg-blue-500]="t.type === 'investment'"
                    [class.bg-red-500]="t.type === 'expense'"
                  ></span>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ t.note }}</p>
                    <p class="text-xs text-gray-500">{{ t.categoryName || 'Sem categoria' }} — {{ DateUtils.toDisplayDate(t.date) }}</p>
                  </div>
                </div>
                <span
                  class="text-sm font-medium"
                  [class.text-emerald-600]="t.type === 'income'"
                  [class.text-blue-600]="t.type === 'investment'"
                  [class.text-red-600]="t.type === 'expense'"
                >
                  {{ t.type === 'income' || t.type === 'investment' ? '' : '-' }}{{ t.amount | currencyBRL }}
                </span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export default class Dashboard implements OnInit, OnDestroy {
  private readonly periodNav = inject(PeriodNavigationService);
  private readonly summaryService = inject(SummaryService);
  private readonly transactionService = inject(TransactionService);

  protected readonly DateUtils = DateUtils;
  protected readonly CurrencyUtils = CurrencyUtils;

  protected readonly loading = signal(false);
  protected readonly transactionsLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly summary = signal<DetailedSummary | null>(null);
  protected readonly recentTransactions = signal<Transaction[]>([]);

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.periodNav.currentPeriod$
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.transactionsLoading.set(true);
          this.error.set(null);
        }),
        switchMap((period) =>
          this.summaryService.getByPeriod(period).pipe(
            catchError((err) => {
              this.error.set(err.message ?? 'Erro ao carregar resumo');
              this.loading.set(false);
              return of(null);
            })
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((s) => {
        if (s) {
          this.summary.set(s);
        }
        this.loading.set(false);
      });

    // Load recent transactions
    this.periodNav.currentPeriod$
      .pipe(
        switchMap((period) =>
          this.transactionService.list(period).pipe(
            catchError(() => {
              this.transactionsLoading.set(false);
              return of(null);
            })
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((result) => {
        if (result) {
          this.recentTransactions.set(result.transactions.slice(0, 5));
        }
        this.transactionsLoading.set(false);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected expenseBreakdown(summary: DetailedSummary) {
    return [
      { label: 'Fixas', total: summary.expenses.fixed.total, type: 'fixed' as const },
      { label: 'Variáveis', total: summary.expenses.variable.total, type: 'variable' as const },
      { label: 'Extras', total: summary.expenses.extra.total, type: 'extra' as const },
      { label: 'Adicionais', total: summary.expenses.additional.total, type: 'additional' as const },
    ];
  }
}
