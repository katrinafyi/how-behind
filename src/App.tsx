import React, { useState } from 'react';
import './App.css';

import { FaHome, FaCog, FaHeart, FaSignInAlt, FaSignOutAlt, FaWrench } from 'react-icons/fa';

import firebase, { isProduction } from './services/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

import { BrowserRouter as Router, Switch, Route, Link, Redirect } from "react-router-dom";
import { Login } from './pages/Login';
import { Logout } from './pages/Logout';
import { Loading } from './pages/Loading';
import cx from 'classnames';
import { Settings } from './pages/Settings';
import { Main } from './pages/Main';
import { Data } from './pages/Data';
import { useStorage, Storage, CourseEntryWithDate, fromDateEntry } from './services/storage';
import { add, addMinutes } from 'date-fns';
import { useTimetableEvents, makeId, ID_PREFIX } from './services/timetable';

// @ts-ignore
const fixBehindFormat = (c: CourseEntry & Partial<CourseEntryWithDate | CourseEntryTimestamps>) => {
  if (c.startDate === undefined)
    c.startDate = add(fromDateEntry(c.start), { hours: c.time.hour, minutes: c.time.minute });
  else if (typeof c.startDate === 'string')
    c.startDate = new Date(c.startDate);
  else if (c.startDate instanceof firebase.firestore.Timestamp)
    c.startDate = c.startDate.toDate();

  if (c.endDate === undefined)
    c.endDate = addMinutes(c.startDate, c.duration);
  else if (typeof c.endDate === 'string')
    c.endDate = new Date(c.endDate);
  else if (c.endDate instanceof firebase.firestore.Timestamp)
    c.endDate = c.endDate.toDate();

  console.assert(c.startDate instanceof Date, 'startDate is not a Date', c.startDate);

  if (!c?.id?.startsWith(ID_PREFIX))
    c.id = makeId(c);

  return c as CourseEntryWithDate;
};

function App() {
  const [data, setData, dataLoading] = useStorage<Storage>();

  const [events, eventsLoading] = useTimetableEvents(data?.ical);

  if (data)
    data.behind = data?.behind?.map(fixBehindFormat) ?? [];

  const [user, userLoading, userError] = useAuthState(firebase.auth());
  const [burger, setBurger] = useState(false);

  const loading = userLoading;

  const loggedIn = !!user;
  const needsLogin = (x: any, redirect?: string) => {
    redirect = redirect ?? '/login';
    if (!loggedIn && !loading) return <Redirect to={redirect}></Redirect>;
    return x;
  };

  const storageProps = {data, setData, loading: dataLoading};
  const eventsProps = {events, eventsLoading};

  return (
    <div className="columns is-centered">
      <div className="column is-8-widescreen is-10">
        <Router>
          <nav className="navbar">
            <div className="container">
              <div className="navbar-brand">
                <div className="navbar-item">
                  <h1 className="title">How behind am I?</h1>
                </div>
                <button className={cx("button", "is-white", "navbar-burger", "burger", {'is-active': burger})} 
                    onClick={() => setBurger(!burger)}
                    style={{borderRadius: 0}}
                    aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
                  <span aria-hidden="true"></span>
                  <span aria-hidden="true"></span>
                  <span aria-hidden="true"></span>
                </button>
              </div>
              <div id="navbarBasicExample" className={cx('navbar-menu', {'is-active': burger})}>
                <div className="navbar-start">
                  <Link className="navbar-item" to="/" onClick={() => setBurger(false)}>
                    <span className="icon"><FaHome></FaHome></span>
                    <span>Home</span>
                  </Link>

                  <Link className="navbar-item" to="/settings" onClick={() => setBurger(false)}>
                    <span className="icon"><FaCog></FaCog></span>
                    <span>Settings</span>
                  </Link>

                  {isProduction 
                  ? <div className="navbar-item">
                    <span className="icon"><FaHeart></FaHeart></span>
                    <small>Made by <a href="https://kentonlam.xyz">Kenton Lam</a>!</small>
                  </div>
                  : <div className="navbar-item">
                    <span className="tag is-warning">
                      <span className="icon is-small"><FaWrench></FaWrench></span>
                      &nbsp; Development Build
                    </span>
                  </div>}
                </div>

                <div className="navbar-end">
                  <div className="navbar-item">
                    {loading ? <div className="button is-loading">Loading...</div> : 
                      <div className="buttons">
                        {!user ? <Link to="/login" className="button is-link"><span className="icon"><FaSignInAlt></FaSignInAlt></span><span>Log in</span></Link>
                          : <Link to="/logout" className="button is-light"><span className="icon"><FaSignOutAlt></FaSignOutAlt></span><span>Log out</span></Link>}
                    </div>}
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* A <Switch> looks through its children <Route>s and
                renders the first one that matches the current URL. */}
          <section className="section">
            {userError && <article className="message is-danger">
              <div className="message-header">
                Authentication Error
              </div>
              <div className="message-body">
                {userError}
              </div>
            </article>}
            {loading ? <Loading></Loading> : 
            <Switch>
              <Route path="/login">
                <Login></Login>
              </Route>
              <Route path="/logout">
                {needsLogin(<Logout></Logout>, '/')}
              </Route>
              <Route path="/settings">
                {needsLogin(<Settings {...storageProps}></Settings>)}
              </Route>
              <Route path="/data">
                {needsLogin(<Data {...storageProps}></Data>)}
              </Route>
              <Route path="/" exact>
                {needsLogin(<Main {...storageProps} {...eventsProps}></Main>)}
              </Route>
            </Switch>}
          </section>
        </Router>
      </div>
    </div>
  );
}

export default App;
