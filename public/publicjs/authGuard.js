import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { auth, db } from './firebaseConfig.js';

onAuthStateChanged(auth, async (user) => {
  const pathname = window.location.pathname.toLowerCase();
  const filename = pathname.split('/').pop();

  if (!user) {
    // Si no hay usuario, redirigir al login si intenta acceder a páginas protegidas
    // Permitimos index.html (login), registro.html y la raíz
    if (filename !== 'index.html' && filename !== 'registro.html' && filename !== '') {
      window.location.href = '../index.html';
    }
  } else {
    // Usuario logueado
    // Si intenta acceder al dashboard, verificar rol estrictamente
    if (filename === 'dashboard.html') {
      try {
        console.log("Verificando permisos de administrador para:", user.email);
        const userDocRef = doc(db, 'usuarios', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          console.log("Rol del usuario:", userData.rol);

          // Verificación estricta del rol
          if (userData.rol !== 'admin') {
            console.warn('Acceso denegado: Usuario no es administrador (Rol actual: ' + userData.rol + ')');
            window.location.href = 'catalogo.html';
          } else {
            console.log("Acceso concedido: Usuario es administrador");
            // Eliminar overlay de carga si existe
            const overlay = document.getElementById('auth-loading-overlay');
            if (overlay) overlay.remove();
          }
        } else {
          console.warn('Acceso denegado: No se encontró registro de usuario en Firestore');
          window.location.href = 'catalogo.html';
        }
      } catch (error) {
        console.error("Error verificando permisos de administrador:", error);
        // En caso de error, por seguridad denegar acceso
        window.location.href = 'catalogo.html';
      }
    }
  }
});