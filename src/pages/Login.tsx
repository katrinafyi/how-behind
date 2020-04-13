import firebase from '../services/firebase';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router';
import { Storage } from '../services/storage';
import { fixBehindFormat, compareCourseEntries } from '../services/timetable';

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

export const Login = () => {
  const currentUser = firebase.auth().currentUser;
  const isAnonymous = currentUser?.isAnonymous;

  const [redirect, setRedirect] = useState("");

  const signInSuccess = () => {
    setRedirect("/?logged-in=true");
    return false;
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
        const newData: Storage | null = snapshot.data() as Storage | null;
        console.log("Received new data: ", newData);

        let merged = newData;
        if (merged) {
          merged.behind = [...(merged?.behind ?? []), ...(oldData?.behind ?? [])];
          merged.behind = merged?.behind.map(fixBehindFormat) ?? [];
          merged.behind.sort(compareCourseEntries);

          merged.ical = merged?.ical || oldData?.ical;
          merged.lastUpdated = merged?.lastUpdated || oldData?.lastUpdated;
        } else {
          merged = oldData;
        }
        console.log("Merged data: ", merged);

        return snapshot.ref.set(merged ?? {});
      })
      // .then(() => {
      //   console.log("Deleting anonymous user: ", oldUser.uid);
        
      //   return oldUser.delete();
      // })
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

    {isAnonymous && <>
      <div className="message is-link">
        <div className="message-body content">
          {/* <p>You are logged in anonymously; your data is only accessible from this device.</p> */}

          <p>
            Log in or create an account to sync across devices. <br/>
            <small>Your data will be merged with any existing account.</small>
          </p>
        </div>
      </div>
    </>}
    <div id="firebaseui-auth-container"></div>
  </>;
};