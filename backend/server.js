const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      
    password: 'bdNas$%0tvZ4WfUm&@',     
    database: 'ethernotesw'
});

db.connect(err => {
    if (err) {
        console.error('Error conectando a la BD:', err);
        return;
    }
    console.log('Conectado a MySQL exitosamente.');
});

app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    
    db.query(sql, [username, email, password], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error al registrar usuario' });
        }
        res.json({ success: true, message: 'Usuario registrado exitosamente' });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';

    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error del servidor' });
        
        if (results.length > 0) {

            const user = results[0];
            res.json({ 
                success: true, 
                user: { id: user.id, username: user.username, email: user.email } 
            });
        } else {
            res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }
    });
});

app.get('/chests/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = `
        SELECT c.*, COUNT(n.id) as count 
        FROM chests c 
        LEFT JOIN notes n ON c.id = n.chest_id 
        WHERE c.user_id = ? 
        GROUP BY c.id
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/chests/:chestId/notes', (req, res) => {
    const chestId = req.params.chestId;
    const sql = 'SELECT * FROM notes WHERE chest_id = ? ORDER BY created_at DESC';

    db.query(sql, [chestId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/notes', (req, res) => {
    const { user_id, chest_id, title, content, tags } = req.body;
    const sql = 'INSERT INTO notes (user_id, chest_id, title, content, tags) VALUES (?, ?, ?, ?, ?)';

    db.query(sql, [user_id, chest_id, title, content, tags], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: result.insertId, message: 'Nota creada' });
    });
});

app.get('/notes/search', (req, res) => {
    const { userId, query } = req.query; 
    const searchTerm = `%${query}%`;
    
    const sql = `
        SELECT * FROM notes 
        WHERE user_id = ? AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)
    `;

    db.query(sql, [userId, searchTerm, searchTerm, searchTerm], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.listen(3000, () => {
    console.log('Servidor corriendo en el puerto 3000');
});