const axios = require('axios');

module.exports = {
    name: 'yt',
    alias: ['play', 'musica'],
    description: 'Descarga música de YouTube.',
    run: async (sock, m, texto) => {
        const from = m.key.remoteJid;
        if (!texto) return sock.sendMessage(from, { text: '🍜 _¿Qué quieres escuchar?_' }, { quoted: m });

        try {
            await sock.sendMessage(from, { text: '⏳ _Buscando en el servidor de Mitzuki..._' }, { quoted: m });

            // API estable de la comunidad
            const res = await axios.get(`https://api.botcahx.eu.org/api/dowloader/yt.mp3?url=${encodeURIComponent(texto)}&apikey=BrunoSobrino`);
            
            if (res.data && res.data.result) {
                const { title, mp3 } = res.data.result;
                
                await sock.sendMessage(from, { 
                    audio: { url: mp3 }, 
                    mimetype: 'audio/mp4',
                    fileName: `${title}.mp3`
                }, { quoted: m });
            } else {
                throw new Error('No se encontró el archivo');
            }

        } catch (e) {
            console.log('Error YT:', e);
            await sock.sendMessage(from, { text: '❌ _La API de Mitzuki/Botcahx está en mantenimiento. Intenta de nuevo más tarde._' }, { quoted: m });
        }
    }
};
