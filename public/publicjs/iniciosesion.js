import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { auth, db } from './firebaseConfig.js';
import { showToast } from './toast.js';

import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const forgotLink = document.querySelector(".forgot-password");

  if (!loginBtn) {
    console.error("No se encontró el botón de inicio de sesión");
    return;
  }

  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      showToast("Por favor ingresa tu correo y contraseña.", 'warn');
      return;
    }

    if (loginBtn) loginBtn.disabled = true;
    try {
      const remember = document.getElementById("remember").checked;
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      showToast("Inicio de sesión exitoso", 'success');
      try {
        const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() || {};
          const rol = (data.rol || data.role || data.Rol || '').toString().toLowerCase();
          console.log('Usuario autenticado:', user.uid, 'rol encontrado:', rol);
          if (['admin', 'administrador', 'administrator', 'superadmin'].includes(rol)) {
            window.location.href = './html/dashboard.html';
            return;
          }
        }
      } catch (err) {
        console.error('Error leyendo rol de usuario:', err);
      }
      // Por defecto, ir a perfil
      window.location.href = "./html/catalogo.html";
    } catch (error) {
      switch (error.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/invalid-email":
          showToast("Correo o contraseña incorrectos.", 'error');
          break;
        case "auth/user-not-found":
          showToast("No existe una cuenta con este correo.", 'error');
          break;
        case "auth/too-many-requests":
          showToast("Demasiados intentos. Intenta más tarde.", 'warn');
          break;
        default:
          showToast("Error en inicio: " + error.message, 'error');
      }
    } finally {
      if (loginBtn) loginBtn.disabled = false;
    }
  });

  // Recuperar contraseña con modal personalizado
  const resetModal = document.getElementById('resetModal');
  const resetForm = document.getElementById('resetForm');
  const resetEmail = document.getElementById('resetEmail');
  const resetMsg = document.getElementById('resetMsg');
  const closeReset = document.querySelector('.close-reset');

  function showResetModal() {
    if (resetModal) {
      resetModal.style.display = 'block';
      resetMsg.textContent = '';
      resetEmail.value = '';
      resetEmail.focus();
    }
  }
  function hideResetModal() {
    if (resetModal) resetModal.style.display = 'none';
  }

  if (forgotLink) {
    forgotLink.addEventListener("click", (e) => {
      e.preventDefault();
      showResetModal();
    });
  }
  if (closeReset) {
    closeReset.addEventListener('click', hideResetModal);
  }
  if (resetModal) {
    resetModal.addEventListener('click', (e) => {
      if (e.target === resetModal) hideResetModal();
    });
  }
  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = resetEmail.value.trim();
      if (!email) {
        resetMsg.textContent = 'Por favor ingresa tu correo.';
        resetMsg.classList.remove('text-success');
        resetMsg.classList.add('text-error');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return;
      }
      resetMsg.textContent = 'Verificando...';
      resetMsg.classList.remove('text-success', 'text-error');
      try {
        // Verificar si el correo existe en la base de datos (Cliente)
        // Requiere reglas de Firestore que permitan 'list' para usuarios no autenticados
        try {
          const usersRef = collection(db, "usuarios");
          const q = query(usersRef, where("email", "==", email));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            throw { code: "custom/user-not-found-in-db" };
          }
        } catch (dbError) {
          // Si es error de permisos, es porque las reglas no permiten leer sin login
          if (dbError.code === "permission-denied" || dbError.message.includes("Missing or insufficient permissions")) {
            console.warn("Falta configurar reglas de Firestore para permitir verificar emails públicamente.");
            // Opcional: Lanzar error para forzar al dev a arreglarlo, o dejar pasar (pero el usuario quiere que NO se envíe si no existe)
            // Dado el requerimiento estricto del usuario ("no debe ser asi"), asumimos que si falla la verificación, NO enviamos.
            throw { code: "custom/permission-error", original: dbError };
          }
          if (dbError.code === "custom/user-not-found-in-db") {
            throw dbError;
          }
          console.error("Error verificando BD:", dbError);
        }

        await sendPasswordResetEmail(auth, email);
        resetMsg.textContent = '✓ Se envió un correo para restablecer tu contraseña. Por favor revisa también tu carpeta de SPAM.';
        resetMsg.classList.remove('text-error');
        resetMsg.classList.add('text-success');
      } catch (error) {
        if (error.code === "custom/user-not-found-in-db" || error.code === "auth/user-not-found") {
          resetMsg.textContent = 'No existe una cuenta con ese correo.';
        } else if (error.code === "custom/permission-error") {
          resetMsg.textContent = 'Error de configuración: No se puede verificar el correo (Permisos).';
        } else if (error.code === "auth/invalid-email") {
          resetMsg.textContent = 'Correo inválido.';
        } else {
          console.error("Error reset password:", error);
          resetMsg.textContent = 'Error al enviar correo: ' + (error.message || error.code);
        }
        resetMsg.classList.remove('text-success');
        resetMsg.classList.add('text-error');
      }
    });
  }

  // Google sign-in
  const googleBtn = document.querySelector('.google-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      googleBtn.disabled = true;
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userRef = doc(db, 'usuarios', user.uid);
        let userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          // New user: create with default role 'user'
          await setDoc(userRef, {
            displayName: user.displayName || '',
            email: user.email || '',
            rol: 'user',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          // Fetch again to be sure (or just use the data we just set)
          userDoc = await getDoc(userRef);
        } else {
          // Existing user: update info but PRESERVE ROLE
          await setDoc(userRef, {
            displayName: user.displayName || '',
            email: user.email || '',
            updatedAt: new Date()
          }, { merge: true });
        }

        // Check role and redirect
        try {
          if (userDoc.exists()) {
            const data = userDoc.data() || {};
            const rol = (data.rol || data.role || data.Rol || '').toString().toLowerCase();
            if (['admin', 'administrador', 'administrator', 'superadmin'].includes(rol)) {
              window.location.href = './html/dashboard.html';
              return;
            }
          }
        } catch (err) {
          console.error('Error leyendo rol después de Google sign-in:', err);
        }

        // Default redirect
        window.location.href = "./html/catalogo.html";
      } catch (error) {
        console.error('Error con Google sign-in:', error);
        showToast('Error al iniciar sesión con Google: ' + (error.message || ''), 'error');
      } finally {
        googleBtn.disabled = false;
      }
    });
  }
});

  function setupPasswordToggle() {
    const toggleBtn = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');

    if (!toggleBtn || !passwordInput) return;

    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isPass = passwordInput.type === 'password';
      passwordInput.type = isPass ? 'text' : 'password';

      const icon = toggleBtn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
      }
    });
  }

  setupPasswordToggle();

