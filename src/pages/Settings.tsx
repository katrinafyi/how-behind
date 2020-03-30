import React, { useState } from "react";

import firebase from '../services/firebase';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import { useStorage, Storage, toDateEntry, DateEntry, fromDateEntry } from "../services/storage";
import { FaTimes, FaPlus } from "react-icons/fa";

import _ from 'lodash';

import './Settings.css';
import DayPickerInput from "react-day-picker/DayPickerInput";
import 'react-day-picker/lib/style.css';
import { formatDate, parseDate, SHORT_DATE_FORMAT, LONG_DATE_FORMAT, WEEK_START } from "../utils/dates";
import dateFnsFormat from 'date-fns/format';
import { startOfWeek, format, parseISO } from "date-fns";
import { endOfWeek } from "date-fns/esm";

export const Settings = () => {
  const [settings, setSettings] = useStorage<Storage | undefined>();
  
  const [unsaved, setUnsaved] = useState(false);
  const [breaks, setBreaks] = useState(settings?.breaks ?? []);
  const [ical, setICalURL] = useState(settings?.ical ?? '');
  const [dateInput, setDateInput] = useState<Date | undefined>(undefined);

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
  const dateInputElement = <DayPickerInput
    inputProps={{className: 'input is-small', }}
    formatDate={formatDate}
    format={SHORT_DATE_FORMAT}
    parseDate={parseDate}
    placeholder="(add break week)"
    onDayChange={setDateInput}
    dayPickerProps={{firstDayOfWeek: WEEK_START}}>
  </DayPickerInput>;

  return <div>
    <h2 className="title is-3">Settings</h2>

    <div className="field">
      <label className="label">Calendar URL</label>
      <div className="control">
        <input type="text" className="input" placeholder="Allocate+ iCal URL"
          onChange={dirty((e) => setICalURL(e.currentTarget.value))}
          value={ical}/>
      </div>
    </div>
    <div className="field">
      <label className="label">Break Weeks</label>
      <div className="control">
        <table className="table is-narrow no-border vertical-center">
          <tbody>
            {breaks.map(s => {
              const start = fromDateEntry(s);
              const end = endOfWeek(start, {weekStartsOn: WEEK_START});

              return <tr key={s}>
                <td>
                  {formatDate(start, LONG_DATE_FORMAT)} &ndash; {formatDate(end, LONG_DATE_FORMAT)}
                </td>
                <td>
                  <button className="button is-small is-text" onClick={dirty(() => removeBreak(s))}>
                    <FaTimes></FaTimes>
                  </button>
                </td>
              </tr>;
            })}
            <tr>
              <td>{dateInputElement}</td>
              <td><button className="button is-small is-light" onClick={dirty(addBreak)}><FaPlus></FaPlus></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

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