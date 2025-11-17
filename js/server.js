import http from "http";

const PORT = process.env.PORT || 8080;

// aquí va tu lógica principal:
console.log("Ejecutando mi app JS en Fly.io");

// server mínimo para mantenerla viva:
http.createServer((req, res) => {
  res.end("App corriendo");
}).listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
