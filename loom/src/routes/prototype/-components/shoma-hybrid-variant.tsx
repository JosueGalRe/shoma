import { useState } from 'react'
import { UserRound, Settings } from 'lucide-react'

const TYPOGRAPHY_THEMES = {
  A: { display: "'Cinzel', serif", body: "'Inter', sans-serif" },
  B: { display: "'Playfair Display', serif", body: "'Source Sans 3', sans-serif" },
  C: { display: "'Roboto', sans-serif", body: "'Roboto', sans-serif" },
  D: { display: "'Beaufort for LoL', serif", body: "'Spiegel', sans-serif" },
} as const

export function ShomaHybridVariant() {
  const [activeTab, setActiveTab] = useState<'home' | 'lobby' | 'ready-check' | 'champ-select'>('home')
  const [isSocialOpen, setIsSocialOpen] = useState(false)
  const [typography, setTypography] = useState<'A' | 'B' | 'C' | 'D'>('A')

  const theme = TYPOGRAPHY_THEMES[typography]
  const displayStyle = { fontFamily: theme.display }
  const bodyStyle = { fontFamily: theme.body }

  return (
    <div className="flex h-full w-full flex-col bg-shoma-bg text-shoma-text relative overflow-hidden" style={bodyStyle}>
      <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-shoma-surface/50 blur-[100px] pointer-events-none"></div>
      <div className="absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-shoma-accent/10 blur-[100px] pointer-events-none"></div>

      <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-shoma-border-gold/30 bg-shoma-bg/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-wide text-shoma-text" style={displayStyle}>Sho'ma</h1>
          <div className="hidden sm:flex items-center gap-2 ml-2">
            <span className="text-sm text-shoma-text-muted">Phase:</span>
            <span className="text-sm font-medium text-shoma-accent">Connected</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex bg-shoma-surface/50 rounded border border-shoma-border p-1 backdrop-blur-md">
            {(['A', 'B', 'C', 'D'] as const).map(opt => (
              <button
                key={opt}
                onClick={() => setTypography(opt)}
                className={`w-8 h-8 rounded text-sm font-bold transition-all ${typography === opt ? 'bg-shoma-primary text-shoma-bg' : 'text-shoma-text-muted hover:text-shoma-text'}`}
                title={`Typography Option ${opt}`}
              >
                {opt}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setIsSocialOpen(true)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded border border-shoma-border bg-shoma-surface/50 px-3 py-1.5 text-sm font-medium text-shoma-text-muted transition-all hover:border-shoma-primary hover:text-shoma-text lg:hidden backdrop-blur-md"
          >
            <UserRound className="size-4" />
            Social
          </button>
        </div>
      </header>

      <div className="relative z-10 flex items-center justify-between gap-3 px-6 py-2 sm:hidden border-b border-shoma-border bg-shoma-surface/30 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-sm text-shoma-text-muted">Phase:</span>
          <span className="text-sm font-medium text-shoma-accent">Connected</span>
        </div>
        <div className="flex bg-shoma-surface/50 rounded border border-shoma-border p-1 backdrop-blur-md">
          {(['A', 'B', 'C', 'D'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => setTypography(opt)}
              className={`w-6 h-6 rounded text-xs font-bold transition-all ${typography === opt ? 'bg-shoma-primary text-shoma-bg' : 'text-shoma-text-muted hover:text-shoma-text'}`}
              title={`Typography Option ${opt}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto px-6 pb-24 flex flex-col">
          {activeTab === 'home' && (
            <div className="flex flex-col items-center justify-center flex-1 gap-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-3 text-shoma-text" style={displayStyle}>Welcome to Sho'ma</h2>
                <p className="text-shoma-text-muted text-sm max-w-[250px] mx-auto leading-relaxed">
                  Enter the code shown on your computer to connect and control League from your phone.
                </p>
              </div>

              <div className="flex gap-2 justify-center my-4">
                {['2', '5', '2', '4', '9', '3'].map((digit, i) => (
                  <div key={i} className="w-10 h-12 flex items-center justify-center border border-shoma-border-gold/50 rounded bg-shoma-surface/50 text-xl font-medium text-shoma-text backdrop-blur-sm shadow-inner">
                    {digit}
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setActiveTab('lobby')}
                className="w-full max-w-[280px] rounded border border-shoma-primary bg-shoma-primary/5 px-6 py-4 font-bold text-shoma-primary uppercase tracking-widest transition-all hover:bg-shoma-primary/10 hover:shadow-shoma-glow-primary active:scale-[0.98] backdrop-blur-sm">
                CONNECT!
              </button>
            </div>
          )}

          {activeTab === 'lobby' && (
            <div className="flex flex-col gap-6 h-full pt-4">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-shoma-text" style={displayStyle}>Lobby</h2>
                <div className="flex items-center justify-between rounded border border-shoma-border bg-shoma-surface/50 p-4 backdrop-blur-md">
                  <div>
                    <h3 className="text-lg font-bold text-shoma-primary">Normal Draft</h3>
                  </div>
                  <button className="rounded bg-transparent px-4 py-2 text-sm font-medium text-shoma-text-muted border border-shoma-border transition-all hover:border-shoma-primary hover:text-shoma-text">
                    Change Mode
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`flex items-center gap-4 rounded border p-3 backdrop-blur-sm transition-all ${i === 1 ? 'border-shoma-primary bg-shoma-primary/5 shadow-shoma-glow-primary' : 'border-shoma-border bg-shoma-surface/50'}`}>
                    <div className="h-12 w-12 rounded-full bg-shoma-bg overflow-hidden border border-shoma-border-gold/50 shadow-inner">
                      {i === 1 && <img src="https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/29.jpg" alt="You" className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1 flex justify-between items-center">
                      <div>
                        <div className={`text-base font-medium ${i === 1 ? 'text-shoma-primary' : 'text-shoma-text'}`}>{i === 1 ? 'You' : 'Invite Player'}</div>
                        {i === 1 && <div className="text-sm text-shoma-text-muted">Mid / Top</div>}
                      </div>
                      {i !== 1 && (
                        <button className="rounded bg-transparent px-3 py-1.5 text-xs font-medium text-shoma-text-muted border border-shoma-border transition-all hover:border-shoma-primary hover:text-shoma-text">
                          Invite
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-2 flex gap-2">
                <button className="flex-1 rounded bg-transparent px-4 py-3 text-sm font-medium text-shoma-text-muted border border-shoma-border transition-all hover:border-shoma-primary hover:text-shoma-text backdrop-blur-sm">
                  Role Preferences
                </button>
                <button className="flex-1 rounded bg-transparent px-4 py-3 text-sm font-medium text-shoma-text-muted border border-shoma-border transition-all hover:border-shoma-primary hover:text-shoma-text backdrop-blur-sm">
                  Invites
                </button>
              </div>

              <button 
                onClick={() => setActiveTab('ready-check')}
                className="mt-2 w-full rounded border border-shoma-primary bg-shoma-primary/5 px-6 py-4 font-bold text-shoma-primary uppercase tracking-widest transition-all hover:bg-shoma-primary/10 hover:shadow-shoma-glow-primary active:scale-[0.98] backdrop-blur-sm">
                FIND MATCH
              </button>
            </div>
          )}

          {activeTab === 'ready-check' && (
            <div className="flex flex-col items-center justify-center h-full gap-10">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-shoma-text mb-2" style={displayStyle}>Match Found!</h2>
                <p className="text-shoma-text-muted">Accept to join the game.</p>
              </div>
              
              <div className="relative flex items-center justify-center w-40 h-40">
                <div className="absolute inset-0 rounded-full border-2 border-shoma-border"></div>
                <div className="absolute inset-0 rounded-full border-2 border-shoma-accent border-t-transparent animate-[spin_2s_linear_infinite] shadow-shoma-glow-accent"></div>
                <div className="text-4xl font-light text-shoma-text">10</div>
              </div>
              
              <div className="flex flex-col gap-3 w-full max-w-[280px]">
                <button 
                  onClick={() => setActiveTab('champ-select')}
                  className="w-full rounded border border-shoma-primary bg-shoma-primary/10 px-6 py-4 font-bold text-shoma-primary uppercase tracking-widest transition-all hover:bg-shoma-primary/20 hover:shadow-shoma-glow-primary active:scale-[0.98] backdrop-blur-sm">
                  ACCEPT
                </button>
                <button 
                  onClick={() => setActiveTab('lobby')}
                  className="w-full rounded border border-shoma-border bg-transparent px-6 py-4 font-bold text-shoma-text-muted uppercase tracking-widest transition-all hover:bg-shoma-border/50 active:scale-[0.98] backdrop-blur-sm">
                  DECLINE
                </button>
              </div>
            </div>
          )}

          {activeTab === 'champ-select' && (
            <div className="flex flex-col gap-6 h-full pt-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-shoma-text" style={displayStyle}>Your Pick</h2>
                <p className="text-xl text-shoma-primary mt-1">0:24</p>
              </div>

              <div className="grid grid-cols-4 gap-3 overflow-y-auto flex-1 pr-1">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className={`aspect-square rounded border ${i === 0 ? 'border-shoma-primary shadow-shoma-glow-primary' : 'border-shoma-border'} bg-shoma-surface overflow-hidden relative backdrop-blur-sm`}>
                    <img src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${i + 1}.png`} alt="Champ" className="h-full w-full object-cover opacity-90 hover:opacity-100" onError={(e) => e.currentTarget.src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/1.png'} />
                  </div>
                ))}
              </div>

              <button className="w-full rounded border border-shoma-primary bg-shoma-primary/5 px-6 py-4 font-bold text-shoma-primary uppercase tracking-widest transition-all hover:bg-shoma-primary/10 hover:shadow-shoma-glow-primary active:scale-[0.98] backdrop-blur-sm">
                LOCK IN
              </button>
            </div>
          )}
        </main>

        <aside className="hidden lg:flex w-80 flex-col border-l border-shoma-border-gold/30 bg-shoma-surface/40 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-shoma-text" style={displayStyle}>Social</h2>
            <button className="p-2 rounded hover:bg-shoma-surface/60 text-shoma-text-muted hover:text-shoma-text transition-colors">
              <Settings className="size-5" />
            </button>
          </div>
          <div className="flex gap-4 mb-6 border-b border-shoma-border-gold/20 pb-2">
            <button className="text-sm font-bold text-shoma-primary border-b-2 border-shoma-primary pb-2">Friends</button>
            <button className="text-sm font-medium text-shoma-text-muted hover:text-shoma-text pb-2 transition-colors">Chat</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="mb-4">
              <button className="flex items-center justify-between w-full text-left text-sm font-bold text-shoma-text-muted hover:text-shoma-text py-2">
                <span>General (3/25)</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform rotate-180"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <div className="flex flex-col gap-2 pl-2 mt-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-shoma-surface/40 group transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-shoma-success"></div>
                      <span className="text-sm text-shoma-text">FriendName#{i}</span>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 text-xs bg-transparent border border-shoma-border-gold/50 rounded px-2 py-1 text-shoma-text-muted hover:text-shoma-primary hover:border-shoma-primary transition-all">Invite</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {isSocialOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSocialOpen(false)}></div>
          <div className="relative bg-shoma-bg border-t border-shoma-border-gold/50 rounded-t-xl h-[85vh] flex flex-col p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="w-12 h-1 bg-shoma-border-gold/30 rounded-full mx-auto mb-6"></div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-shoma-text" style={displayStyle}>Social</h2>
              <button className="p-2 rounded hover:bg-shoma-surface/60 text-shoma-text-muted hover:text-shoma-text transition-colors">
                <Settings className="size-5" />
              </button>
            </div>
            <div className="flex gap-4 mb-6 border-b border-shoma-border-gold/20 pb-2">
              <button className="text-sm font-bold text-shoma-primary border-b-2 border-shoma-primary pb-2">Friends</button>
              <button className="text-sm font-medium text-shoma-text-muted hover:text-shoma-text pb-2 transition-colors">Chat</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="mb-4">
                <button className="flex items-center justify-between w-full text-left text-sm font-bold text-shoma-text-muted hover:text-shoma-text py-2">
                  <span>General (3/25)</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform rotate-180"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                <div className="flex flex-col gap-2 pl-2 mt-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-shoma-surface/40 group transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-shoma-success"></div>
                        <span className="text-sm text-shoma-text">FriendName#{i}</span>
                      </div>
                      <button className="text-xs bg-transparent border border-shoma-border-gold/50 rounded px-2 py-1 text-shoma-text-muted hover:text-shoma-primary hover:border-shoma-primary transition-all">Invite</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="relative z-20 border-t border-shoma-border-gold/30 bg-shoma-bg/80 backdrop-blur-2xl pb-safe">
        <div className="flex justify-around p-2">
          {[
            { id: 'home', label: 'HOME', icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></> },
            { id: 'lobby', label: 'LOBBY', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></> },
            { id: 'ready-check', label: 'QUEUE', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
            { id: 'champ-select', label: 'CHAMPS', icon: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></> }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1.5 rounded p-2 px-4 transition-all ${activeTab === tab.id ? 'text-shoma-primary' : 'text-shoma-text-muted hover:text-shoma-text'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {tab.icon}
              </svg>
              <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
