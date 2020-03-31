import firebase from 'firebase';

const firebaseConfig = {
  apiKey: "AIzaSyC7CyI4kt5oTI46VQC3JMgVEAc3LaTOUAk",
  authDomain: "how-behind.firebaseapp.com",
  databaseURL: "https://how-behind.firebaseio.com",
  projectId: "how-behind",
  storageBucket: "how-behind.appspot.com",
  messagingSenderId: "982552075598",
  appId: "1:982552075598:web:645d3ed0815fe6d48e921f",
  measurementId: "G-57XLB5G6YW"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();
// console.log('initialising firebase!');

export default firebase;