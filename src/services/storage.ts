import { useLocalStorage } from 'react-use';
import { useAuthState } from 'react-firebase-hooks/auth';
import firebase from './firebase';
import { formatISO, parseISO } from 'date-fns';

enum DayOfWeek {
    MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
}

export type Time = {
    hour: number, 
    minute: number,
}

export type DateEntry = string;

export type CourseEntry = {
    course: string, 
    day: DayOfWeek,
    time: Time,
    duration: number,
    frequency: number,
    start: DateEntry,
}

export type Storage = {
    ical?: string,
    breaks?: DateEntry[],
    behind?: CourseEntry[],
    lastUpdated?: string,
}

export const useStorage = <T>() => {
    const [user, loading, error] = useAuthState(firebase.auth());
    return useLocalStorage<T>(user?.uid ?? 'ANONYMOUS');
};

export type StorageProps = {
    settings?: Storage, 
    setSettings: (s: Storage | undefined) => void,
};

export const toDateEntry = (date: Date): DateEntry => {
    return formatISO(date, {representation: 'date'});
}

export const fromDateEntry = (date: DateEntry) => {
    return parseISO(date);
}