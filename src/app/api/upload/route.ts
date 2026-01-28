import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'



export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())

        // SAFE_BASE from previous context
        const SAFE_BASE = "d:\\PX KI Event\\PROJECT\\CODE\\GFX_LINK\\CODE3\\dashboard"
        const uploadDir = path.join(SAFE_BASE, 'uploads')

        // Create dir if not exists
        await mkdir(uploadDir, { recursive: true })

        // Unique filename to prevent overwrite or handle it? 
        // User probably wants to overwrite if they upload "Video.mp4" again.
        // Let's keep original name for clarity in AE.
        const filename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
        const filePath = path.join(uploadDir, filename)

        await writeFile(filePath, buffer)

        console.log(`File uploaded: ${filePath}`)

        return NextResponse.json({
            success: true,
            path: filePath
        })

    } catch (error: any) {
        console.error('Upload Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
