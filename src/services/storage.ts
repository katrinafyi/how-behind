import firebase from './firebase';
import { formatISO, parseISO } from 'date-fns';
import { useState, useEffect, SetStateAction, Dispatch } from 'react';

enum DayOfWeek {
  MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
}

export type Time = {
  hour: number,
  minute: number,
}

export type DateEntry = string;

export type CourseEntry = {
  id: string,
  course: string,
  activity: string,
  day: DayOfWeek,
  time: Time,
  duration: number,
  frequency: number,
  start: DateEntry,
};

export type CourseEntryWithDate = CourseEntry & {
  startDate: Date, 
  endDate: Date
};

export type Storage = {
  ical?: string,
  breaks?: DateEntry[],
  behind?: CourseEntryWithDate[],
  lastUpdated?: string,
};

export type StorageProps<T> = {
  data: T | undefined,
  setData: Dispatch<SetStateAction<T | undefined>>,
  loading: boolean,
};

export type StorageReturn<T> = [
  StorageProps<T>['data'],
  StorageProps<T>['setData'],
  StorageProps<T>['loading'],
];

export const useStorage = <T>(): StorageReturn<T> => {
  const ANON = "ANONYMOUS";
  const [data, setData] = useState<T | undefined>(undefined);
  const [uid, setUid] = useState(ANON);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return firebase.auth().onAuthStateChanged((user) => {
      const newUser = user?.uid ?? ANON;
      // console.log("Updating user to: " + newUser);
      setUid(newUser);
      if (newUser === ANON)
        setData(undefined);
      setLoading(true);
    });
  }, []);

  useEffect(() => {
    return firebase.firestore().collection('user').doc(uid).onSnapshot((snapshot) => {
      // console.log("Received firestore snapshot.");
      setData(snapshot.data() as T);
      setLoading(false);
    })
  }, [uid]);

  const set = (x: SetStateAction<T | undefined>) => {
    // debugger;
    // console.log("Saving to firebase...");
    const doc = firebase.firestore().collection('user').doc(uid);
    // @ts-ignore
    const newData = typeof x == 'function' ? x(data) : x;
    // console.log(newData);
    if (newData != null)
      doc.set(newData);
    else
      doc.delete();
  };

  return [data, set, loading];
};

export const toDateEntry = (date: Date): DateEntry => {
  return formatISO(date, { representation: 'date' });
}

export const fromDateEntry = (date: DateEntry) => {
  return parseISO(date);
}

export const formatTime = (t: Time) => {
  let h = t.hour % 12;
  if (h === 0) h = 12;
  let suffix = t.hour < 12 ? 'AM' : 'PM';
  return h.toString() + ':' + t.minute.toString().padStart(2, '0') + ' ' + suffix;
}
