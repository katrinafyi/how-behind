import { StorageProps, useStorage } from "../services/storage";
import React, { ReactNode } from "react";
import { format } from "date-fns";
import { FaHistory } from "react-icons/fa";

const commaAnd = (array: ReactNode[]) => {
  const out: ReactNode[] = [];
  array.forEach((x, i) => {
    if (i > 0) out.push(', ');
    if (i === array.length-1) out.push('and ');
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
    <span style={{color: useColour ? colour : ''}}><b>{n}</b></span> hour{suffix}
  </span>;
}

export const Main = () => {
  const [settings, setSettings] = useStorage<Storage | undefined>();
  const NICE_FORMAT = "PPPP";
  const NICE_DATETIME_FORMAT = 'p EEEE P';

  const behindCourses = [
    [20, 'CSSE1001'], [20, 'CSSE2010'], [100, 'ENGG1100']
  ] as const;

  return <div className="columns is-centered">
    <div className="column is-7-widescreen is-9-desktop">
      <div className="block">
        <div className="is-size-4">{format(new Date(), NICE_FORMAT)}</div>
      </div>
      <div className="block" style={{marginBottom: '0.75rem'}}>
        {/* style={{backgroundColor: '#363636', color: 'white'}} */}
        <span className="title is-2" style={{fontWeight: 'normal'}}>You are behind {largeHours(10, true)},</span>
      </div>
      <div className="">
        which is made up of&nbsp;
        {commaAnd(behindCourses.map(([n, c]) => <span style={{whiteSpace: 'nowrap'}}>{smallHours(n)} of {c}</span>))}.
      </div>

      {/* <hr></hr>
      <h2 className="title is-4" style={{fontWeight: 'normal'}}>Missed Classes</h2> */}

      <table className="table vertical-center is-hoverable is-fullwidth header-spaced">
        <tbody>
          <tr className="not-hoverable">
            <th colSpan={4}>{format(new Date(), NICE_FORMAT)}</th>
          </tr>
          <tr>
            <td>{format(new Date(), 'p')} &ndash; {format(new Date(), 'p')}</td><td>CSSE2001</td><td>LEC1_02</td><td><button className="button is-link is-outlined is-small"><span className="icon is-small"><FaHistory></FaHistory></span></button></td>
          </tr>
          <tr>
          <td>{format(new Date(), 'p')}</td><td>CSSE2001</td><td>LEC1_02</td><td><button className="button is-link is-outlined is-small"><span className="icon is-small"><FaHistory></FaHistory></span></button></td>
          </tr>
          <tr>
          <td>{format(new Date(), 'p')}</td><td>CSSE2001</td><td>LEC1_02</td><td><button className="button is-link is-outlined is-small"><span className="icon is-small"><FaHistory></FaHistory></span></button></td>          </tr>
          <tr className="not-hoverable">
            <th colSpan={4}>{format(new Date(), NICE_FORMAT)}</th>
          </tr>
          <tr>
          <td>{format(new Date(), 'p')}</td><td>CSSE2001</td><td>LEC1_02</td><td><button className="button is-link is-outlined is-small"><span className="icon is-small"><FaHistory></FaHistory></span></button></td>          </tr>
          <tr className="not-hoverable">
            <th colSpan={4}>{format(new Date(), NICE_FORMAT)}</th>
          </tr>
          <tr>
          <td>{format(new Date(), 'p')}</td><td>CSSE2001</td><td>LEC1_02</td><td><button className="button is-link is-outlined is-small"><span className="icon is-small"><FaHistory></FaHistory></span></button></td>          </tr>
        </tbody>
      </table>
    </div>
  </div>
};