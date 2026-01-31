'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef } from 'react'
import { MessageCircle, Loader2, Send, Trash2, Settings2 } from 'lucide-react'

export default function ChatPage() {
  const [sessionId, setSessionId] = useState(() => `session-${Date.now()}`)
  const [showSettings, setShowSettings] = useState(false)
  const [model, setModel] = useState('openai/gpt-4o-mini')
  const [thinking, setThinking] = useState('low')
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    onError: (error) => {
      console.error('Chat error:', error)
    },
  })

  const handleSend = async () => {
    if (!input.trim()) return

    const messageText = input
    setInput('')

    await sendMessage({
      text: messageText,
      body: {
        sessionId,
        model,
        thinking,
      },
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleReset = () => {
    setSessionId(`session-${Date.now()}`)
    // Chat hook will clear messages automatically
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-muted border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-6 h-6 text-primary" />
            <span className="font-semibold">Moltbot WebAI</span>
          </div>
          <button
            onClick={handleReset}
            className="w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="text-xs text-muted-foreground mb-3">Session ID</div>
          <div className="text-xs font-mono bg-background p-2 rounded break-all">
            {sessionId}
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full px-3 py-2 rounded-lg bg-background hover:bg-muted text-sm flex items-center justify-center gap-2"
          >
            <Settings2 className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Settings Panel */}
        {showSettings && (
          <div className="border-b border-border bg-muted p-4">
            <div className="max-w-2xl mx-auto grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                >
                  <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                  <option value="openai/gpt-4">GPT-4 Turbo</option>
                  <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Thinking Level</label>
                <select
                  value={thinking}
                  onChange={(e) => setThinking(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                >
                  <option value="off">Off</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <MessageCircle className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Welcome to Moltbot WebAI</h2>
                <p className="text-muted-foreground max-w-sm">
                  A web-based AI assistant with real tool functions. Ask me anything!
                </p>
                <div className="mt-8 text-sm text-muted-foreground space-y-2">
                  <p>✓ Web search & content fetching</p>
                  <p>✓ Browser automation</p>
                  <p>✓ System information</p>
                  <p>✓ Multi-turn conversations</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-md px-4 py-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground border border-border'
                    }`}
                  >
                    {message.parts
                      ?.filter((p) => p.type === 'text')
                      .map((p, i) => (
                        <p key={i}>{(p as any).text}</p>
                      ))}

                    {/* Tool Calls Rendering */}
                    {message.parts
                      ?.filter((p) => p.type === 'tool-call')
                      .map((p, i) => (
                        <div key={i} className="mt-2 text-xs opacity-75">
                          🔧 {(p as any).toolName}
                        </div>
                      ))}

                    {/* Tool Results Rendering */}
                    {message.parts
                      ?.filter((p) => p.type === 'tool-result')
                      .map((p, i) => (
                        <div key={i} className="mt-2 text-xs opacity-75 bg-background/50 p-2 rounded">
                          {(p as any).result}
                        </div>
                      ))}
                  </div>
                </div>
              ))
            )}

            {status === 'streaming' && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground border border-border px-4 py-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
                Error: {error.message}
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-background p-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything... (Shift+Enter for new line)"
                className="flex-1 px-4 py-3 rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
              <button
                onClick={handleSend}
                disabled={status === 'streaming' || !input.trim()}
                className="px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
