const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://eidcxqxjmraargwhrdai.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpZGN4cXhqbXJhYXJnd2hyZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMDk5MDQsImV4cCI6MjA3NzY4NTkwNH0.N3rGabdTCz5IjdJlUw58nBpC7m4aIVJnP5r_brT8W5Y';
const db = createClient(supabaseUrl, supabaseKey);

async function testUpsert() {
    console.log("--- TESTING ANON UPSERT ON VSL_VIDEO ---");
    const testPayload = {
        page_key: 'audit_test_slot',
        video_url: 'https://example.com/test.mp4',
        created_at: new Date().toISOString()
    };

    const { data, error } = await db.from('vsl_video').upsert(testPayload, { onConflict: 'page_key' }).select();
    if (error) {
        console.error("❌ Anon Upsert Failed:", error);
    } else {
        console.log("✅ Anon Upsert Success:", data);
        // cleanup
        await db.from('vsl_video').delete().eq('page_key', 'audit_test_slot');
    }
}

testUpsert();
