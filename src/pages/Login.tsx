import firebase from '../services/firebase';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Redirect } from 'react-router';

// Initialize the FirebaseUI Widget using Firebase.
const ui = new firebaseui.auth.AuthUI(firebase.auth());

export const Login = () => {
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

  const currentUser = firebase.auth().currentUser;
  const isAnonymous = currentUser?.isAnonymous;

  const [redirect, setRedirect] = useState(false);

  uiConfig.callbacks!.signInSuccessWithAuthResult = (x) => {
    // debugger;
    setRedirect(true);
    return false;
  };

  if (!currentUser) {
    uiConfig.signInOptions!.push(firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID);
  }

  useEffect(() => {
    // The start method will wait until the DOM is loaded.
    if (!redirect)
      ui.start('#firebaseui-auth-container', uiConfig);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirect]);

  return <>
    {redirect && <Redirect to="/?logged-in=true"></Redirect>}
    {!currentUser && 
      <article className="message is-link">
        <div className="message-header">
          <p>Welcome to How Behind</p>
        </div>
        <div className="message-body content">
          <p>Keeping track of missed Zoom lectures since March 2020.</p>
          <p>
            Log in or create an account from the options below.
            You can also continue as a guest and link your accounts later.
          </p>
        </div>
      </article>}

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