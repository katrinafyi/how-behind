import React, { useState, useEffect } from 'react';
import './App.css';

import { FaHome, FaCog, FaHeart, FaSignInAlt, FaSignOutAlt, FaWrench, FaGithub } from 'react-icons/fa';

import firebase, { DEVELOPMENT } from './services/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

import { BrowserRouter as Router, Switch, Route, Link, Redirect } from "react-router-dom";
import { Login } from './pages/Login';
import { Logout } from './pages/Logout';
import { Loading } from './pages/Loading';
import cx from 'classnames';
import { Settings } from './pages/Settings';
import { Main } from './pages/Main';
import { Advanced } from './pages/Advanced';
import { useStorage, Storage } from './services/storage';
import { useTimetableEvents, fixBehindFormat } from './services/timetable';
import { CONTEXT } from './utils/variables';

function App() {
  const [data, setData, dataLoading] = useStorage<Storage>();

  const [events, eventsLoading] = useTimetableEvents(data?.ical);

  if (data)
    data.behind = data?.behind?.map(fixBehindFormat) ?? [];

  const [user, userLoading, userError] = useAuthState(firebase.auth());
  const [burger, setBurger] = useState(false);
  const [anon, setAnon] = useState(true);

  const userIsAnon = user?.isAnonymous ?? true;
  useEffect(() => {
    setAnon(userIsAnon);
  }, [userIsAnon]);

  const loggedIn = !!user;
  function needsLogin(x: any, redirect?: string) {

    redirect = redirect ?? '/login';

    return (props: any) => {

      const param = new URLSearchParams(props.location.search).get('logged-in');
      if (!loggedIn && !userLoading && param !== 'true') {
        return <Redirect to={redirect!}></Redirect>;
      } else {
        return x;
      }

    };
  }

  const storageProps = {data, setData, loading: dataLoading};
  const eventsProps = {events, eventsLoading};

  const context = CONTEXT ?? '';
  let buildText = '';
  let buildColour = '';
  if (DEVELOPMENT) {
    // local dev build
    buildText = 'Development Build'; 
    buildColour = 'is-danger';
    // @ts-ignore
  } else if (context !== 'production') {
    // deployed netlify build but not production
    buildText = context.replace('-', ' '); 
    buildColour = 'is-warning';
  }

  const hideBurger = () => setBurger(false);

  return <Router>
    <nav className="navbar is-spaced">
      <div className="container">
        <div className="navbar-brand">
          <div className="navbar-item">
            <h1 className="title">How behind am I?</h1>
          </div>
          <button className={cx("button", "is-white", "navbar-burger", "burger", { 'is-active': burger })}
            onClick={() => setBurger(!burger)}
            style={{ borderRadius: 0 }}
            aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </button>
        </div>
        <div id="navbarBasicExample" className={cx('navbar-menu', { 'is-active': burger })}>
          <div className="navbar-start">
            <Link className="navbar-item" to="/" onClick={hideBurger}>
              <span className="icon"><FaHome></FaHome></span>
              <span>Home</span>
            </Link>

            <Link className="navbar-item" to="/settings" onClick={hideBurger}>
              <span className="icon"><FaCog></FaCog></span>
              <span>Settings</span>
            </Link>

            {buildText
              ? <div className="navbar-item">
                <span className={"tag " + buildColour}>
                  <span className="icon is-small"><FaWrench></FaWrench></span>
                  &nbsp;
                  <span style={{textTransform: 'capitalize'}}>{buildText}</span>
                </span>
              </div>
              : <>
                <div className="navbar-item">
                  <span className="icon"><FaHeart></FaHeart></span>
                  <small>Made by <a href="https://kentonlam.xyz">Kenton Lam</a>!</small>
                </div>
                <div className="navbar-item">
                  <span className="icon"><FaGithub></FaGithub></span>
                  <small><a href="https://github.com/kentonlam/how-behind">GitHub</a></small>
                </div>
              </>}
          </div>

          <div className="navbar-end">
            <div className="navbar-item">
              {userLoading ? <div className="button is-loading">Loading...</div> :
                <div className="buttons">
                  {!user || anon ? <Link to="/login" className="button is-link" onClick={hideBurger}><span className="icon"><FaSignInAlt></FaSignInAlt></span><span>Log in</span></Link>
                    : <Link to="/logout" className="button is-light" onClick={hideBurger}><span className="icon"><FaSignOutAlt></FaSignOutAlt></span><span>Log out</span></Link>}
                </div>}
            </div>
          </div>
        </div>
      </div>
    </nav>

    {/* A <Switch> looks through its children <Route>s and
                renders the first one that matches the current URL. */}
    <div className="section">
      <div className="columns is-centered">
        <div className="column is-5-fullhd is-6-widescreen is-8-desktop">

          {userError &&
            <article className="message is-danger">
              <div className="message-header">
                Authentication Error
                  </div>
              <div className="message-body">
                {userError}
              </div>
            </article>}

          {(userLoading) ? <Loading></Loading> :
            <Switch>
              <Route path="/login">
                <Login></Login>
              </Route>
              <Route path="/logout">
                {needsLogin(<Logout></Logout>, '/')}
              </Route>
              <Route path="/settings">
                {<Settings {...storageProps}></Settings>}
              </Route>
              <Route path="/advanced">
                {needsLogin(<Advanced {...storageProps}></Advanced>, '/settings')}
              </Route>
              <Route path="/" exact>
                {dataLoading ? <Loading></Loading> : needsLogin(<Main {...storageProps} {...eventsProps}></Main>, '/settings')}
              </Route>
            </Switch>}

        </div></div>
    </div>
  </Router>;
}

export default App;
