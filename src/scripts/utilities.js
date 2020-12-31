import firebase from 'firebase/app';
import 'firebase/auth';


import { deleteSongFromFirestore } from '../firebase/firebaseRepository';




export function assignClick(elementId, func){
  const clickElement = document.getElementById(elementId);
  if (clickElement){
    clickElement.addEventListener('click', func);
  }
}


/* =============================================================================

============================================================================= */


export function initializeSigninButtons(){
  const signInButton  = document.getElementById('sign-in-link');
  const signOutButton = document.getElementById('sign-out-link');
  const addSongButton = document.getElementById('add-song-link');
  const mySongsButton = document.getElementById('my-songs-link');

  if(signInButton && signOutButton && addSongButton && mySongsButton){

    firebase.auth().onAuthStateChanged(user => {
      if(user && !user.isAnonymous){
        signInButton.style.display  = 'none';
        signOutButton.style.display = 'block';
        addSongButton.style.display = 'block';
        mySongsButton.style.display = 'block';
      } else {
        signInButton.style.display  = 'block';
        signOutButton.style.display = 'none';
        addSongButton.style.display = 'none';
        mySongsButton.style.display = 'none';

      }
    });
  }
}


/* =============================================================================

============================================================================= */


export function addSong(songsUL, song){
  const li                 = document.createElement("LI");
  li.className             = "list-group-item d-flex align-items-center";


  const h6                 = document.createElement("H6");
  h6.style.flex            = "1";
  h6.className             = "me-2 my-0"
  h6.textContent           = `${song.songTitle} by ${song.songArtist}`;


  const editButton         = document.createElement("BUTTON");
  editButton.className     = "btn btn-outline-primary ml-auto me-2";
  editButton.textContent   = "EDIT";
  editButton.addEventListener('click', function(){
    location.href = `edit-song.html?id=${song.id}`;
  });

  const deleteButton       = document.createElement("BUTTON");
  deleteButton.className   = "btn btn-outline-danger";
  deleteButton.textContent = "DELETE";
  deleteButton.addEventListener('click', function(){
    deleteSongFromFirestore(song.id);
  });


  li.appendChild(h6);
  li.appendChild(editButton);
  li.appendChild(deleteButton);
  songsUL.appendChild(li);
}


/* =============================================================================

============================================================================= */



export function addArtistToList(artistList, artist){
  const li     = document.createElement('LI');
  li.className = "list-group-item text-center";

  const artistLink = document.createElement('A');
  artistLink.setAttribute('href', `/listen.html?userId=${artist.id}`);
  artistLink.textContent = artist.artistName; //https://kellegous.com/j/2013/02/27/innertext-vs-textcontent/

  li.appendChild(artistLink)



  artistList.append(li); //append vs appendChild ???
}



/* =============================================================================

============================================================================= */


export function addCommentToContainer(comment, commentsContainer){
  const commentWrapper = document.createElement('DIV');
  commentWrapper.className = "mb-3 p-3 bg-white border border-dark rounded"


  const date        = new Date(comment.date);
  const displayDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const displayTime = date.toLocaleTimeString('en-US');


  commentWrapper.innerHTML = `
    <p>${comment.commentText}</p>
    <p class="text-end m-0">By ${comment.userName} on ${displayDate} ${displayTime}</p>
  `;

  commentsContainer.append(commentWrapper);
}




//
