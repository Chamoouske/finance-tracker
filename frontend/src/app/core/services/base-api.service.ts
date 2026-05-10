import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { ApiResponse } from '../interfaces';

/**
 * BaseApiService
 * SRP: Responsabilidade única — lidar com o envelope de resposta da API.
 * DIP: Depende de abstrações (HttpClient), não de implementações concretas.
 * OCP: Aberto para extensão via herança, fechado para modificação.
 *
 * Todas as respostas da API seguem o formato:
 * { success: true, data: { ... } }
 * { success: false, error: { code, message } }
 */
export abstract class BaseApiService {
    protected readonly http = inject(HttpClient);
    protected abstract readonly basePath: string;

    /**
     * Performs a GET request and extracts data from the API response envelope.
     */
    protected get<T>(path?: string, params?: HttpParams): Observable<T> {
        const url = path ? `${this.basePath}/${path}` : this.basePath;
        return this.http
            .get<ApiResponse<T>>(url, { params })
            .pipe(map((response) => this.extractData(response)));
    }

    /**
     * Performs a POST request and extracts data from the API response envelope.
     */
    protected post<T>(body: unknown, path?: string): Observable<T> {
        const url = path ? `${this.basePath}/${path}` : this.basePath;
        return this.http
            .post<ApiResponse<T>>(url, body)
            .pipe(map((response) => this.extractData(response)));
    }

    /**
     * Performs a PATCH request and extracts data from the API response envelope.
     */
    protected patch<T>(id: number, body: unknown): Observable<T> {
        return this.http
            .patch<ApiResponse<T>>(`${this.basePath}/${id}`, body)
            .pipe(map((response) => this.extractData(response)));
    }

    /**
     * Performs a DELETE request and extracts data from the API response envelope.
     */
    protected deleteRequest<T>(id: number): Observable<T> {
        return this.http
            .delete<ApiResponse<T>>(`${this.basePath}/${id}`)
            .pipe(map((response) => this.extractData(response)));
    }

    /**
     * Extracts data from the API response envelope.
     * Throws an error if the response indicates failure.
     */
    private extractData<T>(response: ApiResponse<T>): T {
        if (!response.success) {
            throw new Error(
                response.error?.message ?? 'Erro desconhecido na resposta da API'
            );
        }
        return response.data as T;
    }
}
