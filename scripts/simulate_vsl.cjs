const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://eidcxqxjmraargwhrdai.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpZGN4cXhqbXJhYXJnd2hyZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMDk5MDQsImV4cCI6MjA3NzY4NTkwNH0.N3rGabdTCz5IjdJlUw58nBpC7m4aIVJnP5r_brT8W5Y';
const db = createClient(supabaseUrl, supabaseKey);

async function testSimulation() {
    console.log("--- SIMULATING VSL SELECTION LOGIC ---");

    // Simulating inputs
    const hostname = "metodo-lovable-infinito.vip";

    // A. Legacy Video
    const { data: legacyVideo } = await db.from("vsl_video")
        .select("*")
        .eq("page_key", "home_vsl")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    console.log("Legacy Video Found:", legacyVideo ? legacyVideo.video_url : "NONE");

    // B. Test Center
    const { data: testCenter } = await db.from('vsl_test_centers')
        .select('*, active_vsl:vsl_variants!active_vsl_id(*)')
        .eq('domain', hostname)
        .maybeSingle();

    console.log("Test Center Info:", testCenter);

    let activeVslObj = null;
    let isActive = false;

    if (testCenter && testCenter.status === "active") {
        isActive = true;
        if (testCenter.active_vsl) {
            activeVslObj = testCenter.active_vsl;
        } else if (testCenter.vsl_slug) {
            // mock getVSLBySlug
            const { data } = await db.from('vsl_variants').select('*').eq('slug', testCenter.vsl_slug).maybeSingle();
            activeVslObj = data;
        }
    }

    console.log("Pre-Fallback Choice:", activeVslObj ? activeVslObj.slug : "NULL");

    if ((!activeVslObj || !activeVslObj.video_url) && legacyVideo) {
        console.log("Applying Fallback to Legacy Video");
        activeVslObj = legacyVideo;
    }

    console.log("FINAL RESULT:", activeVslObj);
}

testSimulation();
