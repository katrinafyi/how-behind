import firebase from '../services/firebase';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import React, { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Redirect } from 'react-router';

var uiConfig = {
  signInSuccessUrl: '/',
  signInOptions: [
    // Leave the lines as is for the providers you want to offer your users.
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
    // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
    // firebase.auth.GithubAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
    firebase.auth.PhoneAuthProvider.PROVIDER_ID,
    // firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
  ],
  // tosUrl and privacyPolicyUrl accept either url string or a callback
  // function.
  // Terms of service url/callback.
  tosUrl: 'http://example.com',
  // Privacy policy url/callback.
  privacyPolicyUrl: function() {
    window.location.assign('<your-privacy-policy-url>');
  }
};

// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());

export const Login = () => {
    const [user, loading, error] = useAuthState(firebase.auth());
    
    const redirect = user && !loading && !ui.isPendingRedirect();

    useEffect(() => {
        // The start method will wait until the DOM is loaded.
        if (!redirect)
            ui.start('#firebaseui-auth-container', uiConfig);
    }, [redirect]);

    if (redirect)
        return <Redirect to="/"></Redirect>;
    return <div id="firebaseui-auth-container"></div>;
};