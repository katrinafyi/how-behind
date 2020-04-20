import firebase from '../services/firebase';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router';
import { Storage } from '../services/storage';
import { fixBehindFormat, compareCourseEntries } from '../services/timetable';
import _ from 'lodash';

import 'bulma-checkradio/dist/css/bulma-checkradio.min.css';
import { Link } from 'react-router-dom';

// Initialize the FirebaseUI Widget using Firebase.
const ui = new firebaseui.auth.AuthUI(firebase.auth());

const signInOptionsNoAnon = [
  // Leave the lines as is for the providers you want to offer your users.
  firebase.auth.GoogleAuthProvider.PROVIDER_ID,
  firebase.auth.FacebookAuthProvider.PROVIDER_ID,
  {
    provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
    defaultCountry: 'AU',
  },
  // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
  firebase.auth.EmailAuthProvider.PROVIDER_ID,
  firebase.auth.GithubAuthProvider.PROVIDER_ID,
  // firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
];

const uiConfig: firebaseui.auth.Config = {
  // signInSuccessUrl: '/login',
  signInOptions: signInOptionsNoAnon,
  credentialHelper: firebaseui.auth.CredentialHelper.NONE,
  autoUpgradeAnonymousUsers: true,
  // tosUrl and privacyPolicyUrl accept either url string or a callback
  // function.
  // Terms of service url/callback.
  tosUrl: 'https://kentonlam.xyz/how-behind/terms',
  // Privacy policy url/callback.
  privacyPolicyUrl: 'https://kentonlam.xyz/how-behind/privacy',
  callbacks: {
    signInSuccessWithAuthResult: undefined,
  }
};

const KEEP_ANON_KEY = 'how-behind:keepAnon';

export const Login = () => {
  const currentUser = firebase.auth().currentUser;
  const isAnonymous = currentUser?.isAnonymous;

  const [keepAnon, setKeepAnon] = useState(true);
  const [redirect, setRedirect] = useState("");
  const [saveKeepAnon, setSaveKeepAnon] = useState(false);

  useEffect(() => {
    if (saveKeepAnon) {
      // to persist keep anon state across redirects.
      console.log("Saving keep anon:", keepAnon);
      localStorage.setItem(KEEP_ANON_KEY, keepAnon.toString());
    }
  }, [saveKeepAnon, keepAnon]);

  const signInSuccess = () => {
    localStorage.removeItem(KEEP_ANON_KEY);
    setRedirect("/?logged-in=true");
    return false; // don't redirect via HTTP.
  }

  uiConfig.callbacks!.uiShown = () => {
    document.querySelectorAll('.firebaseui-idp-button').forEach(e => {
      e.addEventListener('click', () => {
        setSaveKeepAnon(true);
      });
    });
  };

  uiConfig.callbacks!.signInSuccessWithAuthResult = signInSuccess;

  uiConfig.callbacks!.signInFailure = (error) => {
    if (error.code !== 'firebaseui/anonymous-upgrade-merge-conflict')
      return Promise.resolve();
    // console.log(error.credential.toJSON());
    // const json = JSON.stringify(error.credential.toJSON());
    // setRedirect('/conflict?credential='+encodeURIComponent(json));

    const anonUser = firebase.auth().currentUser!;
    const newCredential = error.credential;
    
    console.log("Currently signed in as: ", anonUser?.uid);
    console.log("Initiating merge procedure with new credential: ", newCredential);

    let anonData: Storage | null = null;
    return firebase.firestore().collection('user').doc(anonUser.uid).get()
      .then(snapshot => {
        anonData = snapshot.data() as Storage;
        console.log("Received old data: ", anonData);
        return firebase.auth().signInWithCredential(newCredential);
      })
      .then(newUser => {
        console.log("Signed in with new user: ", newUser.user?.uid);
        return firebase.firestore().collection('user').doc(newUser.user!.uid).get();
      })
      .then(snapshot => {
        const keepAnon = localStorage.getItem(KEEP_ANON_KEY);
        console.log("Keep anon flag: ", keepAnon);
        
        if (keepAnon !== 'false') {
          const existingData: Storage | null = snapshot.data() as Storage | null;
          console.log("Received new data: ", existingData);

          const merged: Storage = {};
          merged.behind = [...existingData?.behind ?? [], ...anonData?.behind ?? []];
          merged.behind = merged.behind.map(fixBehindFormat);
          merged.behind.sort(compareCourseEntries);
          _.uniqBy(merged.behind, x => x.id);

          merged.ical = anonData?.ical || existingData?.ical;
          merged.lastUpdated = anonData?.lastUpdated || existingData?.lastUpdated;

          merged.mergedFrom = [
            ...anonData?.mergedFrom ?? [], 
            ...existingData?.mergedFrom ?? [], 
            anonUser.uid
          ];
          
          console.log("Merged data: ", merged);

          return snapshot.ref.set(merged ?? {});
        } else {
          console.log("Not merging data.");
          return Promise.resolve();
        }
      })
      .then(() => {
        console.log("Deleting anonymous user: ", anonUser.uid);
        return anonUser.delete();
      })
      .then(() => {
        signInSuccess();
      });
  };

  if (!currentUser) {
    uiConfig.signInOptions = [...signInOptionsNoAnon,
      firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID];
  }

  useEffect(() => {
    // The start method will wait until the DOM is loaded.
    if (!redirect)
      ui.start('#firebaseui-auth-container', uiConfig);
  }, [redirect]);

  const showLoginUI = (!currentUser || isAnonymous)

  return <>
    {redirect && <Redirect to={redirect}></Redirect>}

    {showLoginUI
    ? <>
      <div className="message is-link">
        <div className="message-body content">
          <p>
            Log in or create an account to sync across devices. <br/>
            {isAnonymous && <small>You are logged in anonymously; your data is only accessible from this device.</small>}
          </p>
        </div>
      </div>

      {isAnonymous && <div className="field" style={{display: 'flex', justifyContent: 'center'}}>
        <input 
          className={"is-checkradio is-info is-centered " + (keepAnon ? 'has-background-color' : '')}
          type="checkbox" id="merge" checked={keepAnon} onChange={e => setKeepAnon(e.currentTarget.checked)}
        >
        </input>
        <label htmlFor="merge">Keep data from anonymous account?</label>
      </div>}
    </>
    : <div className="message is-success">
      <div className="message-body content">
        <p>
          Logged in successfully! Please wait to be redirected. <br/>
          <small>Alternatively, click <Link to="/">Home</Link> to see your classes.</small>
        </p>
      </div>
    </div>}

    <div id="firebaseui-auth-container" style={{display: showLoginUI ? undefined : 'none'}}></div>

    
  </>;
};