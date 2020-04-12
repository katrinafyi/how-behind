import firebase from '../services/firebase';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Redirect } from 'react-router';

// Initialize the FirebaseUI Widget using Firebase.
const ui = new firebaseui.auth.AuthUI(firebase.auth());

const uiConfig: firebaseui.auth.Config = {
  // signInSuccessUrl: '/login',
  signInOptions: [
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
  ],
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

  uiConfig.callbacks!.signInSuccessWithAuthResult = (x) => {
    // debugger;
    setRedirect("/?logged-in=true");
    return false;
  };

  uiConfig.callbacks!.signInFailure = (error) => {
    if (error.code !== 'firebaseui/anonymous-upgrade-merge-conflict')
      return Promise.resolve();
    // console.log(error.credential.toJSON());
    const json = JSON.stringify(error.credential.toJSON());
    setRedirect('/conflict?credential='+encodeURIComponent(json));
    return Promise.resolve();
  };

  if (!currentUser) {
    const anon = firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID;
    if (uiConfig.signInOptions![uiConfig.signInOptions!.length-1] !== anon)
      uiConfig.signInOptions!.push(anon);
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
        <div className="message-body">
          Log in or create an account to sync your data on any device.
        </div>
      </div>
    </>}
    <div id="firebaseui-auth-container"></div>
  </>;
};