import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function DELETE() {
    try {
        const { error } = await supabase
            .from('render_jobs')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000') // Efficient way to delete all rows

        if (error) throw error

        return NextResponse.json({ success: true, message: 'Job history cleared' })
    } catch (error: any) {
        console.error('Clear Jobs Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
