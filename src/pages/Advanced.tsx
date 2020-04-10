import React, { createRef, useState } from "react";
import { StorageProps, Storage } from "../services/storage";
import firebase from "../services/firebase";
import { BRANCH, CONTEXT, COMMIT, BUILD_ID, BUILD_TIME, NODE_ENV } from "../utils/variables";

const TIMESTAMP_VALUE = 'firebase.firestore.Timestamp';
const DATE_VALUE = '__JAVASCRIPT_DATE__';
const TYPE_KEY = '__TYPE__';

const isPlainObject = function (obj: any) {
	return Object.prototype.toString.call(obj) === '[object Object]';
};

const timestampTransform = (key: string, value: any) => {
  if (value instanceof firebase.firestore.Timestamp) {
    // @ts-ignore
    value[TYPE_KEY] = TIMESTAMP_VALUE;
  }
  return value;
}

const timestampReviver = (key: string, value: any) => {
  if (isPlainObject(value)) {
    switch (value[TYPE_KEY]) {
      case TIMESTAMP_VALUE: 
        return new firebase.firestore.Timestamp(value.seconds, value.nanoseconds);
    }    
  }
  return value;
}

export const Advanced = (props: StorageProps<Storage>) => {
  const settings = props.data;
  const setSettings = props.setData;
  const settingsLoading = props.loading;

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const inputRef = createRef<HTMLInputElement>();

  const data = (JSON.stringify(settings, timestampTransform));

  const copy = () => {
    const input = inputRef.current;
    if (!input) return;
    input.select();
    document.execCommand('copy');
  };

  const importData = () => {
    const input = inputRef.current;
    if (!input) return;
    let data;
    let valid = false;
    try {
      data = input.value.length ? JSON.parse(input.value, timestampReviver) : undefined;
      if (!isPlainObject(data) && data !== undefined)
        throw new Error("Data is not a valid object");
      valid = true;
    } catch (e) {
      setSaved(false);
      setError("Error while importing data: " + e);
    }
    if (valid) {
      setSettings(data);
      setSaved(true);
      setError("");
    }
  };

  return <>

      {saved && <article className="message is-link">
        <div className="message-body">
          Data successfully imported.
        </div>
      </article>}

      {error && <article className="message is-danger">
        <div className="message-body">
          {error}
        </div>
      </article>}

      <h2 className="title is-3">Advanced Settings</h2>
      
      <div className="field">
        <label className="label">Deploy Information</label>
        <div className="help">
          <table className="table is-narrow">
            <tbody>
              <tr><td>Branch</td><td>{BRANCH || "Unknown"}</td></tr>
              <tr><td>Context</td><td>{CONTEXT || "Unknown"}</td></tr>
              <tr><td>Commit</td><td>{COMMIT || "Unknown"}</td></tr>
              <tr><td>Build ID</td><td>{BUILD_ID || "Unknown"}</td></tr>
              <tr><td>Build Time</td><td>{BUILD_TIME || "Unknown"}</td></tr>
              <tr><td>Environment</td><td>{NODE_ENV}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="field">
        <label className="label">Raw Data</label>
      </div>
      <div className="field has-addons">
        <div className="control is-expanded">
          <input type="text" className="input" placeholder=""
            readOnly={settingsLoading}
            defaultValue={data} ref={inputRef}/>
        </div>
        <div className="control">
          <button className="button is-link" onClick={copy}>Copy</button>
        </div>
      </div>
      <div className="field">
        <p className="help">
          You can export by copying or import by pasting then clicking "Import". <b>Importing will overwrite existing data.</b>
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
          <button className="button is-warning" onClick={importData}>Import</button>
        </div>
      </div>
    </>;
};