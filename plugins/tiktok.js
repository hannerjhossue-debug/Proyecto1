const axios = require('axios');

module.exports = {
    name: 'tiktok',
    alias: ['tt', 'tk'],
    category: 'descargas',
    description: 'Descarga videos de TikTok sin marca de agua.',
    run: async (sock, m, texto) => {
        const from = m.key.remoteJid;
        if (!texto) return sock.sendMessage(from, { text: '🍜 _Pega un link de TikTok._' }, { quoted: m });

        const link = texto.match(/(https?:\/\/[^\s]+)/g);
        if (!link) return sock.sendMessage(from, { text: '❌ _Link no válido._' }, { quoted: m });

        try {
            await sock.sendMessage(from, { text: '⏳ _Maruchan está buscando el video más rápido..._' }, { quoted: m });

            // API 1: Usando un servicio de procesamiento directo (AIO)
            const res = await axios.post('https://api.tiklydown.eu.org/api/download', { url: link[0] });
            
            if (res.data && res.data.video) {
                return await sock.sendMessage(from, { 
                    video: { url: res.data.video.noWatermark }, 
                    caption: `✅ *TikTok Listo*\n👤 ${res.data.author.nickname || 'User'}` 
                }, { quoted: m });
            }
            throw new Error();

        } catch (e) {
            try {
                // API 2: Respaldo con servidor de alto rendimiento (Sandwich)
                const res2 = await axios.get(`https://api.boxi.biz/api/tiktok?url=${link[0]}`);
                if (res2.data && res2.data.video) {
                    return await sock.sendMessage(from, { 
                        video: { url: res2.data.video }, 
                        caption: '✅ *Descargado con éxito*' 
                    }, { quoted: m });
                }
                throw new Error();
            } catch (err2) {
                // API 3: Último recurso (Loli)
                try {
                    const res3 = await axios.get(`https://api.lolhuman.xyz/api/tiktok?apikey=GataDios&url=${link[0]}`);
                    await sock.sendMessage(from, { video: { url: res3.data.result.link }, caption: '✅ *Servidor 3 activo*' }, { quoted: m });
                } catch (err3) {
                    await sock.sendMessage(from, { text: '❌ _TikTok actualizó su seguridad. Intenta de nuevo en unos minutos o usa un link de TikTok normal._' }, { quoted: m });
                }
            }
        }
    }
};
