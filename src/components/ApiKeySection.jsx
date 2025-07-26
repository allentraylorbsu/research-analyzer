import { useState } from 'react'

const ApiKeySection = ({ apiKeys, setApiKeys }) => {
  const [openaiKey, setOpenaiKey] = useState(import.meta.env.VITE_OPENAI_API_KEY || '')
  const [supabaseUrl, setSupabaseUrl] = useState(import.meta.env.VITE_SUPABASE_URL || '')
  const [supabaseKey, setSupabaseKey] = useState(import.meta.env.VITE_SUPABASE_ANON_KEY || '')
  const [connectionStatus, setConnectionStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const testConnection = async () => {
    if (!openaiKey.trim()) {
      setConnectionStatus('<div class="error">❌ Please enter your OpenAI API key</div>')
      return
    }

    setIsLoading(true)
    setConnectionStatus('<div class="loading">Testing connections...</div>')

    try {
      // Test OpenAI connection
      const openaiResponse = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json().catch(() => ({}))
        throw new Error(`OpenAI connection failed: ${openaiResponse.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      setConnectionStatus('<div class="success">✅ OpenAI connection successful!</div>')
      
      // Store keys for later use
      const keys = { openaiKey, supabaseUrl, supabaseKey }
      setApiKeys(keys)
      
    } catch (error) {
      console.error('Connection error:', error)
      setConnectionStatus(`<div class="error">❌ Connection failed: ${error.message}</div>`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="section">
      <h2>Step 1: Configure API Keys</h2>
      <p className="section-description">
        Enter your API keys below. These are stored locally and used to connect to OpenAI for analysis.
      </p>
      
      <div className="input-group">
        <label htmlFor="openai-key">OpenAI API Key *</label>
        <input
          type="password"
          id="openai-key"
          placeholder="sk-..."
          value={openaiKey}
          onChange={(e) => setOpenaiKey(e.target.value)}
          className="api-input"
        />
      </div>

      <div className="input-group">
        <label htmlFor="supabase-url">Supabase URL (optional)</label>
        <input
          type="text"
          id="supabase-url"
          placeholder="https://your-project.supabase.co"
          value={supabaseUrl}
          onChange={(e) => setSupabaseUrl(e.target.value)}
          className="api-input"
        />
      </div>

      <div className="input-group">
        <label htmlFor="supabase-key">Supabase Anon Key (optional)</label>
        <input
          type="password"
          id="supabase-key"
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          value={supabaseKey}
          onChange={(e) => setSupabaseKey(e.target.value)}
          className="api-input"
        />
      </div>

      <button 
        onClick={testConnection}
        disabled={isLoading}
        className="primary-button"
      >
        {isLoading ? 'Testing...' : 'Test Connection'}
      </button>
      
      <div 
        id="connection-status" 
        dangerouslySetInnerHTML={{ __html: connectionStatus }}
      />
    </div>
  )
}

export default ApiKeySection