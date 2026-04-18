const fs = require('fs');

module.exports = {
    name: 'menu',
    alias: ['help', 'comandos'],
    run: async (sock, m, texto) => {
        const from = m.key.remoteJid;
        const nombreUser = m.pushName || 'Usuario';

        // Leer la carpeta de plugins para armar la lista
        const archivos = fs.readdirSync('./plugins').filter(file => file.endsWith('.js'));
        let listaComandos = archivos.map(file => {
            const plugin = require(`./${file}`);
            return `🍜 */${plugin.name}*`;
        }).join('\n');

        const mensajeMenu = `
¡Hola, *${nombreUser}*! 👋
Bienvenido a **Maruchan Bot v1** 🍜

Aquí tienes mi lista de comandos:
----------------------------------
${listaComandos}
----------------------------------

_Usa el prefijo / antes de cada comando._
_Estado: Online 🚀_
`.trim();

        await sock.sendMessage(from, { 
            text: mensajeMenu,
            mentions: [m.key.participant || from]
        }, { quoted: m });
    }
};
