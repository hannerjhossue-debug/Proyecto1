const fs = require('fs');

module.exports = {
    name: 'menu',
    alias: ['ayuda', 'help'],
    category: 'principal',
    description: 'Muestra el menú de comandos por categorías.',
    run: async (sock, m, texto) => {
        const from = m.key.remoteJid;
        const archivos = fs.readdirSync('./plugins').filter(file => file.endsWith('.js'));
        
        const menuDinamico = {};

        archivos.forEach(file => {
            const plugin = require(`./${file}`);
            const cat = plugin.category || 'OTROS';
            if (!menuDinamico[cat]) menuDinamico[cat] = [];
            menuDinamico[cat].push(`🔹 */${plugin.name}* \n   _${plugin.description || 'Sin descripción'}_`);
        });

        let textoMenu = `✨ *MARUCHAN BOT - PANEL* ✨\n\n`;
        for (const [categoria, comandos] of Object.entries(menuDinamico)) {
            textoMenu += `📂 *${categoria.toUpperCase()}*\n`;
            textoMenu += comandos.join('\n') + `\n\n`;
        }
        
        textoMenu += `🚀 _Usa el prefijo / para todo._`;

        await sock.sendMessage(from, { text: textoMenu }, { quoted: m });
    }
};
