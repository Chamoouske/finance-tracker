import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { type Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { CreateTransactionPayload, MonthlySummary, Transaction, UpdateTransactionPayload } from '../interfaces';
import { BaseApiService } from './base-api.service';

/**
 * TransactionService
 * SRP: Responsabilidade única — operações de CRUD de transações.
 * LSP: Pode ser substituída por qualquer implementação que estenda BaseApiService.
 * ISP: Interface pequena e coesa, apenas métodos relacionados a transações.
 *
 * Endpoints:
 *   GET    /api/transactions?period=YYYY-MM  → { transactions: Transaction[], total, period }
 *   POST   /api/transactions                  → { transaction: Transaction, summary: MonthlySummary }
 *   PATCH  /api/transactions/:id              → { transaction: Transaction, summary: MonthlySummary }
 *   DELETE /api/transactions/:id              → { message: string, summary: MonthlySummary }
 */
@Injectable({ providedIn: 'root' })
export class TransactionService extends BaseApiService {
    protected readonly basePath = '/api/transactions';

    /**
     * Lists transactions for a given period.
     */
    list(period: string): Observable<TransactionListResponse> {
        const params = new HttpParams().set('period', period);
        return this.get<TransactionListResponse>('', params);
    }

    /**
     * Creates a new transaction.
     */
    create(payload: CreateTransactionPayload): Observable<TransactionCreateResponse> {
        return this.post<TransactionCreateResponse>(payload);
    }

    /**
     * Updates an existing transaction.
     */
    update(id: number, payload: UpdateTransactionPayload): Observable<TransactionCreateResponse> {
        return this.patch<TransactionCreateResponse>(id, payload);
    }

    /**
     * Deletes a transaction.
     */
    deleteTransaction(id: number): Observable<TransactionDeleteResponse> {
        return this.deleteRequest<TransactionDeleteResponse>(id);
    }

}

export interface TransactionListResponse {
    transactions: Transaction[];
    total: number;
    period: string;
}

export interface TransactionCreateResponse {
    transaction: Transaction;
    summary: MonthlySummary;
}

export interface TransactionDeleteResponse {
    message: string;
    summary: MonthlySummary;
}
