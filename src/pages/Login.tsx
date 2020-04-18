import firebase from '../services/firebase';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router';
import { Storage } from '../services/storage';
import { fixBehindFormat, compareCourseEntries } from '../services/timetable';
import _ from 'lodash';

import 'bulma-checkradio/dist/css/bulma-checkradio.min.css';

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

  const [keepAnon, setKeepAnon] = useState<boolean | null>(null);
  const [redirect, setRedirect] = useState("");

  const keepAnonTicked = keepAnon ?? true;

  useEffect(() => {
    const prev = localStorage.getItem(KEEP_ANON_KEY);
    if (prev !== null && keepAnon === null)
      return;

    // console.log("setting anon key", keepAnon);
    
    // needed because firebaseui refreshes the page.
    localStorage.setItem(KEEP_ANON_KEY, keepAnonTicked.toString());

    return () => {
      // console.log("deleting anon key");
      
      localStorage.removeItem(KEEP_ANON_KEY);
    }
  }, [keepAnon, keepAnonTicked]);

  const signInSuccess = () => {
    localStorage.removeItem(KEEP_ANON_KEY);
    setRedirect("/?logged-in=true");
    return false; // don't redirect via HTTP.
  }

  uiConfig.callbacks!.signInSuccessWithAuthResult = signInSuccess;

  uiConfig.callbacks!.signInFailure = (error) => {
    if (error.code !== 'firebaseui/anonymous-upgrade-merge-conflict')
      return Promise.resolve();
    // console.log(error.credential.toJSON());
    // const json = JSON.stringify(error.credential.toJSON());
    // setRedirect('/conflict?credential='+encodeURIComponent(json));

    const oldUser = firebase.auth().currentUser!;
    const newCredential = error.credential;
    
    console.log("Currently signed in as: ", oldUser?.uid);
    console.log("Initiating merge procedure with new credential: ", newCredential);

    let oldData: Storage | null = null;
    return firebase.firestore().collection('user').doc(oldUser.uid).get()
      .then(snapshot => {
        oldData = snapshot.data() as Storage;
        console.log("Received old data: ", oldData);
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
          const newData: Storage | null = snapshot.data() as Storage | null;
          console.log("Received new data: ", newData);

          const merged: Storage = {};
          merged.behind = [...newData?.behind ?? [], ...oldData?.behind ?? []];
          merged.behind = newData?.behind?.map(fixBehindFormat) ?? [];
          merged.behind.sort(compareCourseEntries);
          _.uniqBy(merged.behind, x => x.id);

          merged.ical = newData?.ical || oldData?.ical;
          merged.lastUpdated = newData?.lastUpdated || oldData?.lastUpdated;

          merged.mergedFrom = [
            ...oldData?.mergedFrom ?? [], 
            ...newData?.mergedFrom ?? [], 
            oldUser.uid
          ];
          
          console.log("Merged data: ", merged);

          return snapshot.ref.set(merged ?? {});
        } else {
          console.log("Not merging data.");
          return Promise.resolve();
        }
      })
      .then(() => {
        console.log("Deleting anonymous user: ", oldUser.uid);
        return oldUser.delete();
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

  return <>
    {redirect && <Redirect to={redirect}></Redirect>}

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
        className={"is-checkradio is-info is-centered " + (keepAnonTicked ? 'has-background-color' : '')}
        type="checkbox" id="merge" checked={keepAnonTicked} onChange={e => setKeepAnon(e.currentTarget.checked)}
      >
      </input>
      <label htmlFor="merge">Keep data from anonymous account?</label>
    </div>}

    <div id="firebaseui-auth-container"></div>
  </>;
};