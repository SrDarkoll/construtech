// Importar Firebase
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import { auth, db } from './firebaseConfig.js';
import { showToast } from './toast.js';
// Inicializar Firebase
// Manejar registro
document.getElementById("registerBtn").addEventListener("click", async () => {
  const registerBtn = document.getElementById("registerBtn");
  const name = document.getElementById("name").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email = document.getElementById("email").value.trim();
  const direccion = document.getElementById("direccion").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!name || !telefono || !email || !direccion || !password) {
    showToast("Completa todos los campos", 'warn');
    return;
  }

  if (registerBtn) registerBtn.disabled = true;
  try {
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Guardar datos adicionales en Firestore
    await setDoc(doc(db, "usuarios", user.uid), {
      nombre: name,
      telefono: telefono,
      direccion: direccion,
      email: email
    });

    showToast("Registro exitoso", 'success');
    window.location.href = "index.html"; 
  } catch (error) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        showToast('Este correo ya está registrado.', 'error');
        break;
      case 'auth/invalid-email':
        showToast('Correo no válido.', 'error');
        break;
      case 'auth/weak-password':
        showToast('La contraseña debe tener al menos 6 caracteres.', 'warn');
        break;
      default:
        showToast('Error en registro: ' + error.message, 'error');
        break;
    }
    console.error(error);
  }
  finally {
    if (registerBtn) registerBtn.disabled = false;
  }
});
