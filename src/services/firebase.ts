import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/analytics';

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

const devConfig = {
  apiKey: "AIzaSyA1v8vgZ3O3Ht6DkZWmr3rvdG_P0JORUb0",
  authDomain: "how-behind-dev.firebaseapp.com",
  databaseURL: "https://how-behind-dev.firebaseio.com",
  projectId: "how-behind-dev",
  storageBucket: "how-behind-dev.appspot.com",
  messagingSenderId: "710247196154",
  appId: "1:710247196154:web:a4f7172e97fc2c131d7043",
  measurementId: "G-ZJ0NN0DRHN"
};

export const DEVELOPMENT = process.env.NODE_ENV !== 'production';

// Initialize Firebase
firebase.initializeApp(!DEVELOPMENT ? firebaseConfig : devConfig);
firebase.analytics();
// console.log('initialising firebase!');

export default firebase;