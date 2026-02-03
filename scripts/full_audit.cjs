const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://eidcxqxjmraargwhrdai.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpZGN4cXhqbXJhYXJnd2hyZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMDk5MDQsImV4cCI6MjA3NzY4NTkwNH0.N3rGabdTCz5IjdJlUw58nBpC7m4aIVJnP5r_brT8W5Y';
const db = createClient(supabaseUrl, supabaseKey);

async function checkAll() {
    console.log("--- FULL VIDEO SLOTS AUDIT ---");
    const { data: videos } = await db.from("vsl_video").select("*");
    console.log("Videos in DB:", videos);

    const { data: banners } = await db.from("banner_images").select("*");
    console.log("Banners in DB:", banners);
}

checkAll();
