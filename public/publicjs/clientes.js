import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, addDoc, getDocs, onSnapshot, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { auth, db } from './firebaseConfig.js';
import { showToast } from './toast.js';
import { showConfirmModal, showPromptModal } from './modal.js';

const form = document.getElementById('formAddCliente');
const lista = document.getElementById('listaClientes');
const btnVolver = document.getElementById('btnVolverDashboard');

onAuthStateChanged(auth, user => {
  if (!user) window.location.href = '../index.html';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = form.querySelector('button[type="submit"]');
  const nombre = document.getElementById('cliNombre').value.trim();
  const telefono = document.getElementById('cliTelefono').value.trim();
  const correo = document.getElementById('cliCorreo').value.trim();

  if (!nombre) { showToast('Ingresa el nombre', 'warn'); return; }

  const phoneRegex = /^\+\d{2} \d{3} \d{3} \d{4}$/;
  if (telefono && !phoneRegex.test(telefono)) {
    showToast("El teléfono debe tener el formato: +XX XXX XXX XXXX", 'warn');
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (correo && !emailRegex.test(correo)) {
    showToast("Correo inválido", 'warn');
    return;
  }

  if (submitBtn) submitBtn.disabled = true;
  try {
    await addDoc(collection(db, 'clientes'), {
      nombre,
      telefono,
      correo,
      fechaRegistro: new Date()
    });
    form.reset();
    showToast('Cliente agregado correctamente', 'success');
  } catch (err) {
    console.error('Error al agregar cliente', err);
    showToast('Error al agregar cliente', 'error');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

const q = collection(db, 'clientes');
onSnapshot(q, (snapshot) => {
  lista.innerHTML = '';
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const id = docSnap.id;
    const div = document.createElement('div');
    div.innerHTML = `
      <strong>${data.nombre}</strong> — ${data.telefono || ''} — ${data.correo || ''}
      <button data-id="${id}" class="btn-edit">Editar</button>
      <button data-id="${id}" class="btn-del">Eliminar</button>
    `;
    lista.appendChild(div);
  });
});

lista.addEventListener('click', async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains('btn-del')) {
    const confirmed = await showConfirmModal('Eliminar Cliente', '¿Estás seguro de que deseas eliminar este cliente?');
    if (!confirmed) return;
    await deleteDoc(doc(db, 'clientes', id));
    showToast('Cliente eliminado', 'success');
    return;
  }

  if (e.target.classList.contains('btn-edit')) {
    const nuevoNombre = await showPromptModal('Editar Nombre', 'Ingresa el nuevo nombre del cliente:');
    if (!nuevoNombre) return;
    await updateDoc(doc(db, 'clientes', id), { nombre: nuevoNombre });
    showToast('Nombre actualizado', 'success');
  }
});

btnVolver.addEventListener('click', () => window.location.href = './html/dashboard.html');
