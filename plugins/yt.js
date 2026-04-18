const axios = require('axios');

module.exports = {
    name: 'yt',
    alias: ['play', 'musica'],
    category: 'descargas',
    description: 'Busca y descarga música de YouTube.',
    run: async (sock, m, texto) => {
        const from = m.key.remoteJid;
        if (!texto) return m.reply('🍜 _¿Qué canción quieres escuchar?_');

        try {
            await m.reply('⏳ _Buscando en los servidores de YouTube..._');
            const res = await axios.get(`https://api.botcahx.eu.org/api/dowloader/yt.mp3?url=${encodeURIComponent(texto)}&apikey=BrunoSobrino`);
            
            const { title, mp3 } = res.data.result;
            await sock.sendMessage(from, { 
                audio: { url: mp3 }, 
                mimetype: 'audio/mp4',
                fileName: `${title}.mp3`
            }, { quoted: m });
        } catch (e) {
            m.reply('❌ _No se pudo obtener el audio. Intenta con el nombre exacto._');
        }
    }
};
