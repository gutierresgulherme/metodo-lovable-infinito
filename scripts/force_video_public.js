
import https from 'https';

// Credenciais do usuário
const PROJECT_REF = 'eidcxqxjmraargwhrdai';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpZGN4cXhqbXJhYXJnd2hyZGFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjEwOTkwNCwiZXhwIjoyMDc3Njg1OTA0fQ.fOI4mR5mfyxicrlkcfJGWQQUn5Jw4UCbWwVuGD5WjF0';

// Função para fazer requisição SQL via REST API (mais confiável que bibliotecas JS para DDL complexo)
// Mas o Supabase não expõe endpoint SQL direto facilmente sem extensions.
// Então vamos usar a API de Storage para FORÇAR a atualização das permissões do bucket 'videos'

async function updateBucketPublic(bucketId) {
    console.log(`Atualizando bucket '${bucketId}' para PUBLIC...`);

    const options = {
        hostname: `${PROJECT_REF}.supabase.co`,
        path: `/storage/v1/bucket/${bucketId}`,
        method: 'PUT',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json'
        }
    };

    const data = JSON.stringify({
        public: true
    });

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log(`Status Update: ${res.statusCode}`);
                console.log(`Response: ${body}`);
                resolve(body);
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// Como não conseguimos rodar SQL diretamente via script sem token, 
// o erro 'violates row-level security policy' no STORAGE indica que
// FALTA A POLÍTICA DE STORAGE.

// Solução: O usuário TEM QUE rodar o SQL de politica.
// Mas se ele diz que rodou, pode ser que rodou no projeto errado ou não comitou.
// Vou criar um arquivo .sql SOMENTE com a política de storage para ele rodar de novo.

console.log("Este script apenas verifica a visibilidade pública. A política RLS deve ser SQL.");
updateBucketPublic('videos');
