import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';


const firebaseConfig = {
  apiKey:            "AIzaSyCl_b6vqyejHtcNHVvhro843Iq5AjoHl-I",
  authDomain:        "sound-chat-ba0d5.firebaseapp.com",
  projectId:         "sound-chat-ba0d5",
  storageBucket:     "sound-chat-ba0d5.appspot.com",
  messagingSenderId: "568277026618",
  appId:             "1:568277026618:web:0105a01ff9dfcede1ab203"
};


export const firebaseApp  = firebase.initializeApp(firebaseConfig);
export const firestoreDb  = firebase.firestore();
export const cloudStorage = firebase.storage();
