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
            await sock.sendMessage(from, { text: '⏳ _Procesando video de alta calidad..._' }, { quoted: m });

            // API 1: DelApi (Muy estable para Latinoamérica)
            const res = await axios.get(`https://delirius-api-oficial.vercel.app/api/tiktok?url=${link[0]}`);
            
            if (res.data && res.data.data) {
                const video = res.data.data.main;
                return await sock.sendMessage(from, { 
                    video: { url: video }, 
                    caption: `✅ *Maruchan Bot*\n👤 ${res.data.data.nickname || 'TikToker'}` 
                }, { quoted: m });
            }
            
            throw new Error('Fallo API 1');

        } catch (e) {
            // API 2: Respaldo directo (Tiky)
            try {
                const res2 = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(link[0])}`);
                const video2 = res2.data.video.noWatermark;
                await sock.sendMessage(from, { video: { url: video2 }, caption: '✅ *Servidor de Respaldo*' }, { quoted: m });
            } catch (err2) {
                await sock.sendMessage(from, { text: '❌ _TikTok ha bloqueado la descarga temporalmente. Prueba con otro video._' }, { quoted: m });
            }
        }
    }
};
