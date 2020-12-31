//I really don't like how code specific to different pages is all lumped together
//in index.js. This is, in part, what made this course so confusing.


import firebase from 'firebase/app';
import 'firebase/auth';
import { firestoreDb } from '../firebase/firebaseConfiguration';

import "./bootstrap.bundle.min.js";
import '../firebase/firebaseConfiguration';
import {
  emailSignin,
  createEmailSigninAccount,
  anonymousSignin,
  googleSignin,
  facebookSignin,
  signOut
} from '../firebase/firebaseAuthentication.js';

import {
  assignClick,
  initializeSigninButtons,
  addSong,
  addArtistToList,
  addCommentToContainer
} from './utilities.js';


import {
  writeSongToFirestore,
  readSongsFromFirestore,
  deleteSongFromFirestore,
  getSongFromFirestore,
  updateSongInFirebase,
  getAudioFromStorage,
  getAllArtists,
  getArtistName,
  saveCommentToFirestore,
  getCommentsForSong
} from '../firebase/firebaseRepository';


initializeSigninButtons();
anonymousSignin();


assignClick('google-login-button', googleSignin);
assignClick('facebook-login-button', facebookSignin);
assignClick('sign-out-link', signOut);


/* =============================================================================

============================================================================= */


const emailLoginForm = document.getElementById('email-login-form');

if (emailLoginForm){

  emailLoginForm.addEventListener('submit', function(e){
    e.preventDefault();

    const email    = e.target['login-email'].value.trim();
    const password = e.target['login-password'].value.trim();

    if (email.length === 0 || password.length === 0){
      return alert("Please complete all fields.");
    }


    emailSignin(email, password);
  });
}


/* =============================================================================

============================================================================= */


const emailRegisterForm = document.getElementById('email-register-form');

if (emailRegisterForm){
  emailRegisterForm.addEventListener('submit', function(e){
    e.preventDefault();

    const email           = e.target['register-email'].value.trim();
    const password        = e.target['register-password'].value.trim();
    const passwordConfirm = e.target['register-password-confirm'].value.trim();

    if (email.length === 0 || password.length === 0 || passwordConfirm.length === 0 ){
      return alert("Please complete all fields.");
    }

    //Email validation...

    if (password.length < 6){
      return alert("The password must be at least six characters.");
    }

    if (password !== passwordConfirm){
      return alert("The passwords must match.");
    }


    createEmailSigninAccount(email, password);
  });
}


/* =============================================================================

============================================================================= */


const addSongForm = document.getElementById('add-song-form');

if (addSongForm){
  addSongForm.addEventListener('submit', function(e){
    e.preventDefault();

    const songArtist = e.target['artist-input'].value.trim();
    const songTitle  = e.target['song-title-input'].value.trim();
    const songFile   = e.target['song-file-input'].files[0];


    if (songArtist.length   === 0 || songTitle.length === 0 || songFile === undefined){
      return alert("Please complete all fields.");
    }


    writeSongToFirestore(songArtist, songTitle, songFile)
    .then(()   => { addSongForm.reset(); })
    .catch(err => { console.log("Here is the caught error from the rejected Promise: ", err); })
  });
}


/* =============================================================================

============================================================================= */


const songsUL = document.getElementById('songs-ul');

if (songsUL){
  firebase.auth().onAuthStateChanged(user => {
    if (user){
      readSongsFromFirestore(user.uid)
      .then(songs => {
        songs.forEach(song => { addSong(songsUL, song); });
      });
    }
  });
}


/* =============================================================================

============================================================================= */


const editSongForm = document.getElementById('edit-song-form');


if (editSongForm){
  const searchParams = new URLSearchParams(location.search);
  const songId       = searchParams.get('id');


  getSongFromFirestore(songId)
  .then(song => {
    editSongForm.elements.song_id.value               = song.id;
    editSongForm.elements.edit_song_title_input.value = song.songTitle;
  })
  .catch(err => {
    console.log(err);
  })


  editSongForm.addEventListener('submit', function(e){
    e.preventDefault();

    const id         = e.target.elements.song_id.value;
    const songTitle  = e.target.elements.edit_song_title_input.value.trim();
    const song       = { id, songTitle };


    //Validation...
    if (songTitle.length === 0){
      alert("Please complete all fields.");
    }


    updateSongInFirebase(song);
  });
}


/* =============================================================================

============================================================================= */


const audioElement      = document.getElementById('audio-component');
const artistNameElement = document.getElementById('artist-name');
const songSelectElement = document.getElementById('song-select');
const commentsContainer  = document.getElementById('comments-container');


if (audioElement && artistNameElement && songSelectElement && commentsContainer){
  const searchParams = new URLSearchParams(location.search);
  const userId       = searchParams.get('userId');


  //Set all songs for the userId
  readSongsFromFirestore(userId)
  .then(songs => {
    songs.forEach(song => {
      const option = document.createElement('OPTION');
      option.setAttribute('data-songid', song.id);
      option.setAttribute('data-filename', song.songFileName);
      option.textContent = song.songTitle;

      songSelectElement.appendChild(option);
    });
  });


  songSelectElement.addEventListener('change', function(e){
    const selectedOption = e.target.selectedOptions[0];
    const songId = selectedOption.dataset.songid;
    const fullFileName = `${songId}-${selectedOption.dataset.filename}`;

    //Set audio src
    getAudioFromStorage(userId, fullFileName)
    .then(fileUrl => {
      audioElement.setAttribute('src', fileUrl);
    });


    //Get all song related comments
    // commentsContainer.innerHTML = '';
    // getCommentsForSong(songId)
    // .then(comments => {
    //   comments.forEach(comment => {
    //     console.log(comment);
    //     addCommentToContainer(comment, commentsContainer);
    //   });
    // });


    //Get all song related comments
    window.unsubscribe && window.unsubscribe();


    window.unsubscribe = firestoreDb.collection('comments')
    //Note: Firebase index build time may take a few minutes
    //https://cloud.google.com/firestore/docs/query-data/indexing
    .where('songId', '==', songId)
    .orderBy('date', 'desc')
    .onSnapshot(snapshot => {
      commentsContainer.innerHTML = '';

      snapshot.forEach(comment => {
        addCommentToContainer(comment.data(), commentsContainer);
      });
    });
  });


  getArtistName(userId)
  .then(artistName => {
    artistNameElement.textContent = artistName;
  });
}




/* =============================================================================

============================================================================= */


const selectArtistElement = document.getElementById('select-artist');
if (selectArtistElement){
  getAllArtists()
  .then(artists => {
    artists.forEach(artist => {
      addArtistToList(selectArtistElement, artist);
    });
  });
}


/* =============================================================================

============================================================================= */


const addCommentForm = document.getElementById('add-comment-form');


if (addCommentForm){
  addCommentForm.addEventListener('submit', function(e){
    e.preventDefault();
    const commentText    = e.target['comment-text'].value;
    const songSelect     = document.getElementById('song-select');
    const selectedOption = songSelect.selectedOptions[0];
    const songId         = selectedOption.dataset.songid;

    saveCommentToFirestore(commentText, songId);
  });
}



///
