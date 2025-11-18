import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useToken() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const save = (t) => { localStorage.setItem('token', t); setToken(t) }
  const clear = () => { localStorage.removeItem('token'); setToken('') }
  return { token, save, clear }
}

function SignIn({ onAuthed }) {
  const { save } = useToken()
  const [email, setEmail] = useState('demo@example.com')
  const [password, setPassword] = useState('password')
  const [name, setName] = useState('Demo User')
  const [mode, setMode] = useState('signin')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setErr('')
    try {
      const endpoint = mode === 'signin' ? '/auth/signin' : '/auth/signup'
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'signin' ? { email, password } : { name, email, password })
      })
      if (!res.ok) throw new Error((await res.json()).detail || 'Auth failed')
      const data = await res.json()
      save(data.access_token)
      onAuthed()
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-xl p-6">
      <h2 className="text-white text-2xl font-semibold mb-4">{mode === 'signin' ? 'Sign in' : 'Create account'}</h2>
      <form onSubmit={submit} className="space-y-3">
        {mode === 'signup' && (
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" className="w-full px-3 py-2 rounded bg-white/10 text-white placeholder-white/50" />
        )}
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 rounded bg-white/10 text-white placeholder-white/50" />
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" className="w-full px-3 py-2 rounded bg-white/10 text-white placeholder-white/50" />
        {err && <p className="text-red-300 text-sm">{err}</p>}
        <button disabled={loading} className="w-full py-2 bg-blue-500 hover:bg-blue-600 rounded text-white transition">{loading ? 'Connecting…' : (mode === 'signin' ? 'Sign in' : 'Sign up')}</button>
      </form>
      <p className="text-white/70 text-sm mt-3">
        {mode === 'signin' ? (
          <>No account? <button className="underline" onClick={()=>setMode('signup')}>Create one</button></>
        ) : (
          <>Have an account? <button className="underline" onClick={()=>setMode('signin')}>Sign in</button></>
        )}
      </p>
    </div>
  )
}

function CreateProject({ token, onCreated }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [skills, setSkills] = useState('')
  const [duration, setDuration] = useState('')
  const [tags, setTags] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [loading, setLoading] = useState(false)

  async function submit(e){
    e.preventDefault(); setLoading(true)
    const payload = {
      title, description,
      skills_required: skills.split(',').map(s=>s.trim()).filter(Boolean),
      duration,
      tags: tags.split(',').map(s=>s.trim()).filter(Boolean),
      visibility
    }
    const res = await fetch(`${API}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    onCreated(data)
    setLoading(false)
  }

  return (
    <form onSubmit={submit} className="space-y-3 bg-white/5 border border-white/10 rounded-xl p-4">
      <h3 className="text-white font-semibold">Create a project</h3>
      <input className="w-full px-3 py-2 rounded bg-white/10 text-white" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
      <textarea className="w-full px-3 py-2 rounded bg-white/10 text-white" placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
      <input className="w-full px-3 py-2 rounded bg-white/10 text-white" placeholder="Skills (comma separated)" value={skills} onChange={e=>setSkills(e.target.value)} />
      <input className="w-full px-3 py-2 rounded bg-white/10 text-white" placeholder="Duration" value={duration} onChange={e=>setDuration(e.target.value)} />
      <input className="w-full px-3 py-2 rounded bg-white/10 text-white" placeholder="Tags (comma separated)" value={tags} onChange={e=>setTags(e.target.value)} />
      <div className="flex gap-3 text-white/80">
        <label className="flex items-center gap-2"><input type="radio" checked={visibility==='public'} onChange={()=>setVisibility('public')} /> Public</label>
        <label className="flex items-center gap-2"><input type="radio" checked={visibility==='private'} onChange={()=>setVisibility('private')} /> Private</label>
      </div>
      <button disabled={loading} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded text-white">{loading? 'Publishing…': 'Publish project'}</button>
    </form>
  )
}

function Explore({ token }){
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  async function load(){
    setLoading(true)
    const res = await fetch(`${API}/projects?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setItems(data); setLoading(false)
  }
  useEffect(()=>{ load() },[])

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search projects" className="flex-1 px-3 py-2 rounded bg-white/10 text-white" />
        <button onClick={load} className="px-3 py-2 rounded bg-white/10 text-white">Search</button>
      </div>
      {loading && <p className="text-white/70">Connecting creators…</p>}
      <div className="grid md:grid-cols-2 gap-4">
        {items.map(p=> <ProjectCard key={p.id} token={token} project={p} />)}
      </div>
    </div>
  )
}

function ProjectCard({ project, token }){
  const [saved, setSaved] = useState(false)

  async function save(){
    if(!token) return alert('Sign in first')
    await fetch(`${API}/projects/${project.id}/save`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }})
    setSaved(true)
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-white">
      <h4 className="text-lg font-semibold">{project.title}</h4>
      <p className="text-white/70 text-sm">{project.description}</p>
      <div className="flex flex-wrap gap-2 my-2">
        {project.tags?.map(t=> <span key={t} className="px-2 py-0.5 text-xs bg-blue-500/20 rounded">{t}</span>)}
      </div>
      <Apply project={project} token={token} />
      <div className="flex gap-2 mt-3">
        <button onClick={save} className="px-3 py-1.5 bg-white/10 rounded">{saved? 'Saved': 'Save'}</button>
      </div>
    </div>
  )
}

function Apply({ project, token }){
  const [message, setMessage] = useState('I would love to collaborate!')
  const [portfolio, setPortfolio] = useState('https://github.com/')
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')

  async function submit(){
    if(!token) return alert('Sign in first')
    if(!file) return alert('Please attach a document')
    const form = new FormData()
    form.append('message', message)
    form.append('portfolio_url', portfolio)
    form.append('document', file)
    const res = await fetch(`${API}/projects/${project.id}/apply`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
    setStatus(res.ok ? 'Application submitted' : 'Failed to submit')
  }

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <h5 className="text-white font-medium">Apply to collaborate</h5>
      <div className="grid gap-2">
        <input value={message} onChange={e=>setMessage(e.target.value)} className="px-3 py-2 rounded bg-white/10 text-white" placeholder="Personal message" />
        <input value={portfolio} onChange={e=>setPortfolio(e.target.value)} className="px-3 py-2 rounded bg-white/10 text-white" placeholder="Portfolio URL" />
        <input type="file" onChange={e=>setFile(e.target.files?.[0])} className="text-white" />
        <button onClick={submit} className="px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded text-white">Send request</button>
        {status && <p className="text-white/70 text-sm">{status}</p>}
      </div>
    </div>
  )
}

function OwnerDashboard({ token }){
  const [projectId, setProjectId] = useState('')
  const [requests, setRequests] = useState([])
  const [status, setStatus] = useState('')

  async function load(){
    if(!projectId) return
    const res = await fetch(`${API}/owner/projects/${projectId}/requests`, { headers: { Authorization: `Bearer ${token}` }})
    const data = await res.json()
    setRequests(data)
  }

  async function update(id, s){
    await fetch(`${API}/owner/requests/${id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: s })})
    setStatus('Updated'); load()
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <h3 className="text-white font-semibold mb-2">Owner review</h3>
      <input value={projectId} onChange={e=>setProjectId(e.target.value)} placeholder="Your project ID" className="w-full px-3 py-2 rounded bg-white/10 text-white" />
      <div className="flex gap-2 mt-2">
        <button onClick={load} className="px-3 py-2 bg-white/10 rounded text-white">Load applicants</button>
        {status && <span className="text-white/70">{status}</span>}
      </div>
      <div className="mt-4 space-y-3">
        {requests.map(r => (
          <div key={r.id} className="p-3 border border-white/10 rounded text-white">
            <p className="text-sm">Message: {r.message}</p>
            <a href={r.portfolio_url} target="_blank" className="text-blue-300 underline text-sm">Visit portfolio</a>
            <div className="flex gap-2 mt-2">
              <a href={`${API}/owner/requests/${r.id}/document`} className="px-2 py-1 bg-white/10 rounded">Download document</a>
              <button onClick={()=>update(r.id, 'accepted')} className="px-2 py-1 bg-green-500/80 rounded">Accept</button>
              <button onClick={()=>update(r.id, 'rejected')} className="px-2 py-1 bg-red-500/80 rounded">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function App() {
  const { token, clear } = useToken()
  const [authed, setAuthed] = useState(!!token)

  useEffect(()=>{ setAuthed(!!token) }, [token])

  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-white p-6">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8 items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">CollabLab</h1>
            <p className="text-white/70 mb-6">Connect creators and collaborators. Minimal, secure, and fast.</p>
            <ul className="space-y-2 text-white/80 text-sm">
              <li>• Create and manage project posts</li>
              <li>• Explore projects, search and filter</li>
              <li>• Apply with message, portfolio URL, and a document</li>
              <li>• Owner dashboard to review, accept, reject, and download files</li>
            </ul>
          </div>
          <SignIn onAuthed={()=>setAuthed(true)} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">CollabLab</h1>
          <button onClick={clear} className="text-white/70 underline">Sign out</button>
        </header>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <CreateProject token={token} onCreated={()=>{}} />
            <OwnerDashboard token={token} />
          </div>
          <div className="lg:col-span-2">
            <Explore token={token} />
          </div>
        </div>
        <footer className="text-center text-white/40 text-sm pt-8">Custom 404 coming soon • Loading copy included</footer>
      </div>
    </div>
  )
}

export default App
