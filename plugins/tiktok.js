const axios = require('axios');

module.exports = {
    name: 'tiktok',
    alias: ['tt', 'tk', 'tiktoknow'],
    category: 'descargas',
    description: 'Descarga videos de TikTok (Normal y Lite) sin marca de agua.',
    run: async (sock, m, texto) => {
        const from = m.key.remoteJid;
        
        // Validar si puso link
        if (!texto) return sock.sendMessage(from, { text: '🍜 _Pega un link de TikTok._\n\n*Ejemplo:* /tk https://vt.tiktok.com/ZS...' }, { quoted: m });

        // Extraer el link limpio (por si el usuario copió texto extra)
        const tiktokLink = texto.match(/(https?:\/\/[^\s]+)/g);
        if (!tiktokLink) return sock.sendMessage(from, { text: '❌ _No encontré un link válido._' }, { quoted: m });

        try {
            await sock.sendMessage(from, { text: '⏳ _Cocinando tu video de TikTok..._' }, { quoted: m });

            // API Alternativa más estable para links Lite y Normales
            const response = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(tiktokLink[0])}`);
            
            if (!response.data || !response.data.video) {
                throw new Error('No video data');
            }

            const data = response.data;
            const videoUrl = data.video.noWatermark || data.video.watermark;

            await sock.sendMessage(from, { 
                video: { url: videoUrl }, 
                caption: `✅ *TikTok descargado*\n👤 *Autor:* ${data.author.nickname || 'Desconocido'}\n📝 *Título:* ${data.title || 'Sin título'}` 
            }, { quoted: m });

        } catch (e) {
            console.log('Error TikTok:', e);
            // Si la primera falla, intentamos con una segunda de respaldo
            try {
                const res2 = await axios.get(`https://api.lolhuman.xyz/api/tiktok?apikey=GataDios&url=${tiktokLink[0]}`);
                await sock.sendMessage(from, { 
                    video: { url: res2.data.result.link }, 
                    caption: '✅ *Descargado (Servidor de respaldo)*' 
                }, { quoted: m });
            } catch (err2) {
                await sock.sendMessage(from, { text: '❌ _Los servidores de TikTok están saturados. Intenta con otro link más tarde._' }, { quoted: m });
            }
        }
    }
};
