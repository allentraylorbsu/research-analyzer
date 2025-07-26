import { useState } from 'react'
import ApiKeySection from './components/ApiKeySection'
import ResearchAnalysisSection from './components/ResearchAnalysisSection' 
import PolicyConnectionSection from './components/PolicyConnectionSection'
import DatabaseResultsSection from './components/DatabaseResultsSection'
import './App.css'

function App() {
  const [apiKeys, setApiKeys] = useState(null)
  const [analysisData, setAnalysisData] = useState(null)

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔬 Research Paper Analyzer</h1>
        <p>Analyze research findings and connect them to relevant policies</p>
      </header>

      <main className="app-main">
        <ApiKeySection 
          apiKeys={apiKeys} 
          setApiKeys={setApiKeys}
        />
        
        <ResearchAnalysisSection 
          apiKeys={apiKeys}
          analysisData={analysisData}
          setAnalysisData={setAnalysisData}
        />
        
        <PolicyConnectionSection 
          apiKeys={apiKeys}
          analysisData={analysisData}
        />

        <DatabaseResultsSection 
          apiKeys={apiKeys}
        />
      </main>
    </div>
  )
}

export default App
