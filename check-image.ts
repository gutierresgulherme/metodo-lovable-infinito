
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manualmente
const envPath = path.resolve(process.cwd(), '.env');
let anonKey = "";

try {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
        if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) { // Correction here
            anonKey = line.split('=')[1].trim().replace(/['"]/g, '');
            break;
        }
    }
} catch (e) {
    console.log("Aviso: .env não encontrado ou erro ao ler.");
}

const SUPABASE_URL = "https://eidcxqxjmraargwhrdai.supabase.co";

if (!anonKey) {
    console.error("ERRO: VITE_SUPABASE_PUBLISHABLE_KEY não encontrada no .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, anonKey);

async function check() {
    console.log("🔍 Iniciando Diagnóstico de Imagem...");

    // 1. Listar Buckets
    console.log("\n📦 Buckets Disponíveis:");
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) console.error("Erro ao listar buckets:", bucketError);
    else {
        buckets.forEach(b => console.log(` - [${b.id}] Public: ${b.public}`));

        const siteUploads = buckets.find(b => b.id === 'site_uploads');
        if (!siteUploads) {
            console.error("❌ CRÍTICO: Bucket 'site_uploads' NÃO EXISTE!");
        } else if (!siteUploads.public) {
            console.error("❌ CRÍTICO: Bucket 'site_uploads' EXISTE mas NÃO É PÚBLICO! Rodar SQL de correção.");
        } else {
            console.log("✅ Bucket 'site_uploads' existe e é público.");
        }
    }

    // 2. Verificar Arquivo no Storage
    console.log("\n📂 Verificando arquivo 'banners/thankyou_banner_br.png'...");
    const { data: files, error: listError } = await supabase.storage.from('site_uploads').list('banners');

    if (listError) {
        console.error("Erro ao listar arquivos em 'banners':", listError);
    } else {
        // files é null se erro?
        if (!files) {
            console.log("Pasta 'banners' vazia ou inacessível.");
        } else {
            console.log(`Arquivos encontrados na pasta 'banners': ${files.length}`);
            files.forEach(f => console.log(` - ${f.name} (${f.metadata?.mimetype}) Size: ${f.metadata?.size}`));

            const targetFile = files.find(f => f.name === 'thankyou_banner_br.png');
            if (targetFile) {
                console.log("✅ Arquivo 'thankyou_banner_br.png' ENCONTRADO no Storage.");
            } else {
                console.error("❌ Arquivo 'thankyou_banner_br.png' NÃO ENCONTRADO no Storage.");
            }

            const targetFileGlobal = files.find(f => f.name === 'thankyou_banner.png');
            if (targetFileGlobal) {
                console.log("ℹ️ Arquivo 'thankyou_banner.png' (Global) ENCONTRADO no Storage.");
            }
        }
    }

    // 3. Testar URLs Públicas
    // NOTA: O bucket público acessa via /storage/v1/object/public/NOME_DO_BUCKET/CAMINHO
    const urlsToTest = [
        `${SUPABASE_URL}/storage/v1/object/public/site_uploads/banners/thankyou_banner_br.png`,
        `${SUPABASE_URL}/storage/v1/object/public/site_uploads/banners/thankyou_banner.png`
    ];

    for (const url of urlsToTest) {
        console.log(`\n🌐 Testando acesso HTTP direto: ${url}`);
        try {
            const res = await fetch(url);
            console.log(`Status Code: ${res.status} ${res.statusText}`);
            if (res.ok) {
                console.log("✅ Acesso HTTP SUCESSO! Esta URL é válida.");
            } else {
                console.error(`❌ Acesso HTTP FALHOU (Status: ${res.status}).`);
            }
        } catch (err) {
            console.error("Erro de conexão:", err);
        }
    }
}

check();
