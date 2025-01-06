require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const port = 3000;
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

const app = express();
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD,
    database: 'user_management'
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err);
    } else {
        console.log('Conectado ao MySQL.');
    }
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Página de Login
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// Página de Registro
app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

// Endpoint para Registro
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
    }

    try {
        // Verificar se o usuário já existe
        const [rows] = await db.promise().query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length > 0) {
            return res.status(400).json({ message: 'Usuário já existe. Escolha outro nome.' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Inserir o novo usuário no banco
        await db.promise().query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        res.status(201).json({ message: 'Registro bem-sucedido!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao registrar o usuário.' });
    }
});

// Endpoint para Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
    }

    try {
        // Verificar se o usuário existe
        const [rows] = await db.promise().query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(400).json({ message: 'Usuário não encontrado.' });
        }

        const user = rows[0];

        // Comparar a senha
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Senha incorreta.' });
        }

        res.status(200).json({ message: 'Login bem-sucedido!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao processar o login.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}/login`);
});
