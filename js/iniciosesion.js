import { auth, db } from './firebaseConfig.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { showToast } from './toast.js';

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");

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
      await signInWithEmailAndPassword(auth, email, password);
      showToast("Inicio de sesión exitoso", 'success');
      window.location.href = "perfil.html";
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
    }
    finally {
      if (loginBtn) loginBtn.disabled = false;
    }
  });
});
