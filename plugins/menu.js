const fs = require('fs');

module.exports = {
    name: 'menu',
    alias: ['ayuda', 'help'],
    category: 'principal',
    description: 'Muestra la lista de comandos disponibles.',
    run: async (sock, m, texto) => {
        const from = m.key.remoteJid;
        const nombreUser = m.pushName || 'Usuario';
        const archivos = fs.readdirSync('./plugins').filter(file => file.endsWith('.js'));
        
        let menuTxt = `¡Hola, *${nombreUser}*! 👋\n`;
        menuTxt += `Bienvenido a *Maruchan Bot v1* 🍜\n\n`;
        menuTxt += `Aquí tienes mi lista de comandos:\n`;
        menuTxt += `━━━━━━━━━━━━━━━━━━━━\n`;

        archivos.forEach(file => {
            const plugin = require(`./${file}`);
            menuTxt += `🍜 */${plugin.name}*\n`;
            menuTxt += `╰ _${plugin.description || 'Sin descripción.'}_\n\n`;
        });

        menuTxt += `━━━━━━━━━━━━━━━━━━━━\n`;
        menuTxt += `📌 *Dato:* Usa / antes de cada comando.\n`;
        menuTxt += `🚀 *Estado:* Online`;

        await sock.sendMessage(from, { text: menuTxt.trim() }, { quoted: m });
    }
};
