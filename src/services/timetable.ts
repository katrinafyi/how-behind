import { addMinutes, startOfHour, format } from "date-fns";
import { CourseEntry, CourseEntryWithDate, toDateEntry } from "./storage";
import { useState, useEffect } from "react";

// @ts-ignore
import ICAL from 'ical.js';

export const ID_PREFIX = 'v3|';
export const makeId = (c: CourseEntryWithDate) => 
  (ID_PREFIX + c.course + '|' + c.activity + '|' + format(c.startDate, 'yyyy-MM-dd|HH:mm:ss'));

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

const makeTestEvents = (d: Date): CourseEntryWithDate[] => {
  const events = [];
  const interval = 1;
  const numEvents = Math.ceil(24 * 60 / interval);
  
  let start = startOfHour(d);

  for (let i = 1; i < numEvents; i++) {
    const end = addMinutes(start, interval);

    const event = {
      startDate: start,
      endDate: end,
      activity: 'Test Activity ' + i,
      course: 'TEST2000',
      duration: interval,
      day: 0,
      start: toDateEntry(start),
      frequency: 1,
      time: { hour: start.getHours(), minute: start.getMinutes() }
    };
    // @ts-ignore
    event.id = makeId(event);

    const event2 = {
      startDate: start,
      endDate: end,
      activity: 'Test Activity B' + i,
      course: 'TEST2001',
      duration: interval,
      day: 0,
      start: toDateEntry(start),
      frequency: 1,
      time: { hour: start.getHours(), minute: start.getMinutes() }
    };
    // @ts-ignore
    event2.id = makeId(event2);

    events.push(event as CourseEntryWithDate);
    events.push(event2 as CourseEntryWithDate);
    
    start = end;
  };

  events.sort(compareCourseEntries);

  return events;
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
    if (ical === '__TEST__') {
      setLoading(false);
      setData(makeTestEvents(new Date()));
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