const axios = require('axios');

module.exports = {
    name: 'tiktok',
    alias: ['tt', 'tk'],
    description: 'Descarga videos de TikTok sin marca de agua.',
    run: async (sock, m, texto) => {
        const from = m.key.remoteJid;
        if (!texto) return sock.sendMessage(from, { text: '🍜 _Debes poner un link de TikTok después del comando._\n\n*Ejemplo:* /tiktok https://vm.tiktok.com/...' }, { quoted: m });

        try {
            await sock.sendMessage(from, { text: '⏳ _Descargando video, espera un momento..._' }, { quoted: m });

            // Usamos una API gratuita para obtener el video
            const res = await axios.get(`https://api.lolhuman.xyz/api/tiktok?apikey=GataDios&url=${texto}`);
            const videoUrl = res.data.result.link;

            await sock.sendMessage(from, { 
                video: { url: videoUrl }, 
                caption: '✅ *Video descargado con éxito por Maruchan Bot*' 
            }, { quoted: m });

        } catch (e) {
            console.log(e);
            await sock.sendMessage(from, { text: '❌ _No pude descargar el video. Verifica que el link sea correcto._' }, { quoted: m });
        }
    }
};
