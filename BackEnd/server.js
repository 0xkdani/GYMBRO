const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mern_app';
const JWT_SECRET = process.env.JWT_SECRET;


mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

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
        match:[/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email no valid']
     },
    password: { 
        type: String, 
        required: true,
        minlength: [4, 'La contraseña debe tener al menos 4 caracteres'],
        select: false 
    }
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        
    } catch (err) {
        next(err);
    }
});



const Usuario = mongoose.model('Usuario', userSchema);

const coachClienteSchema = new mongoose.Schema({
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fechaAsignacion: { type: Date, default: Date.now },
    estado: {
        type: String,
        enum: ['activo', 'inactivo'],
        default: 'activo'
    }
});

const CoachCliente = mongoose.model('CoachCliente', coachClienteSchema);

const resenaCoachSchema = new mongoose.Schema({
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    calificacion: { type: Number, required: true, min: 1, max: 5 },
    comentario: { type: String },
    fechaResena: { type: Date, default: Date.now }
});

const ResenaCoach = mongoose.model('ResenaCoach', resenaCoachSchema);
 
app.post('/api/register', async (req, res) => {
    const { nombre, apellido, email, password, rol } = req.body;
    if(!nombre || !apellido || !email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const existingUser = await mongoose.model('Usuario').findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const newuser = new Usuario({ nombre, apellido, email, password, rol: rol || 'cliente' });

    await newuser.save();

    res.status(201).json({ message: 'Usuario registrado exitosamente' });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if(!email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const user = await mongoose.model('Usuario').findOne({ email }).select('+password');

    if(!user) {
        return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch) {
        return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });


    res.json({mensaje: 'Login exitoso',Usuario: { id: user._id, nombre: user.nombre, apellido: user.apellido, email: user.email, rol: user.rol }, token });
});

app.get('/api/coaches', async (req, res) => {
    const coaches = await mongoose.model('Usuario')
        .find({ rol: 'coach' })
        .select('nombre apellido email rol');

    res.json(coaches);
});

app.post('/api/coach-cliente', async (req, res) => {
    const { clienteId, coachId, fechaAsignacion, estado } = req.body;

    if (!clienteId || !coachId) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    if (!mongoose.Types.ObjectId.isValid(clienteId) || !mongoose.Types.ObjectId.isValid(coachId)) {
        return res.status(400).json({ message: 'clienteId y coachId deben ser ids validos de MongoDB' });
    }

    const cliente = await mongoose.model('Usuario').findById(clienteId);
    if (!cliente || cliente.rol !== 'cliente') {
        return res.status(400).json({ message: 'El cliente no existe o no tiene rol cliente' });
    }

    const coach = await mongoose.model('Usuario').findById(coachId);
    if (!coach || coach.rol !== 'coach') {
        return res.status(400).json({ message: 'El coach no existe o no tiene rol coach' });
    }

    const existingRelation = await mongoose.model('CoachCliente').findOne({ clienteId, coachId });
    if (existingRelation) {
        return res.status(400).json({ message: 'La relacion coach-cliente ya existe' });
    }

    const nuevaRelacion = new CoachCliente({ clienteId, coachId, fechaAsignacion, estado: estado || 'activo' });

    await nuevaRelacion.save();

    res.status(201).json({ message: 'Relacion coach-cliente creada exitosamente' });
});

app.post('/api/resenas-coach', async (req, res) => {
    const { clienteId, coachId, calificacion, comentario, fechaResena } = req.body;

    if (!clienteId || !coachId || calificacion == null) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    if (!mongoose.Types.ObjectId.isValid(clienteId) || !mongoose.Types.ObjectId.isValid(coachId)) {
        return res.status(400).json({ message: 'clienteId y coachId deben ser ids validos de MongoDB' });
    }

    if (calificacion < 1 || calificacion > 5) {
        return res.status(400).json({ message: 'La calificacion debe ser entre 1 y 5' });
    }

    const cliente = await mongoose.model('Usuario').findById(clienteId);
    if (!cliente || cliente.rol !== 'cliente') {
        return res.status(400).json({ message: 'El cliente no existe o no tiene rol cliente' });
    }

    const coach = await mongoose.model('Usuario').findById(coachId);
    if (!coach || coach.rol !== 'coach') {
        return res.status(400).json({ message: 'El coach no existe o no tiene rol coach' });
    }

    const nuevaResena = new ResenaCoach({ clienteId, coachId, calificacion, comentario, fechaResena: fechaResena || new Date() });

    await nuevaResena.save();

    res.status(201).json({ message: 'Resena registrada exitosamente' });
});

app.get('/api/', (req, res) => {
    res.json({ message: 'API funcionando' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});