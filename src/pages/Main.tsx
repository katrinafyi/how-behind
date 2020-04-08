import { Storage, toDateEntry, CourseEntryWithDate, StorageProps } from "../services/storage";
import React, { ReactNode, useEffect, useState } from "react";
import { format, isBefore, parseISO, formatISO, startOfWeek, addDays } from "date-fns";
import { FaHistory, FaRedo, FaExclamationTriangle, FaRegClock, FaChevronLeft, FaChevronRight, FaHourglass, FaRegHourglass } from "react-icons/fa";

import { isAfter } from "date-fns";
import _ from "lodash";
import { WEEK_START, formatDate, SHORT_DATE_FORMAT, parseDate } from "../utils/dates";

import { Redirect } from "react-router";

import DayPickerInput from "react-day-picker/DayPickerInput";
import "react-day-picker/lib/style.css";
import { compareCourseEntries } from "../services/timetable";

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

const NICE_FORMAT = "PPPP";

type BehindTableProps = {
  behindGroups: [string, CourseEntryWithDate[]][], 
  makeButton: (c: CourseEntryWithDate) => ReactNode
}

const BehindTable = ({behindGroups, makeButton}: BehindTableProps) => {
  return <table className="table vertical-center is-hoverable is-fullwidth block">
    <tbody>
      {behindGroups.map(([date, behinds], i) => {
        const formatPad = (d: Date) => {
          const s = format(d, "h:mm");
          const hhmm = s.length >= 5 ? <>{s}</> : <>&#8199;{s}</>;
          const ampm = <span className="ampm">{format(d, "aa")}</span>;
          return <>{hhmm} {ampm}</>;
        };
        const timeSpan = (d: Date) => <span style={{whiteSpace: 'nowrap'}}>{formatPad(d)}</span>;

        const jDate = parseISO(date);
        // const dateStr = formatRelative(jDate, now, {weekStartsOn: WEEK_START}).split(' at ')[0];
        const dateHeader = <span title={formatISO(jDate, {representation: 'date'})}>
          {format(jDate, NICE_FORMAT)}
        </span>;

        // const noWrap = {textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap'} as const;
        const noWrap = {};

        return <React.Fragment key={date}>
          <tr className="not-hoverable">
            <th colSpan={4} className={i > 0 ? 'spaced' : ''}>{dateHeader}</th>
          </tr>
          {behinds.length
          ? behinds.map(x => <tr key={x.id}>
            <td style={noWrap}>{timeSpan(x.startDate)}
              <span className="is-hidden-touch">&nbsp;&ndash;&nbsp;</span>
              <br className="is-hidden-desktop"/>
              {timeSpan(x.endDate)}
            </td>
            <td>
              {x.course}
              <br className="is-hidden-tablet"/>
              <span className="is-hidden-tablet">{x.activity}</span>
            </td>
            <td style={noWrap} className="is-hidden-mobile">{x.activity}</td>
            <td>{makeButton(x)}</td>
          </tr>)
          : <tr><td><i>There's nothing here...</i></td></tr>}
        </React.Fragment>;
      })}
    </tbody>
  </table>;
};

type MainProps = StorageProps<Storage> & {
  events: CourseEntryWithDate[] | undefined,
  eventsLoading: boolean,
};

export const Main = (props: MainProps) => {
  const [settings, setSettings, settingsLoading] = [props.data, props.setData, props.loading];

  const [events, eventsLoading] = [props.events, props.eventsLoading];

  const [showDone, setShowDone] = useState(false);
  const [showDate, setShowDate] = useState<Date | null>(new Date());

  const ical = settings?.ical;
  // const [events, loading] = useTimetableEvents(ical);

  const now = new Date();
  let lastUpdated = !settings?.lastUpdated ? startOfWeek(now, {weekStartsOn: WEEK_START}) : parseISO(settings.lastUpdated);
  const behind = settings?.behind ?? [];

  useEffect(() => {
    if (eventsLoading || events == null) {
      console.log("Waiting for events to become populated...");
      return;
    }
    
    const nextIndex = _.sortedIndexBy(events, {endDate: lastUpdated} as CourseEntryWithDate, x => x.endDate.getTime());
    if (nextIndex >= events.length) {
      console.log("No events found past this time. Not updating.");
      return;
    }
    const nextEvent = events[nextIndex];
    
    const delay = Math.max(0, nextEvent.endDate.getTime() - now.getTime() + 2000);

    console.log('Next update will be in ' + delay/1000 + ' seconds at ' + nextEvent.endDate);

    const timer = setTimeout(() => {
      const now = new Date();

      const startIndex = _.sortedLastIndexBy(events, {endDate: lastUpdated} as CourseEntryWithDate, x => x.endDate.getTime());
      const endIndex = _.sortedIndexBy(events, {endDate: now} as CourseEntryWithDate, x => x.endDate.getTime());

      // const newEvents = events
      // .filter((ev) => {
      //   return isAfter(ev.endDate, lastUpdated) && isBefore(ev.endDate, now);
      // });

      const newEvents = events.slice(startIndex, endIndex);

      console.log("Last update was at " + lastUpdated);
      if (newEvents.length) {
        const newBehind = [...behind, ...newEvents];
        setSettings(s => ({...s, behind: newBehind, lastUpdated: formatISO(now)}));
        console.log(`Previously had ${behind?.length} behind items, now ${newBehind.length}.`);
      } else {
        console.log("No new events since last update.");
      }
    }, delay);

    return () => clearInterval(timer);
  }, [events, eventsLoading, lastUpdated, behind, now, setSettings]);


  const behindGroups = _.groupBy(behind, (x) => x.start);

  const behindCourses = Object.entries(_.groupBy(behind, x => x.course))
    .map(([c, entries]) => [entries.reduce((x, a) => a.duration + x, 0) / 60, c]) as [number, string][];
  behindCourses.sort((a, b) => -(a[0] - b[0]));

  const totalBehind = behindCourses.reduce((x,a) => a[0] + x, 0);

  const removeBehind = (id: string) => {
    const newBehind = behind?.filter(x => x.id !== id);
    setSettings({...settings, behind: newBehind});
  };

  const addBehind = (x: CourseEntryWithDate) => {
    const newBehind = [...behind, x];
    newBehind.sort(compareCourseEntries);
    setSettings({...settings, behind: newBehind});
  };

  const showDateStr = showDate ? toDateEntry(showDate) : '';
  const behindSet = new Set(behind.map(x => x.id));
  
  const doneOnDate = (events && showDateStr && showDone)
    ? events.filter(x => x.start === showDateStr && !behindSet.has(x.id)) : [];

  const makeButton = (x: CourseEntryWithDate) => {
    const states = {
      past: ['is-info', 'Mark as not done', <FaRedo></FaRedo>],
      now: ['is-static', 'Happening now', <FaRegHourglass></FaRegHourglass>],
      future: ['is-static', 'Event is in the future', <FaRegClock></FaRegClock>],
    } as const;

    let state: keyof typeof states = 'now';
    if (isBefore(x.endDate, now))
      state = 'past';
    else if (isAfter(x.startDate, now))
      state = 'future';

    const [buttonClass, title, icon] = states[state];
    const past = state === 'past';

    return <button className={"button is-outlined is-small " + buttonClass} 
        onClick={() => addBehind(x)} title={title}>
      <span className="icon is-small">{icon}</span>
    </button>;
  };

  return <div className="columns is-centered">
    <div className="column is-7-widescreen is-9-desktop">

      {!settingsLoading && !eventsLoading && !settings && <Redirect to="/settings"></Redirect>}

      <div style={{marginBottom: '0.3rem'}}>
        <div className="is-size-4">{format(new Date(), NICE_FORMAT)}
        {settings && (events == null && !eventsLoading) 
        && <span className="icon" title="An error occured while fetching the timetable.">&nbsp;<FaExclamationTriangle></FaExclamationTriangle></span>}
      </div>
      </div>
      <progress className="progress is-small is-link" max="100"
        style={{marginBottom: '0.2rem', height: '0.2rem', visibility: (settings && eventsLoading && ical) ? 'visible' : 'hidden'}}></progress>
        
      {settings && <>
        {totalBehind === 0 
        ? <div className="block">
            <span className="title is-2" style={{ fontWeight: 'normal' }}>You&rsquo;re all caught up! 🎉</span>
            {!ical && <p>Set your timetable URL on the Settings page.</p>}
          </div> 
        : <><div className="block" style={{ marginBottom: '0.75rem' }}>
            {/* style={{backgroundColor: '#363636', color: 'white'}} */}
            <span className="title is-2" style={{ fontWeight: 'normal' }}>You are behind {largeHours(totalBehind, true)},</span>
          </div>
          <div className="is-size-6" style={{ marginBottom: '0.75rem' }}>
            which is made up of&nbsp;
            {commaAnd(behindCourses.map(([n, c]) => <span key={c} style={{ whiteSpace: 'nowrap' }}>{smallHours(n)} of {c}</span>))}.
          </div></>}

        {/* <hr></hr>
        <h2 className="title is-4" style={{fontWeight: 'normal'}}>Missed Classes</h2> */}
        <BehindTable 
          behindGroups={Object.entries(behindGroups)}
          makeButton={x => <button className="button is-link is-outlined is-small" onClick={() => removeBehind(x.id)} title="Mark as done"><span className="icon is-small"><FaHistory></FaHistory></span></button>}
        ></BehindTable>
        
        <div className="field">
          <div className="control">
            {!showDone 
            ? <button className="button is-light is-link" onClick={() => setShowDone(true)}>
              Show other classes
            </button>
            : <button className="button is-light is-link is-active" onClick={() => setShowDone(false)}>
              Hide other classes
            </button>}
          </div>
        </div>
        
        {showDone && <>
          <label className="label">Date</label>
          <div className="field has-addons">
            <div className="control">
              <button className="button"
                onClick={() => setShowDate(showDate ? addDays(showDate, -1) : now)}>
                <span className="icon"><FaChevronLeft></FaChevronLeft></span>
              </button>
            </div>
            <div className="control">
              <DayPickerInput 
                dayPickerProps={{showOutsideDays: true, firstDayOfWeek: WEEK_START}}
                inputProps={{className: 'input has-text-centered', readOnly: true, style: {cursor: 'pointer'}}} 
                formatDate={formatDate}
                format={SHORT_DATE_FORMAT}
                parseDate={parseDate}
                placeholder={formatDate(now, SHORT_DATE_FORMAT)}
              value={showDate ?? undefined} onDayChange={setShowDate}></DayPickerInput>
            </div>
            <div className="control">
              <button className="button"
                onClick={() => setShowDate(showDate ? addDays(showDate, 1) : now)}>
                <span className="icon"><FaChevronRight></FaChevronRight></span>
              </button>
            </div>
          </div>
        </>}

        {showDone && showDate && <BehindTable
          behindGroups={[[showDateStr, doneOnDate]]}
          makeButton={makeButton}
        ></BehindTable>}
      </>}
    </div>
  </div>
};
