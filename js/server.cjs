const express = require("express");
const path = require('path');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000; 
const HOST = '0.0.0.0'; 
const ROOT_DIR = path.join(__dirname, '..');

// SERVIR SOLO LA CARPETA PÚBLICA (no exponer nada fuera de public)
app.use(express.static(path.join(ROOT_DIR, "public"), {
    dotfiles: 'deny', // no servir archivos ocultos
    index: false,     // no servir índices de directorio automáticamente
}));

// RUTA RAÍZ
app.get('/', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'public', 'index.html'));
});

// Aceptar rutas sin extensión: /catalogo -> public/html/catalogo.html
app.get('/:page', (req, res, next) => {
    const page = req.params.page;
    // evita interferir con rutas estáticas existentes (css, js, img, publicjs)
    const forbidden = ['css','js','img','publicjs','node_modules','functions','.git'];
    if (forbidden.includes(page)) return next();
    // redirige /pagina -> /pagina.html si existe
    const filePath = path.join(ROOT_DIR, 'public', 'html', `${page}.html`);
    if (fs.existsSync(filePath)) {
        return res.redirect(302, `/${page}.html`);
    }
    return next();
});

// ESTA SIEMPRE VA DESPUÉS
app.get('/:page.html', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'public', 'html', `${req.params.page}.html`));
});

app.listen(PORT, HOST, () => {
    console.log(`Servidor escuchando en http://${HOST}:${PORT}`);
});
