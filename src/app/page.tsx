import { InputForm } from '@/components/InputForm'
import { JobHistory } from '@/components/JobHistory'
import { Header } from '@/components/Header'

export default function Home() {
  return (
    <div className="min-h-screen bg-tech-dark text-tech-cyan font-mono selection:bg-tech-cyan selection:text-tech-dark">
      <Header />

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="border-l-2 border-tech-cyan pl-4">
            <h2 className="text-2xl font-bold text-white tracking-widest text-shadow-neon">NEW RENDER JOB</h2>
            <p className="text-tech-dim text-sm">INITIALIZE SEQUENCING PROTOCOL</p>
          </div>
          <InputForm />
        </div>

        <div className="space-y-6">
          <div className="border-l-2 border-tech-purple pl-4">
            <h2 className="text-2xl font-bold text-white tracking-widest">JOB HISTORY</h2>
            <p className="text-tech-dim text-sm">SYSTEM LOGS_</p>
          </div>
          <JobHistory />
        </div>
      </main>
    </div>
  )
}
