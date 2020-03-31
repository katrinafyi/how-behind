import { StorageProps, useStorage, Storage, CourseEntry, toDateEntry, formatTime, Time } from "../services/storage";
import React, { ReactNode, useEffect, useState } from "react";
import { format, isBefore, parseISO, formatRelative, formatISO } from "date-fns";
import { FaHistory } from "react-icons/fa";
// @ts-ignore
import ICAL from 'ical.js';
import { isAfter, subWeeks } from "date-fns/esm";
import _ from "lodash";
import { WEEK_START } from "../utils/dates";

const proxyUrl = (url: string) => {
  return 'https://asia-east2-how-behind.cloudfunctions.net/timetable-proxy?url=' + encodeURIComponent(url);
}

const commaAnd = (array: ReactNode[]) => {
  const out: ReactNode[] = [];
  array.forEach((x, i) => {
    if (i > 0) out.push(', ');
    if (i === array.length - 1 && i > 0) out.push('and ');
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
};

type CourseEntryWithDate = CourseEntry & {
  startDate: Date, 
  endDate: Date
};

const useTimetableEvents = (ical?: string) => {
  const [data, setData] = useState<CourseEntryWithDate[] | undefined>(undefined);
  // console.log("useTimetableEvents: " + ical);
  useEffect(() => {
    if (!ical) {
      console.log("No ical url specified. Not fetching.");
      return;
    }
    console.log("Initiating ical fetch...");
    fetch(proxyUrl(ical))
    .then(resp => resp.text()).then(data => {

      console.log("Received ical response.");
      const jcal = ICAL.parse(data);
      const comp = new ICAL.Component(jcal);
      const events: CourseEntryWithDate[] = comp.getAllSubcomponents('vevent')
      .map((x: any) => new ICAL.Event(x))
      .map((ev: any): CourseEntryWithDate => {
        const top = ev.description.split('\n')[0]
        const course: string = top.split('_')[0];
        const activity = top.split(', ').slice(1).join(', ');
        const duration = ev.duration.toSeconds() / 60;
        const start: Date = ev.startDate.toJSDate();
        const day = start.getDay();
        return {
          startDate: start, endDate: ev.endDate.toJSDate(),
          activity, course, duration, day, start: toDateEntry(start), time: {hour: start.getHours(), minute: start.getMinutes()},
          frequency: 1, id: course + '|' + activity + '|' + toDateEntry(start),
        };
      });

      events.sort((a,b) => {
        const x = a.start.localeCompare(b.start);
        if (x !== 0) return x;
        return a.duration - b.duration; // shorter duration first.
      });
      console.log("Caching " + events.length + " events.");
      setData(events);
    });
  }, [ical]);
  return [data];
}


export const Main = () => {
  const [settings, setSettings] = useStorage<Storage | undefined>();
  const [loading, setLoading] = useState(true);

  const ical = settings?.ical;
  const [events] = useTimetableEvents(ical);

  const now = new Date();
  let lastUpdated = !settings?.lastUpdated ? subWeeks(now, 1) : parseISO(settings.lastUpdated);
  const behind = settings?.behind ?? [];

  useEffect(() => {
    if (events == null) {
      console.log("Waiting for events to become populated...");
      return;
    }

    const newEvents: CourseEntry[] = events
    .filter((ev) => {
      return isAfter(ev.startDate, lastUpdated) && isBefore(ev.endDate, now);
    })
    .map(x => {
      delete x.startDate;
      delete x.endDate;
      return x;
    });

    if (newEvents.length) {
      const newBehind = [...behind, ...newEvents];
      setSettings({...settings, behind: newBehind, lastUpdated: formatISO(now)});
      console.log(`Previously had ${behind?.length} items, got ${events.length} new. Total ${newBehind.length}.`);
    } else {
      console.log("No new events since last update.");
    }
    setLoading(false);
    console.log("Finished updating events.");
  }, [events, lastUpdated, behind, now, settings]);

  const NICE_FORMAT = "PPPP";
  const NICE_DATETIME_FORMAT = 'p EEEE P';
  const behindGroups = _.groupBy(behind, (x) => x.start);

  const behindCourses = Object.entries(_.groupBy(behind, x => x.course))
  .map(([c, entries]) => [entries.reduce((x, a) => a.duration + x, 0) / 60, c]) as [number, string][];
  behindCourses.sort((a, b) => -(a[0] - b[0]));

  const totalBehind = behindCourses.reduce((x,a) => a[0] + x, 0);

  const removeBehind = (id: string) => {
    const newBehind = behind?.filter(x => x.id !== id);
    setSettings({...settings, behind: newBehind});
  };

  return <div className="columns is-centered">
    <div className="column is-7-widescreen is-9-desktop">
      <div style={{marginBottom: '0.3rem'}}>
        <div className="is-size-4">{format(new Date(), NICE_FORMAT)}</div>
      </div>
      <progress className="progress is-small is-link" max="100"
        style={{marginBottom: '0.2rem', height: '0.2rem', visibility: loading ? 'visible' : 'hidden'}}></progress>
      
      {totalBehind === 0 
      ? <div className="block">
          <span className="title is-2" style={{ fontWeight: 'normal' }}>You&rsquo;re all caught up! 🎉</span>
          {!ical && <p>Set your timetable URL on the Settings page.</p>}
        </div> 
      : <><div className="block" style={{ marginBottom: '0.75rem' }}>
          {/* style={{backgroundColor: '#363636', color: 'white'}} */}
          <span className="title is-2" style={{ fontWeight: 'normal' }}>You are behind {largeHours(totalBehind, true)},</span>
        </div>
        <div className="is-size-6">
          which is made up of&nbsp;
          {commaAnd(behindCourses.map(([n, c]) => <span key={c} style={{ whiteSpace: 'nowrap' }}>{smallHours(n)} of {c}</span>))}.
        </div></>}

      {/* <hr></hr>
      <h2 className="title is-4" style={{fontWeight: 'normal'}}>Missed Classes</h2> */}

      <table className="table vertical-center is-hoverable is-fullwidth header-spaced">
        <tbody>
          {Object.entries(behindGroups).map(([date, behinds]) => {
            const timeSpan = (t: Time) => <span style={{whiteSpace: 'nowrap'}}>{formatTime(t)}</span>
            const endTime = (c: CourseEntry) => {
              const time = c.time.hour*60 + c.time.minute + c.duration;
              return { hour: Math.floor(time / 60), minute: time % 60 };
            };

            const jDate = parseISO(date);
            // const dateStr = formatRelative(jDate, now, {weekStartsOn: WEEK_START}).split(' at ')[0];
            const dateHeader = <span title={formatISO(jDate, {representation: 'date'})}>
              {format(jDate, NICE_FORMAT)}
            </span>;

            return <React.Fragment key={date}>
              <tr className="not-hoverable"><th colSpan={4}>{dateHeader}</th></tr>
              {behinds.map(x => <tr key={x.id}>
                <td>{timeSpan(x.time)} &ndash; {timeSpan(endTime(x))}</td><td>{x.course}</td><td>{x.activity}</td><td><button className="button is-link is-outlined is-small" onClick={() => removeBehind(x.id)} title="Mark as watched"><span className="icon is-small"><FaHistory></FaHistory></span></button></td>
              </tr>)}
            </React.Fragment>;
          })}
        </tbody>
      </table>
    </div>
  </div>
};