import { useEffect } from "react";
import firebase from '../services/firebase';
import React from "react";

export const Logout = () => {
    useEffect(() => {
        firebase.auth().signOut();
    }, []);
    return <div>Logging out...</div>;
};