import React from 'react';
import logo from './logo.svg';
import './App.css';

import { FaHome, FaCog, FaHeart, FaSignInAlt, FaSignOutAlt } from 'react-icons/fa';

import firebase from './services/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

import { BrowserRouter as Router, Switch, Route, Link, Redirect } from "react-router-dom";
import { Login } from './pages/Login';
import { Logout } from './pages/Logout';
import { Loading } from './pages/Loading';

function App() {
  const [user, loading, error] = useAuthState(firebase.auth());
  const loggedIn = !!user;
  const needsLogin = (x: any, redirect?: string) => {
    redirect = redirect ?? '/login';
    if (!loggedIn) return <Redirect to={redirect}></Redirect>;
    return x;
  }

  return (
    <div className="App">

      <nav className="navbar is-spaced">
        <div className="container">
        <div className="navbar-brand">
          <a className="navbar-item" href="/">
            <h1 className="title">How Behind?</h1>
          </a>
          <a role="button" className="navbar-burger burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
        </div>
        <div id="navbarBasicExample" className="navbar-menu">
          <div className="navbar-start">
            <a className="navbar-item" href="/">
              <span className="icon"><FaHome></FaHome></span>
              <span>Home</span>
            </a>

            <a className="navbar-item" href="/settings">
              <span className="icon"><FaCog></FaCog></span>
              <span>Settings</span>
            </a>

            <div className="navbar-item">
              <span className="icon"><FaHeart></FaHeart></span>
              <small>Made by Kenton Lam!</small>
            </div>
          </div>

          <div className="navbar-end">
            <div className="navbar-item">
              <div className="buttons">
                {!user ? <a href="/login" className="button is-primary"><span className="icon"><FaSignInAlt></FaSignInAlt></span><span>Log in</span></a>
                  : <a href="/logout" className="button is-light"><span className="icon"><FaSignOutAlt></FaSignOutAlt></span><span>Log out</span></a>}
              </div>
            </div>
          </div>
        </div>
        </div>
      </nav>
      <div className="section">
        {loading ? <Loading></Loading> :
          <Router>
            {/* A <Switch> looks through its children <Route>s and
                renders the first one that matches the current URL. */}
            <Switch>
              <Route path="/login">
                <Login></Login>
              </Route>
              <Route path="/logout">
                {needsLogin(<Logout></Logout>, '/')}
              </Route>
              <Route path="/settings">
                {needsLogin("Settings Page!")}
              </Route>
              <Route path="/">
                {needsLogin("Main Page! " + JSON.stringify(user))}
              </Route>
            </Switch>
          </Router>
        }
      </div>
    </div>
  );
}

export default App;
