import { Storage, toDateEntry, CourseEntryWithDate, StorageProps } from "../services/storage";
import React, { ReactNode, useEffect, useState } from "react";
import { isBefore, parseISO, formatISO, startOfWeek, addDays, endOfMinute } from "date-fns";
import { FaHistory, FaRedo, FaExclamationTriangle, FaRegClock, FaChevronLeft, FaChevronRight, FaRegHourglass } from "react-icons/fa";

import { isAfter } from "date-fns";
import _ from "lodash";
import { WEEK_START, SHORT_DATE_FORMAT, LONG_DATE_OPTIONS, SHORT_TIME_OPTIONS, LONG_DATETIME_OPTIONS } from "../utils/dates";

import { Redirect } from "react-router";

import DayPickerInput from "react-day-picker/DayPickerInput";
import "react-day-picker/lib/style.css";
import { compareCourseEntries } from "../services/timetable";

import 'balloon-css';

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


type BehindTableProps = {
  behindGroups: [string, CourseEntryWithDate[]][], 
  makeButton: (c: CourseEntryWithDate) => ReactNode
}

const BehindTable = ({behindGroups, makeButton}: BehindTableProps) => {
  return <table className="table vertical-center is-hoverable is-fullwidth block">
    <tbody>
      {behindGroups.map(([date, behinds], i) => {
        const timeSpan = (d: Date) => <span style={{whiteSpace: 'nowrap'}}>
          {d.toLocaleTimeString(undefined, SHORT_TIME_OPTIONS)}
        </span>;

        const jDate = parseISO(date);
        // const dateStr = formatRelative(jDate, now, {weekStartsOn: WEEK_START}).split(' at ')[0];
        const dateHeader = <span title={formatISO(jDate, {representation: 'date'})}>
          {jDate.toLocaleDateString(undefined, LONG_DATE_OPTIONS)}
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

const DEFAULT_BEHIND_COMPUTED: BehindComputed = {
  behindCourses: [],
  behindGroups: {},
  totalBehind: 0,
  behindSet: new Set(),
}

type BehindComputed = {
  behindCourses: [number, string][],
  behindGroups: {[course: string]: CourseEntryWithDate[]},
  totalBehind: number,
  behindSet: Set<string>,
}

type MainProps = StorageProps<Storage> & {
  events: CourseEntryWithDate[] | undefined,
  eventsLoading: boolean,
};

export const Main = (props: MainProps) => {
  const [settings, setSettings, settingsLoading] = [props.data, props.setData, props.loading];

  const [events, eventsLoading] = [props.events, props.eventsLoading];

  const [showDone, setShowDone] = useState(false);
  const [showDate, setShowDate] = useState<Date | null>(new Date());

  const [computed, setComputed] = useState<BehindComputed>(DEFAULT_BEHIND_COMPUTED);
  const {behindCourses, behindGroups, totalBehind, behindSet} = computed;

  const [enabledDays, setEnabledDays] = useState(new Set());

  const ical = settings?.ical;
  // const [events, loading] = useTimetableEvents(ical);

  const [now, setNow] = useState(new Date());

  const lastUpdatedStr = settings?.lastUpdated;
  const behind = settings?.behind ?? [];

  useEffect(() => {
    const timer = setTimeout(() => {
      setNow(new Date());
    }, endOfMinute(now).getTime() - now.getTime() + 1);
    return () => clearInterval(timer);
  }, [now]);

  useEffect(() => {
    if (eventsLoading || events == null) {
      console.log("Waiting for events to become populated... (loading: " + eventsLoading + ")");
      return;
    }

    const lastUpdated = !lastUpdatedStr ? startOfWeek(new Date(), {weekStartsOn: WEEK_START}) : new Date(lastUpdatedStr);
    
    const nextIndex = _.sortedLastIndexBy(events, {endDate: lastUpdated} as CourseEntryWithDate, x => x.endDate.getTime());
    if (nextIndex >= events.length) {
      console.log("No events found past this time. Not updating.");
      return;
    }
    const nextEvent = events[nextIndex];
    
    const delay = Math.max(0, nextEvent.endDate.getTime() - Date.now());

    console.log('Next update will be in ' + delay/1000 + ' seconds at ' + nextEvent.endDate);

    const timer = setTimeout(() => {
      const now = new Date();

      const endIndex = _.sortedLastIndexBy(events, {endDate: now} as CourseEntryWithDate, x => x.endDate.getTime());

      // const newEvents = events
      // .filter((ev) => {
      //   return isAfter(ev.endDate, lastUpdated) && isBefore(ev.endDate, now);
      // });

      const newEvents = events.slice(nextIndex, endIndex);
      // debugger;

      console.log("Last update was at " + lastUpdated);
      if (newEvents.length) {
        const newBehind = [...behind, ...newEvents];
        setSettings(s => ({...s, behind: newBehind, lastUpdated: now.toISOString()}));
        console.log(`Previously had ${behind?.length} behind items, now ${newBehind.length}.`);
      } else {
        console.log("No new events since last update.");
      }
    }, delay);

    return () => clearInterval(timer);
  }, [events, eventsLoading, behind, lastUpdatedStr, setSettings]);

  useEffect(() => {
    console.log("Computing and caching behind properties...");

    const behindGroups = _.groupBy(behind, (x) => x.start);

    const behindCourses = Object.entries(_.groupBy(behind, x => x.course))
      .map(([c, entries]) => [entries.reduce((x, a) => a.duration + x, 0) / 60, c]) as [number, string][];
    behindCourses.sort((a, b) => -(a[0] - b[0]));

    const totalBehind = behindCourses.reduce((x,a) => a[0] + x, 0);

    const behindSet = new Set(behind.map(x => x.id));

    setComputed({behindGroups, behindCourses, totalBehind, behindSet});
  }, [behind]);

  useEffect(() => {
    setEnabledDays(new Set(events?.map(x => x.start)));
  }, [events]);

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
  
  const doneOnDate = (events && showDateStr && showDone)
    ? events.filter(x => x.start === showDateStr) : [];

  const dayHasNoEvents = (d: Date) => {
    return !enabledDays.has(formatISO(d, {representation: 'date'}));
  };

  const buttonStates = {
    past: ['is-outlined is-success', 'Mark as not done', () => <FaRedo></FaRedo>, false],
    now: ['is-warning', 'Happening now', () => <FaRegHourglass></FaRegHourglass>, true],
    future: ['is-grey', 'Event is in the future', () => <FaRegClock></FaRegClock>, true],
    behind: ['is-link is-outlined', 'Mark as done', () => <FaHistory></FaHistory>, false],
  } as const;

  const makeButton = (x: CourseEntryWithDate, state?: keyof typeof buttonStates) => {
    if (!state) {
      state = 'now';
      if (behindSet.has(x.id))
        state = 'behind';
      else if (isBefore(x.endDate, now))
        state = 'past';
      else if (isAfter(x.startDate, now))
        state = 'future';
    }

    const [buttonClass, title, icon, disabled] = buttonStates[state];
    const past = state === 'past';
    const behind = state === 'behind';

    const onClick = () => {
      if (behind) {
        removeBehind(x.id);
      } if (past) {
        addBehind(x);
      }
    };

    return <div data-balloon-pos="up" aria-label={title} style={{display: 'inline-block'}}>
      <button className={"button is-small " + buttonClass} 
        onClick={onClick}>
        <span className="icon is-small">{icon()}</span>
      </button>
    </div>
  };

  const setNextDayWithEvents = (direction: number) => () => {
    let day = showDate ?? now;
    for (let i = 0; i < 14; i++) {
      day = addDays(day, direction);
      if (!dayHasNoEvents(day)) {
        break;
      }
    }
    setShowDate(day);
  };

  return <>

      {!settingsLoading && !eventsLoading && !settings && <Redirect to="/settings"></Redirect>}

      <div style={{marginBottom: '0.3rem'}}>
        <div className="is-size-4">{now.toLocaleDateString(undefined, LONG_DATETIME_OPTIONS)}
        {settings && (events == null && !eventsLoading) 
        && <span className="icon" title="An error occured while fetching the timetable.">&nbsp;<FaExclamationTriangle></FaExclamationTriangle></span>}
      </div>
      </div>
      <progress className="progress is-small is-link" max="100"
        style={{marginBottom: '0.2rem', height: '0.2rem', visibility: (settingsLoading || eventsLoading) ? 'visible' : 'hidden'}}></progress>
        
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
          makeButton={x => makeButton(x, 'behind')}
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
                onClick={setNextDayWithEvents(-1)}>
                <span className="icon"><FaChevronLeft></FaChevronLeft></span>
              </button>
            </div>
            <div className="control">
              <DayPickerInput 
                dayPickerProps={{
                  showOutsideDays: true, 
                  firstDayOfWeek: WEEK_START, 
                  modifiers: {highlight: (d) => !dayHasNoEvents(d)},
                  modifiersStyles: {highlight: {fontWeight: 'bold'}}
                }}
                inputProps={{className: 'input has-text-centered', readOnly: true, style: {cursor: 'pointer'}}} 
                formatDate={d => d.toLocaleDateString()}
                format={SHORT_DATE_FORMAT}
                parseDate={() => showDate ?? undefined}
                placeholder={now.toLocaleDateString()}
              value={showDate ?? undefined} onDayChange={setShowDate}></DayPickerInput>
            </div>
            <div className="control">
              <button className="button"
                onClick={setNextDayWithEvents(1)}>
                <span className="icon"><FaChevronRight></FaChevronRight></span>
              </button>
            </div>
          </div>
          <p className="content">
            Here, you can see all classes on a particular day and 
            move them to or from your behind list.
          </p>
        </>}

        {showDone && showDate && <BehindTable
          behindGroups={[[showDateStr, doneOnDate]]}
          makeButton={makeButton}
        ></BehindTable>}
      </>}
    </>;
};
