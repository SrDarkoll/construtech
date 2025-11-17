

import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { auth, db } from './firebaseConfig.js';
export { auth, db };
import { showToast } from './toast.js';

const logoutBtn = document.getElementById('logoutBtn');
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');

const clientesTableBody = document.getElementById('clientesTableBody');
const addClienteBtn = document.getElementById('addClienteBtn');
const clienteModal = document.getElementById('clienteModal');
const clienteForm = document.getElementById('clienteForm');
let editingClientId = null;

const projectsGrid = document.querySelector('.projects-grid');
const addProyectoBtn = document.getElementById('addProyectoBtn');
const proyectoModal = document.getElementById('proyectoModal');
const proyectoForm = document.getElementById('proyectoForm');
const clienteProyectoSelect = document.getElementById('clienteProyecto');
const detalleProyecto = document.getElementById('detalleProyecto');

const closeButtons = document.querySelectorAll('.close');
const cancelButtons = document.querySelectorAll('.cancel-btn');

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
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = item.getAttribute('data-section');
        showSection(sectionId);
        if (sectionId === 'clientes') cargarClientes();
        if (sectionId === 'proyectos') cargarProyectos();
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

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "index.html";
    } else {
        cargarResumen();
        cargarClientes();
        cargarProyectos();
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = "index.html";
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        showToast("Error al cerrar sesión", 'error');
    }
});

addClienteBtn.addEventListener('click', () => {
    showModal(clienteModal);
});

clienteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = clienteForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    const clienteData = {
        nombre: document.getElementById('nombre').value,
        telefono: document.getElementById('telefono').value,
        email: document.getElementById('email').value,
        direccion: document.getElementById('direccion').value
    };

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
        await poblarSelectClientes();
        showModal(proyectoModal);
    });
}

if (proyectoForm) {
    proyectoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const proyectoData = {
                nombre: document.getElementById('nombreProyecto').value,
                clienteId: clienteProyectoSelect ? clienteProyectoSelect.value : null,
                fechaInicio: document.getElementById('fechaInicio').value,
                duracionMeses: parseInt(document.getElementById('duracion').value, 10),
                presupuesto: parseFloat(document.getElementById('presupuesto').value),
                descripcion: document.getElementById('descripcion').value,
                createdAt: new Date()
            };

            const submitBtnP = proyectoForm.querySelector('button[type="submit"]');
            if (submitBtnP) submitBtnP.disabled = true;
            try {
                await addDoc(collection(db, 'proyectos'), proyectoData);
                hideModal(proyectoModal);
                cargarProyectos();
                cargarResumen();
                showToast('Proyecto agregado correctamente', 'success');
            } catch (error) {
                console.error('Error al agregar proyecto:', error);
                showToast('Error al agregar proyecto', 'error');
            } finally {
                if (submitBtnP) submitBtnP.disabled = false;
            }
        } catch (error) {
            console.error('Error al agregar proyecto (preparación):', error);
            showToast('Error al agregar proyecto', 'error');
        }
    });
}

if (projectsGrid) {
    projectsGrid.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.dataset.id;
        if (!id) return;

        if (btn.classList.contains('project-delete')) {
            if (!confirm('Eliminar proyecto?')) return;
            try {
                await deleteDoc(doc(db, 'proyectos', id));
                cargarProyectos();
                cargarResumen();
                } catch (err) {
                console.error('Errore eliminando proyecto', err);
                showToast('Error eliminando proyecto', 'error');
            }
        }
        if (btn.classList.contains('project-view')) {
            try {
                await verProyecto(id);
            } catch (err) {
                console.error('Error mostrando proyecto', err);
                showToast('Error al mostrar proyecto', 'error');
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
    if (!projectsGrid) return;
    projectsGrid.innerHTML = '';
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
            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                <h3>${p.nombre || 'Sin nombre'}</h3>
                <p><strong>Cliente:</strong> ${clienteNombre}</p>
                <p><strong>Inicio:</strong> ${p.fechaInicio || '-'}</p>
                <p><strong>Duración:</strong> ${p.duracionMeses || '-'} meses</p>
                <p><strong>Presupuesto:</strong> ${p.presupuesto || '-'}</p>
                <div class="project-actions">
                    <button class="action-btn project-view" data-id="${docSnap.id}">Ver</button>
                    <button class="action-btn project-delete" data-id="${docSnap.id}">Eliminar</button>
                </div>
            `;
            projectsGrid.appendChild(card);
        });
        } catch (err) {
        console.error('Error cargando proyectos', err);
        showToast('Error al cargar proyectos', 'error');
    }
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
                    <button class="action-btn edit" data-id="${doc.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" data-id="${doc.id}">
                        <i class="fas fa-trash"></i>
                    </button>
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
clientesTableBody.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (!id) return;

    if (btn.classList.contains('delete')) {
        if (!confirm('Eliminar cliente?')) return;
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
