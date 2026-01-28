const chokidar = require('chokidar');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Or SERVICE_ROLE_KEY if RLS policies prevent update. usually anon key is fine if policies allow.
// But for backend scripts, SERVICE_ROLE might be better if available.
// Given previous context, user likely has anon key in env. Let's try that first.
// If update fails, we might need service role.

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Error: Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const WATCH_FOLDER = path.join(__dirname, '..', '_Renderings');

console.log(`Starting Watcher for: ${WATCH_FOLDER}`);

if (!fs.existsSync(WATCH_FOLDER)) {
    console.log(`Folder ${WATCH_FOLDER} does not exist. Creating it...`);
    fs.mkdirSync(WATCH_FOLDER, { recursive: true });
}

const watcher = chokidar.watch(WATCH_FOLDER, {
    persistent: true,
    ignoreInitial: false, // Process existing files too? Maybe valid if script restarts.
    depth: 0, // Only top level
    awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
    }
});

watcher.on('add', async (filePath) => {
    const fileName = path.basename(filePath);

    // Ignore dot files or hidden files
    if (fileName.startsWith('.')) return;

    console.log(`File detected: ${fileName}`);

    // Parse: SYFY_Trailer_Titel_GLEICH.mxf -> SYFY_Trailer_Titel_GLEICH
    const jobName = path.parse(fileName).name;

    try {
        // 1. Find the job
        const { data: jobs, error: findError } = await supabase
            .from('render_jobs')
            .select('id, status')
            .eq('new_comp_name', jobName)
            .neq('status', 'done') // Only pending/processing ones
            .limit(1);

        if (findError) throw findError;

        if (jobs && jobs.length > 0) {
            const job = jobs[0];
            console.log(`Matching Job found: ${job.id} (Status: ${job.status}). Updating to DONE...`);

            // 2. Update status
            const { error: updateError } = await supabase
                .from('render_jobs')
                .update({
                    status: 'done',
                    output_path: filePath // Optional: save local path
                })
                .eq('id', job.id);

            if (updateError) throw updateError;

            console.log(`✅ Job ${job.id} marked as DONE.`);
        } else {
            console.log(`ℹ️ No pending job found for ${jobName} (or already done).`);
        }

    } catch (err) {
        console.error(`❌ Error processing ${fileName}:`, err.message);
    }
});

watcher.on('error', error => console.error(`Watcher Error: ${error}`));
