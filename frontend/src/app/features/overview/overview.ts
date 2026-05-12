import { Component, inject, signal, type OnInit } from '@angular/core';
import { catchError, of, tap } from 'rxjs';

import { BalanceService } from '../../core/services/balance.service';
import { CurrencyBRLPipe } from '../../shared/pipes/currency.pipe';
import { LoadingSpinner } from '../../shared/components/loading-spinner';
import { ErrorAlert } from '../../shared/components/error-alert';
import { PageHeader } from '../../shared/components/page-header';
import type { BalanceSnapshot } from '../../core/interfaces';

@Component({
    selector: 'app-overview',
    standalone: true,
    imports: [PageHeader, LoadingSpinner, ErrorAlert, CurrencyBRLPipe],
    template: `
    <app-page-header title="Visão Geral" description="Estado atual do balanço consolidado" />

    <app-error-alert [message]="error()!" (dismiss)="error.set(null)" />

    @if (loading()) {
      <app-loading-spinner message="Carregando balanço geral..." />
    } @else if (snapshot(); as s) {
      <!-- Main Balance Card -->
      <div class="mb-6 rounded-lg border p-6 shadow-sm"
        [class.border-emerald-200]="s.total_balance >= 0"
        [class.bg-emerald-50]="s.total_balance >= 0"
        [class.border-red-200]="s.total_balance < 0"
        [class.bg-red-50]="s.total_balance < 0"
      >
        <p class="text-sm font-medium text-gray-500">Saldo Total Consolidado</p>
        <p class="mt-2 text-4xl font-bold"
          [class.text-emerald-700]="s.total_balance >= 0"
          [class.text-red-700]="s.total_balance < 0"
        >
          {{ s.total_balance | currencyBRL }}
        </p>
        <p class="mt-2 text-xs text-gray-400">
          Última atualização: {{ formatDate(s.calculated_at) }}
        </p>
      </div>

      <!-- Secondary Cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Income Card -->
        <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-medium text-gray-500">Total Receitas</p>
          <p class="mt-2 text-2xl font-bold text-emerald-600">
            {{ s.total_income | currencyBRL }}
          </p>
        </div>

        <!-- Expense Card -->
        <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-medium text-gray-500">Total Despesas</p>
          <p class="mt-2 text-2xl font-bold text-red-600">
            {{ s.total_expense | currencyBRL }}
          </p>
        </div>

        <!-- Credit Card -->
        <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-medium text-gray-500">Total Crédito</p>
          <p class="mt-2 text-2xl font-bold text-blue-600">
            {{ s.total_credit | currencyBRL }}
          </p>
        </div>

        <!-- Debit Card -->
        <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-medium text-gray-500">Total Débito</p>
          <p class="mt-2 text-2xl font-bold text-purple-600">
            {{ s.total_debit | currencyBRL }}
          </p>
        </div>
      </div>

      <!-- Info Footer -->
      <div class="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span>📊 Baseado em <strong class="text-gray-700">{{ s.month_count }}</strong> {{ s.month_count === 1 ? 'mês' : 'meses' }}</span>
          <span>🕐 Calculado em {{ formatDate(s.calculated_at) }}</span>
        </div>
      </div>
    }
  `,
})
export default class OverviewScreen implements OnInit {
    private readonly balanceService = inject(BalanceService);

    protected readonly loading = signal(true);
    protected readonly error = signal<string | null>(null);
    protected readonly snapshot = signal<BalanceSnapshot | null>(null);

    ngOnInit(): void {
        this.loadBalance();
    }

    private loadBalance(): void {
        this.loading.set(true);
        this.error.set(null);

        this.balanceService.getBalance().pipe(
            tap((snapshot) => this.snapshot.set(snapshot)),
            catchError((err) => {
                this.error.set(err.message ?? 'Erro ao carregar balanço geral');
                return of(null);
            }),
            tap(() => this.loading.set(false)),
        ).subscribe();
    }

    protected formatDate(isoString: string): string {
        if (!isoString) return '—';
        try {
            const date = new Date(isoString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}`;
        } catch {
            return isoString;
        }
    }
}
