import { Injectable } from '@angular/core';
import { type Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ClosePeriodPayload, Period } from '../interfaces';
import { BaseApiService } from './base-api.service';

/**
 * PeriodService
 * SRP: Responsabilidade única — operações de períodos.
 *
 * Endpoints:
 *   GET  /api/periods        → { periods: Period[] }
 *   POST /api/periods/close  → { message: string, period: Period }
 */
@Injectable({ providedIn: 'root' })
export class PeriodService extends BaseApiService {
    protected readonly basePath = '/api/periods';

    /**
     * Lists all periods that have transactions.
     */
    list(): Observable<Period[]> {
        return this.get<{ periods: Period[] }>().pipe(
            map((response) => response.periods)
        );
    }

    /**
     * Closes a period, preventing further modifications.
     */
    close(payload: ClosePeriodPayload): Observable<PeriodCloseResponse> {
        return this.post<PeriodCloseResponse>(payload, 'close');
    }
}

export interface PeriodCloseResponse {
    message: string;
    period: Period;
}
