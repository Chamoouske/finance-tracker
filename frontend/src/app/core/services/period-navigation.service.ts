import { Injectable } from '@angular/core';
import { BehaviorSubject, type Observable } from 'rxjs';
import { DateUtils } from '../utils';

/**
 * PeriodNavigationService
 * SRP: Responsabilidade única — gerenciar o período ativo da aplicação.
 *
 * Serviço de estado compartilhado que mantém o período selecionado
 * e permite navegação entre meses. Todos os componentes que precisam
 * saber o período ativo podem se inscrever no Observable.
 */
@Injectable({ providedIn: 'root' })
export class PeriodNavigationService {
    private readonly currentPeriodSubject = new BehaviorSubject<string>(
        DateUtils.currentPeriod()
    );

    /** Observable do período ativo. */
    readonly currentPeriod$: Observable<string> =
        this.currentPeriodSubject.asObservable();

    /** Valor atual do período (getter síncrono). */
    get currentPeriod(): string {
        return this.currentPeriodSubject.value;
    }

    /** Navega para o período anterior. */
    previous(): void {
        const prev = DateUtils.previousPeriod(this.currentPeriod);
        this.currentPeriodSubject.next(prev);
    }

    /** Navega para o próximo período. */
    next(): void {
        const [yearStr, monthStr] = this.currentPeriod.split('-');
        let year = parseInt(yearStr, 10);
        let month = parseInt(monthStr, 10);
        month += 1;
        if (month > 12) {
            month = 1;
            year += 1;
        }
        const next = `${year}-${String(month).padStart(2, '0')}`;
        this.currentPeriodSubject.next(next);
    }

    /** Define um período específico. */
    goTo(period: string): void {
        this.currentPeriodSubject.next(period);
    }

    /** Retorna ao período atual (mês corrente). */
    goToCurrent(): void {
        this.currentPeriodSubject.next(DateUtils.currentPeriod());
    }
}
