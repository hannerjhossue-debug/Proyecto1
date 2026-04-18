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
            await sock.sendMessage(from, { text: '⏳ _Maruchan está cocinando tu video..._' }, { quoted: m });

            // Probamos con una API de alto rendimiento
            const res = await axios.get(`https://api.vreden.my.id/api/tiktok?url=${encodeURIComponent(link[0])}`);
            
            if (res.data && res.data.status === 200) {
                const videoData = res.data.result;
                return await sock.sendMessage(from, { 
                    video: { url: videoData.video || videoData.video_hd }, 
                    caption: `✅ *TikTok Listo*\n📝 ${videoData.title || 'Sin descripción'}` 
                }, { quoted: m });
            }
            
            throw new Error('La API no devolvió un video válido');

        } catch (e) {
            // LOG DETALLADO EN CONSOLA PARA TI
            console.log('--- ERROR EN TIKTOK ---');
            console.log(e.response?.data || e.message);
            
            // Intento final con API de respaldo clásica
            try {
                const res2 = await axios.get(`https://api.dorratz.com/v2/download/tiktok?url=${link[0]}`);
                if (res2.data && res2.data.data) {
                    return await sock.sendMessage(from, { 
                        video: { url: res2.data.data.media.no_watermark }, 
                        caption: '✅ *Descargado (Servidor 2)*' 
                    }, { quoted: m });
                }
            } catch (err2) {
                await sock.sendMessage(from, { text: '❌ _TikTok bloqueó el acceso. Intenta con un link de TikTok normal (no Lite) o prueba más tarde._' }, { quoted: m });
            }
        }
    }
};
