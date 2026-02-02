
import https from 'https';

const PROJECT_REF = 'eidcxqxjmraargwhrdai';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpZGN4cXhqbXJhYXJnd2hyZGFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjEwOTkwNCwiZXhwIjoyMDc3Njg1OTA0fQ.fOI4mR5mfyxicrlkcfJGWQQUn5Jw4UCbWwVuGD5WjF0';

const options = {
    hostname: `${PROJECT_REF}.supabase.co`,
    path: '/storage/v1/bucket',
    method: 'POST',
    headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
    }
};

const data = JSON.stringify({
    id: 'site_uploads',
    name: 'site_uploads',
    public: true,
    file_size_limit: 5242880,
    allowed_mime_types: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
});

console.log('Tentando criar bucket via Node https (ESM)...');

const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);

    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Response:', body);
    });
});

req.on('error', (e) => {
    console.error(`ERRO DE CONEXÃO: ${e.message}`);
});

req.write(data);
req.end();
