import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { auth } from './firebaseConfig.js';

onAuthStateChanged(auth, (user) => {
  const pathname = window.location.pathname.toLowerCase();
  const filename = pathname.split('/').pop();
  if (!user) {
    if (filename !== 'index.html' && filename !== 'registro.html' && filename !== '' ) {
      window.location.href = 'index.html';
    }
  }
});