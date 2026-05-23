const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const ejercicioSchema = new mongoose.Schema({
    nombreEjercicio: { type: String, required: true },
    descripcion: { type: String },
    grupoMuscular: { type: String, required: true },
    fechaCreacion: { type: Date, default: Date.now }
});

const Ejercicio = mongoose.model('Ejercicio', ejercicioSchema);

// POST /api/ejercicios
router.post('/', async (req, res) => {
    const { nombreEjercicio, descripcion, grupoMuscular, fechaCreacion } = req.body;

    if (!nombreEjercicio || !grupoMuscular) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const nuevoEjercicio = new Ejercicio({ nombreEjercicio, descripcion, grupoMuscular, fechaCreacion: fechaCreacion || new Date() });
    await nuevoEjercicio.save();

    res.status(201).json({ message: 'Ejercicio creado exitosamente' });
});

// GET /api/ejercicios
router.get('/', async (req, res) => {
    const ejercicios = await Ejercicio.find();
    res.json(ejercicios);
});

module.exports = router;
