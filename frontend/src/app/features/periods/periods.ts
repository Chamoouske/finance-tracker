import { Component, inject, signal, type OnInit, type OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, switchMap, takeUntil, catchError, of, tap } from 'rxjs';

import { PeriodService } from '../../core/services/period.service';
import { PeriodNavigationService } from '../../core/services/period-navigation.service';
import { PageHeader } from '../../shared/components/page-header';
import { ErrorAlert } from '../../shared/components/error-alert';
import { LoadingSpinner } from '../../shared/components/loading-spinner';
import { EmptyState } from '../../shared/components/empty-state';
import { ConfirmDialog } from '../../shared/components/confirm-dialog';
import { CurrencyBRLPipe } from '../../shared/pipes/currency.pipe';
import { DateUtils } from '../../core/utils';
import type { Period } from '../../core/interfaces';

@Component({
  selector: 'app-periods',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageHeader, ErrorAlert, LoadingSpinner, EmptyState, ConfirmDialog,
    CurrencyBRLPipe,
  ],
  template: `
    <app-page-header title="Períodos" description="Gerencie o fechamento de meses" />

    <app-error-alert [message]="error()!" (dismiss)="error.set(null)" />

    <!-- Close Period Form -->
    <div class="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 class="mb-4 text-lg font-semibold text-gray-900">Fechar Período</h2>
      <form [formGroup]="closeForm" (ngSubmit)="onClosePeriod()" class="flex items-end gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Ano</label>
          <input
            type="number"
            formControlName="year"
            [value]="currentYear"
            class="mt-1 block w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Mês</label>
          <select
            formControlName="month"
            class="mt-1 block w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            @for (m of months; track m.value) {
              <option [ngValue]="m.value">{{ m.label }}</option>
            }
          </select>
        </div>
        <button
          type="submit"
          [disabled]="closeForm.invalid || closing()"
          class="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          @if (closing()) { Fechando... } @else { Fechar Período }
        </button>
      </form>
    </div>

    <!-- Periods List -->
    @if (loading()) {
      <app-loading-spinner message="Carregando períodos..." />
    } @else if (periods().length === 0) {
      <app-empty-state
        title="Nenhum período encontrado"
        message="Os períodos são criados automaticamente ao registrar transações."
      />
    } @else {
      <div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Período</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Transações</th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Saldo</th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (p of periods(); track p.id) {
              <tr class="hover:bg-gray-50">
                <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                  {{ DateUtils.getMonthName(p.month) }}/{{ p.year }}
                </td>
                <td class="whitespace-nowrap px-4 py-3">
                  @if (p.closedAt) {
                    <span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      Fechado
                    </span>
                  } @else {
                    <span class="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                      Aberto
                    </span>
                  }
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                  {{ p.transactionCount ?? '—' }}
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-right text-sm font-medium"
                  [class.text-emerald-600]="(p.balance ?? 0) >= 0"
                  [class.text-red-600]="(p.balance ?? 0) < 0"
                >
                  {{ (p.balance ?? 0) | currencyBRL }}
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-right">
                  <button
                    class="text-sm text-indigo-600 hover:text-indigo-500"
                    (click)="navigateToPeriod(p)"
                  >
                    Visualizar
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <!-- Close Success Dialog -->
    <app-confirm-dialog
      [isOpen]="closeSuccessDialogOpen()"
      title="Período Fechado"
      [message]="closeSuccessMessage()"
      confirmText="OK"
      cancelText=""
      (confirmed)="closeSuccessDialogOpen.set(false)"
      (cancelled)="closeSuccessDialogOpen.set(false)"
    />
  `,
})
export default class Periods implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly periodService = inject(PeriodService);
  private readonly periodNav = inject(PeriodNavigationService);

  protected readonly DateUtils = DateUtils;

  protected readonly loading = signal(true);
  protected readonly closing = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly periods = signal<Period[]>([]);
  protected readonly closeSuccessDialogOpen = signal(false);
  protected readonly closeSuccessMessage = signal('');

  protected readonly months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  protected get currentYear(): number {
    return new Date().getFullYear();
  }

  protected readonly closeForm = this.fb.group({
    year: [this.currentYear, [Validators.required, Validators.min(2020), Validators.max(2100)]],
    month: [new Date().getMonth(), Validators.required],
  });

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadPeriods();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPeriods(): void {
    this.periodService.list().pipe(
      catchError((err) => {
        this.error.set(err.message ?? 'Erro ao carregar períodos');
        this.loading.set(false);
        return of([]);
      })
    ).subscribe((periods) => {
      // API returns newest first, keep as is
      this.periods.set(periods);
      this.loading.set(false);
    });
  }

  protected onClosePeriod(): void {
    if (this.closeForm.invalid) return;

    this.closing.set(true);
    this.error.set(null);

    this.periodService.close({
      year: this.closeForm.value.year!,
      month: this.closeForm.value.month!,
    }).pipe(
      catchError((err) => {
        this.error.set(err.message ?? 'Erro ao fechar período');
        this.closing.set(false);
        return of(null);
      })
    ).subscribe((result) => {
      this.closing.set(false);
      if (result) {
        this.closeSuccessMessage.set(`Período ${result.period.year}-${String(result.period.month).padStart(2, '0')} fechado com sucesso!`);
        this.closeSuccessDialogOpen.set(true);
        this.loadPeriods();
      }
    });
  }

  protected navigateToPeriod(p: Period): void {
    const periodStr = `${p.year}-${String(p.month).padStart(2, '0')}`;
    this.periodNav.goTo(periodStr);
  }
}
