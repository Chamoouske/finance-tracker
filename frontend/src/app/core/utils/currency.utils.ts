/**
 * Utility class for currency formatting and conversion.
 * Follows SRP — responsabilidade única: manipulação de moeda.
 */
export class CurrencyUtils {
    /**
     * Converts cents (int64) to a float value for display.
     * Ex: 150000 → 1500.00
     */
    static centsToFloat(cents: number): number {
        return cents / 100;
    }

    /**
     * Converts a float value to cents (int64) for API.
     * Ex: 1500.00 → 150000
     */
    static floatToCents(value: number): number {
        return Math.round(value * 100);
    }

    /**
     * Formats cents to Brazilian Real currency string.
     * Ex: 150000 → "R$ 1.500,00"
     */
    static formatBRL(cents: number): string {
        const floatValue = this.centsToFloat(cents);
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(floatValue);
    }

    /**
     * Formats cents to a compact string without currency symbol for table display.
     * Ex: 150000 → "1.500,00"
     */
    static formatNumber(cents: number): string {
        const floatValue = this.centsToFloat(cents);
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(floatValue);
    }

    /**
     * Parses a Brazilian currency string to cents.
     * Ex: "1.500,00" → 150000
     *     "1500,00" → 150000
     */
    static parseBRL(value: string): number {
        const cleaned = value
            .replace(/[R$\s]/g, '')
            .replace(/\./g, '')
            .replace(',', '.');
        const floatValue = parseFloat(cleaned);
        if (isNaN(floatValue)) return 0;
        return this.floatToCents(floatValue);
    }
}
