
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                let value = parts.slice(1).join('=').trim();
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        console.error('Erro ao ler .env:', e.message);
        return {};
    }
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;

// HARDCODED SERVICE TOKEN provided by User
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpZGN4cXhqbXJhYXJnd2hyZGFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjEwOTkwNCwiZXhwIjoyMDc3Njg1OTA0fQ.fOI4mR5mfyxicrlkcfJGWQQUn5Jw4UCbWwVuGD5WjF0";

console.log('--- DIAGNÓSTICO SUPABASE ---');
console.log(`URL: ${SUPABASE_URL}`);
console.log('TOKEN: (Hardcoded Service Role)');

const supabase = createClient(SUPABASE_URL, ACCESS_TOKEN, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

async function run() {
    console.log('1. Listando Buckets...');
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('❌ FALHA AO LISTAR:', error.message);
    } else {
        console.log(`✅ Sucesso! Encontrados ${buckets.length} buckets.`);
        buckets.forEach(b => console.log(`   - ID: ${b.id} | Public: ${b.public}`));

        const siteUploads = buckets.find(b => b.id === 'site_uploads');
        if (siteUploads) {
            console.log('✅ Bucket "site_uploads" JÁ EXISTE.');
        } else {
            console.log('❌ Bucket "site_uploads" NÃO EXISTE.');
            console.log('🔧 Tentando criar bucket "site_uploads"...');

            const { data, error: createError } = await supabase.storage.createBucket('site_uploads', {
                public: true,
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
                fileSizeLimit: 5242880 // 5MB
            });

            if (createError) {
                console.error('   ❌ Falha ao criar:', createError.message);
            } else {
                console.log('   ✅ BUCKET "site_uploads" CRIADO COM SUCESSO!');
            }
        }
    }
}

run();
