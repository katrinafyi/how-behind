import React from "react";

import firebase from '../services/firebase';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import { useStorage, Storage } from "../services/storage";
import { FaTimes, FaPlus } from "react-icons/fa";

import 'react-day-picker/lib/style.css';

import './Settings.css';
import DayPickerInput from "react-day-picker/DayPickerInput";
import { formatDate, parseDate } from "../utils/dates";
import dateFnsFormat from 'date-fns/format';

export const Settings = () => {
  const [settings, setSettings] = useStorage<Storage | undefined>();

  const behind = settings?.behind ?? [];

  const FORMAT = "dd/MM/yyyy";
  const dateInput = <DayPickerInput
    inputProps={{className: 'input is-small'}}
    formatDate={formatDate}
    format={FORMAT}
    parseDate={parseDate}
    placeholder={dateFnsFormat(new Date(), FORMAT)}>  
  </DayPickerInput>;

  return <div>
    <h2 className="title is-3">Settings</h2>

    <div className="field">
      <label className="label">Calender URL</label>
      <div className="control">
        <input type="text" className="input" placeholder="Allocate+ iCal URL" />
      </div>
    </div>
    <div className="field">
      <label className="label">Break Weeks</label>
      <div className="control">
        <table className="table is-narrow no-border vertical-center">
          <tr><td>Monday xth March &ndash; Sunday xth March</td><td><button className="button is-small is-text"><FaTimes></FaTimes></button></td></tr>
          <tr><td>Monday xth March</td><td><button className="button is-small is-text"><FaTimes></FaTimes></button></td></tr>
          <tr><td>{dateInput}</td><td><button className="button is-small is-light" style={{height: '100%'}}><FaPlus></FaPlus></button></td></tr>
        </table>
      </div>
    </div>

    <div className="field is-grouped">
      <div className="control">
        <button className="button is-link">Save</button>
      </div>
      <div className="control">
        <button className="button is-light">Cancel</button>
      </div>
    </div>

  </div>;
};