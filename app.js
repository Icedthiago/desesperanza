const express    = require("express");
const mysql2     = require("mysql2/promise");
const bodyParser = require("body-parser");

const app = express();

// Validación de A–Z / a–z
function validarSoloLetras(texto) {
  return /^[A-Za-z]+$/.test(texto);
}

// Limpia etiquetas HTML/PHP
function removeScriptsTags(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>?/gm, "")
    .replace(/<\?php.*?\?>/gs, "");
}

// Conexión con pool usando env vars
const pool = mysql2.createPool({
  host:     process.env.MYSQL_HOST,
  port:     Number(process.env.MYSQL_PORT),
  user:     process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
});

async function checkDb() {
  try {
    const conn = await pool.getConnection();
    console.log(" Conexión a MySQL exitosa");
    conn.release();
  } catch (err) {
    console.error(" Error conectando a MySQL:", err);
  }
}

checkDb();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Crear categoría
app.post("/agregarcategoria", async (req, res) => {
  const nombre = removeScriptsTags(req.body.nombre);

  if (!validarSoloLetras(nombre)) {
    return res
      .status(400)
      .send("El nombre solo puede contener letras (A-Z, a-z).");
  }

  try {
    await pool.query(
      "INSERT INTO categorias (name) VALUES (?)",
      [nombre]
    );
    res.send(`<h1>Nombre guardado:</h1> ${nombre}`);
  } catch (err) {
    console.error("Error al insertar categoría:", err);
    res.status(500).send("Error al conectar con la base de datos");
  }
});

// Listar categorías
app.get("/obtenerCategorias", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM categorias");
    let userHTML = rows
      .map((cat,i) => `<tr><td>${i+1}</td><td>${cat.name}</td></tr>`)
      .join("");

    res.send(`<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Categorías</title></head>
<body>
  <table>${userHTML || "<tr><td>No hay categorías</td></tr>"}</table>
</body>
</html>`);
  } catch (err) {
    console.error("Error al obtener categorías:", err);
    res.status(500).send("Error al obtener las categorías");
  }
});

// Borrar categoría
app.post("/borrarCategoria", async (req, res) => {
  const nombre = removeScriptsTags(req.body.nombre);

  if (!validarSoloLetras(nombre)) {
    return res
      .status(400)
      .send("El nombre solo puede contener letras (A-Z, a-z).");
  }

  try {
    const [result] = await pool.query(
      "DELETE FROM categorias WHERE name = ?",
      [nombre]
    );
    if (result.affectedRows === 0) {
      return res.status(404).send("Categoría no encontrada");
    }
    res.send(`Categoría '${nombre}' borrada correctamente`);
  } catch (err) {
    console.error("Error al borrar categoría:", err);
    res.status(500).send("Error al borrar la categoría");
  }
});

// Editar categoría
app.post("/editarCategoria", async (req, res) => {
  const oldName = removeScriptsTags(req.body.nombre_ant);
  const newName = removeScriptsTags(req.body.nombre_nuevo);

  if (!validarSoloLetras(oldName) || !validarSoloLetras(newName)) {
    return res
      .status(400)
      .send("Los nombres solo pueden contener letras (A-Z, a-z).");
  }

  try {
    const [result] = await pool.query(
      "UPDATE categorias SET name = ? WHERE name = ?",
      [newName, oldName]
    );
    if (result.affectedRows === 0) {
      return res.status(404).send("Categoría no encontrada");
    }
    res.send(`Categoría '${oldName}' renombrada a '${newName}'`);
  } catch (err) {
    console.error("Error al editar categoría:", err);
    res.status(500).send("Error al editar la categoría");
  }
});

// Solo un app.listen al final
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(` Servidor escuchando en el puerto ${PORT}`);
});
