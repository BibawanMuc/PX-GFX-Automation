'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, Play, Plus, Clock, Calendar } from 'lucide-react'
import { JobInput } from '@/types'

// Not strictly using the JobInput interface for *state* anymore because inputs are split
// But we will construct JobInput objects for submission.

const DAYS_OPTIONS = [
    "HEUTE", "MORGEN", "GLEICH", "JETZT",
    "MONTAG", "DIENSTAG", "MITTWOCH", "DONNERSTAG", "FREITAG", "SAMSTAG", "SONNTAG"
]

export function InputForm() {
    // Core Data
    const [compTemplate, setCompTemplate] = useState('Trailer') // Default per new requirement
    const [title1, setTitle1] = useState('')
    const [title2, setTitle2] = useState('')

    // Batch Data
    const [selectedDays, setSelectedDays] = useState<string[]>([])
    const [customDate, setCustomDate] = useState('')
    const [timeValue, setTimeValue] = useState('') // "20:15"

    // Paths
    const [videoPath, setVideoPath] = useState('')
    const [packshotPath, setPackshotPath] = useState('')

    // Status
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const toggleDay = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        )
    }

    // Helper to generate a single Job Payload
    const createJobPayload = (tuneInText: string): JobInput => {
        // Auto-generate name: SYFY_Title1_Title2_TuneIn
        const rawName = `SYFY_${title1}_${title2}_${tuneInText}`
        const sanitizedName = rawName
            .replace(/[^a-zA-Z0-9_\- ]/g, '')
            .replace(/\s+/g, ' ')
            .trim()

        return {
            comp_template: compTemplate,
            title1,
            title2,
            tune_in: tuneInText,
            video_path: videoPath,
            packshot_path: packshotPath,
            new_comp_name: sanitizedName,
            output_path: ''
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        try {
            // 1. Validate Inputs
            if (selectedDays.length === 0 && !customDate) {
                throw new Error("Bitte mindestens einen Tag wählen oder ein Datum eingeben.")
            }
            // Logic change: Time is optional if ONLY "GLEICH" or "JETZT" are selected?
            // User requirement says remove time for them, but presumably time is still needed for other days.
            // Let's keep the time check generally but maybe relax it if ONLY gleich/jetzt selected? 
            // For now, assuming timeValue is present but ignored for specific ones.
            if (!timeValue && !selectedDays.every(d => d === 'GLEICH' || d === 'JETZT')) {
                throw new Error("Bitte eine Uhrzeit angeben (z.B. 20:15).")
            }

            // 2. Generate Variations
            const variations: string[] = []

            // Add Day Variations
            selectedDays.forEach(day => {
                if (day === 'GLEICH' || day === 'JETZT') {
                    variations.push(day)
                } else {
                    variations.push(`${day} ${timeValue}`)
                }
            })

            // Add Date Variation: "27. NOV 20:15"
            if (customDate) {
                variations.push(`${customDate} ${timeValue}`)
            }

            console.log("Generating Jobs for:", variations)

            // 3. Create Jobs in Supabase (Parallel)
            const createdJobIds: string[] = []

            for (const variant of variations) {
                const payload = createJobPayload(variant)

                const { data, error } = await supabase
                    .from('render_jobs')
                    .insert([{
                        ...payload,
                        status: 'pending'
                    }])
                    .select()
                    .single()

                if (error) throw error
                if (data) createdJobIds.push(data.id)
            }

            setMessage(`Created ${createdJobIds.length} jobs. Triggering Render...`)

            // 4. Trigger Batch Render API
            const response = await fetch('/api/render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobIds: createdJobIds })
            })

            if (!response.ok) {
                const errJson = await response.json()
                throw new Error('Batch Render Failed: ' + (errJson.error || response.statusText))
            }

            const resJson = await response.json()
            setMessage(`Success! ${resJson.message}`)

            // Reset "Days" and "Date" after success? user might want to reuse titles.
            // keeping titles, clearing selection
            setSelectedDays([])
            setCustomDate('')

        } catch (err: any) {
            console.error(err)
            setMessage('Error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-tech-surface p-6 rounded-lg border border-tech-border/50 shadow-xl shadow-tech-cyan/5">
            {/* --- COMP & TITLES --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-tech-dim mb-1">Comp Template</label>
                    <input
                        value={compTemplate}
                        onChange={e => setCompTemplate(e.target.value)}
                        className="w-full bg-tech-dark border border-tech-border text-white p-3 rounded focus:outline-none focus:border-tech-cyan"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-wider text-tech-dim mb-1">Titel 1</label>
                    <input
                        value={title1}
                        onChange={e => setTitle1(e.target.value)}
                        className="w-full bg-tech-dark border border-tech-border text-white p-3 rounded focus:outline-none focus:border-tech-purple"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-wider text-tech-dim mb-1">Titel 2</label>
                    <input
                        value={title2}
                        onChange={e => setTitle2(e.target.value)}
                        className="w-full bg-tech-dark border border-tech-border text-white p-3 rounded focus:outline-none focus:border-tech-purple"
                        required
                    />
                </div>
            </div>

            {/* --- TUNE IN CONFIGURATOR --- */}
            <div className="border-t border-b border-tech-border/30 py-4 space-y-4">
                <h3 className="text-sm font-bold text-tech-cyan uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Tune In Configuration
                </h3>

                <div className="flex gap-4 items-end">
                    <div className="w-32">
                        <label className="block text-xs uppercase tracking-wider text-tech-dim mb-1">Uhrzeit</label>
                        <input
                            value={timeValue}
                            onChange={e => setTimeValue(e.target.value)}
                            placeholder="20:15"
                            className="w-full bg-tech-dark border border-tech-border text-tech-cyan font-bold p-3 rounded focus:outline-none focus:border-tech-cyan text-center"
                            required
                        />
                    </div>

                    <div className="flex-1">
                        <label className="block text-xs uppercase tracking-wider text-tech-dim mb-1">Datum (Optional)</label>
                        <input
                            value={customDate}
                            onChange={e => setCustomDate(e.target.value)}
                            placeholder="27. NOV"
                            className="w-full bg-tech-dark border border-tech-border text-white p-3 rounded focus:outline-none focus:border-tech-purple"
                        />
                    </div>
                </div>

                {/* ... (Days Buttons) ... */}
                <div>
                    <label className="block text-xs uppercase tracking-wider text-tech-dim mb-2">Wochetage wählen</label>
                    <div className="flex flex-wrap gap-2">
                        {DAYS_OPTIONS.map(day => (
                            <button
                                type="button"
                                key={day}
                                onClick={() => toggleDay(day)}
                                className={`px-3 py-2 text-xs font-bold rounded border transition-all ${selectedDays.includes(day)
                                    ? 'bg-tech-cyan text-black border-tech-cyan shadow-[0_0_10px_rgba(0,243,255,0.3)]'
                                    : 'bg-tech-dark text-tech-dim border-tech-border hover:border-tech-cyan/50 hover:text-white'
                                    }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- LIVE PREVIEW --- */}
                <div className="bg-black/20 p-3 rounded border border-tech-border/30">
                    <label className="block text-[10px] uppercase tracking-wider text-tech-dim mb-1">Generated Output(s)</label>
                    <div className="space-y-1">
                        {selectedDays.length === 0 && !customDate && <span className="text-white/20 text-xs italic">No selection...</span>}

                        {selectedDays.map(day => {
                            const isSpecial = day === 'GLEICH' || day === 'JETZT';
                            const tuneIn = isSpecial ? day : `${day} ${timeValue || "TIME"}`;
                            return (
                                <div key={day} className="text-xs text-tech-purple flex items-center gap-2 font-mono">
                                    <span>• {tuneIn}</span>
                                    <span className="text-white/20">→ {`SYFY_${title1}_${title2}_${tuneIn}`}</span>
                                </div>
                            )
                        })}
                        {customDate && (
                            <div className="text-xs text-tech-purple flex items-center gap-2 font-mono">
                                <span>• {customDate} {timeValue || "TIME"}</span>
                                <span className="text-white/20">→ {`SYFY_${title1}_${title2}_${customDate} ${timeValue || "TIME"}`}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ... (Rest of Form) ... */}


            {/* --- PATHS (DROPZONES) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileDropZone
                    label="Video Path"
                    accept="video/*"
                    currentPath={videoPath}
                    onUploadComplete={setVideoPath}
                />

                <FileDropZone
                    label="Packshot Path"
                    accept="image/*,video/*"
                    currentPath={packshotPath}
                    onUploadComplete={setPackshotPath}
                />
            </div>

            {/* --- SUBMIT --- */}
            <div className="pt-4 flex items-center justify-between">
                <span className="text-xs text-tech-cyan font-mono animate-pulse">{message}</span>

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-tech-cyan text-black px-8 py-3 rounded font-bold uppercase tracking-widest hover:bg-white hover:shadow-[0_0_20px_rgba(0,243,255,0.5)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    BATCH RENDER
                </button>
            </div>
        </form>
    )
}

// --- SUB-COMPONENT: File Dropzone ---
function FileDropZone({ label, accept, currentPath, onUploadComplete }: {
    label: string,
    accept?: string,
    currentPath: string,
    onUploadComplete: (path: string) => void
}) {
    const [isDragging, setIsDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [fileName, setFileName] = useState('')

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const files = e.dataTransfer.files
        if (files?.length > 0) {
            await uploadFile(files[0])
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await uploadFile(e.target.files[0])
        }
    }

    const uploadFile = async (file: File) => {
        setUploading(true)
        setFileName(file.name)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (!res.ok) throw new Error('Upload failed')

            const data = await res.json()
            onUploadComplete(data.path)

        } catch (err) {
            console.error(err)
            setFileName('Error uploading file')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div
            className={`border-2 border-dashed rounded-lg p-4 transition-all ${isDragging
                ? 'border-tech-cyan bg-tech-cyan/10'
                : 'border-tech-border bg-tech-dark'
                }`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
        >
            <div className="flex flex-col items-center justify-center gap-2 text-center">
                <label className="text-xs uppercase tracking-wider text-tech-dim">{label}</label>

                {uploading ? (
                    <Loader2 className="w-8 h-8 text-tech-cyan animate-spin" />
                ) : (
                    <div className="relative group cursor-pointer">
                        <input
                            type="file"
                            accept={accept}
                            onChange={handleFileSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-1 group-hover:text-tech-cyan transition-colors">
                            <Plus className="w-8 h-8 text-tech-dim group-hover:text-tech-cyan" />
                            <span className="text-xs text-tech-dim">Drop file or click</span>
                        </div>
                    </div>
                )}

                {/* Status Display */}
                <div className="text-xs font-mono break-all mt-2">
                    {currentPath ? (
                        <span className="text-tech-purple">
                            {fileName || currentPath.split('\\').pop()}
                            <span className="text-tech-dim block text-[10px] opacity-50">Deployed</span>
                        </span>
                    ) : (
                        <span className="text-tech-dim/30">No file selected</span>
                    )}
                </div>
            </div>
        </div>
    )
}
