const fs = require('fs');

module.exports = {
    name: 'menu',
    alias: ['ayuda', 'comandos', 'h'],
    run: async (sock, m, texto) => {
        const from = m.key.remoteJid;
        const nombreUser = m.pushName || 'Usuario';
        const archivos = fs.readdirSync('./plugins').filter(file => file.endsWith('.js'));
        
        let listaComandos = archivos.map(file => {
            const plugin = require(`./${file}`);
            const aliasTxt = plugin.alias ? ` _(alias: ${plugin.alias.join(', ')})_` : '';
            return `🍜 */${plugin.name}*${aliasTxt}`;
        }).join('\n');

        const mensajeMenu = `
¡Qué onda, *${nombreUser}*! 👋
Bienvenido al **Maruchan Bot v1** 🍜

Aquí tienes lo que puedo hacer:
━━━━━━━━━━━━━━━━━━
${listaComandos}
━━━━━━━━━━━━━━━━━━

📌 *Dato:* Usa / antes de cada comando.
🚀 *Estado:* Máxima velocidad.
`.trim();

        await sock.sendMessage(from, { text: mensajeMenu }, { quoted: m });
    }
};
