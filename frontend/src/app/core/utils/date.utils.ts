/**
 * Utility class for date formatting and manipulation.
 * Follows SRP — responsabilidade única: manipulação de datas.
 */
export class DateUtils {
    /**
     * Formats a date string (ISO YYYY-MM-DD) to Brazilian format.
     * Ex: "2026-05-10" → "10/05/2026"
     */
    static toDisplayDate(dateStr: string): string {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    /**
     * Gets today's date in ISO YYYY-MM-DD format.
     */
    static todayISO(): string {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    /**
     * Gets current year-month as period string.
     * Ex: "2026-05"
     */
    static currentPeriod(): string {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    /**
     * Gets previous year-month based on a period string.
     * Ex: "2026-05" → "2026-04"
     */
    static previousPeriod(period: string): string {
        const [yearStr, monthStr] = period.split('-');
        let year = parseInt(yearStr, 10);
        let month = parseInt(monthStr, 10);
        month -= 1;
        if (month === 0) {
            month = 12;
            year -= 1;
        }
        return `${year}-${String(month).padStart(2, '0')}`;
    }

    /**
     * Formats period string to month name in Portuguese.
     * Ex: "2026-05" → "Maio/2026"
     */
    static periodToMonthName(period: string): string {
        const [yearStr, monthStr] = period.split('-');
        const month = parseInt(monthStr, 10);
        const months = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
        ];
        return `${months[month - 1]}/${yearStr}`;
    }

    /**
     * Gets month name from month number (1-based).
     */
    static getMonthName(month: number): string {
        const months = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
        ];
        return months[month - 1] || '';
    }
}
