import { DateUtils } from 'react-day-picker';

import dateFnsFormat from 'date-fns/format';
import dateFnsParse from 'date-fns/parse';

export function parseDate(str: string, format: string, locale: any) {
    const parsed = dateFnsParse(str, format, new Date(), { locale });
    if (DateUtils.isDate(parsed)) {
        return parsed;
    }
    return undefined;
}

export function formatDate(date: number | Date, format: string, locale: any) {
    return dateFnsFormat(date, format, { locale });
}