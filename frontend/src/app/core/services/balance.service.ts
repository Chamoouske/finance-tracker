import { Injectable } from '@angular/core';
import { type Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { BalanceSnapshot } from '../interfaces';
import { BaseApiService } from './base-api.service';

/**
 * BalanceService
 * SRP: Responsabilidade única — obter o snapshot global do balanço.
 *
 * Endpoint:
 *   GET /api/balance → { balance: BalanceSnapshot }
 */
@Injectable({ providedIn: 'root' })
export class BalanceService extends BaseApiService {
    protected readonly basePath = '/api/balance';

    /**
     * Gets the current balance snapshot (sum of all months).
     */
    getBalance(): Observable<BalanceSnapshot> {
        return this.get<{ balance: BalanceSnapshot }>('').pipe(
            map((response) => response.balance)
        );
    }
}
