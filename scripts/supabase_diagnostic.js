import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://eidcxqxjmraargwhrdai.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpZGN4cXhqbXJhYXJnd2hyZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMDk5MDQsImV4cCI6MjA3NzY4NTkwNH0.N3rGabdTCz5IjdJlUw58nBpC7m4aIVJnP5r_brT8W5Y";

async function setup() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log("Attempting to create bucket 'videos'...");
    const { data, error } = await supabase.storage.createBucket('videos', {
        public: true,
        fileSizeLimit: 524288000, // 500MB
        allowedMimeTypes: ['video/mp4', 'video/webm', 'image/png', 'image/jpeg']
    });

    if (error) {
        if (error.message.includes("already exists")) {
            console.log("Bucket 'videos' already exists.");
        } else {
            console.error("Failed to create bucket:", error.message);
        }
    } else {
        console.log("Bucket 'videos' created successfully!", data);
    }

    // Also create 'banners' just in case
    await supabase.storage.createBucket('banners', { public: true });
}

setup();
