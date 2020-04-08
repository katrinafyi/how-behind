import { add, parseISO, addMinutes, formatISO } from "date-fns";
import { CourseEntry, CourseEntryWithDate, toDateEntry } from "./storage";
import { useState, useEffect } from "react";

// @ts-ignore
import ICAL from 'ical.js';

type CourseEntryTimestamps = {
  startDate: firebase.firestore.Timestamp,
  endDate: firebase.firestore.Timestamp,
}

export const makeId = (c: CourseEntryWithDate) => 
  ('v2|' + c.course + '|' + c.activity + '|' + formatISO(c.startDate));

const proxyUrl = (url: string) => {
  return 'https://asia-east2-how-behind.cloudfunctions.net/timetable-proxy?url=' + encodeURIComponent(url);
};

export const compareCourseEntries = (a: CourseEntry, b: CourseEntry) => {
  let x = a.start.localeCompare(b.start);
  if (x !== 0) return x;
  x = a.time.hour - b.time.hour;
  if (x !== 0) return x;
  x = a.time.minute - b.time.minute;
  if (x !== 0) return x;
  return a.duration - b.duration; // shorter duration first.
};

export const useTimetableEvents = (ical?: string) => {
  const [data, setData] = useState<CourseEntryWithDate[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // console.log("useTimetableEvents: " + ical);
  useEffect(() => {
    if (!ical) {
      // console.log("No ical url specified. Not fetching.");
      setLoading(false);
      return;
    }
    setLoading(true);
    // console.log("Initiating ical fetch...");
    fetch(proxyUrl(ical))
      .then(resp => resp.text())
      .then(data => {

        // console.log("Received ical response.");
        const jcal = ICAL.parse(data);
        const comp = new ICAL.Component(jcal);
        const events: CourseEntryWithDate[] = comp.getAllSubcomponents('vevent')
          .map((x: any) => new ICAL.Event(x))
          .map((ev: any) => {
            const top = ev.description.split('\n')[0]
            const course: string = top.split('_')[0];
            const activity = top.split(', ').slice(1).join(', ');
            const duration = ev.duration.toSeconds() / 60;
            const start: Date = ev.startDate.toJSDate();
            const day = start.getDay();
            return {
              startDate: start, endDate: ev.endDate.toJSDate(),
              activity, course, duration, day, start: toDateEntry(start), time: { hour: start.getHours(), minute: start.getMinutes() },
              frequency: 1, 
            };
          })
          .map((c: any): CourseEntryWithDate => {
            c.id = makeId(c);
            return c;
          });

        events.sort(compareCourseEntries);
        // console.log("Caching " + events.length + " events.");
        setData(events);
        setLoading(false);
      })
      .catch(() => {
        setData(undefined);
        setLoading(false);
      });
  }, [ical]);
  return [data, loading] as const;
}