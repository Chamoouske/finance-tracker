import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { type Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { DetailedSummary, MonthlySummary } from '../interfaces';
import { BaseApiService } from './base-api.service';

/**
 * SummaryService
 * SRP: Responsabilidade única — obter resumos financeiros.
 *
 * Endpoint:
 *   GET /api/summary?period=YYYY-MM → DetailedSummary
 */
@Injectable({ providedIn: 'root' })
export class SummaryService extends BaseApiService {
    protected readonly basePath = '/api/summary';

    /**
     * Gets the detailed monthly summary for a given period.
     */
    getByPeriod(period: string): Observable<DetailedSummary> {
        const params = new HttpParams().set('period', period);
        return this.get<DetailedSummary>('', params);
    }

    /**
     * Gets only the flat MonthlySummary object from the detailed summary.
     */
    getMonthlySummary(period: string): Observable<MonthlySummary> {
        const params = new HttpParams().set('period', period);
        return this.get<DetailedSummary>('', params).pipe(
            map((detailed) => detailed.summary)
        );
    }
}
