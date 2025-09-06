const mineflayer = require('mineflayer');
const { createClient } = require('@supabase/supabase-js');

// 🔥 CONFIGURA QUESTI VALORI 🔥
const config = {
    host: 'donutsmp.net',
    port: 25565,
    username: 'AdamTren',
    auth: 'microsoft',
    version: '1.21.4',
    supabaseUrl: 'https://sagzrjcbdtkqhdzdlmmn.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZ3pyamNiZHRrcWhkemRsbW1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE5MDQ4NSwiZXhwIjoyMDcyNzY2NDg1fQ.ChcC1kIQcJBM3-Ip56kWmZ7iUSo3krWqSFyrwEgUbb4' // USA SERVICE ROLE KEY!
};

const supabase = createClient(config.supabaseUrl, config.supabaseKey);

const bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.username,
    auth: config.auth,
    version: config.version
});

// 👂 ASCOLTA I MESSAGGI DEL SERVER
bot.on('message', (jsonMsg) => {
    const message = jsonMsg.toString();
    console.log(`[CHAT] ${message}`);

    // RILEVA RICHIESTE TPA AL BOT
    const tpaRequestRegex = /(\w+).*ha richiesto di teletrasportarsi da te/i;
    const tpaMatch = message.match(tpaRequestRegex);

    if (tpaMatch) {
        const username = tpaMatch[1].trim();
        console.log(`📨 Rilevata richiesta TPA da: ${username}`);
        verifyPlayer(username);
    }
});

// ✅ VERIFICA IL GIOCATORE SU SUPABASE
async function verifyPlayer(minecraftUsername) {
    try {
        console.log(`🔍 Verifico giocatore: ${minecraftUsername}`);
        const usernameLower = minecraftUsername.toLowerCase();

        // 1. Cerca il giocatore nel database
        const { data: player, error: searchError } = await supabase
            .from('players')
            .select('*')
            .eq('minecraft_username', usernameLower)
            .single();

        if (searchError && searchError.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('❌ Errore ricerca giocatore:', searchError);
            return;
        }

        if (player) {
            // 2. Aggiorna a verificato
            const { error: updateError } = await supabase
                .from('players')
                .update({ is_verified: true })
                .eq('minecraft_username', usernameLower);

            if (updateError) throw updateError;
            console.log(`✅ Giocatore verificato: ${minecraftUsername}`);
            
        } else {
            // 3. Crea nuovo profilo verificato
            const { error: insertError } = await supabase
                .from('players')
                .insert([{ 
                    minecraft_username: usernameLower,
                    balance: 1000,
                    is_verified: true
                }]);

            if (insertError) throw insertError;
            console.log(`✅ Nuovo giocatore creato e verificato: ${minecraftUsername}`);
        }

        bot.chat(`/msg ${minecraftUsername} ✅ Verifica completata! Ora puoi giocare al casino.`);

    } catch (error) {
        console.error('❌ Errore verifica giocatore:', error);
    }
}

// ⚙️ GESTIONE EVENTI
bot.on('login', () => console.log('✅ Bot connesso al server Minecraft'));
bot.on('error', (err) => console.error('❌ Errore bot:', err));
bot.on('kicked', (reason) => console.log('🔴 Bot kickato:', reason));
bot.on('end', () => console.log('⚠️ Bot disconnesso'));

// 🚦 MANTIENI IL PROCESSO ATTIVO
setInterval(() => {}, 1000);
console.log('🚀 Bot avviato in modalità SOLO LETTURA...');
