# 🔬 Research Paper Analyzer

A modern React application for analyzing research papers and connecting findings to relevant policies using AI.

## Features

- **AI-Powered Research Analysis**: Extract structured health outcomes data from research text using OpenAI GPT-4
- **Policy Connection Detection**: Automatically identify relationships between research findings and policies  
- **Modern UI/UX**: Clean, responsive design with gradient themes and smooth animations
- **Environment Variable Support**: Secure API key management with .env files
- **Real-time Analysis**: Live feedback and status updates during processing

## Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key
- (Optional) Supabase account for data storage

## Installation

1. Clone the repository:
```bash
git clone https://github.com/allentraylorbsu/gold_research_assistant.git
cd gold_research_assistant/research-analyzer
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Set up custom environment variables:
```bash
cp .env.example .env.local
```

**Note**: API keys are pre-configured for this demo! You can override them by editing `.env.local`:
```env
VITE_OPENAI_API_KEY=your_custom_openai_key_here
VITE_SUPABASE_URL=your_custom_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_custom_supabase_key_here
```

## Usage

1. Start the development server:
```bash
npm run dev
```

2. Open your browser to `http://localhost:5173`

3. Follow the app workflow:
   - **Step 1**: API keys auto-load and test (or enter your own)
   - **Step 2**: Paste research text and analyze with AI
   - **Step 3**: Explore policy connections

## API Keys Setup

### OpenAI API Key (Required)
1. Visit [OpenAI API](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your `.env.local` file

### Supabase (Optional)
1. Create account at [Supabase](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key from Settings > API
4. Add them to your `.env.local` file

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please visit the [GitHub repository](https://github.com/allentraylorbsu/gold_research_assistant).
