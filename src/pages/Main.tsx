import { StorageProps, useStorage, Storage, CourseEntry, toDateEntry, formatTime } from "../services/storage";
import React, { ReactNode, useEffect, useState } from "react";
import { format, isBefore, parseISO } from "date-fns";
import { FaHistory } from "react-icons/fa";
// @ts-ignore
import ICAL from 'ical.js';
import { isAfter, subWeeks } from "date-fns/esm";
import _ from "lodash";

const proxyUrl = (url: string) => {
  return 'https://asia-east2-how-behind.cloudfunctions.net/timetable-proxy?url=' + encodeURIComponent(url);
}

const commaAnd = (array: ReactNode[]) => {
  const out: ReactNode[] = [];
  array.forEach((x, i) => {
    if (i > 0) out.push(', ');
    if (i === array.length - 1) out.push('and ');
    out.push(x);
  });
  return out;
}

const smallHours = (n: number) => {
  const suffix = n === 1 ? '' : 's';
  const prefix = n < 10 ? <>&#8199;</> : '';
  return <span>
    <b>{n}</b> hour{suffix}
  </span>;
}

const largeHours = (n: number, useColour?: boolean) => {
  let colour;
  if (n === 0)
    colour = 'green';
  else if (n <= 2)
    colour = 'yellowgreen';
  else if (n <= 6)
    colour = 'orange';
  else if (n <= 10)
    colour = 'darkorange';
  else
    colour = 'maroon';

  const suffix = n === 1 ? '' : 's';
  return <span>
    <span style={{ color: useColour ? colour : '' }}><b>{n}</b></span> hour{suffix}
  </span>;
}


export const Main = () => {
  const [settings, setSettings] = useStorage<Storage | undefined>();
  const [loading, setLoading] = useState(true);
  const [behind, setBehind] = useState<CourseEntry[]>([]);

  const ical = settings?.ical;
  const now = new Date();
  let lastUpdated = !settings?.lastUpdated ? now : parseISO(settings.lastUpdated);
  lastUpdated = subWeeks(lastUpdated, 2);

  useEffect(() => {
    if (!ical) return;
    console.log("Initiating ical fetch...");
    fetch(proxyUrl(ical))
    .then(resp => resp.text()).then(data => {
      console.log("Received ical response.");
      const jcal = ICAL.parse(data);
      const comp = new ICAL.Component(jcal);
      const events: CourseEntry[] = comp.getAllSubcomponents('vevent')
        .map((x: any) => new ICAL.Event(x))
        .filter((ev: any) => {
          return isAfter(ev.startDate.toJSDate(), lastUpdated) && isBefore(ev.endDate.toJSDate(), now);
        })
        .map((ev: any): CourseEntry => {
          const top = ev.description.split('\n')[0]
          const course: string = top.split('_')[0];
          const activity = top.split(', ').slice(1).join(', ');
          const duration = ev.duration.toSeconds() / 60;
          const start: Date = ev.startDate.toJSDate();
          const day = start.getDay();
          return {
            activity, course, duration, day, start: toDateEntry(start), time: {hour: start.getHours(), minute: start.getMinutes()},
            frequency: 1, id: course + '|' + activity + '|' + toDateEntry(start),
          };
        });
        events.sort((a,b) => {
          const x = a.start.localeCompare(b.start);
          if (x !== 0) return x;
          return a.duration - b.duration; // shorter duration first.
        })
        setBehind(events);
        setLoading(false);
        console.log("Finished parsing calendar.");
      // debugger;
    })
    .catch(e => {
      console.warn('error: ', e);
    })
  }, [ical]);

  const NICE_FORMAT = "PPPP";
  const NICE_DATETIME_FORMAT = 'p EEEE P';
  const behindGroups = _.groupBy(behind, (x) => x.start);

  const behindCourses = Object.entries(_.groupBy(behind, x => x.course)).map(([c, entries]) => {
    return [entries.reduce((x, a) => a.duration + x, 0) / 60, c];
  }) as [number, string][];
  behindCourses.sort((a, b) => a[0] - b[0]);

  const totalBehind = behindCourses.reduce((x,a) => a[0] + x, 0);

  const removeBehind = (id: string) => {
    setBehind(behind.filter(x => x.id !== id));
  };

  return <div className="columns is-centered">
    <div className="column is-7-widescreen is-9-desktop">
      {loading ? "Loading..." : <>
      <div className="block">
        <div className="is-size-4">{format(new Date(), NICE_FORMAT)}</div>
      </div>
      <div className="block" style={{ marginBottom: '0.75rem' }}>
        {/* style={{backgroundColor: '#363636', color: 'white'}} */}
        <span className="title is-2" style={{ fontWeight: 'normal' }}>You are behind {largeHours(totalBehind, true)},</span>
      </div>
      <div className="is-size-6">
        which is made up of&nbsp;
        {commaAnd(behindCourses.map(([n, c]) => <span key={c} style={{ whiteSpace: 'nowrap' }}>{smallHours(n)} of {c}</span>))}.
      </div>

      {/* <hr></hr>
      <h2 className="title is-4" style={{fontWeight: 'normal'}}>Missed Classes</h2> */}

      <table className="table vertical-center is-hoverable is-fullwidth header-spaced">
        <tbody>
          {Object.entries(behindGroups).map(([date, behinds]) => {
            const timeSpan = (t: CourseEntry) => <span style={{whiteSpace: 'nowrap'}}>{formatTime(t.time)}</span>

            return <React.Fragment key={date}>
              <tr className="not-hoverable"><th colSpan={4}>{format(parseISO(date), NICE_FORMAT)}</th></tr>
              {behinds.map(x => <tr key={x.id}>
                <td>{timeSpan(x)} &ndash; {timeSpan(x)}</td><td>{x.course}</td><td>{x.activity}</td><td><button className="button is-link is-outlined is-small" onClick={() => removeBehind(x.id)}><span className="icon is-small"><FaHistory></FaHistory></span></button></td>
              </tr>)}
            </React.Fragment>;
          })}
        </tbody>
      </table></>}
    </div>
  </div>
};