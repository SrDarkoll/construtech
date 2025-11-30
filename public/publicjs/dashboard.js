

import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc, query, orderBy, limit, where, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { auth, db } from './firebaseConfig.js';
import { showToast } from './toast.js';
import { showConfirmModal } from './modal.js';
export { auth, db };

const logoutBtn = document.getElementById('logoutBtn');
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');

// Función de seguridad JIT (Just-In-Time) para verificar rol antes de acciones críticas
async function checkAdminRole() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = "../index.html";
        return false;
    }
    try {
        const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
        if (userDoc.exists() && userDoc.data().rol === 'admin') {
            return true;
        } else {
            console.warn("Seguridad: Intento de acción no autorizada (Rol revocado).");
            showToast("Acceso denegado: Tus permisos de administrador han sido revocados.", "error");
            setTimeout(() => {
                window.location.href = "catalogo.html";
            }, 2000);
            return false;
        }
    } catch (error) {
        console.error("Error verificando rol JIT:", error);
        return false;
    }
}

const clientesTableBody = document.getElementById('clientesTableBody');
const addClienteBtn = document.getElementById('addClienteBtn');
const clienteModal = document.getElementById('clienteModal');
const clienteForm = document.getElementById('clienteForm');
let editingClientId = null;

const addProyectoBtn = document.getElementById('addProyectoBtn');
const proyectoModal = document.getElementById('proyectoModal');
const proyectoForm = document.getElementById('proyectoForm');
const clienteProyectoSelect = document.getElementById('clienteProyecto');
let editingProyectoId = null;

const administradoresTableBody = document.getElementById('administradoresTableBody');
const addAdminBtn = document.getElementById('addAdminBtn');
const adminModal = document.getElementById('adminModal');
const adminForm = document.getElementById('adminForm');
let editingAdminId = null;

// Search input (header)
const searchInput = document.querySelector('.search-bar input');

const closeButtons = document.querySelectorAll('.close');
const cancelButtons = document.querySelectorAll('.cancel-btn');

// Notificaciones
const bell = document.querySelector(".notifications .fa-bell");
const badge = document.querySelector(".notification-badge");
const modalSolicitudes = document.getElementById("solicitudesModal");
const closeModal = document.querySelector(".close-solicitudes");
const listaSolicitudes = document.getElementById("listaSolicitudes");

function showModal(modal) {
    modal.style.display = 'block';
}

function hideModal(modal) {
    modal.style.display = 'none';
    const form = modal.querySelector('form');
    if (form) form.reset();
    // si cerramos el modal de cliente, resetear edición
    if (modal === clienteModal) {
        editingClientId = null;
        const title = clienteModal.querySelector('h2');
        if (title) title.textContent = 'Nuevo Cliente';
        const submitBtn = clienteModal.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Guardar';
    }
    // si cerramos el modal de proyecto, resetear edición
    if (modal === proyectoModal) {
        editingProyectoId = null;
        const title = proyectoModal.querySelector('h2');
        if (title) title.textContent = 'Nuevo Proyecto';
        const submitBtn = proyectoModal.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Guardar';
    }
}

function showSection(sectionId) {
    sections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

    navItems.forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
}

navItems.forEach(item => {
    item.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!(await checkAdminRole())) return;
        const sectionId = item.getAttribute('data-section');
        showSection(sectionId);
        if (sectionId === 'clientes') cargarClientes();
        if (sectionId === 'proyectos') cargarProyectos();
        if (sectionId === 'administradores') cargarAdministradores();
        // Cargar solicitudes 
    });
});

closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        const modal = button.closest('.modal');
        hideModal(modal);
    });
});

cancelButtons.forEach(button => {
    button.addEventListener('click', () => {
        const modal = button.closest('.modal');
        hideModal(modal);
    });
});

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../index.html";
    } else {
        try {
            const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
            if (userDoc.exists() && userDoc.data().rol === 'admin') {
                cargarResumen();
                cargarClientes();
                cargarProyectos();
                // Cargar solicitudes 

                // LISTENER EN TIEMPO REAL:
                // Si el rol cambia en la base de datos mientras el usuario está conectado,
                // lo detectamos inmediatamente y lo expulsamos sin esperar a que haga clic.
                onSnapshot(doc(db, 'usuarios', user.uid), (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.rol !== 'admin') {
                            console.warn("Permisos revocados en tiempo real.");
                            showToast("Tus permisos han sido revocados.", "error");
                            setTimeout(() => {
                                window.location.href = "catalogo.html";
                            }, 1000);
                        }
                    } else {
                        // Si el documento del usuario es borrado
                        window.location.href = "catalogo.html";
                    }
                });

            } else {
                // Si no es admin, redirigir (redundancia con authGuard)
                window.location.href = "catalogo.html";
            }
        } catch (error) {
            console.error("Error verificando permisos en dashboard:", error);
            window.location.href = "catalogo.html";
        }
    }
});

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = "../index.html";
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            showToast("Error al cerrar sesión", 'error');
        }
    });
}

// --- Event listeners para notificaciones ---
if (bell) {
    bell.addEventListener("click", async () => {
        if (modalSolicitudes) {

            const isOpen = modalSolicitudes.classList.contains('modal-open');
            if (isOpen) {
                modalSolicitudes.style.display = "none";
                modalSolicitudes.classList.remove('modal-open');
            } else {
                await cargarSolicitudes(); // Cargar solicitudes cuando se abre modal
                modalSolicitudes.style.display = "block";
                modalSolicitudes.classList.add('modal-open');
            }
        }
    });
}

if (closeModal) {
    closeModal.addEventListener("click", () => {
        if (modalSolicitudes) {
            modalSolicitudes.style.display = "none";
            modalSolicitudes.classList.remove('modal-open');
        }
    });
}

// Cerrar modal de solicitudes al hacer clic fuera
if (modalSolicitudes) {
    window.addEventListener("click", (event) => {
        if (event.target === modalSolicitudes) {
            modalSolicitudes.style.display = "none";
            modalSolicitudes.classList.remove('modal-open');
        }
    });
}


addClienteBtn.addEventListener('click', async () => {
    if (!(await checkAdminRole())) return;
    showModal(clienteModal);
    setupClienteInputValidation();
});

// Validaciones en tiempo real para formulario de cliente
function setupClienteInputValidation() {
    const nombreInput = document.getElementById('nombre');
    const telefonoInput = document.getElementById('telefono');
    const emailInput = document.getElementById('email');
    const direccionInput = document.getElementById('direccion');

    // Nombre: Solo letras y espacios
    if (nombreInput) {
        nombreInput.addEventListener('input', (e) => {
            let value = e.target.value;
            value = value.replace(/[^a-záéíóúñ\s]/gi, '');
            e.target.value = value;
        });
    }

    // Teléfono: Solo números, máximo 10
    if (telefonoInput) {
        telefonoInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) {
                value = value.slice(0, 10);
            }
            e.target.value = value;
        });
    }
}

clienteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!(await checkAdminRole())) return;
    const submitBtn = clienteForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const clienteData = {
        nombre: document.getElementById('nombre').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        email: document.getElementById('email').value.trim(),
        direccion: document.getElementById('direccion').value.trim()
    };

    // Validar nombre: más de 2 letras, solo letras y espacios
    const nameRegex = /^[a-záéíóúñ\s]{3,}$/i;
    if (!nameRegex.test(clienteData.nombre)) {
        showToast("Nombre: solo letras, mínimo 3 caracteres", 'warn');
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    // Validar teléfono: exactamente 10 dígitos
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(clienteData.telefono)) {
        showToast("Teléfono: exactamente 10 dígitos", 'warn');
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (clienteData.email && !emailRegex.test(clienteData.email)) {
        showToast("Email no válido", 'warn');
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    // Validar dirección: más de 6 caracteres
    if (clienteData.direccion.length < 6) {
        showToast("Dirección: mínimo 6 caracteres", 'warn');
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    try {
        if (editingClientId) {
            // editar cliente existente
            await updateDoc(doc(db, 'clientes', editingClientId), {
                ...clienteData,
                updatedAt: new Date()
            });
            showToast('Cliente actualizado correctamente', 'success');
        } else {
            // crear nuevo cliente
            await addDoc(collection(db, "clientes"), { ...clienteData, createdAt: new Date() });
            showToast("Cliente agregado correctamente", 'success');
        }
        hideModal(clienteModal);
        cargarClientes();
        cargarResumen();
    } catch (error) {
        console.error("Error guardando cliente:", error);
        showToast("Error guardando cliente", 'error');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
});

if (addProyectoBtn) {
    addProyectoBtn.addEventListener('click', async () => {
        if (!(await checkAdminRole())) return;
        await poblarSelectClientes();
        showModal(proyectoModal);
        setupProyectoInputValidation();
    });
}

// Validaciones en tiempo real para formulario de proyecto
function setupProyectoInputValidation() {
    const nombreProyecto = document.getElementById('nombreProyecto');

    // Nombre proyecto: Solo letras y espacios
    if (nombreProyecto) {
        nombreProyecto.addEventListener('input', (e) => {
            let value = e.target.value;
            value = value.replace(/[^a-záéíóúñ\s]/gi, '');
            e.target.value = value;
        });
    }
}

if (proyectoForm) {
    proyectoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!(await checkAdminRole())) return;
        try {
            const nombreProyecto = document.getElementById('nombreProyecto').value.trim();

            // Validar nombre del proyecto
            const nameRegex = /^[a-záéíóúñ\s]{3,}$/i;
            if (!nameRegex.test(nombreProyecto)) {
                showToast("Nombre proyecto: solo letras, mínimo 3 caracteres", 'warn');
                return;
            }

            const proyectoData = {
                nombre: nombreProyecto,
                clienteId: clienteProyectoSelect ? clienteProyectoSelect.value : null,
                fechaInicio: document.getElementById('fechaInicio').value,
                duracionMeses: parseInt(document.getElementById('duracion').value, 10),
                presupuesto: parseFloat(document.getElementById('presupuesto').value),
                descripcion: document.getElementById('descripcion').value
            };

            const submitBtnP = proyectoForm.querySelector('button[type="submit"]');
            if (submitBtnP) submitBtnP.disabled = true;
            try {
                if (editingProyectoId) {
                    // Editar proyecto existente
                    await updateDoc(doc(db, 'proyectos', editingProyectoId), {
                        ...proyectoData,
                        updatedAt: new Date()
                    });
                    showToast('Proyecto actualizado correctamente', 'success');
                    editingProyectoId = null;
                    const title = proyectoModal.querySelector('h2');
                    const btn = proyectoModal.querySelector('button[type="submit"]');
                    if (title) title.textContent = 'Nuevo Proyecto';
                    if (btn) btn.textContent = 'Guardar';
                } else {
                    // Crear nuevo proyecto
                    proyectoData.createdAt = new Date();
                    await addDoc(collection(db, 'proyectos'), proyectoData);
                    showToast('Proyecto agregado correctamente', 'success');
                }
                hideModal(proyectoModal);
                cargarProyectos();
                cargarResumen();
            } catch (error) {
                console.error('Error al guardar proyecto:', error);
                showToast('Error al guardar proyecto', 'error');
            } finally {
                if (submitBtnP) submitBtnP.disabled = false;
            }
        } catch (error) {
            console.error('Error al guardar proyecto (preparación):', error);
            showToast('Error al guardar proyecto', 'error');
        }
    });
}

// ADMINIS
addAdminBtn.addEventListener('click', async () => {
    if (!(await checkAdminRole())) return;
    // Reset form para nuevo admin
    adminForm.reset();
    editingAdminId = null;
    const title = adminModal.querySelector('h2');
    if (title) title.textContent = 'Nuevo Administrador';
    const submitBtn = adminModal.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Guardar';
    showModal(adminModal);
    setupAdminInputValidation();
});

// Cerrar modal de admin
const adminCloseBtn = adminModal.querySelector('.close');
if (adminCloseBtn) {
    adminCloseBtn.addEventListener('click', () => {
        hideModal(adminModal);
        adminForm.reset();
        editingAdminId = null;
    });
}

const adminCancelBtn = adminModal.querySelector('.cancel-btn');
if (adminCancelBtn) {
    adminCancelBtn.addEventListener('click', () => {
        hideModal(adminModal);
        adminForm.reset();
        editingAdminId = null;
    });
}

// Validaciones en tiempo real para formulario de administrador
function setupAdminInputValidation() {
    const adminNombreInput = document.getElementById('adminNombre');

    // Nombre: Solo letras y espacios
    if (adminNombreInput) {
        adminNombreInput.addEventListener('input', (e) => {
            let value = e.target.value;
            value = value.replace(/[^a-záéíóúñ\s]/gi, '');
            e.target.value = value;
        });
    }
}

adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!(await checkAdminRole())) return;

    const submitBtn = adminForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const adminData = {
        nombre: document.getElementById('adminNombre').value.trim(),
        email: document.getElementById('adminEmail').value.trim()
    };

    // Validar nombre
    const nameRegex = /^[a-záéíóúñ\s]{3,}$/i;
    if (!nameRegex.test(adminData.nombre)) {
        showToast("Nombre: solo letras, mínimo 3 caracteres", 'warn');
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminData.email)) {
        showToast("Email no válido", 'warn');
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    try {
        // VERIFICACIÓN 1: El usuario debe existir en la colección 'usuarios'
        const usersRef = collection(db, "usuarios");
        const qUser = query(usersRef, where("email", "==", adminData.email));
        const userSnapshot = await getDocs(qUser);

        if (userSnapshot.empty) {
            showToast("El correo no corresponde a un usuario registrado.", 'error');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        const userDocSnap = userSnapshot.docs[0];
        const userId = userDocSnap.id;

        // VERIFICACIÓN 2: No duplicar en la colección 'administradores' (solo si es nuevo o cambiamos el email)
        // Para simplificar, verificamos si el email ya está en administradores (excluyendo el actual si editamos)
        const adminsRef = collection(db, "administradores");
        const qAdmin = query(adminsRef, where("email", "==", adminData.email));
        const adminSnapshot = await getDocs(qAdmin);

        if (!adminSnapshot.empty) {
            // Si estamos editando, permitir si el admin encontrado es el mismo que estamos editando
            if (editingAdminId) {
                const existingId = adminSnapshot.docs[0].id;
                if (existingId !== editingAdminId) {
                    showToast("Este correo ya está asignado a otro administrador.", 'warn');
                    if (submitBtn) submitBtn.disabled = false;
                    return;
                }
            } else {
                showToast("Este usuario ya es administrador.", 'warn');
                if (submitBtn) submitBtn.disabled = false;
                return;
            }
        }

        if (editingAdminId) {
            // Editar admin existente
            await updateDoc(doc(db, 'administradores', editingAdminId), {
                ...adminData,
                updatedAt: new Date()
            });

            // Asegurar que tenga el rol
            await updateDoc(doc(db, 'usuarios', userId), {
                rol: 'admin'
            });

            showToast('Administrador actualizado correctamente', 'success');
        } else {
            // Crear nuevo admin - Guardamos también el userId para facilitar la eliminación
            await addDoc(collection(db, "administradores"), {
                ...adminData,
                userId: userId, // Guardamos el ID del usuario
                createdAt: new Date()
            });

            // Actualizar rol en usuarios para dar acceso real
            await updateDoc(doc(db, 'usuarios', userId), {
                rol: 'admin'
            });

            showToast("Administrador agregado y permisos asignados", 'success');
        }
        hideModal(adminModal);
        cargarAdministradores();
    } catch (error) {
        console.error("Error guardando administrador:", error);
        showToast("Error: " + error.message, 'error');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
});

async function cargarAdministradores() {
    try {
        administradoresTableBody.innerHTML = "";
        const adminsQuery = query(collection(db, "administradores"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(adminsQuery);
        querySnapshot.forEach((doc) => {
            const admin = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${admin.nombre}</td>
                <td>${admin.email}</td>
                <td>
                    <button class="action-btn edit" data-id="${doc.id}" style="background:#4CAF50; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px; margin-right:5px;">Editar</button>
                    <button class="action-btn delete" data-id="${doc.id}" style="background:#e74c3c; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px;">Eliminar</button>
                </td>
            `;
            administradoresTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error al cargar administradores:", error);
        showToast("Error al cargar la lista de administradores", 'error');
    }
}

// Delegación de eventos para acciones en la tabla de administradores
if (administradoresTableBody) {
    administradoresTableBody.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.dataset.id;
        if (!id) return;

        if (btn.classList.contains('delete')) {
            if (!(await checkAdminRole())) return;
            const confirmed = await showConfirmModal('Eliminar Administrador', '¿Estás seguro de que deseas eliminar este administrador?');
            if (!confirmed) return;
            try {
                console.log("Iniciando eliminación de administrador:", id);
                // Obtener datos del admin antes de eliminar para poder revertir el rol
                const adminSnap = await getDoc(doc(db, 'administradores', id));
                if (adminSnap.exists()) {
                    const adminData = adminSnap.data();
                    console.log("Datos del administrador encontrado:", adminData);

                    let targetUserId = adminData.userId;

                    // Si no tenemos el userId guardado, lo buscamos por email
                    if (!targetUserId && adminData.email) {
                        console.log("Buscando usuario por email:", adminData.email);
                        const usersRef = collection(db, "usuarios");
                        const qUser = query(usersRef, where("email", "==", adminData.email));
                        const userSnapshot = await getDocs(qUser);

                        if (!userSnapshot.empty) {
                            targetUserId = userSnapshot.docs[0].id;
                            console.log("Usuario encontrado por email con ID:", targetUserId);
                        } else {
                            console.warn("No se encontró usuario con ese email en la colección usuarios.");
                        }
                    }

                    if (targetUserId) {
                        // Revertir rol a 'usuario'
                        console.log("Revocando permisos al usuario:", targetUserId);
                        await updateDoc(doc(db, 'usuarios', targetUserId), {
                            rol: 'usuario'
                        });
                        console.log("Permisos revocados exitosamente.");
                    } else {
                        // INTENTO FINAL: Buscar en toda la colección de usuarios (costoso pero necesario si falla lo anterior)
                        console.warn("Búsqueda directa falló. Intentando búsqueda manual en usuarios...");
                        const allUsersSnap = await getDocs(collection(db, "usuarios"));
                        let foundManual = false;
                        for (const uDoc of allUsersSnap.docs) {
                            const uData = uDoc.data();
                            if (uData.email && uData.email.toLowerCase().trim() === adminData.email.toLowerCase().trim()) {
                                console.log("Usuario encontrado manualmente:", uDoc.id);
                                await updateDoc(doc(db, 'usuarios', uDoc.id), {
                                    rol: 'usuario'
                                });
                                console.log("Permisos revocados exitosamente (manual).");
                                foundManual = true;
                                break;
                            }
                        }

                        if (!foundManual) {
                            console.error("CRÍTICO: No se pudo encontrar el usuario para revocar permisos.");
                            showToast("Advertencia: El usuario sigue teniendo permisos de admin (no se encontró su registro).", 'warn');
                        }
                    }
                } else {
                    console.warn("El documento de administrador no existe.");
                }

                await deleteDoc(doc(db, 'administradores', id));
                console.log("Documento de administrador eliminado.");
                showToast('Administrador eliminado y permisos revocados', 'success');
                cargarAdministradores();
            } catch (err) {
                console.error('Error eliminando administrador', err);
                showToast('Error eliminando administrador', 'error');
            }
            return;
        }

        if (btn.classList.contains('edit')) {
            try {
                const snap = await getDoc(doc(db, 'administradores', id));
                if (!snap.exists()) {
                    showToast('Administrador no encontrado', 'warn');
                    return;
                }
                const data = snap.data() || {};
                document.getElementById('adminNombre').value = data.nombre || '';
                document.getElementById('adminEmail').value = data.email || '';
                editingAdminId = id;
                const title = adminModal.querySelector('h2');
                if (title) title.textContent = 'Editar Administrador';
                const submitBtn = adminModal.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.textContent = 'Actualizar';
                showModal(adminModal);
            } catch (err) {
                console.error('Error preparando edición', err);
                showToast('Error preparando edición', 'error');
            }
        }
    });
}

async function poblarSelectClientes() {
    if (!clienteProyectoSelect) return;
    clienteProyectoSelect.innerHTML = '';
    try {
        const clientesQuery = query(collection(db, 'clientes'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(clientesQuery);
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const opt = document.createElement('option');
            opt.value = docSnap.id;
            opt.textContent = data.nombre || data.nombreCliente || 'Cliente';
            clienteProyectoSelect.appendChild(opt);
        });
    } catch (err) {
        console.error('Error cargando clientes para select', err);
    }
}

async function cargarProyectos() {
    const proyectosTableBody = document.getElementById('proyectosTableBody');
    if (!proyectosTableBody) return;
    proyectosTableBody.innerHTML = '';
    try {
        const proyectosQuery = query(collection(db, 'proyectos'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(proyectosQuery);

        const clientesSnap = await getDocs(collection(db, 'clientes'));
        const clientesMap = {};
        clientesSnap.forEach(c => {
            const d = c.data() || {};
            clientesMap[c.id] = d.nombre || d.nombreCliente || null;
        });

        snapshot.forEach(docSnap => {
            const p = docSnap.data();
            const clienteNombre = (p && p.clienteId && clientesMap[p.clienteId]) ? clientesMap[p.clienteId] : (p.clienteId || '-');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${p.nombre || 'Sin nombre'}</td>
                <td>${clienteNombre}</td>
                <td>${p.fechaInicio || '-'}</td>
                <td>${p.duracionMeses || '-'} meses</td>
                <td>$${p.presupuesto || '0'}</td>
                <td>
                    <button class="action-btn project-edit" data-id="${docSnap.id}" style="background:#4CAF50; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px; margin-right:5px;">Editar</button>
                    <button class="action-btn project-delete" data-id="${docSnap.id}" style="background:#e74c3c; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px;">Eliminar</button>
                </td>
            `;
            proyectosTableBody.appendChild(row);
        });

        // Agregar event listeners a botones
        document.querySelectorAll('.project-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!(await checkAdminRole())) return;
                const id = btn.dataset.id;
                const confirmed = await showConfirmModal('Eliminar Proyecto', '¿Estás seguro de que deseas eliminar este proyecto?');
                if (confirmed) {
                    try {
                        await deleteDoc(doc(db, 'proyectos', id));
                        showToast('Proyecto eliminado', 'success');
                        cargarProyectos();
                        cargarResumen();
                    } catch (err) {
                        console.error('Error eliminando proyecto', err);
                        showToast('Error eliminando proyecto', 'error');
                    }
                }
            });
        });

        document.querySelectorAll('.project-edit').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!(await checkAdminRole())) return;
                const id = btn.dataset.id;
                await poblarSelectClientes();
                const proyectoRef = doc(db, 'proyectos', id);
                const proyectoSnap = await getDoc(proyectoRef);
                if (proyectoSnap.exists()) {
                    const p = proyectoSnap.data();
                    document.getElementById('nombreProyecto').value = p.nombre || '';
                    document.getElementById('clienteProyecto').value = p.clienteId || '';
                    document.getElementById('fechaInicio').value = p.fechaInicio || '';
                    document.getElementById('duracion').value = p.duracionMeses || '';
                    document.getElementById('presupuesto').value = p.presupuesto || '';
                    document.getElementById('descripcion').value = p.descripcion || '';

                    // Cambiar modal a modo edición
                    const modal = document.getElementById('proyectoModal');
                    const title = modal.querySelector('h2');
                    const submitBtn = modal.querySelector('button[type="submit"]');
                    title.textContent = 'Editar Proyecto';
                    submitBtn.textContent = 'Actualizar';
                    editingProyectoId = id;
                    showModal(modal);
                }
            });
        });

    } catch (err) {
        console.error('Error cargando proyectos', err);
        showToast('Error al cargar proyectos', 'error');
    }
}

//Funcionalidad de búsqueda
function debounce(fn, wait = 200) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), wait);
    };
}

function applySearch(query) {
    const q = String(query || '').trim().toLowerCase();
    const proyectosTableBody = document.getElementById('proyectosTableBody');

    // Si no hay query mostramos todo
    if (!q) {
        // mostrar filas clientes
        if (clientesTableBody) {
            clientesTableBody.querySelectorAll('tr').forEach(r => r.style.display = '');
        }
        // mostrar proyectos
        if (proyectosTableBody) {
            proyectosTableBody.querySelectorAll('tr').forEach(r => r.style.display = '');
        }
        return;
    }

    const activeSectionEl = document.querySelector('.section.active');
    const active = activeSectionEl ? activeSectionEl.id : null;

    // Filtrar clientes
    if (!active || active === 'clientes') {
        if (clientesTableBody) {
            clientesTableBody.querySelectorAll('tr').forEach(row => {
                const text = (row.innerText || '').toLowerCase();
                row.style.display = text.includes(q) ? '' : 'none';
            });
        }
    }

    // Filtrar proyectos
    if (!active || active === 'proyectos') {
        if (proyectosTableBody) {
            proyectosTableBody.querySelectorAll('tr').forEach(row => {
                const text = (row.innerText || '').toLowerCase();
                row.style.display = text.includes(q) ? '' : 'none';
            });
        }
    }
}

if (searchInput) {
    const handler = debounce((e) => applySearch(e.target.value), 180);
    searchInput.addEventListener('input', handler);

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applySearch(searchInput.value);
        }
    });
}

async function verProyecto(id) {
    if (!detalleProyecto) return;
    try {
        const proyectoRef = doc(db, 'proyectos', id);
        const proyectoSnap = await getDoc(proyectoRef);
        if (!proyectoSnap.exists()) {
            showToast('Proyecto no encontrado', 'warn');
            return;
        }
        const p = proyectoSnap.data() || {};

        let clienteNombre = '-';
        if (p.clienteId) {
            try {
                const clienteSnap = await getDoc(doc(db, 'clientes', p.clienteId));
                if (clienteSnap.exists()) {
                    const cd = clienteSnap.data() || {};
                    clienteNombre = cd.nombre || cd.nombreCliente || clienteSnap.id;
                }
            } catch (err) {
                console.error('Error obteniendo cliente para proyecto', err);
            }
        }

        const infoGrid = detalleProyecto.querySelector('.info-grid');
        if (infoGrid) {
            infoGrid.innerHTML = `
                <div class="info-item"><strong>Nombre:</strong> ${p.nombre || '-'} </div>
                <div class="info-item"><strong>Cliente:</strong> ${clienteNombre}</div>
                <div class="info-item"><strong>Fecha inicio:</strong> ${p.fechaInicio || '-'}</div>
                <div class="info-item"><strong>Duración:</strong> ${p.duracionMeses || '-'} meses</div>
                <div class="info-item"><strong>Presupuesto:</strong> ${p.presupuesto || '-'}</div>
                <div class="info-item"><strong>Descripción:</strong> ${p.descripcion || '-'}</div>
            `;
        }

        const presupuestosBody = document.getElementById('presupuestosTableBody');
        if (presupuestosBody) {
            presupuestosBody.innerHTML = '';
            try {
                let presupQuery;
                try {
                    presupQuery = query(collection(db, 'presupuestos'), where('projectId', '==', id), orderBy('fecha', 'desc'));
                } catch (err) {
                    presupQuery = query(collection(db, 'presupuestos'), where('projectId', '==', id));
                }
                const presSnap = await getDocs(presupQuery);
                presSnap.forEach(ps => {
                    const data = ps.data() || {};
                    const fechaRaw = data.fecha || data.createdAt || null;
                    let fechaStr = '-';
                    if (fechaRaw) {
                        let d = fechaRaw;
                        if (d.toDate) d = d.toDate();
                        else d = new Date(d);
                        fechaStr = d.toLocaleDateString();
                    }
                    const fila = document.createElement('tr');
                    fila.innerHTML = `
                        <td>${data.descripcion || '-'}</td>
                        <td>${fechaStr}</td>
                        <td>${data.monto || '-'}</td>
                        <td>${data.estado || '-'}</td>
                        <td>
                            <button class="action-btn">Ver</button>
                        </td>
                    `;
                    presupuestosBody.appendChild(fila);
                });
            } catch (err) {
                console.error('Error cargando presupuestos del proyecto', err);
                showToast('Error cargando presupuestos', 'error');
            }
        }

        detalleProyecto.style.display = 'block';
        detalleProyecto.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error en verProyecto:', error);
        throw error;
    }
}

async function cargarClientes() {
    try {
        clientesTableBody.innerHTML = "";
        const clientesQuery = query(collection(db, "clientes"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(clientesQuery);
        querySnapshot.forEach((doc) => {
            const cliente = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${cliente.nombre}</td>
                <td>${cliente.telefono}</td>
                <td>${cliente.email || '-'}</td>
                <td>${cliente.direccion}</td>
                <td>
                    <button class="action-btn edit" data-id="${doc.id}" style="background:#4CAF50; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px; margin-right:5px;">Editar</button>
                    <button class="action-btn delete" data-id="${doc.id}" style="background:#e74c3c; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px;">Eliminar</button>
                </td>
            `;
            clientesTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error al cargar clientes:", error);
        showToast("Error al cargar la lista de clientes", 'error');
    }
}

// Delegación de eventos para acciones en la tabla de clientes (editar / eliminar)
if (clientesTableBody) {
    clientesTableBody.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.dataset.id;
        if (!id) return;

        if (btn.classList.contains('delete')) {
            if (!(await checkAdminRole())) return;
            const confirmed = await showConfirmModal('Eliminar Cliente', '¿Estás seguro de que deseas eliminar este cliente?');
            if (!confirmed) return;
            try {
                await deleteDoc(doc(db, 'clientes', id));
                showToast('Cliente eliminado', 'success');
                cargarClientes();
                cargarResumen();
            } catch (err) {
                console.error('Error eliminando cliente', err);
                showToast('Error eliminando cliente', 'error');
            }
            return;
        }

        if (btn.classList.contains('edit')) {
            if (!(await checkAdminRole())) return;
            try {
                const snap = await getDoc(doc(db, 'clientes', id));
                if (!snap.exists()) {
                    showToast('Cliente no encontrado', 'warn');
                    return;
                }
                const data = snap.data() || {};
                document.getElementById('nombre').value = data.nombre || '';
                document.getElementById('telefono').value = data.telefono || '';
                document.getElementById('email').value = data.email || data.correo || '';
                document.getElementById('direccion').value = data.direccion || '';
                editingClientId = id;
                const title = clienteModal.querySelector('h2');
                if (title) title.textContent = 'Editar Cliente';
                const submitBtn = clienteModal.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.textContent = 'Actualizar';
                showModal(clienteModal);
            } catch (err) {
                console.error('Error preparando edición', err);
                showToast('Error preparando edición', 'error');
            }
        }
    });
}

async function cargarResumen() {
    const proyectosEl = document.getElementById('proyectosCount');
    const clientesEl = document.getElementById('clientesCount');
    const presupuestosEl = document.getElementById('presupuestosCount');
    const ingresosEl = document.getElementById('ingresosMensuales');

    try {
        const clientesSnap = await getDocs(collection(db, 'clientes'));
        const clientesList = [];
        clientesSnap.forEach(s => {
            const d = s.data() || {};
            clientesList.push({ id: s.id, nombre: d.nombre || d.nombreCliente || null, createdAt: d.createdAt });
        });
        console.log('Listado de documentos en colección clientes:', clientesList);
        const clientesConNombre = clientesList.filter(c => c.nombre && String(c.nombre).trim() !== '').length;
        if (clientesEl) clientesEl.innerText = String(clientesConNombre);

        const proyectosSnap = await getDocs(collection(db, 'proyectos'));
        const proyectosCount = proyectosSnap.size || 0;
        if (proyectosEl) proyectosEl.innerText = String(proyectosCount);

        let pendientes = 0;
        try {
            const presupuestosSnap = await getDocs(collection(db, 'presupuestos'));
            presupuestosSnap.forEach(docSnap => {
                const data = docSnap.data() || {};
                const estado = (data.estado || '').toString().toLowerCase();
                if (estado === 'pendiente' || estado === 'pending') pendientes++;
            });
        } catch (err) {
            pendientes = 0;
        }
        if (presupuestosEl) presupuestosEl.innerText = String(pendientes);

        let ingresos = 0;
        const now = new Date();
        proyectosSnap.forEach(docSnap => {
            const p = docSnap.data() || {};
            let createdAt = p.createdAt;
            if (!createdAt) return;
            if (createdAt.toDate) createdAt = createdAt.toDate();
            else createdAt = new Date(createdAt);
            if (createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth()) {
                const monto = parseFloat(p.presupuesto) || 0;
                ingresos += monto;
            }
        });
        if (ingresosEl) ingresosEl.innerText = '$' + new Intl.NumberFormat('es-ES').format(ingresos);

    } catch (error) {
        console.error('Error cargando resumen:', error);
    }
}

// Cargar solicitudes
async function cargarSolicitudes() {
    try {
        if (!listaSolicitudes || !badge) {
            console.warn('Elementos de solicitudes no encontrados');
            return;
        }

        const ref = collection(db, "solicitudes");
        const snapshot = await getDocs(ref);

        listaSolicitudes.innerHTML = "";
        badge.innerText = snapshot.size;

        snapshot.forEach(docu => {
            const data = docu.data();

            listaSolicitudes.innerHTML += `
                <div class="solicitud-item">
                    <p><strong>Nombre:</strong> ${data.nombre}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Teléfono:</strong> ${data.telefono}</p>
                    <p><strong>Dirección:</strong> ${data.direccion || '-'}</p>
                    <p><strong>Descripción del Proyecto:</strong> ${data.mensaje || data.proyecto || '-'}</p>

                    <div class="solicitud-actions">
                        <button class="aceptar" data-id="${docu.id}">Aceptar</button>
                        <button class="eliminar" data-id="${docu.id}">Eliminar</button>
                    </div>
                </div>
            `;
        });

        activarBotones();

    } catch (e) {
        console.error("Error cargando solicitudes:", e);
    }
}

// Cargar solicitudes solo cuando se haga clic en la campanita (en el event listener)


// --- Función para activar botones ---
function activarBotones() {

    // BOTÓN ACEPTAR (agrega cliente)
    document.querySelectorAll(".aceptar").forEach(btn => {
        btn.addEventListener("click", async () => {
            if (!(await checkAdminRole())) return;
            const id = btn.dataset.id;

            const ref = doc(db, "solicitudes", id);
            const dataSnap = await getDoc(ref);
            const data = dataSnap.data();

            // Guardamos como cliente
            await addDoc(collection(db, "clientes"), {
                nombre: data.nombre,
                telefono: data.telefono,
                email: data.email,
                direccion: data.direccion || "Sin dirección",
                notas: data.proyecto || data.mensaje || "", // Guardamos la descripción del proyecto como nota
                createdAt: new Date()
            });

            // Eliminamos la solicitud
            await deleteDoc(ref);

            // Actualizar lista de solicitudes, listar clientes y mostrar sección de clientes
            cargarSolicitudes();
            try {
                // mostrar sección clientes para que el admin vea el nuevo registro inmediatamente
                showSection && showSection('clientes');
            } catch (err) {
                console.warn('No se pudo cambiar a la sección clientes automáticamente:', err);
            }
            try {
                cargarClientes();
            } catch (err) {
                console.warn('No se pudo recargar clientes automáticamente:', err);
            }
            try {
                cargarResumen();
            } catch (err) {
                console.warn('No se pudo recargar el resumen automáticamente:', err);
            }

            showToast('Cliente agregado con éxito 🎉', 'success');
        });
    });

    // BOTÓN ELIMINAR
    document.querySelectorAll(".eliminar").forEach(btn => {
        btn.addEventListener("click", async () => {
            if (!(await checkAdminRole())) return;
            const id = btn.dataset.id;

            await deleteDoc(doc(db, "solicitudes", id));
            showToast("Solicitud eliminada", "success");

            cargarSolicitudes();
        });
    });
}

