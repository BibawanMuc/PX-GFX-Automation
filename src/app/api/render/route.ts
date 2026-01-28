import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
    console.log("!!! API ROUTE - CONSOLIDATED DASHBOARD PATHS (BATCH SUPPORT) !!!")
    try {
        const body = await request.json()

        // Support both single jobId (legacy) and jobIds array
        let jobIds: string[] = []
        if (body.jobIds && Array.isArray(body.jobIds)) {
            jobIds = body.jobIds
        } else if (body.jobId) {
            jobIds = [body.jobId]
        }

        if (jobIds.length === 0) return NextResponse.json({ error: 'Missing jobId or jobIds' }, { status: 400 })

        // 1. Fetch Jobs
        const { data: jobs, error } = await supabase
            .from('render_jobs')
            .select('*')
            .in('id', jobIds)

        if (error || !jobs || jobs.length === 0) return NextResponse.json({ error: 'Jobs not found' }, { status: 404 })

        // 2. Generate TSV Content (Multi-line)
        const header = "Comp\tTitel1\tTitel2\tTuneIn\tVideo\tPackshot\tNewComp\tPath\tOutput"

        const rows = jobs.map(job => [
            job.comp_template,
            job.title1,
            job.title2,
            job.tune_in,
            job.video_path || '',
            job.packshot_path || '',
            job.new_comp_name,
            '', // Path
            ''  // Output
        ].join('\t'))

        const fileContent = `${header}\n${rows.join('\n')}`

        // define SAFE PATHS using process.cwd() (Dynamic System Path)
        const SAFE_BASE = process.cwd()

        console.log("Using SAFE_BASE:", SAFE_BASE)
        console.log(`Processing Batch of ${jobs.length} jobs. IDs:`, jobIds)

        // 3. Write to Temp File inside dashboard/tmp (Use first ID for filename to keep it simple, or a unique batch ID)
        // We'll use the timestamp + first ID to ensure uniqueness if needed, or just job_BATCH_FirstID
        const mainJobId = jobIds[0]
        const tsvPath = path.join(SAFE_BASE, 'tmp', `batch_${mainJobId}.txt`)

        // Ensure tmp directory exists
        await fs.mkdir(path.dirname(tsvPath), { recursive: true })

        await fs.writeFile(tsvPath, fileContent, 'utf-8')

        // 4. Update Status for ALL jobs
        await supabase
            .from('render_jobs')
            .update({ status: 'processing', render_file_path: tsvPath })
            .in('id', jobIds)

        // 5. Generate Wrapper Script
        // Script is now in dashboard/scripts
        const scriptPath = path.join(SAFE_BASE, 'scripts', 'px_automate.jsx')
        const escapedTsvPath = tsvPath.replace(/\\/g, '/')
        const escapedScriptPath = scriptPath.replace(/\\/g, '/')

        const wrapperContent = `var GLOBAL_JOB_FILE = "${escapedTsvPath}";
var GLOBAL_DASHBOARD_PATH = "${SAFE_BASE.replace(/\\/g, '/')}";
// @include "${escapedScriptPath}"
`
        const wrapperPath = path.join(SAFE_BASE, 'tmp', `run_batch_${mainJobId}.jsx`)
        await fs.writeFile(wrapperPath, wrapperContent, 'utf-8')

        // 6. PYTHON LAUNCHER STRATEGY
        const aePath = process.env.AE_BINARY_PATH || "C:\\Program Files\\Adobe\\Adobe After Effects 2026\\Support Files\\AfterFX.exe"

        // Use the new relative location for the project file
        // dashboard/_AE Projekte/SYFY.aep
        const projectPath = path.join(SAFE_BASE, '_AE Projekte', 'SYFY.aep')

        // Launcher is now in dashboard/scripts
        const launcherPath = path.join(SAFE_BASE, 'scripts', 'launcher.py')

        console.log("Spawning Python Launcher...")
        console.log("Script:", launcherPath)
        console.log("Project:", projectPath)

        // Spawn Python process
        const pythonProcess = spawn('python', [
            launcherPath,
            aePath,
            projectPath,
            wrapperPath
        ], {
            detached: true,
            stdio: 'ignore'
        })

        if (pythonProcess && typeof pythonProcess.unref === 'function') {
            pythonProcess.unref()
        }

        return NextResponse.json({
            success: true,
            message: `Batch Render Triggered for ${jobs.length} items`,
            filePath: tsvPath
        })

    } catch (err: any) {
        console.error(err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
