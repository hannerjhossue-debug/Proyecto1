const axios = require('axios');

module.exports = {
    name: 'ig',
    alias: ['instagram', 'reels'],
    category: 'descargas',
    description: 'Descarga videos o fotos de Instagram.',
    run: async (sock, m, texto) => {
        const from = m.key.remoteJid;
        if (!texto) return sock.sendMessage(from, { text: '🍜 _Pega un link de Instagram._' }, { quoted: m });

        try {
            await sock.sendMessage(from, { text: '⏳ _Obteniendo contenido de Instagram..._' }, { quoted: m });

            const res = await axios.get(`https://api.vreden.my.id/api/igdl?url=${texto}`);
            const result = res.data.result;

            // Instagram puede devolver varias fotos o un video
            for (let i of result) {
                if (i.url.includes('.mp4')) {
                    await sock.sendMessage(from, { video: { url: i.url }, caption: '✅ *Instagram Video*' }, { quoted: m });
                } else {
                    await sock.sendMessage(from, { image: { url: i.url }, caption: '✅ *Instagram Imagen*' }, { quoted: m });
                }
            }
        } catch (e) {
            await sock.sendMessage(from, { text: '❌ _No pude descargar de Instagram. El perfil podría ser privado o el link no es válido._' }, { quoted: m });
        }
    }
};
