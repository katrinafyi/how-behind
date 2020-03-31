import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';

import { FaHome, FaCog, FaHeart, FaSignInAlt, FaSignOutAlt } from 'react-icons/fa';

import firebase from './services/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

import { BrowserRouter as Router, Switch, Route, Link, Redirect } from "react-router-dom";
import { Login } from './pages/Login';
import { Logout } from './pages/Logout';
import { Loading } from './pages/Loading';
import cx from 'classnames';
import { Settings } from './pages/Settings';
import { useStorage, Storage } from './services/storage';
import { Main } from './pages/Main';

function App() {
  const [user, loading, error] = useAuthState(firebase.auth());
  const [burger, setBurger] = useState(false);

  const loggedIn = !!user;
  const needsLogin = (x: any, redirect?: string) => {
    redirect = redirect ?? '/login';
    if (!loggedIn) return <Redirect to={redirect}></Redirect>;
    return x;
  }

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
                <a role="button" className={cx("navbar-burger","burger",{'is-active': burger})} 
                    onClick={() => setBurger(!burger)}
                    aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
                  <span aria-hidden="true"></span>
                  <span aria-hidden="true"></span>
                  <span aria-hidden="true"></span>
                </a>
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

                  <div className="navbar-item">
                    <span className="icon"><FaHeart></FaHeart></span>
                    <small>Made by <a href="https://kentonlam.xyz">Kenton Lam</a>!</small>
                  </div>
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
            {loading ? <Loading></Loading> : 
            <Switch>
              <Route path="/login">
                <Login></Login>
              </Route>
              <Route path="/logout">
                {needsLogin(<Logout></Logout>, '/')}
              </Route>
              <Route path="/settings">
                {needsLogin(<Settings></Settings>)}
              </Route>
              <Route path="/" exact>
                {needsLogin(<Main></Main>)}
              </Route>
            </Switch>}
          </section>
        </Router>
      </div>
    </div>
  );
}

export default App;
