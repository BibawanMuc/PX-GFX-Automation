export interface RenderJob {
    id: string
    created_at: string
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'done'
    comp_template: string
    title1: string
    title2: string
    tune_in: string
    video_path: string
    packshot_path: string
    new_comp_name: string
    output_path?: string
    render_file_path?: string
}

export type JobInput = Omit<RenderJob, 'id' | 'created_at' | 'status' | 'render_file_path'>
