const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

const userSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    rol: {
        type: String,
        enum: ['cliente', 'coach'],
        default: 'cliente'
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email no valid']
    },
    password: {
        type: String,
        required: true,
        minlength: [4, 'La contraseña debe tener al menos 4 caracteres'],
        select: false
    }
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        next(err);
    }
});

const Usuario = mongoose.model('Usuario', userSchema);

// POST /api/register
router.post('/register', async (req, res) => {
    const { nombre, apellido, email, password, rol } = req.body;
    if (!nombre || !apellido || !email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const existingUser = await Usuario.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const newuser = new Usuario({ nombre, apellido, email, password, rol: rol || 'cliente' });
    await newuser.save();

    res.status(201).json({ message: 'Usuario registrado exitosamente' });
});

// POST /api/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const user = await Usuario.findOne({ email }).select('+password');
    if (!user) {
        return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
        mensaje: 'Login exitoso',
        Usuario: { id: user._id, nombre: user.nombre, apellido: user.apellido, email: user.email, rol: user.rol },
        token
    });
});

// GET /api/coaches
router.get('/coaches', async (req, res) => {
    const coaches = await Usuario.find({ rol: 'coach' }).select('nombre apellido email rol');
    res.json(coaches);
});

module.exports = router;
