import { useLocalStorage } from 'react-use';
import { useAuthState } from 'react-firebase-hooks/auth';
import firebase from './firebase';
import { formatISO, parseISO } from 'date-fns';
import { useDocumentData, useDocument } from 'react-firebase-hooks/firestore';
import { useState, useEffect } from 'react';

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
}

export type Storage = {
  ical?: string,
  breaks?: DateEntry[],
  behind?: CourseEntry[],
  lastUpdated?: string,
}

export const useStorage = <T>() => {
  const ANON = "ANONYMOUS";
  const [data, setData] = useState<T | undefined>(undefined);
  const [uid, setUid] = useState(ANON);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return firebase.auth().onAuthStateChanged((user) => {
      const newUser = user?.uid ?? ANON;
      console.log("Updating user to: " + newUser);
      setUid(newUser);
    });
  }, []);

  useEffect(() => {
    return firebase.firestore().collection('user').doc(uid).onSnapshot((snapshot) => {
      console.log("Received firestore snapshot.");
      setLoading(false);
      setData(snapshot.data() as T);
    })
  }, [uid]);

  const set = (x: T) => {
    console.log("Saving to firebase...");
    firebase.firestore().collection('user').doc(uid).set(x);
  };

  return [data, set, loading] as const;
};

export type StorageProps = {
  settings?: Storage,
  setSettings: (s: Storage | undefined) => void,
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