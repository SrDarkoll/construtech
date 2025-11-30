
# Construtech
Este proyecto es un sitio web que muestra un catálogo interactivo de diseños divididos por categorías (Residenciales, Salas, Cocinas, Baños).  
Incluye un formulario de contacto totalmente funcional, para cuminicarse con el administrador, el administrador tiene su propia vista con un dashboard para poder gestionar sus clientes, proyectos y más administradores


## Tech Stack

**cliente:** HTML5, CSS3, Google fonts

**Server:** Node.js, Javascript, Firebase 11.1, Firebase Firestore, Express.js, Firebase SDK


## Features

- Inicio sesión seguro
- Restricción de vistas  
- Gestion de clientes
- Carga automatica de datos desde firestore
- catalogo de proyectos por categorias
- Dashboard administrativo
- Diseño Responsive
- Sistema de notificaciones
- Smooth Scroll


## Run Locally

Recursos necesarios

- Node.js version 18+
- npm
- firebase (solo si se usa el backend )


```Clonar repositorio
  git clone https://github.com/SrDarkoll/construtech
```

Ir al directorio del proyecto

```bash
  cd Construtech
```

Instalar las dependencias

```bash
  npm install
```
Configure Firebase (only if using local backend)

```Dentro de /functions debe existir 
  firebaseConfig.js
  serviceAccountKey.json
```

Iniciar el server

```bash
  npm start
   se ejecutara  en http://localhost:3000

```

    
## Used By

This project is used by the following companies:

- Negocio de construcciòn

