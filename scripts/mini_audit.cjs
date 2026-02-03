const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eidcxqxjmraargwhrdai.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpZGN4cXhqbXJhYXJnd2hyZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMDk5MDQsImV4cCI6MjA3NzY4NTkwNH0.N3rGabdTCz5IjdJlUw58nBpC7m4aIVJnP5r_brT8W5Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- AUDIT SUPABASE ---');
    try {
        const { data: videos, error: vError } = await supabase.from('vsl_video').select('*');
        if (vError) console.error('Error vsl_video:', vError);
        else console.log('vsl_video count:', videos.length, videos);

        const { data: buckets, error: bError } = await supabase.storage.listBuckets();
        if (bError) console.error('Error buckets:', bError);
        else console.log('Buckets:', buckets);

        // Check specific file url
        const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl('vsl/home_vsl.mp4');
        console.log('Generated URL:', publicUrl);

    } catch (e) {
        console.error('Fatal:', e);
    }
}

check();
