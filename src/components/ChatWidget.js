
'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Sparkles, Loader2, Minimize2, Maximize2, Zap } from 'lucide-react'

export default function ChatWidget({ transactions }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Namaste! I am Lekka. Ask me anything about your business data.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  
  const SUGGESTED_QUESTIONS = [
    "What is my total profit?",
    "Show me top expenses",
    "How are my sales trending?",
    "Any high-value transactions?",
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen])

  const handleSend = async (text = input) => {
    // If called via event, prevent default. If string, use it.
    if (text && typeof text === 'object' && text.preventDefault) {
        text.preventDefault()
        text = input // use state input
    }
    
    if (!text.trim() || loading) return

    const userMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
           messages: [...messages, userMessage].slice(-10), 
           transactions: transactions 
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
    } catch (error) {
      console.error(error)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I faced an issue connecting to the server.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: -180 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-primary to-chart-3 text-primary-foreground rounded-full shadow-xl flex items-center justify-center z-50 hover:shadow-primary/50"
          >
            <MessageCircle className="w-7 h-7" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1, height: isMinimized ? 'auto' : '500px' }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-6 right-6 w-[380px] bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden z-50 ${isMinimized ? '' : 'h-[500px]'}`}
          >
            {/* Header */}
            <div className="bg-primary p-4 flex items-center justify-between text-primary-foreground">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                   <h3 className="font-semibold text-sm">Lekka Assistant</h3>
                   <span className="text-xs opacity-80 flex items-center gap-1">
                     <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/> Online
                   </span>
                </div>
              </div>
              <div className="flex gap-1">
                 <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-white/20 rounded-md transition-colors">
                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                 </button>
                 <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-md transition-colors">
                    <X className="w-4 h-4" />
                 </button>
              </div>
            </div>

            {/* Chat Area */}
            {!isMinimized && (
                <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
                {messages.map((msg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-br-none' 
                        : 'bg-secondary text-secondary-foreground rounded-bl-none shadow-sm'
                    }`}>
                        {msg.content}
                    </div>
                    </motion.div>
                ))}
                
                {/* Suggested Questions (only show if few messages to act as prompts) */}
                {messages.length < 3 && !loading && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {SUGGESTED_QUESTIONS.map((q, i) => (
                            <button 
                                key={i}
                                onClick={() => handleSend(q)}
                                className="text-xs bg-background border border-primary/20 text-primary px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors flex items-center gap-1"
                            >
                                <Zap className="w-3 h-3" /> {q}
                            </button>
                        ))}
                    </div>
                )}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-secondary p-3 rounded-2xl rounded-bl-none shadow-sm">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-4 bg-card border-t border-border mt-auto">
                    <div className="relative flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your question..."
                            className="flex-1 bg-muted/50 border border-input rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                        <button 
                            type="submit" 
                            disabled={!input.trim() || loading}
                            className="p-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
                </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
