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

const ejercicioSchema = new mongoose.Schema({
    nombreEjercicio: { type: String, required: true },
    descripcion: { type: String },
    grupoMuscular: { type: String, required: true },
    fechaCreacion: { type: Date, default: Date.now }
});

const Ejercicio = mongoose.model('Ejercicio', ejercicioSchema);

const rutinaSchema = new mongoose.Schema({
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombreRutina: { type: String, required: true },
    objetivo: {
        type: String,
        enum: ['Hipertrofia', 'Fuerza', 'Acondicionamiento', 'Resistencia'],
        required: true
    },
    nivel: {
        type: String,
        enum: ['Principiante', 'Intermedio', 'Avanzado'],
        required: true
    },
    notas: { type: String },
    ejercicios: [{
        dia: {
            type: String,
            enum: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'],
            required: true
        },
        ejercicio: { type: String, required: true },
        series: { type: Number, required: true, min: 1 },
        repeticiones: { type: String, required: true },
        descanso: { type: String, default: '-' }
    }],
    fechaCreacion: { type: Date, default: Date.now },
    estado: {
        type: String,
        enum: ['activa', 'inactiva'],
        default: 'activa'
    }
});

const Rutina = mongoose.model('Rutina', rutinaSchema);

const asignacionRutinaSchema = new mongoose.Schema({
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    rutinaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rutina', required: true },
    fechaAsignacion: { type: Date, default: Date.now },
    estado: {
        type: String,
        enum: ['activa', 'inactiva'],
        default: 'activa'
    }
});

const AsignacionRutina = mongoose.model('AsignacionRutina', asignacionRutinaSchema);

const progresoClienteSchema = new mongoose.Schema({
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fecha: { type: Date, required: true },
    peso: { type: Number, required: true, min: 1, max: 500 },
    notas: { type: String, default: '' },
    fechaRegistro: { type: Date, default: Date.now }
});

const ProgresoCliente = mongoose.model('ProgresoCliente', progresoClienteSchema);
 
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

    res.status(201).json({ message: 'Reseña registrada exitosamente' });
});

app.post('/api/ejercicios', async (req, res) => {
    const { nombreEjercicio, descripcion, grupoMuscular, fechaCreacion } = req.body;

    if (!nombreEjercicio || !grupoMuscular) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const nuevoEjercicio = new Ejercicio({ nombreEjercicio, descripcion, grupoMuscular, fechaCreacion: fechaCreacion || new Date() });

    await nuevoEjercicio.save();

    res.status(201).json({ message: 'Ejercicio creado exitosamente' });
});

app.post('/api/rutinas', async (req, res) => {
    const { coachId, nombreRutina, objetivo, nivel, notas, ejercicios, fechaCreacion, estado } = req.body;
    const diasValidos = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

    if (!coachId || !nombreRutina || !objetivo || !nivel) {
        return res.status(400).json({ message: 'Todos los campos obligatorios de la rutina deben enviarse' });
    }

    if (!Array.isArray(ejercicios) || ejercicios.length === 0) {
        return res.status(400).json({ message: 'La rutina debe incluir al menos un ejercicio' });
    }

    const coach = await mongoose.model('Usuario').findById(coachId);
    if (!coach || coach.rol !== 'coach') {
        return res.status(400).json({ message: 'El coach no existe o no tiene rol coach' });
    }

    const ejerciciosCatalogo = await Ejercicio.find({}, 'nombreEjercicio').lean();
    const nombresEjerciciosCatalogo = new Set(
        ejerciciosCatalogo
            .map((ejercicio) => String(ejercicio.nombreEjercicio || '').trim().toLowerCase())
            .filter(Boolean)
    );

    const nombreRutinaLimpio = String(nombreRutina).trim();
    if (!nombreRutinaLimpio) {
        return res.status(400).json({ message: 'El nombre de la rutina es obligatorio' });
    }

    const erroresEjercicios = [];
    const ejerciciosNormalizados = ejercicios.map((item) => ({
        dia: item.dia ? String(item.dia).trim() : '',
        ejercicio: item.ejercicio ? String(item.ejercicio).trim() : '',
        series: Number(item.series),
        repeticiones: item.repeticiones ? String(item.repeticiones).trim() : '',
        descanso: item.descanso ? String(item.descanso).trim() : '-'
    }));

    ejerciciosNormalizados.forEach((item, index) => {
        if (!item.ejercicio) {
            erroresEjercicios.push(`Fila ${index + 1}: ejercicio es obligatorio`);
        } else if (!nombresEjerciciosCatalogo.has(item.ejercicio.toLowerCase())) {
            erroresEjercicios.push(`Fila ${index + 1}: el ejercicio no existe en el catalogo`);
        }

        if (!item.dia || !diasValidos.includes(item.dia)) {
            erroresEjercicios.push(`Fila ${index + 1}: dia invalido`);
        }

        if (!Number.isFinite(item.series) || item.series < 1) {
            erroresEjercicios.push(`Fila ${index + 1}: series debe ser un numero mayor o igual a 1`);
        }

        if (!item.repeticiones) {
            erroresEjercicios.push(`Fila ${index + 1}: repeticiones es obligatorio`);
        }
    });

    if (erroresEjercicios.length > 0) {
        return res.status(400).json({
            message: 'Hay errores en los ejercicios enviados',
            errores: erroresEjercicios
        });
    }

    const nuevaRutina = new Rutina({
        coachId,
        nombreRutina: nombreRutinaLimpio,
        objetivo,
        nivel,
        notas: notas ? String(notas).trim() : '',
        ejercicios: ejerciciosNormalizados,
        fechaCreacion: fechaCreacion || new Date(),
        estado: estado || 'activa'
    });

    await nuevaRutina.save();

    res.status(201).json({
        message: 'Rutina creada exitosamente',
        rutina: {
            id: nuevaRutina._id,
            nombreRutina: nuevaRutina.nombreRutina,
            totalEjercicios: nuevaRutina.ejercicios.length
        }
    });
});

app.post('/api/asignacion-rutinas', async (req, res) => {
    const { clienteId, coachId, rutinaId, fechaAsignacion, estado } = req.body;

    if (!clienteId || !coachId || !rutinaId) {
        return res.status(400).json({ message: 'clienteId, coachId y rutinaId son obligatorios' });
    }

    const nuevaAsignacion = new AsignacionRutina({
        clienteId,
        coachId,
        rutinaId,
        fechaAsignacion: fechaAsignacion || new Date(),
        estado: estado || 'activa'
    });

    await nuevaAsignacion.save();

    res.status(201).json({
        message: 'Asignacion de rutina creada exitosamente',
        asignacion: {
            id: nuevaAsignacion._id,
            clienteId: nuevaAsignacion.clienteId,
            coachId: nuevaAsignacion.coachId,
            rutinaId: nuevaAsignacion.rutinaId,
            estado: nuevaAsignacion.estado
        }
    });
});

app.post('/api/progresos', async (req, res) => {
    const { clienteId, fecha, peso, notas } = req.body;

    if (!clienteId || !fecha || peso == null) {
        return res.status(400).json({ message: 'clienteId, fecha y peso son obligatorios' });
    }

    if (!mongoose.Types.ObjectId.isValid(clienteId)) {
        return res.status(400).json({ message: 'clienteId no tiene un formato valido' });
    }

    const fechaProgreso = new Date(fecha);
    if (Number.isNaN(fechaProgreso.getTime())) {
        return res.status(400).json({ message: 'La fecha es invalida' });
    }

    const pesoNumerico = Number(peso);
    if (!Number.isFinite(pesoNumerico) || pesoNumerico <= 0) {
        return res.status(400).json({ message: 'El peso debe ser un numero mayor a 0' });
    }

    const cliente = await Usuario.findById(clienteId);
    if (!cliente || cliente.rol !== 'cliente') {
        return res.status(400).json({ message: 'El cliente no existe o no tiene rol cliente' });
    }

    const nuevoProgreso = new ProgresoCliente({
        clienteId,
        fecha: fechaProgreso,
        peso: pesoNumerico,
        notas: notas ? String(notas).trim() : ''
    });

    await nuevoProgreso.save();

    res.status(201).json({
        message: 'Progreso guardado exitosamente',
        progreso: {
            id: nuevoProgreso._id,
            clienteId: nuevoProgreso.clienteId,
            fecha: nuevoProgreso.fecha,
            peso: nuevoProgreso.peso,
            notas: nuevoProgreso.notas
        }
    });
});

app.get('/api/', (req, res) => {
    res.json({ message: 'API funcionando' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});