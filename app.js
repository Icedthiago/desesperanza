const express = require("express")
const mysql= require("mysql2")
var bodyParser=require('body-parser')
var app=express()
var con=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'n0m3l0',
    database:'desesperanza'
})
con.connect(err => {
    if (err) {
        console.error('Error de conexión:', err);
        return;
    }
    console.log('Conectado a MySQL');
});
    con.query("CREATE DATABASE IF NOT EXISTS desesperanza", (err) => {
        if (err) {
            console.error("Error al crear la base de datos:", err);
            return;
        }
        console.log("Base de datos 'desesperanza' verificada/creada");

        // Ahora conectamos usando la base de datos
        con.changeUser({ database: 'desesperanza' }, (err) => {
            if (err) {
                console.error("Error al seleccionar la base de datos:", err);
                return;
            }
            console.log("Conexión lista con la base de datos 'desesperanza'");
        });
    });

app.use(bodyParser.json())

app.use(bodyParser.urlencoded({
    extended:true
}))

// Función corregida: solo letras A-Z a-z
function validarSoloLetras(texto) {
  return /^[A-Za-z]+$/.test(texto);
}


function removeScriptsTags (html) {
    if (!html) return '';
    return html.replace (/<[^>]*>?/gm,'').replace(/<\?php.*?\?>/gs,'') ;
}

const pool = mysql.createPool({
  host:     process.env.MYSQL_HOST,
  port:     Number(process.env.MYSQL_PORT),
  user:     process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
});

async function init() {
  try {
    const conn = await pool.getConnection();
    console.log("Conexión a MySQL exitosa");
    conn.release();
  } catch (err) {
    console.error("Error de conexión a MySQL:", err);
  }
}

init();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));



app.use(express.static('public'))

app.post('/agregarcategoria',(req,res)=>{
        let nombre= removeScriptsTags (req.body.nombre);
        let id= removeScriptsTags (req.body.id);

        if (!validarSoloLetras(nombre)) {
        return res.status(400).send(" El nombre solo puede contener letras (A-Z, a-z).");
    }

        con.query('INSERT INTO categorias (name) VALUES (?)', [nombre], (err, respuesta, fields) => {
            if (err) {
                console.log("Error al conectar", err);
                return res.status(500).send("Error al conectar");
            }
           
            return res.send(`<h1>Nombre:</h1> ${nombre}`);
        });
   
})

app.listen(10000,()=>{
    console.log('Servidor escuchando en el puerto 10000')
})

//funny consultar 


app.get('/obtenerCategorias',(req,res)=>{
    con.query('select * from categorias', (err,respuesta, fields)=>{
        if(err)return res.status(500).send("Error al obtener los nombres",err);
        var userHTML=``;
        var i=0;

        respuesta.forEach(user => {
            i++;
            userHTML+= `<tr><td>${i}</td><td>${user.name}</td></tr>`;


        });

        return res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
        <title>Lista de Usuarios</title>
    </head>
    <body class="bg-light">
        <div class="container py-5">
            <div class="row justify-content-center">
                <div class="col-md-8">
                    <div class="card shadow-lg border-0 rounded-4">
                        <div class="card-body">
                            <h1 class="card-title text-center mb-4 text-primary">Lista de categorias</h1>
                            <div class="table-responsive">
                                <table class="table table-striped table-hover align-middle">
                                    <thead class="table-success">
                                        <tr>
                                            <th scope="col">#</th>
                                            <th scope="col">Nombre</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${userHTML || '<tr><td colspan="2" class="text-center">No hay usuarios</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                            <div class="text-center mt-3">
                                <a class="btn btn-outline-secondary" href="/">Volver</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
`);


    });
});

app.post('/borrarCategoria', (req, res) => {
    const nombre = removeScriptsTags (req.body.nombre); // El nombre del usuario a eliminar viene en el cuerpo de la solicitud
    con.query('DELETE FROM categorias WHERE name = ?', [nombre], (err, resultado, fields) => {

if (!validarSoloLetras(nombre)) {
        return res.status(400).send(" El nombre solo puede contener letras (A-Z, a-z).");
    }

        if (err) {
            console.error('Error al borrar la categoria:', err);
            return res.status(500).send("Error al borrar la categoria");
        }
        if (resultado.affectedRows == 0) {
            return res.status(404).send("categoria no encontrado");
        }
        return res.send(`categoria con nombre ${nombre} borrado correctamente`);
    });
});

app.post('/editarCategoria', (req, res) => {
const nombre_ant = removeScriptsTags (req.body.nombre_ant);
const nombre_nuevo =removeScriptsTags (req.body.nombre_nuevo);

if (!validarSoloLetras(nombre_ant) || !validarSoloLetras(nombre_nuevo)) {
        return res.status(400).send(" Los nombres solo pueden contener letras (A-Z, a-z).");
    }

con.query('UPDATE categorias SET name = ? WHERE name = ?', [nombre_nuevo, nombre_ant],
    (err, resultado) => {
        if (err) {
            console.error('Error al modificar el usuario', err);
            return res.status(500).send('ERROR 500');
        }
        if (resultado.affectedRows === 0) {
            return res.status(404).send('Error 404 no encontrado');
        }
        return res.send(`Nuevo nombre de usuario ${nombre_nuevo} modificado correctamente`);
    });

    app.listen(process.env.PORT || 10000, () => {
  console.log(
    `Servidor escuchando en el puerto ${process.env.PORT || 10000}`
  );

});
});