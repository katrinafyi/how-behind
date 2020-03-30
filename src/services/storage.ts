import { useLocalStorage } from 'react-use';
import { useAuthState } from 'react-firebase-hooks/auth';
import firebase from './firebase';

enum DayOfWeek {
    MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
}

export type Time = {
    hour: number, 
    minute: number,
}

export type Date = {
    day: number, 
    month: number, 
    year: number,
}

export type CourseEntry = {
    course: string, 
    day: DayOfWeek,
    time: Time,
    duration: number,
    frequency: number,
    start: Date,
}

export type Storage = {
    ical?: string,
    breaks?: Date[],
    behind?: CourseEntry[] 
}

export const useStorage = <T>() => {
    const [user, loading, error] = useAuthState(firebase.auth());
    return useLocalStorage<T>(user?.uid || 'ANONYMOUS');
};