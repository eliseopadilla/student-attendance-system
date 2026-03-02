// =========================================================
//  BACKEND COMPLETO – Control de Asistencias
// =========================================================
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); 

// =========================================================
//  CONEXIÓN A BASE DE DATOS
// =========================================================
const db = mysql.createConnection({
    host: "",
    user: "",
    password: "",
    database: "control_asistencias_db"
}); 


db.connect(err => {
    if (err) {
        console.error("Error conectando a MySQL:", err);
        return;
    }
    console.log("Conectado a MySQL");
});

// =========================================================
//  ENDPOINTS
// =========================================================

// ===================== GRUPOS =============================
app.get("/api/grupos", (req, res) => {
    db.query("SELECT * FROM grupos", (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Crear grupo
app.post("/api/grupos", (req, res) => {
    const { nombre_grupo, grado, turno } = req.body;
    db.query(
        "INSERT INTO grupos (nombre_grupo, grado, turno) VALUES (?, ?, ?)",
        [nombre_grupo, grado, turno],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Grupo creado", id: result.insertId });
        }
    );
});

// Editar grupo
app.put("/api/grupos/:id", (req, res) => {
    const { nombre_grupo, grado, turno } = req.body;
    db.query(
        "UPDATE grupos SET nombre_grupo = ?, grado = ?, turno = ? WHERE id_grupo = ?",
        [nombre_grupo, grado, turno, req.params.id],
        err => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Grupo actualizado" });
        }
    );
});

// Eliminar grupo
app.delete("/api/grupos/:id", (req, res) => {
    db.query(
        "DELETE FROM grupos WHERE id_grupo = ?",
        [req.params.id],
        err => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Grupo eliminado" });
        }
    );
});

// ===================== ALUMNOS ============================

// Obtener todos los alumnos con nombre de grupo
app.get("/api/alumnos", (req, res) => {
    const sql = `
        SELECT 
            a.*, 
            g.nombre_grupo AS grupo
        FROM alumnos a
        LEFT JOIN grupos g ON a.grupo_id = g.id_grupo
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Obtener alumno por ID
app.get("/api/alumnos/:id", (req, res) => {
    db.query(
        "SELECT * FROM alumnos WHERE id_alumno = ?",
        [req.params.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err });
            res.json(results[0]);
        }
    );
});

// Crear alumno
app.post("/api/alumnos", (req, res) => {
    const { nombre, apellido, matricula, grupo_id, status } = req.body;

    console.log("Datos recibidos:", req.body);  

    db.query(
        "INSERT INTO alumnos (nombre, apellido, matricula, grupo_id, status) VALUES (?, ?, ?, ?, ?)",
        [nombre, apellido, matricula, grupo_id, status],
        (err, results) => {
            
            if (err) {
                console.log("ERROR AL INSERTAR:", err); 
                return res.status(500).json({ error: err });
            }

            res.json({
                message: "Alumno registrado",
                id: results.insertId
            });
        }
    );
});


// Editar alumno
app.put("/api/alumnos/:id", (req, res) => {
    const { nombre, apellido, matricula, grupo_id, status } = req.body;

    db.query(
        `UPDATE alumnos SET 
            nombre = ?, apellido = ?, matricula = ?, grupo_id = ?, status = ?
         WHERE id_alumno = ?`,
        [nombre, apellido, matricula, grupo_id, status, req.params.id],
        err => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Alumno actualizado" });
        }
    );
});

// Eliminar alumno
app.delete("/api/alumnos/:id", (req, res) => {
    db.query(
        "DELETE FROM alumnos WHERE id_alumno = ?",
        [req.params.id],
        err => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Alumno eliminado" });
        }
    );
});

// ===================== CLASES =============================
app.get("/api/clases", (req, res) => {
    const sql = `
        SELECT c.*, 
               u.nombre AS docente,
               g.nombre_grupo AS grupo
        FROM clases c
        INNER JOIN usuarios u ON c.id_docente = u.id_usuario
        INNER JOIN grupos g ON c.id_grupo = g.id_grupo
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// ===================== ASISTENCIAS ========================

// Obtener todas las asistencias
app.get("/api/asistencias", (req, res) => {
    const sql = `
        SELECT 
            asis.*, 
            a.nombre AS alumno, 
            a.apellido,
            c.nombre_clase,
            u.nombre AS registrado_por_nombre
        FROM asistencias asis
        INNER JOIN alumnos a ON asis.id_alumno = a.id_alumno
        INNER JOIN clases c ON asis.id_clase = c.id_clase
        INNER JOIN usuarios u ON asis.registrado_por = u.id_usuario
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Crear asistencia
app.post("/api/asistencias", (req, res) => {
    const { id_alumno, id_clase, fecha, hora, estado, registrado_por } = req.body;

    db.query(
        `INSERT INTO asistencias 
        (id_alumno, id_clase, fecha, hora, estado, registrado_por)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [id_alumno, id_clase, fecha, hora, estado, registrado_por],
        (err) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Asistencia registrada" });
        }
    );
});

// Obtener asistencia por ID
app.get("/api/asistencias/:id", (req, res) => {
    db.query(
        `SELECT * FROM asistencias WHERE id_asistencia = ?`,
        [req.params.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err });
            res.json(results[0]);
        }
    );
});

// Editar asistencia
app.put("/api/asistencias/:id", (req, res) => {
    const { id_alumno, id_clase, fecha, hora, estado } = req.body;
    db.query(
        `UPDATE asistencias SET id_alumno=?, id_clase=?, fecha=?, hora=?, estado=? 
         WHERE id_asistencia=?`,
        [id_alumno, id_clase, fecha, hora, estado, req.params.id],
        err => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Asistencia actualizada" });
        }
    );
});

// Eliminar asistencia
app.delete("/api/asistencias/:id", (req, res) => {
    db.query(
        "DELETE FROM asistencias WHERE id_asistencia = ?",
        [req.params.id],
        err => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Asistencia eliminada" });
        }
    );
});

// ===================== JUSTIFICACIONES ====================
app.get("/api/justificaciones", (req, res) => {
    db.query("SELECT * FROM justificaciones", (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Crear justificación
app.post("/api/justificaciones", (req, res) => {
    const { id_asistencia, motivo, archivo_url } = req.body;
    db.query(
        "INSERT INTO justificaciones (id_asistencia, motivo, archivo_url) VALUES (?, ?, ?)",
        [id_asistencia, motivo, archivo_url],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Justificación registrada", id: result.insertId });
        }
    );
});

// Obtener justificación por ID
app.get("/api/justificaciones/:id", (req, res) => {
    db.query(
        "SELECT * FROM justificaciones WHERE id_justificacion = ?",
        [req.params.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err });
            res.json(results[0]);
        }
    );
});

// Editar justificación
app.put("/api/justificaciones/:id", (req, res) => {
    const { motivo, archivo_url } = req.body;
    db.query(
        "UPDATE justificaciones SET motivo=?, archivo_url=? WHERE id_justificacion=?",
        [motivo, archivo_url, req.params.id],
        err => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Justificación actualizada" });
        }
    );
});

// Eliminar justificación
app.delete("/api/justificaciones/:id", (req, res) => {
    db.query(
        "DELETE FROM justificaciones WHERE id_justificacion = ?",
        [req.params.id],
        err => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Justificación eliminada" });
        }
    );
});


// ===================== USUARIOS ===========================
app.get("/api/usuarios", (req, res) => {
    db.query("SELECT id_usuario, nombre, apellido, email, password_hash, rol FROM usuarios", (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});


// Crear usuario
app.post("/api/usuarios", (req, res) => {
    const { nombre, apellido, email, password_hash, rol } = req.body;
    db.query(
        "INSERT INTO usuarios (nombre, apellido, email, password_hash, rol) VALUES (?, ?, ?, ?, ?)",
        [nombre, apellido, email, password_hash, rol],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Usuario creado", id: result.insertId });
        }
    );
});

// Editar usuario
app.put("/api/usuarios/:id", (req, res) => {
    const { nombre, apellido, email, rol } = req.body;
    db.query(
        "UPDATE usuarios SET nombre=?, apellido=?, email=?, rol=? WHERE id_usuario=?",
        [nombre, apellido, email, rol, req.params.id],
        err => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Usuario actualizado" });
        }
    );
});

// Eliminar usuario
app.delete("/api/usuarios/:id", (req, res) => {
    db.query(
        "DELETE FROM usuarios WHERE id_usuario = ?",
        [req.params.id],
        err => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Usuario eliminado" });
        }
    );
});

// ===================== CODIGOS ASISTENCIA =================
app.get("/api/codigos", (req, res) => {
    db.query(
        `SELECT c.*, a.nombre, a.apellido
         FROM codigos_asistencia c
         INNER JOIN alumnos a ON c.id_alumno = a.id_alumno`,
         (err, results) => {
            if (err) return res.status(500).json({ error: err });
            res.json(results);
         }
    );
});

// Crear código
app.post("/api/codigos", (req, res) => {
    const { id_alumno, codigo_unico } = req.body;
    db.query(
        "INSERT INTO codigos_asistencia (id_alumno, codigo_unico) VALUES (?, ?)",
        [id_alumno, codigo_unico],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Código generado", id: result.insertId });
        }
    );
});

// Obtener por ID
app.get("/api/codigos/:id", (req, res) => {
    db.query(
        "SELECT * FROM codigos_asistencia WHERE id_codigo = ?",
        [req.params.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err });
            res.json(results[0]);
        }
    );
});

// Editar código
app.put("/api/codigos/:id", (req, res) => {
    const { codigo_unico } = req.body;
    db.query(
        "UPDATE codigos_asistencia SET codigo_unico=? WHERE id_codigo=?",
        [codigo_unico, req.params.id],
        err => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Código actualizado" });
        }
    );
});

// Eliminar código
app.delete("/api/codigos/:id", (req, res) => {
    db.query(
        "DELETE FROM codigos_asistencia WHERE id_codigo = ?",
        [req.params.id],
        err => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Código eliminado" });
        }
    );
});

// Crear clase
app.post("/api/clases", (req, res) => {
    const { nombre_clase, id_docente, id_grupo } = req.body;

    db.query(
        "INSERT INTO clases (nombre_clase, id_docente, id_grupo) VALUES (?, ?, ?)",
        [nombre_clase, id_docente, id_grupo],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Clase creada", id: result.insertId });
        }
    );
});

// Editar una clase
app.put("/api/clases/:id", (req, res) => {
    const { nombre_clase, id_docente, id_grupo } = req.body;

    db.query(
        "UPDATE clases SET nombre_clase = ?, id_docente = ?, id_grupo = ? WHERE id_clase = ?",
        [nombre_clase, id_docente, id_grupo, req.params.id],
        err => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Clase actualizada" });
        }
    );
});

// Obtener clases por docente
app.get("/api/clases/docente/:id", (req, res) => {
    const sql = `
        SELECT c.*, g.nombre_grupo, g.grado, g.turno
        FROM clases c
        INNER JOIN grupos g ON c.id_grupo = g.id_grupo
        WHERE c.id_docente = ?
    `;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});


// Eliminar clase
app.delete("/api/clases/:id", (req, res) => {
    db.query(
        "DELETE FROM clases WHERE id_clase = ?",
        [req.params.id],
        err => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Clase eliminada" });
        }
    );
});


// =========================================================
//  SERVIDOR
// =========================================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✔ Servidor corriendo en http://localhost:${PORT}`);
});
