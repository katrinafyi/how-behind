import dateFnsFormat from 'date-fns/format';
import dateFnsParse from 'date-fns/parse';
import enAU from 'date-fns/locale/en-AU';

export function parseDate(str: string, format: string, locale: any) {
    const parsed = dateFnsParse(str, format, new Date(), { locale });
    if (parsed != null) {
        return parsed;
    }
    return undefined;
}

export function formatDate(date: number | Date, format: string, locale?: any) {
    return dateFnsFormat(date, format, { locale });
}

export const SHORT_DATE_FORMAT = "dd/MM/yyyy";
export const WEEK_START = 1;