const mongoose = require('mongoose');

// Esta es tu línea configurada con tu nueva contraseña y los ajustes de estabilidad
const link = "mongodb+srv://proyectolooksmax_db_user:32953738@cluster0.jin1qv9.mongodb.net/?retryWrites=true&w=majority";

const conectarDB = async () => {
    try {
        await mongoose.connect(link);
        console.log('✅ [DATABASE] Base de datos Maruchan conectada con éxito');
    } catch (e) {
        console.log('❌ [DATABASE] Error de conexión: ' + e);
    }
};

module.exports = conectarDB;
