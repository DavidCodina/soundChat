import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import { firestoreDb, cloudStorage } from './firebaseConfiguration';
import { addSong }  from '../scripts/utilities.js';


/* =============================================================================

============================================================================= */


export function writeSongToFirestore(songArtist, songTitle, songFile){
  //////////////////////////////////////////////////////////////////////////////
  //
  //  Why are we wrapping this in a Promise and returning it?
  //  So that a .then() can be attached to the invocation.
  //
  //    writeSongToFirestore(songArtist, songTitle)
  //    .then(()   => { addSongForm.reset(); })
  //    .catch(err => { console.log("Here is the caught error from the rejected Promise: ", err); })
  //
  //////////////////////////////////////////////////////////////////////////////

  return new Promise((resolve, reject) => {
    //Organize the song artist and song title into an object.
    const song = {
      songTitle: songTitle,
      songFileName: songFile.name //.name is a property on any File.
    };


    firebase.auth().onAuthStateChanged(user => {
      if (user){
        //Get the collection of songs for the current user.
        const songsCollection = firestoreDb.collection(`users/${user.uid}/songs`);

        //Add the song to a document in the songs collection and log the document id.
        songsCollection.add(song)
        .then(docRef => {
          resolve();
          console.log('Song document Id: ', docRef.id);
          //docRef.id is the way we find the data in Firestore.
          //We will use it as part of the file name in cloud storage.
          //This is so we can match the song in Firestore with the file in cloud storage.
          saveSongFile(user.uid, docRef.id, songFile);
        })

        .catch(err => {
          reject("There was an error while writing a song to firestore.");
          //console.error('There was an error while writing a song to firestore: ', err);
        });


        //Add artist to user doc if artist exists
        if (songArtist){
          const userDocument = firestoreDb.doc(`users/${user.uid}`);
          userDocument.set({ artistName: songArtist });
        }
      }
    });
  }); //End of return new Promise( ... );
}


/* =============================================================================

============================================================================= */


function saveSongFile(userId, docRefId, songFile){
  //Create a reference to the file path in Cloud Storage.
  //This will create the path if it does not already exist.
  const fileRef = cloudStorage.ref(`songs/${userId}/${docRefId}-${songFile.name}`);


  //Upload the file to Cloud Storage.
  const uploadTask = fileRef.put(songFile);


  /* =======================

  ======================= */


  //The returned task can indicate changes in the state of the file upload.
  uploadTask.on('state_changed',
    //The progress function can indicate how many bytes have been transferred to Cloud Storage.
    function progress(snapshot) {
      console.log('Bytes transferred: ', snapshot.bytesTransferred);
      console.log('Total bytes: ',       snapshot.totalBytes);
    },


    //The error function will be called if there is an error while the file is uploading.
    function error(err){
      console.error('There was an error while saving to Cloud Storage: ', err);
    },


    // The complete function will be called once the upload has completed successfully.
    function complete() {
      console.log('File successfully saved to Cloud Storage');
    }
  ); //End of uploadTask.on( ... )
}


/* =============================================================================

============================================================================= */


export function getArtistName(userId){
  return new Promise(resolve => {
    const userDocument = firestoreDb.doc(`users/${userId}`); //Get reference to the user document

    //Get the user's artist name
    userDocument.get()
    .then(doc => {
      if (doc.exists){ resolve(doc.data().artistName); }
    });
  });
}


/* =============================================================================

============================================================================= */
//This function is used by the my-songs.html page as well as the select-artist.html page.


export function readSongsFromFirestore(userId){
  return new Promise(resolve => {

    getArtistName(userId)
    .then(songArtist => {
      const songs = [];

      //Get the collection of songs for the current user.
      const songsCollection = firestoreDb.collection(`users/${userId}/songs`);

      //Get all song documents from the song collection.
      songsCollection.get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          const songData = { ...doc.data(), id: doc.id, songArtist };
          songs.push(songData);
        });

        resolve(songs);
      })

      .catch(err => {
        console.log(err);
      })
    });
  }); //End of  return new Promise( ... );
}


/* =============================================================================

============================================================================= */
//The Promise functionality is not needed, but it could be useful if you wanted
//to add flexibility in the place where it's called.


export function deleteSongFromFirestore(songId){
  //return new Promise((resolve, reject) => {
    firebase.auth().onAuthStateChanged((user) => {
      if (user){
        const songDocument = firestoreDb.doc(`users/${user.uid}/songs/${songId}`);

        songDocument.delete()

        .then(() => {
          console.log(`The song with an id of ${songId} has been deleted successfully`);
          //resolve();
        })

        .catch(err => {
          //console.error(`There was an error while trying to delete song with id ${songId}.`, err);
          //reject(`There was an error while trying to delete song with id ${songId}.`);
        });
      }
    });
  //}); //End of return new Promise( ... )
}


/* =============================================================================

============================================================================= */


export function getSongFromFirestore(songId){
  return new Promise((resolve, reject) => {
    firebase.auth().onAuthStateChanged((user) => {
      if (user){
        //Assign the reference to the song document using songId
        const songDocument = firestoreDb.doc(`users/${user.uid}/songs/${songId}`);

        //Get the song data from Firestore
        songDocument.get()
        .then(doc => {
          if (doc.exists){
            const songData = { ...doc.data(), id: doc.id };
            resolve(songData);
          }
        })

        .catch(err => {
          //console.error(`There was an error while trying to get song with id ${songId}`, err);

          //////////////////////////////////////////////////////////////////////
          //
          //  This is then handled by the catch in this code in index.js
          //
          // const editSongForm = document.getElementById('edit-song-form');
          // if (editSongForm){
          //   const searchParams = new URLSearchParams(location.search);
          //   const songId       = searchParams.get('id');
          //   getSongFromFirestore(songId)
          //   .then(song => {
          //     editSongForm.elements.song_id.value               = song.id;
          //     editSongForm.elements.edit_artist_input.value     = song.songArtist;
          //     editSongForm.elements.edit_song_title_input.value = song.songTitle;
          //   })
          //   .catch(err => {
          //     console.log(err);
          //   })
          // }
          //
          //////////////////////////////////////////////////////////////////////

          reject(`There was an error while trying to get song with id ${songId}`);
        });
      }
    });
  });
}




/* =============================================================================

============================================================================= */


export function updateSongInFirebase(song){
  firebase.auth().onAuthStateChanged((user) => {
    if (user){
      //Assign the reference to the song document using songId
      const songDocument = firestoreDb.doc(`users/${user.uid}/songs/${song.id}`);


      //Create a new song object
      const updatedSong = {
        songTitle: song.songTitle
      };


      //Update the song with the new song object
      //The update() method will only update the fields that you ask it to.
      songDocument.update(updatedSong)
      .then(() => {
        console.log('Your song was updated successfully: ', song);
      })
      .catch(err => {
        console.error('There was an error while updating your song: ', song, err);
      });

    }
  });
}


/* =============================================================================

============================================================================= */


export function getAudioFromStorage(userId, fileName){
  return new Promise(resolve => {
    //Get the reference to the file in Cloud Storage
    const fileRef = cloudStorage.ref(`songs/${userId}/${fileName}`);


    //Get the URL for the song file in Cloud Storage
    fileRef.getDownloadURL()
      .then(url  => resolve(url))

      .catch(err => {
        console.error('There was an error while retrieving a file from Cloud Storage', err);
      });
  });
}


/* =============================================================================

============================================================================= */


export function getAllArtists(){
  return new Promise(resolve => {
    //Get all the artist names
    let artists          = [];
    const userCollection = firestoreDb.collection('users');


    userCollection.get()
    .then(snapshot => {
      snapshot.forEach(docRef => {
        const artist = { ...docRef.data(), id: docRef.id }
        artists.push(artist);
      });

      resolve(artists);
    });

  });
}


/* =============================================================================

============================================================================= */



export function saveCommentToFirestore(commentText, songId){
  firebase.auth().onAuthStateChanged(user => {
    if (user){
      const commentCollection = firestoreDb.collection(`comments`);
      const userName          = user.displayName ? user.displayName : 'Anonymous';


      commentCollection.add({
        userId:      user.uid,
        userName:    userName,
        songId:      songId,
        commentText: commentText,
        date:        Date.now()
      })


      .then(() => {
        console.log('Comment successfully added to firestore.');
      })


      .catch(err => {
        console.error('There was an error when trying to add your comment to firestore: ', err);
      });

    } //End of if (user){ ... }
  }); //End of firebase.auth().onAuthStateChanged( ... );
}


/* =============================================================================

============================================================================= */


export function getCommentsForSong(songId){
  return new Promise(resolve => {
    const commentCollection = firestoreDb.collection('comments').where("songId", "==", songId);
    const comments          = [];


    commentCollection.get()
    .then(snapshot => {
      snapshot.forEach(comment => { comments.push(comment.data()); });
      resolve(comments);
    });
  });
}



/**/
