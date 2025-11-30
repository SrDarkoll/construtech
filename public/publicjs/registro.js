import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { auth, db } from './firebaseConfig.js';
import { showToast } from './toast.js';

//VALIDACIONES

const nameInput = document.getElementById("name");
const telInput = document.getElementById("telefono");
const emailInput = document.getElementById("email");
const direccionInput = document.getElementById("direccion");
const passInput = document.getElementById("password");

function setValid(input) {
  input.classList.add("input-valid");
  input.classList.remove("input-invalid");
}

function setInvalid(input) {
  input.classList.add("input-invalid");
  input.classList.remove("input-valid");
}

// Nombre: solo letras, mínimo 2
const nameRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{3,}$/;
nameInput.addEventListener("input", () => {
  nameRegex.test(nameInput.value.trim()) ? setValid(nameInput) : setInvalid(nameInput);
});

// Teléfono: 10 dígitos, opcionalmente con formato
const telRegex = /^(\+?52\s?)?\(?(\d{3})\)?[\s-]?(\d{3})[\s-]?(\d{4})$/;
telInput.addEventListener("input", () => {
  telRegex.test(telInput.value.trim()) ? setValid(telInput) : setInvalid(telInput);
});

// Email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
emailInput.addEventListener("input", () => {
  emailRegex.test(emailInput.value.trim()) ? setValid(emailInput) : setInvalid(emailInput);
});

// Dirección: 8 caracteres mínimo
direccionInput.addEventListener("input", () => {
  direccionInput.value.trim().length >= 8 ? setValid(direccionInput) : setInvalid(direccionInput);
});

// Contraseña: fuerte
const passRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;
passInput.addEventListener("input", () => {
  passRegex.test(passInput.value.trim()) ? setValid(passInput) : setInvalid(passInput);
});
//mostrar contraseña
document.querySelector('.toggle-password').addEventListener('click', (e) => {
  e.preventDefault();
  const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passInput.setAttribute('type', type);
  e.target.classList.toggle('fa-eye');
  e.target.classList.toggle('fa-eye-slash');
});


//REGISTRO
document.getElementById("registerBtn").addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const telefono = telInput.value.trim();
  const email = emailInput.value.trim();
  const direccion = direccionInput.value.trim();
  const password = passInput.value.trim();
  const rol = "usuario";

  // Campos vacíos
  if (!name || !telefono || !email || !direccion || !password) {
    showToast("Completa todos los campos", "error");
    return;
  }

  // Validaciones finales
  if (!nameRegex.test(name)) {
    showToast("El nombre no es válido.", "error");
    return;
  }

  if (!telRegex.test(telefono)) {
    showToast("Teléfono inválido. Debe ser un número de 10 dígitos.", "error");
    return;
  }

  if (!emailRegex.test(email)) {
    showToast("Correo electrónico inválido.", "error");
    return;
  }

  if (direccion.length < 8) {
    showToast("La dirección debe tener mínimo 8 caracteres.", "error");
    return;
  }

  if (!passRegex.test(password)) {
    showToast("La contraseña no cumple los requisitos.", "error");
    return;
  }

  // Terminos
  const terms = document.getElementById("terms");
  if (!terms.checked) {
    showToast("Debes aceptar los términos y condiciones.", "error");
    return;
  }

  // Crear usuario
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "usuarios", user.uid), {
      nombre: name,
      telefono,
      direccion,
      email,
      rol
    });

    showToast("Registro exitoso", "success");
    window.location.href = "../index.html";
  } catch (error) {
    console.error(error);
    let message = "Ocurrió un error al registrarse.";

    switch (error.code) {
      case 'auth/email-already-in-use':
        message = "Este correo electrónico ya está registrado.";
        break;
      case 'auth/invalid-email':
        message = "El correo electrónico no es válido.";
        break;
      case 'auth/weak-password':
        message = "La contraseña es muy débil.";
        break;
      case 'auth/network-request-failed':
        message = "Error de conexión. Verifica tu internet.";
        break;
      case 'auth/operation-not-allowed':
        message = "El registro no está habilitado temporalmente.";
        break;
      default:
        // Si es otro error, mostramos un mensaje genérico o el mensaje limpio si es posible
        message = "Error inesperado: " + (error.message || "Inténtalo de nuevo.");
    }
    showToast(message, "error");
  }
});

//MODAL
const modal = document.getElementById("termsModal");
const btn = document.getElementById("openTerms");
const span = document.getElementsByClassName("close-modal")[0];
const acceptBtn = document.getElementById("acceptTermsBtn");
const termsCheckbox = document.getElementById("terms");

if (btn) {
  btn.onclick = function (e) {
    e.preventDefault();
    modal.style.display = "flex";
  };
}

if (span) {
  span.onclick = function () {
    modal.style.display = "none";
  };
}

if (acceptBtn) {
  acceptBtn.onclick = function () {
    termsCheckbox.checked = true;
    modal.style.display = "none";
    showToast("Términos aceptados.", "success");
  };
}

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};
