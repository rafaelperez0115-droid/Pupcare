// PupCare — Firebase Config v6
const firebaseConfig = {
  apiKey:            "AIzaSyAk4PzQNaY0n8aEwv4cHHtL-3aF-kZo1hg",
  authDomain:        "pupcarev1.firebaseapp.com",
  projectId:         "pupcarev1",
  storageBucket:     "pupcarev1.firebasestorage.app",
  messagingSenderId: "447957068017",
  appId:             "1:447957068017:web:3963660edd8b9a9265a150"
};
firebase.initializeApp(firebaseConfig);
const auth    = firebase.auth();
const db      = firebase.firestore();
const storage = firebase.storage();
let PET_ID = localStorage.getItem('pupcare_pet_id') || null;
