const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const Usuario = require('../models/Usuario');
const CoachCliente = require('../models/CoachCliente');
const ResenaCoach = require('../models/ResenaCoach');
const Ejercicio = require('../models/Ejercicio');
const Rutina = require('../models/Rutina');
const AsignacionRutina = require('../models/AsignacionRutina');
const ProgresoCliente = require('../models/ProgresoCliente');

const JWT_SECRET = process.env.JWT_SECRET;

router.get('/', (req, res) => res.json({ message: 'API funcionando' }));

router.post('/register', async (req, res) => {
    const { nombre, apellido, email, password, rol } = req.body;
    if(!nombre || !apellido || !email || !password) {
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

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if(!email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const user = await Usuario.findOne({ email }).select('+password');

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

router.get('/coaches', async (req, res) => {
    const coaches = await Usuario
        .find({ rol: 'coach' })
        .select('nombre apellido email rol');

    res.json(coaches);
});

router.post('/coach-cliente', async (req, res) => {
    const { clienteId, coachId, fechaAsignacion, estado } = req.body;

    if (!clienteId || !coachId) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const cliente = await Usuario.findById(clienteId);
    if (!cliente || cliente.rol !== 'cliente') {
        return res.status(400).json({ message: 'El cliente no existe o no tiene rol cliente' });
    }

    const coach = await Usuario.findById(coachId);
    if (!coach || coach.rol !== 'coach') {
        return res.status(400).json({ message: 'El coach no existe o no tiene rol coach' });
    }

    const existingRelation = await CoachCliente.findOne({ clienteId, coachId });
    if (existingRelation) {
        return res.status(400).json({ message: 'La relacion coach-cliente ya existe' });
    }

    const nuevaRelacion = new CoachCliente({ clienteId, coachId, fechaAsignacion, estado: estado || 'activo' });

    await nuevaRelacion.save();

    res.status(201).json({ message: 'Relacion coach-cliente creada exitosamente' });
});

router.post('/resenas-coach', async (req, res) => {
    const { clienteId, coachId, calificacion, comentario, fechaResena } = req.body;

    if (!clienteId || !coachId || calificacion == null) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    if (calificacion < 1 || calificacion > 5) {
        return res.status(400).json({ message: 'La calificacion debe ser entre 1 y 5' });
    }

    const cliente = await Usuario.findById(clienteId);
    if (!cliente || cliente.rol !== 'cliente') {
        return res.status(400).json({ message: 'El cliente no existe o no tiene rol cliente' });
    }

    const coach = await Usuario.findById(coachId);
    if (!coach || coach.rol !== 'coach') {
        return res.status(400).json({ message: 'El coach no existe o no tiene rol coach' });
    }

    const nuevaResena = new ResenaCoach({ clienteId, coachId, calificacion, comentario, fechaResena: fechaResena || new Date() });

    await nuevaResena.save();

    res.status(201).json({ message: 'Reseña registrada exitosamente' });
});

router.post('/ejercicios', async (req, res) => {
    const { nombreEjercicio, descripcion, grupoMuscular, fechaCreacion } = req.body;

    if (!nombreEjercicio || !grupoMuscular) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const nuevoEjercicio = new Ejercicio({ nombreEjercicio, descripcion, grupoMuscular, fechaCreacion: fechaCreacion || new Date() });

    await nuevoEjercicio.save();

    res.status(201).json({ message: 'Ejercicio creado exitosamente' });
});

router.post('/rutinas', async (req, res) => {
    const { coachId, nombreRutina, objetivo, nivel, notas, ejercicios, fechaCreacion, estado } = req.body;
    const diasValidos = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

    if (!coachId || !nombreRutina || !objetivo || !nivel) {
        return res.status(400).json({ message: 'Todos los campos obligatorios de la rutina deben enviarse' });
    }

    if (!Array.isArray(ejercicios) || ejercicios.length === 0) {
        return res.status(400).json({ message: 'La rutina debe incluir al menos un ejercicio' });
    }

    const coach = await Usuario.findById(coachId);
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

router.post('/asignacion-rutinas', async (req, res) => {
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

router.post('/progresos', async (req, res) => {
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

module.exports = router;
