const mongoose = require('mongoose');
const link = "mongodb+srv://proyectolooksmax_db_user:cnfKWFOZaUskQyUn@cluster0.jin1qv9.mongodb.net/?appName=Cluster0
‎"; // El que sacamos de Atlas

const conectarDB = async () => {
    try {
        await mongoose.connect(link);
        console.log('✅ Base de Datos Conectada');
    } catch (e) { console.log(e); }
};
module.exports = conectarDB;
