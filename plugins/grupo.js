const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const { exec } = require('child_process');

module.exports = {
    name: 'sticker',
    alias: ['s', 'stiker'],
    description: 'Crea stickers de fotos.',
    run: async (sock, m) => {
        const from = m.key.remoteJid;
        
        // Buscamos la imagen en el mensaje o en lo que respondes
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMsg = m.message?.imageMessage || m.message?.videoMessage || quoted?.imageMessage || quoted?.videoMessage;

        if (!imageMsg) return sock.sendMessage(from, { text: '🍜 _Para hacer un sticker, envía una foto con /s o responde a una._' });

        try {
            const stream = await downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }

            const tempJpg = `./${Date.now()}.jpg`;
            const tempWebp = `./${Date.now()}.webp`;
            fs.writeFileSync(tempJpg, buffer);

            exec(`ffmpeg -i ${tempJpg} -vcodec libwebp -vf "scale='if(gt(a,1),512,-1)':'if(gt(a,1),-1,512)',pad=512:512:(512-iw)/2:(512-ih)/2:color=white@0" -lossless 1 ${tempWebp}`, async (err) => {
                if (!err) {
                    await sock.sendMessage(from, { sticker: fs.readFileSync(tempWebp) }, { quoted: m });
                }
                if (fs.existsSync(tempJpg)) fs.unlinkSync(tempJpg);
                if (fs.existsSync(tempWebp)) fs.unlinkSync(tempWebp);
            });
        } catch (e) {
            console.log(e);
        }
    }
};
