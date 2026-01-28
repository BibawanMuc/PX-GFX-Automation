import { Terminal } from 'lucide-react'

export function Header() {
    return (
        <header className="border-b border-tech-border bg-tech-surface/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-tech-cyan/10 rounded border border-tech-cyan/20">
                        <Terminal className="w-5 h-5 text-tech-cyan" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tighter text-white">
                        PX <span className="text-tech-cyan">AUTOMATION</span> HUB
                    </h1>
                </div>
                <div className="flex items-center gap-4 text-xs text-tech-dim">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-tech-green animate-pulse" />
                        <span>SYSTEM ONLINE</span>
                    </div>
                    <span>v1.0.0</span>
                </div>
            </div>
        </header>
    )
}
