const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const { exec } = require('child_process');

module.exports = {
    name: 'sticker',
    alias: ['s', 'stiker'],
    category: 'herramientas',
    description: 'Convierte imágenes en stickers (respondiendo o enviando foto).',
    run: async (sock, m, texto) => {
        const from = m.key.remoteJid;
        
        // Detectar si hay una imagen (directa o respondida)
        const msg = m.message?.imageMessage || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

        if (!msg) {
            return await sock.sendMessage(from, { text: '❌ Debes enviar una imagen con el comando */s* o responder a una foto.' });
        }

        try {
            const stream = await downloadContentFromMessage(msg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const tempJpg = `./${Date.now()}.jpg`;
            const tempWebp = `./${Date.now()}.webp`;
            fs.writeFileSync(tempJpg, buffer);

            // Comando optimizado para Termux (asegúrate de tener ffmpeg instalado)
            exec(`ffmpeg -i ${tempJpg} -vcodec libwebp -vf "scale='if(gt(a,1),512,-1)':'if(gt(a,1),-1,512)',pad=512:512:(512-iw)/2:(512-ih)/2:color=white@0" -lossless 1 ${tempWebp}`, async (err) => {
                if (err) {
                    console.log(err);
                    return sock.sendMessage(from, { text: '❌ Error al procesar el sticker. Asegúrate de tener ffmpeg.' });
                }

                await sock.sendMessage(from, { sticker: fs.readFileSync(tempWebp) }, { quoted: m });
                
                // Limpiar archivos temporales
                if (fs.existsSync(tempJpg)) fs.unlinkSync(tempJpg);
                if (fs.existsSync(tempWebp)) fs.unlinkSync(tempWebp);
            });

        } catch (e) {
            console.log(e);
            await sock.sendMessage(from, { text: '❌ Ocurrió un error inesperado.' });
        }
    }
};
