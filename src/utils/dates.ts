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

export function formatDate(date: number | Date, format: string, locale: any = enAU) {
    return dateFnsFormat(date, format, { locale });
}

export const SHORT_TIME_OPTIONS = {hour: '2-digit', minute: '2-digit'} as const;
export const LONG_DATE_OPTIONS = {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'} as const;
export const LONG_DATETIME_OPTIONS = {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'} as const;
export const SHORT_DATE_FORMAT = "P";
export const WEEK_START = 1;