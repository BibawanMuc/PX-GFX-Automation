
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
    const dashboardDir = process.cwd();
    const statusPath = path.join(dashboardDir, 'tmp', 'system_status.json');
    const logPath = path.join(dashboardDir, 'tmp', 'ae_script_debug.txt');

    let status = { status: 'unknown', message: '', timestamp: 0 };
    let logs = '';

    try {
        const statusContent = await fs.readFile(statusPath, 'utf-8');
        status = JSON.parse(statusContent);
    } catch (e) {
        // File might not exist yet
    }

    try {
        logs = await fs.readFile(logPath, 'utf-8');
        // Limit logs to last 20 lines?
        const lines = logs.split('\n');
        if (lines.length > 50) {
            logs = lines.slice(-50).join('\n');
        }
    } catch (e) {
        logs = 'No logs available yet.';
    }

    return NextResponse.json({
        ...status,
        logs
    });
}
