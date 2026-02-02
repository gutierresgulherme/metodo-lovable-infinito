
import https from 'https';

// Configuring with the user's provided project and service key
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
    id: 'videos',
    name: 'videos',
    public: true,
    file_size_limit: null, // Unlimited size for videos (or set high cap)
    allowed_mime_types: ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/x-msvideo', 'video/mpeg']
});

console.log('Tentando criar bucket "videos" via API...');

const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Response:', body);
    });
});

req.on('error', (e) => {
    console.error(`ERRO: ${e.message}`);
});

req.write(data);
req.end();
