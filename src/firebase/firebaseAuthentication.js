import firebase from 'firebase/app';
import 'firebase/auth';




export function googleSignin(){
  //https://firebase.google.com/docs/auth/web/google-signin
  const provider = new firebase.auth.GoogleAuthProvider();
  //You can also sign in with a redirect which is recommended for mobile phones.
  //firebase.auth().signInWithRedirect(provider);
  firebase.auth().signInWithPopup(provider)
  .then((result) => {
    //We probably will eventually redirect to some other page.
    console.log("Successfully Logged In: ", result.user.displayName);
  })

  .catch(err => {
    console.log("There was an error when signing in with Google: ", err);
  });
}


/* =============================================================================

============================================================================= */


export function facebookSignin(){
  console.log("facebookSignin() called.");
  const provider = new firebase.auth.FacebookAuthProvider();

  firebase.auth().signInWithPopup(provider)
  .then((result) => {
    //We probably will eventually redirect to some other page.
    console.log("Successfully Logged In: ", result.user.displayName);
  })

  .catch(err => {
    console.log("There was an error when signing in with Facebook: ", err);
  });
}


/* =============================================================================

============================================================================= */


export function emailSignin(email, password){
  firebase.auth().signInWithEmailAndPassword(email, password)
  .then(() => {
    const emailLoginForm = document.getElementById('email-login-form');
    emailLoginForm.reset();
    console.log("User successfully signed in with email and password.");
  })

  .catch(err => {
    alert(err.message);
    console.log(err.message);
  });
}


/* =============================================================================

============================================================================= */


export function createEmailSigninAccount(email, password){

  firebase.auth().createUserWithEmailAndPassword(email, password)
  .then(() => {
    const emailRegisterForm = document.getElementById('email-register-form');
    emailRegisterForm.reset();
    console.log("User successfully registered with email and password.");
  })

  .catch(err => {
    alert(err.message);
    console.log(err.message);
  });
}


/* =============================================================================

============================================================================= */
//This function will be called from index.js which runs on every page load.
//However, we don't want to sign people in anonymously if they're already signed in,
//or authenticated using some other method. Thus we wrap the code in the
//firebase.auth().onAuthStateChanged() and only sign in anonymously if !user.


export function anonymousSignin(){
  firebase.auth().onAuthStateChanged(user => {
    if (!user){
      firebase.auth().signInAnonymously()

      .then(() => {
        console.log("User successfully signed in anonymously.")
      })

      .catch(err => {
        console.log("There was an error while signing in anonymously.");
        console.log(err.message);
      });
    }
  });
}




/* =============================================================================

============================================================================= */


export function signOut(){
  firebase.auth().signOut()
  .then(() => { console.log("User successfully signed out."); })
  .catch(err => { console.log(err); });
}
