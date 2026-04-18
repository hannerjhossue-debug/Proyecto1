const axios = require('axios');

module.exports = {
    name: 'yt',
    alias: ['play', 'youtube'],
    category: 'descargas',
    description: 'Descarga audio o video de YouTube.',
    run: async (sock, m, texto) => {
        const from = m.key.remoteJid;
        if (!texto) return sock.sendMessage(from, { text: '🍜 _Escribe el nombre de la canción o el link._' }, { quoted: m });

        try {
            await sock.sendMessage(from, { text: '⏳ _Buscando en YouTube..._' }, { quoted: m });

            // Esta API busca y descarga a la vez
            const res = await axios.get(`https://api.vreden.my.id/api/ytdl?url=${encodeURIComponent(texto)}`);
            const { title, mp3, mp4 } = res.data.result;

            // Por defecto mandamos el audio para no gastar tantos datos
            await sock.sendMessage(from, { 
                audio: { url: mp3 }, 
                mimetype: 'audio/mp4', 
                fileName: `${title}.mp3` 
            }, { quoted: m });

            await sock.sendMessage(from, { text: `✅ *${title}* enviado.\n\n_Si querías el video, usa el comando /ytmp4 (próximamente)._` });

        } catch (e) {
            await sock.sendMessage(from, { text: '❌ _Error al buscar en YouTube._' }, { quoted: m });
        }
    }
};
