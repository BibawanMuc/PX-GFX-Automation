'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { RenderJob } from '@/types'
import { Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react'

export function JobHistory() {
    const [jobs, setJobs] = useState<RenderJob[]>([])
    const [systemStatus, setSystemStatus] = useState<any>(null)
    const [systemLogs, setSystemLogs] = useState<string>('')
    const [showLogs, setShowLogs] = useState(false)

    useEffect(() => {
        const fetchJobs = async () => {
            const { data } = await supabase
                .from('render_jobs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20)

            if (data) setJobs(data as RenderJob[])
        }

        fetchJobs()

        // Realtime subscription
        const subscription = supabase
            .channel('render_jobs_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'render_jobs' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setJobs(prev => [payload.new as RenderJob, ...prev])
                } else if (payload.eventType === 'UPDATE') {
                    setJobs(prev => prev.map(job => job.id === payload.new.id ? (payload.new as RenderJob) : job))
                }
            })
            .subscribe()

        // SYSTEM STATUS POLLING
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/system/status')
                if (res.ok) {
                    const data = await res.json()
                    setSystemStatus(data)
                    setSystemLogs(data.logs)

                    // Auto-refresh jobs list when status changes to stopped (just to be safe)
                    if (data.status === 'stopped') {
                        // We could re-fetch jobs here if needed, but Realtime should handle it.
                    }
                }
            } catch (e) {
                console.error("Polling error", e)
            }
        }, 2000)

        return () => {
            subscription.unsubscribe()
            clearInterval(interval)
        }
    }, [])

    const clearHistory = async () => {
        if (!confirm('Are you sure you want to delete all job history? This cannot be undone.')) return
        try {
            const res = await fetch('/api/jobs/clear', { method: 'DELETE' })
            if (res.ok) {
                setJobs([])
            }
        } catch (e) {
            console.error("Failed to clear history", e)
        }
    }

    // CALCULATE PROGRESS
    // We consider "active batch" as all jobs created in the last 10 minutes? 
    // Or just calculate based on visible list?
    // Let's keep it simple: if AE is running, calculate % of "processing" vs "done" in the top 20.
    const activeJobs = jobs.filter(j => j.status === 'processing' || (j.status === 'done' && new Date(j.created_at).getTime() > Date.now() - 1000 * 60 * 60)) // last hour
    const processingCount = jobs.filter(j => j.status === 'processing').length
    const doneCount = activeJobs.filter(j => j.status === 'done').length
    const totalBatch = processingCount + doneCount
    const progressPercent = totalBatch > 0 ? (doneCount / totalBatch) * 100 : 0

    const isRunning = systemStatus?.status === 'running' || systemStatus?.status === 'rendering' || systemStatus?.status === 'starting'

    return (
        <div className="space-y-6">

            {/* SYSTEM STATUS CARD */}
            <div className="bg-tech-surface p-4 rounded border border-tech-border">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-tech-cyan animate-pulse' : 'bg-tech-dim'}`} />
                        Render Engine
                    </h2>
                    <span className="text-xs font-mono uppercase text-tech-dim">{systemStatus?.status || 'OFFLINE'}</span>
                </div>

                {isRunning && (
                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-tech-dim mb-1">
                            <span>Progress</span>
                            <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="h-2 bg-black/50 rounded overflow-hidden">
                            <div
                                className="h-full bg-tech-cyan transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <p className="text-xs text-center mt-1 text-tech-dim animate-pulse">
                            Processing {processingCount} items...
                        </p>
                    </div>
                )}

                <div className="mt-2">
                    <button
                        onClick={() => setShowLogs(!showLogs)}
                        className="text-xs text-tech-dim hover:text-white underline"
                    >
                        {showLogs ? 'Hide Engine Logs' : 'Show Engine Logs'}
                    </button>

                    {showLogs && (
                        <div className="mt-2 text-[10px] font-mono bg-black/80 p-2 rounded h-32 overflow-y-auto whitespace-pre-wrap text-green-400/80">
                            {systemLogs}
                        </div>
                    )}
                </div>
            </div>

            {/* JOB HISTORY */}
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-white to-tech-dim bg-clip-text text-transparent">Job Log</h2>
                    {jobs.length > 0 && (
                        <button
                            onClick={clearHistory}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors uppercase font-mono tracking-wider border border-red-900/30 px-2 py-1 rounded hover:bg-red-900/10"
                        >
                            Clear Log
                        </button>
                    )}
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {jobs.map(job => (
                        <div
                            key={job.id}
                            onClick={async () => {
                                if (job.status === 'done' && job.output_path) {
                                    try {
                                        await fetch('/api/open-file', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ filePath: job.output_path })
                                        })
                                    } catch (e) {
                                        console.error("Failed to open file", e)
                                    }
                                }
                            }}
                            className={`bg-tech-surface p-4 rounded border-l-4 border-tech-border transition-colors group relative overflow-hidden ${(job.status === 'done' && job.output_path)
                                ? 'cursor-pointer hover:bg-tech-surface-highlight hover:shadow-[0_0_15px_rgba(0,255,100,0.1)]'
                                : 'hover:bg-tech-surface-highlight'
                                }`}
                            style={{
                                borderLeftColor:
                                    (job.status === 'completed' || job.status === 'done') ? 'var(--tech-green)' :
                                        job.status === 'processing' ? 'var(--tech-cyan)' :
                                            job.status === 'failed' ? 'red' : 'var(--tech-dim)'
                            }}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-white group-hover:text-tech-cyan transition-colors truncate pr-4">{job.new_comp_name || 'Untitled'}</h3>
                                <StatusBadge status={job.status} />
                            </div>

                            <div className="text-xs text-tech-dim flex flex-col gap-1">
                                <p>{job.comp_template}</p>
                                <p className="font-mono text-[10px] opacity-50">{new Date(job.created_at).toLocaleString()}</p>
                            </div>

                            {job.status === 'processing' && (
                                <div className="absolute bottom-0 left-0 h-0.5 bg-tech-cyan animate-pulse w-full" />
                            )}
                        </div>
                    ))}

                    {jobs.length === 0 && (
                        <div className="text-center py-12 text-tech-dim border border-dashed border-tech-border rounded bg-tech-surface/30">
                            NO LOGS FOUND
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'completed' || status === 'done') return <CheckCircle className="w-4 h-4 text-tech-green" />
    if (status === 'processing') return <Loader className="w-4 h-4 text-tech-cyan animate-spin" />
    if (status === 'failed') return <AlertCircle className="w-4 h-4 text-red-500" />
    return <Clock className="w-4 h-4 text-tech-dim" />
}
