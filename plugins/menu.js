const fs = require('fs');

module.exports = {
    name: 'menu',
    alias: ['ayuda', 'help'],
    description: 'Muestra este panel de control.',
    run: async (sock, m) => {
        const from = m.key.remoteJid;
        const nombre = m.pushName || 'Usuario';

        const menuTexto = `
🍜 *MARUCHAN BOT v1* 🍜
_Hola, ${nombre}_

*─── [ PRINCIPAL ] ───*
- */menu*
  _Muestra la lista de comandos_

*─── [ DESCARGAS ] ───*
- */tiktok* <link>
  _Descarga videos de TikTok sin marca de agua_
- */ig* <link>
  _Descarga reels y fotos de Instagram_

*─── [ HERRAMIENTAS ] ───*
- */sticker*
  _Convierte imagen en sticker (usa /s en la foto)_

*─── [ GRUPOS ] ───*
- */grupo* <abrir/cerrar>
  _Control de acceso al chat_

*─── [ INFO ] ───*
- Prefijo: [ / ]
- Dev: Jhossue
`.trim();

        await sock.sendMessage(from, { text: menuTexto }, { quoted: m });
    }
};
