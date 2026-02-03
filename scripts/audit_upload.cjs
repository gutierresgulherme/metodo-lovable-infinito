const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://eidcxqxjmraargwhrdai.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpZGN4cXhqbXJhYXJnd2hyZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMDk5MDQsImV4cCI6MjA3NzY4NTkwNH0.N3rGabdTCz5IjdJlUw58nBpC7m4aIVJnP5r_brT8W5Y';

// Stateless client like in the app
const supabasePublic = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

async function testUpload() {
    console.log('--- AUDIT UPLOAD (STATELESS) ---');
    const dummyFile = Buffer.from('test video content');
    try {
        const { data, error } = await supabasePublic.storage
            .from('videos')
            .upload('test_audit.mp4', dummyFile, {
                upsert: true,
                contentType: 'video/mp4'
            });

        if (error) {
            console.error('❌ Upload Failed:', error);
        } else {
            console.log('✅ Upload Success:', data);
        }
    } catch (e) {
        console.error('Fatal:', e);
    }
}

testUpload();
