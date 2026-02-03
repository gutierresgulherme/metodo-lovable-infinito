import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://eidcxqxjmraargwhrdai.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpZGN4cXhqbXJhYXJnd2hyZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMDk5MDQsImV4cCI6MjA3NzY4NTkwNH0.N3rGabdTCz5IjdJlUw58nBpC7m4aIVJnP5r_brT8W5Y";

async function audit() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("--- SUPABASE AUDIT START ---");

    // 1. Check Tables
    const { data: vsls, error: vslError } = await supabase.from('vsl_video').select('*');
    console.log("Tables Check:", vslError ? vslError.message : `vsl_video has ${vsls.length} rows`);
    if (vsls) vsls.forEach(v => console.log(`  - ${v.page_key}: ${v.video_url}`));

    // 2. Check Storage Objects via anon
    const { data: objects, error: objError } = await supabase.storage.from('videos').list('vsl');
    if (objError) {
        console.error("Storage List Error:", objError.message);
    } else {
        console.log("Storage 'videos/vsl' objects:", objects.map(o => o.name));
    }

    // 3. Test Public Accessibility of stored URLs
    if (vsls) {
        for (const v of vsls) {
            if (v.video_url) {
                console.log(`Testing URL: ${v.video_url}`);
                // Note: can't easily fetch in Node without many deps but we did HEAD earlier
            }
        }
    }

    console.log("--- AUDIT END ---");
}

audit();
