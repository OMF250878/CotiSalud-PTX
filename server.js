const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Sirve todos los archivos estáticos del repo (HTML, CSS, JS, imágenes, etc.)
app.use(express.static(__dirname));

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
