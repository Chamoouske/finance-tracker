import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { ApiResponse } from '../interfaces';

/**
 * Interface for runtime environment variables set via index.html + docker-entrypoint.sh.
 * In production (Docker), `apiUrl` is populated from the `API_URL` env variable.
 * In development (ng serve), `apiUrl` defaults to the placeholder `__API_URL__`
 * which is treated as "not set", falling back to relative URLs (proxied by proxy.conf.json).
 */
declare global {
    interface Window {
        __env__?: {
            apiUrl?: string;
        };
    }
}

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
     * Returns the API base URL from the runtime environment configuration.
     *
     * In production (Docker), `window.__env__.apiUrl` is set to the value of
     * the `API_URL` environment variable by the docker-entrypoint.sh script.
     * In development (ng serve), the placeholder `__API_URL__` is not replaced,
     * so this method returns an empty string, keeping relative URLs for the proxy.
     */
    private getApiBaseUrl(): string {
        const apiUrl = window.__env__?.apiUrl;
        if (apiUrl && apiUrl !== '__API_URL__') {
            return apiUrl.replace(/\/+$/, '');
        }
        return '';
    }

    /**
     * Builds the full URL by combining the API base URL (from runtime config),
     * the service's base path, and an optional path suffix.
     */
    private buildUrl(path?: string): string {
        const base = `${this.getApiBaseUrl()}${this.basePath}`;
        return path ? `${base}/${path}` : base;
    }

    /**
     * Performs a GET request and extracts data from the API response envelope.
     */
    protected get<T>(path?: string, params?: HttpParams): Observable<T> {
        const url = this.buildUrl(path);
        return this.http
            .get<ApiResponse<T>>(url, { params })
            .pipe(map((response) => this.extractData(response)));
    }

    /**
     * Performs a POST request and extracts data from the API response envelope.
     */
    protected post<T>(body: unknown, path?: string): Observable<T> {
        const url = this.buildUrl(path);
        return this.http
            .post<ApiResponse<T>>(url, body)
            .pipe(map((response) => this.extractData(response)));
    }

    /**
     * Performs a PATCH request and extracts data from the API response envelope.
     */
    protected patch<T>(id: number, body: unknown): Observable<T> {
        return this.http
            .patch<ApiResponse<T>>(`${this.getApiBaseUrl()}${this.basePath}/${id}`, body)
            .pipe(map((response) => this.extractData(response)));
    }

    /**
     * Performs a DELETE request and extracts data from the API response envelope.
     */
    protected deleteRequest<T>(id: number): Observable<T> {
        return this.http
            .delete<ApiResponse<T>>(`${this.getApiBaseUrl()}${this.basePath}/${id}`)
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
