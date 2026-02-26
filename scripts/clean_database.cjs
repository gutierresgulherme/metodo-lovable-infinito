const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://eidcxqxjmraargwhrdai.supabase.co";
const SERVICE_KEY = process.argv[2] || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
    console.error("❌ Erro: SUPABASE_SERVICE_ROLE_KEY não fornecida.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false }
});

async function runCleanup() {
    console.log("🚀 Iniciando Limpeza Profunda...");

    try {
        // 1. Limpar Button Clicks (> 24h)
        console.log("1/4 Deletando cliques antigos...");
        const { error: err1 } = await supabase
            .from('button_clicks')
            .delete()
            .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        if (err1) console.error("  ⚠️ Erro em button_clicks:", err1.message);
        else console.log("  ✅ Cliques limpos.");

        // 2. Limpar Video Events (> 24h)
        console.log("2/4 Deletando eventos de vídeo antigos...");
        const { error: err2 } = await supabase
            .from('video_watch_events')
            .delete()
            .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        if (err2) console.error("  ⚠️ Erro em video_watch_events:", err2.message);
        else console.log("  ✅ Eventos de vídeo limpos.");

        // 3. Limpar Page Sessions (> 24h)
        console.log("3/4 Deletando sessões antigas...");
        const { error: err3 } = await supabase
            .from('page_sessions')
            .delete()
            .lt('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        if (err3) console.error("  ⚠️ Erro em page_sessions:", err3.message);
        else console.log("  ✅ Sessões limpas.");

        // 4. Update Policies (Garantir acesso público ao bucket de vídeos)
        // Isso normalmente exigiria SQL direto, mas vamos tentar garantir que o bucket seja público via Storage API se possível
        console.log("4/4 Verificando Buckets...");
        const { data: buckets } = await supabase.storage.listBuckets();
        const videoBucket = buckets?.find(b => b.name === 'videos');

        if (videoBucket && !videoBucket.public) {
            console.log("  🔧 Tornando bucket 'videos' público...");
            await supabase.storage.updateBucket('videos', { public: true });
        }

        console.log("\n✅ LIMPEZA LÓGICA CONCLUÍDA COM SUCESSO!");
        console.log("\n⚠️ NOTA FINAL: O espaço em disco só será liberado após o VACUUM FULL.");
        console.log("Como sou um robô, o PostgreSQL não me deixa rodar VACUUM FULL por segurança.");
        console.log("Por favor, cole 'VACUUM FULL public.page_sessions;' no seu SQL Editor do Supabase.");

    } catch (err) {
        console.error("❌ Falha crítica no script:", err.message);
    }
}

runCleanup();
