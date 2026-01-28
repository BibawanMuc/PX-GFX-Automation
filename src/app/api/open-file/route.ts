import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import fs from 'fs'

export async function POST(request: Request) {
    try {
        const { filePath } = await request.json()

        if (!filePath) {
            return NextResponse.json({ error: 'No file path provided' }, { status: 400 })
        }

        // Security/Sanity Check: Ensure it attempts to open a file that actually exists
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        console.log(`Attempting to open: ${filePath}`)

        // Windows command to open file in default viewer
        // "start" command needs an empty title argument first: start "" "path"
        const command = `start "" "${filePath}"`

        exec(command, (error) => {
            if (error) {
                console.error(`Exec error: ${error}`)
                // We don't necessarily want to fail the request if the detach works, 
                // but 'start' usually returns immediately.
            }
        })

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Open File Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
