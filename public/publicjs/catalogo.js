import { db } from "./firebaseConfig.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Estados de validación
const validationStates = {
  nombre: false,
  email: false,
  direccion: false,
  telefono: true, // Opcional
  mensaje: false
};

document.addEventListener('DOMContentLoaded', function () {
  initializeProjectCards();
  initializeContactForm();
  initializeSmoothScroll();
  initializeMenuToggle();
  initializeFormValidation();
});

function initializeMenuToggle() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function () {
      navLinks.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }
}

// Validaciones de formulario
function initializeFormValidation() {
  const nombreInput = document.getElementById('nombre');
  const emailInput = document.getElementById('email');
  const direccionInput = document.getElementById('direccion');
  const telefonoInput = document.getElementById('telefono');
  const mensajeInput = document.getElementById('mensaje');

  // Nombre: Solo letras y espacios, mínimo 3 caracteres
  if (nombreInput) {
    nombreInput.addEventListener('input', (e) => {
      let value = e.target.value;
      value = value.replace(/[^a-záéíóúñ\s]/gi, '');
      e.target.value = value;
    });

    nombreInput.addEventListener('blur', () => {
      const value = nombreInput.value.trim();
      if (value && !/^[a-záéíóúñ\s]{3,}$/i.test(value)) {
        showFieldError(nombreInput, 'Solo letras, mín 3 caracteres');
        validationStates.nombre = false;
      } else if (value) {
        clearFieldError(nombreInput);
        validationStates.nombre = true;
      }
    });

    nombreInput.addEventListener('focus', () => {
      clearFieldError(nombreInput);
    });
  }

  // Email: Validación de correo
  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      const value = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        showFieldError(emailInput, 'Email no válido');
        validationStates.email = false;
      } else if (value) {
        clearFieldError(emailInput);
        validationStates.email = true;
      }
    });

    emailInput.addEventListener('focus', () => {
      clearFieldError(emailInput);
    });
  }

  // Dirección: Mínimo 10 caracteres, específica
  if (direccionInput) {
    direccionInput.addEventListener('blur', () => {
      const value = direccionInput.value.trim();
      if (value && value.length < 10) {
        showFieldError(direccionInput, 'Dirección específica, mín 10 caracteres');
        validationStates.direccion = false;
      } else if (value) {
        clearFieldError(direccionInput);
        validationStates.direccion = true;
      }
    });

    direccionInput.addEventListener('focus', () => {
      clearFieldError(direccionInput);
    });
  }

  // Teléfono: Exactamente 10 dígitos u opcional
  if (telefonoInput) {
    telefonoInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 10) {
        value = value.slice(0, 10);
      }
      e.target.value = value;
    });

    telefonoInput.addEventListener('blur', () => {
      const value = telefonoInput.value.trim();
      if (value && value.length !== 10) {
        showFieldError(telefonoInput, 'Teléfono: 10 dígitos exactos');
        validationStates.telefono = false;
      } else {
        clearFieldError(telefonoInput);
        validationStates.telefono = value === '' || value.length === 10;
      }
    });

    telefonoInput.addEventListener('focus', () => {
      clearFieldError(telefonoInput);
    });
  }

  // Mensaje: Entre 20 y 100 caracteres
  if (mensajeInput) {
    mensajeInput.addEventListener('input', () => {
      const value = mensajeInput.value.trim();
      const charCount = value.length;

      if (value && (charCount < 20 || charCount > 100)) {
        showFieldError(mensajeInput, `20-100 caracteres (${charCount}/100)`);
        validationStates.mensaje = false;
      } else if (value) {
        clearFieldError(mensajeInput);
        validationStates.mensaje = true;
      }
    });

    mensajeInput.addEventListener('focus', () => {
      clearFieldError(mensajeInput);
    });
  }
}

function showFieldError(field, message) {
  clearFieldError(field);
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.textContent = message;
  field.parentElement.appendChild(errorDiv);
  field.classList.add('input-error');
}

function clearFieldError(field) {
  const errorDiv = field.parentElement.querySelector('.field-error');
  if (errorDiv) {
    errorDiv.remove();
  }
  field.classList.remove('input-error');
}


function initializeProjectCards() {
  const projectButtons = document.querySelectorAll('.btn-detalles');

  projectButtons.forEach(button => {
    button.addEventListener('click', function (e) {
      e.preventDefault();
      const card = this.closest('.proyecto-card');
      const title = card.querySelector('.card-title').textContent;
      const description = card.querySelector('.card-description').textContent;
      const price = card.querySelector('.precio').textContent;
      const location = card.querySelector('.card-location').textContent;
      const duration = card.querySelector('.duracion').textContent;

      showProjectModal({
        title: title,
        description: description,
        price: price,
        location: location,
        duration: duration
      });
    });
  });
}

function showProjectModal(projectData) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close">&times;</button>
            <h2>${projectData.title}</h2>
            <p class="modal-location"><i class="fas fa-map-marker-alt"></i> ${projectData.location}</p>
            <p>${projectData.description}</p>
            <div class="modal-details">
                <p class="modal-price"><strong>Precio:</strong> ${projectData.price}</p>
                <p class="modal-duration"><strong>Duración:</strong> ${projectData.duration}</p>
            </div>
            <p class="modal-note">Contáctanos para más información y presupuesto personalizado.</p>
            <button class="modal-cta">Solicitar Presupuesto</button>
        </div>
    `;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('.modal-close');
  const ctaBtn = modal.querySelector('.modal-cta');

  closeBtn.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  ctaBtn.addEventListener('click', () => {
    modal.remove();
    document.querySelector('#contacto').scrollIntoView({ behavior: 'smooth' });
  });
}

// CONTACTO
function initializeContactForm() {
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const formData = {
        nombre: document.getElementById('nombre').value.trim(),
        email: document.getElementById('email').value.trim(),
        direccion: document.getElementById('direccion').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        mensaje: document.getElementById('mensaje').value.trim()
      };

      // Verificar que todos los campos requeridos sean válidos
      if (!validationStates.nombre) {
        showNotification('Nombre inválido', 'error');
        return;
      }
      if (!validationStates.email) {
        showNotification('Email inválido', 'error');
        return;
      }
      if (!validationStates.direccion) {
        showNotification('Dirección inválida', 'error');
        return;
      }
      if (!validationStates.telefono) {
        showNotification('Teléfono inválido', 'error');
        return;
      }
      if (!validationStates.mensaje) {
        showNotification('Proyecto: 20-100 caracteres', 'error');
        return;
      }

      if (!formData.nombre || !formData.email || !formData.direccion || !formData.mensaje) {
        showNotification('Completa todos los campos requeridos', 'error');
        return;
      }

      submitContactForm(formData);
    });
  }
}


function filtrarCategoria(cat) {
  const cards = document.querySelectorAll(".proyecto-card");

  cards.forEach(card => {
    const titulo = card.querySelector(".card-title").textContent.toLowerCase();

    if (titulo.includes(cat)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}
// Mostrar categorías al hacer clic
document.querySelectorAll(".mega-menu a[data-cat], .btn-cat-filter[data-cat]").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const categoria = link.dataset.cat;

    // Oculta todas las categorías
    document.querySelectorAll(".categoria").forEach(cat => {
      cat.style.display = "none";
    });

    // Muestra la seleccionada
    document.getElementById("cat-" + categoria).style.display = "block";

    // Cambiar título
    document.getElementById("tituloCategoria").textContent =
      "Proyectos de " + categoria.charAt(0).toUpperCase() + categoria.slice(1);

    // Bajar automáticamente al catálogo
    document.getElementById("disenos").scrollIntoView({ behavior: "smooth" });
  });
});


const proyectosBtn = document.querySelector(".mega-parent > a");
const megaMenu = document.querySelector(".mega-menu");

proyectosBtn.addEventListener("click", (e) => {
  e.preventDefault();

  // alterna mostrar/ocultar
  megaMenu.style.display =
    megaMenu.style.display === "flex" ? "none" : "flex";
});

// Cerrar el menú al hacer clic fuera
document.addEventListener("click", (e) => {
  if (!e.target.closest(".mega-parent")) {
    megaMenu.style.display = "none";
  }
});

async function submitContactForm(formData) {
  try {
    await addDoc(collection(db, "solicitudes"), {
      nombre: formData.nombre,
      email: formData.email,
      telefono: formData.telefono,
      direccion: formData.direccion,
      proyecto: formData.mensaje,
      mensaje: formData.mensaje,
      fecha: new Date()
    });

    showNotification("¡Solicitud enviada con éxito!", "success");
    document.getElementById("contactForm").reset();
    validationStates.nombre = false;
    validationStates.email = false;
    validationStates.direccion = false;
    validationStates.telefono = true;
    validationStates.mensaje = false;

  } catch (error) {
    console.error("Error al enviar solicitud:", error);
    showNotification("Error al enviar solicitud", "error");
  }
}


// ============ NOTIFICATIONS ============
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 4000);
}

// ============ SMOOTH SCROLL ============
function initializeSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const href = this.getAttribute('href');
      if (!href || href === "#") return;  // ignora enlaces vacíos o "#"
      const target = document.querySelector(href);

      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}
