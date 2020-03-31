import React, { useState, useRef, useEffect } from "react";

import firebase from '../services/firebase';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import { useStorage, Storage, toDateEntry, DateEntry, fromDateEntry, StorageProps, CourseEntry } from "../services/storage";
import { FaTimes, FaPlus } from "react-icons/fa";

import _ from 'lodash';

import 'react-day-picker/lib/style.css';
import { formatDate, parseDate, SHORT_DATE_FORMAT, LONG_DATE_FORMAT, WEEK_START } from "../utils/dates";
import dateFnsFormat from 'date-fns/format';
import { startOfWeek, subWeeks, parseISO, formatISO } from "date-fns";
import { endOfWeek } from "date-fns/esm";

export const Settings = () => {
  
  const [settings, setSettings] = useStorage<Storage | undefined>();
  
  const [unsaved, setUnsaved] = useState(false);
  const [breaks, setBreaks] = useState<string[]>([]);
  const [ical, setICalURL] = useState('');
  const [dateInput, setDateInput] = useState(new Date());

  useEffect(() => {
    setBreaks(settings?.breaks ?? []);
    setICalURL(settings?.ical ?? '');
  }, [settings]);

  const addBreak = () => {
    if (!dateInput)
      return;
    const monday = startOfWeek(dateInput, {weekStartsOn: WEEK_START});
    const newBreaks = [...breaks, toDateEntry(monday)];
    newBreaks.sort();
    setBreaks(_.sortedUniq(newBreaks));
  };

  const removeBreak = (s: DateEntry) => {
    setBreaks(breaks.filter(x => x !== s));
  }

  const dirty = <T extends unknown>(f: T): T => {
    // @ts-ignore
    return (...x) => {
      setUnsaved(true);
      // @ts-ignore
      return f(...x);
    }
  };
    
  const save = () => {
    const newSettings = {...settings, ical, breaks};
    console.log("Saving settings...", newSettings);
    setSettings(newSettings);
    setUnsaved(false);
  };

  // onKeyDown: (e: any) => e.preventDefault()
  // const dateInputElement = <DatePicker
  //   inputProps={{className: 'input is-small', }}
  //   formatDate={formatDate}
  //   format={SHORT_DATE_FORMAT}
  //   parseDate={parseDate}
  //   placeholder="(add break week)"
  //   onDayChange={setDateInput}
  //   value={dateInput}
  //   dayPickerProps={{firstDayOfWeek: WEEK_START}}>
  // </DatePicker>;

  return <div>
    <h2 className="title is-3">Settings</h2>

    <div className="field">
      <label className="label">Calendar URL</label>
      <div className="control">
        <input type="text" className="input" placeholder=""
          onChange={dirty((e) => setICalURL(e.currentTarget.value))}
          value={ical}/>
      </div>
      <p className="help">
        Use the subscribe URL from <a href="https://timetable.my.uq.edu.au/even/student">Allocate+</a>.
      </p>
    </div>
    {/* <div className="field">
      <div className="control">
        <button className="button is-warning" 
            onClick={() => setSettings({...settings, lastUpdated: formatISO(subWeeks(settings?.lastUpdated ? parseISO(settings.lastUpdated) : new Date(), 1))})}>
          Test one week
        </button>
      </div>
    </div> */}

    <div className="field is-grouped">
      <div className="control">
        <button className="button is-link" disabled={!unsaved} onClick={save}>Save</button>
      </div>
      <div className="control">
        <button className="button is-light" disabled={!unsaved} >Cancel</button>
      </div>
    </div>

  </div>;
};