import { StorageProps, useStorage } from "../services/storage";
import React from "react";
import { format } from "date-fns";

const renderHours = (n: number, useColour?: boolean) => {
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
    <span style={{color: useColour ? colour : ''}}><b>{n}</b></span> hour{suffix}
  </span>;
}

export const Main = () => {
  const [settings, setSettings] = useStorage<Storage | undefined>();
  const NICE_FORMAT = "PPPP"

  return <div className="columns is-centered">
    <div className="column is-6-widescreen is-9-desktop">
      <div className="block">
        <div className="is-size-4">{format(new Date(), NICE_FORMAT)}</div>
        {/* style={{backgroundColor: '#363636', color: 'white'}} */}
        <span className="is-size-2">You are behind {renderHours(10, true)}!</span>
      </div>
      <div className="columns is-gapless">
        <div className="column is-narrow" style={{marginRight: '0.8ex'}}>Which is made up of</div>
         <div className="column">
           {renderHours(2)} of CSSE1001, and<br></br>
           {renderHours(1)} of STAT3004.</div>

      </div>
    </div>
  </div>
};