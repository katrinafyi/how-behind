import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';

import firebase from '../services/firebase';
import { useStorage, Storage } from "../services/storage";

import { parseISO, formatISO9075 } from "date-fns";

export const Settings = () => {
  
  const [settings, setSettings, settingsLoading] = useStorage<Storage | undefined>();
  
  const [unsaved, setUnsaved] = useState(false);
  const [breaks, setBreaks] = useState<string[]>([]);
  const [ical, setICalURL] = useState('');

  const reset = () => {
    setBreaks(settings?.breaks ?? []);
    setICalURL(settings?.ical ?? '');
    setUnsaved(false);
  };

  useEffect(reset, [settings]);


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
    // console.log("Saving settings...", newSettings);
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

  const newUser = !settingsLoading && !settings;

  return <div className="columns is-centered">
    <div className="column is-7-widescreen is-9-desktop">
      {newUser && <article className="message is-link">
        <div className="message-header">
          <p>Welcome to How Behind</p>
        </div>
        <div className="message-body content">
          <p>Keeping track of those missed Zoom lectures since March 2020.</p>
          <p>
            Enter your timetable URL to get started. We'll add your classes from the current week. 
            You can find your URL under "Subscribe to your timetable" at <a target="_blank" rel="noopener noreferrer" href="https://timetable.my.uq.edu.au/even/student">Allocate+</a>.
          </p>
        </div>
      </article>}
      <h2 className="title is-3">Settings</h2>
      {settings && !settings.ical?.trim() && <article className="message is-danger">
        <div className="message-body">
          No timetable URL saved. Your classes will not be updated. 
        </div>
      </article>}

      <div className="field">
        <label className="label">Timetable URL</label>
        <div className="control">
          <input type="text" className="input" placeholder=""
            readOnly={settingsLoading}
            onChange={dirty((e) => setICalURL(e.currentTarget.value))}
            value={ical}/>
        </div>
        <p className="help">
          You can find your timetable URL on <a target="_blank" rel="noopener noreferrer" href="https://timetable.my.uq.edu.au/even/student">Allocate+</a>.
        </p>
      </div>
      <div className="field">
        <p className="help">
          {settings?.lastUpdated ? <>Timetable last updated {formatISO9075(parseISO(settings.lastUpdated))}.</>
          : "Timetable not yet imported."}
          &nbsp;Logged in as {firebase.auth().currentUser?.uid}. <span style={{whiteSpace: 'nowrap'}}><Link to="/data">Import or export data</Link>.</span>
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
          <button className="button is-light" disabled={!unsaved} onClick={reset}>Cancel</button>
        </div>
      </div>
    </div>
  </div>;
};