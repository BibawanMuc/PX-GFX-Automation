'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { RenderJob } from '@/types'
import { Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react'

export function JobHistory() {
    const [jobs, setJobs] = useState<RenderJob[]>([])

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

        return () => {
            subscription.unsubscribe()
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

    return (
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
    )
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'completed' || status === 'done') return <CheckCircle className="w-4 h-4 text-tech-green" />
    if (status === 'processing') return <Loader className="w-4 h-4 text-tech-cyan animate-spin" />
    if (status === 'failed') return <AlertCircle className="w-4 h-4 text-red-500" />
    return <Clock className="w-4 h-4 text-tech-dim" />
}
