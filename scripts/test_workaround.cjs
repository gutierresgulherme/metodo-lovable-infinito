const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://eidcxqxjmraargwhrdai.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpZGN4cXhqbXJhYXJnd2hyZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMDk5MDQsImV4cCI6MjA3NzY4NTkwNH0.N3rGabdTCz5IjdJlUw58nBpC7m4aIVJnP5r_brT8W5Y';
const db = createClient(supabaseUrl, supabaseKey);

async function testUpsert() {
    console.log("--- WORKAROUND: DELETE THEN INSERT ---");
    const testPayload = {
        page_key: 'audit_workaround_slot',
        video_url: 'https://example.com/workaround.mp4',
        created_at: new Date().toISOString()
    };

    // First delete
    await db.from('vsl_video').delete().eq('page_key', testPayload.page_key);

    // Then insert
    const { data, error } = await db.from('vsl_video').insert(testPayload).select();
    if (error) {
        console.error("❌ Workaround Failed:", error);
    } else {
        console.log("✅ Workaround Success:", data);
        await db.from('vsl_video').delete().eq('page_key', testPayload.page_key);
    }
}

testUpsert();
