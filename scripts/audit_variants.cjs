const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://eidcxqxjmraargwhrdai.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpZGN4cXhqbXJhYXJnd2hyZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMDk5MDQsImV4cCI6MjA3NzY4NTkwNH0.N3rGabdTCz5IjdJlUw58nBpC7m4aIVJnP5r_brT8W5Y';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- AUDIT VSL VARIANTS ---');
    try {
        const { data: variants, error } = await supabase.from('vsl_variants').select('*');
        if (error) console.error('Error:', error);
        else console.log('Variants count:', variants.length, variants.slice(0, 3));
    } catch (e) {
        console.error('Fatal:', e);
    }
}
check();
