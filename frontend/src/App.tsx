import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, coy } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Login from './Login';

// --- TYPES ---
interface Message {
  role: 'user' | 'ai';
  content: string;
  image?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  date: string;
}

// --- HELPER: Detect Mobile Screen ---
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

// --- SUB-COMPONENT: Typing Indicator ---
const TypingIndicator = () => (
  <div style={{ display: 'flex', gap: '4px', padding: '10px 15px', backgroundColor: 'transparent', width: 'fit-content' }}>
    <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }`}</style>
    {[0, 1, 2].map(i => (
      <div key={i} style={{ width: '8px', height: '8px', backgroundColor: '#888', borderRadius: '50%', animation: `bounce 1s infinite ${i * 0.2}s` }} />
    ))}
  </div>
);

// --- SUB-COMPONENT: ChatMessage ---
const ChatMessage = ({ role, content, image, isDark }: { role: 'user' | 'ai', content: string, image?: string, isDark: boolean }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (code: string, lang: string) => {
    navigator.clipboard.writeText(code);
    setCopied(lang);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: role === 'user' ? "flex-end" : "flex-start",
      marginBottom: "20px",
      animation: "fadeIn 0.3s ease-in-out",
      maxWidth: "100%"
    }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      
      <div style={{
        maxWidth: role === 'user' ? "85%" : "95%",
        padding: "14px 18px",
        borderRadius: "18px",
        backgroundColor: role === 'user' ? "#2563eb" : (isDark ? "transparent" : "#f3f4f6"),
        color: role === 'user' ? "white" : (isDark ? "#e5e7eb" : "#1f2937"),
        boxShadow: role === 'user' ? "0 2px 8px rgba(37, 99, 235, 0.2)" : "none",
        borderTopRightRadius: role === 'user' ? "4px" : "18px",
        borderTopLeftRadius: role === 'ai' ? "4px" : "18px",
        wordBreak: "break-word"
      }}>
        {/* Role Label */}
        <div style={{ fontSize: "11px", marginBottom: "6px", opacity: 0.8, fontWeight: "600", letterSpacing: "0.5px", textTransform: "uppercase" }}>
          {role === 'user' ? "You" : "Edward"}
        </div>

        {/* Image Preview */}
        {image && (
          <img 
            src={image} 
            alt="User Upload" 
            style={{ maxWidth: "100%", borderRadius: "12px", marginBottom: "12px", border: "1px solid rgba(255,255,255,0.1)" }} 
          />
        )}

        {/* Markdown Content */}
        <div style={{ fontSize: "15px", lineHeight: "1.6" }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');
                
                return !inline && match ? (
                  <div style={{ borderRadius: "8px", overflow: "hidden", marginTop: "10px", marginBottom: "10px", border: isDark ? "1px solid #444" : "1px solid #ddd" }}>
                    <div style={{ 
                      backgroundColor: isDark ? "#1e1e1e" : "#f8f9fa", 
                      padding: "6px 12px", 
                      fontSize: "11px", 
                      color: "#888", 
                      display: "flex", 
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: isDark ? "1px solid #333" : "1px solid #e9ecef"
                    }}>
                      <span style={{ fontWeight: "bold", textTransform: "uppercase" }}>{match[1]}</span>
                      <button 
                        onClick={() => handleCopy(codeString, match[1])}
                        style={{ border: "none", background: "none", color: copied === match[1] ? "#10b981" : "#888", cursor: "pointer", fontSize: "11px" }}
                      >
                        {copied === match[1] ? "✓" : "Copy"}
                      </button>
                    </div>
                    <SyntaxHighlighter
                      style={isDark ? vscDarkPlus : coy}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{ margin: 0, padding: "12px", fontSize: "13px" }}
                      {...props}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code className={className} {...props} style={{ 
                    backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", 
                    padding: "2px 5px", 
                    borderRadius: "4px",
                    fontFamily: "monospace",
                    fontSize: "0.9em",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all"
                  }}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState("gemini");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  const isMobile = useIsMobile();
  const [isSidebarOpen, setSidebarOpen] = useState(!isMobile);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- EFFECTS ---
  useEffect(() => {
    setSidebarOpen(!isMobile); // Reset sidebar when switching devices
  }, [isMobile]);

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    const saved = localStorage.getItem('edward_chats');
    if (saved) {
      const parsedSessions = JSON.parse(saved);
      setSessions(parsedSessions);
      if (parsedSessions.length > 0) setCurrentSessionId(parsedSessions[0].id);
      else createNewSession();
    } else {
      createNewSession();
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) localStorage.setItem('edward_chats', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, currentSessionId, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  }, [prompt]);

  const currentMessages = sessions.find(s => s.id === currentSessionId)?.messages || [];

  // --- HANDLERS ---
  const handleLogin = (newToken: string) => setToken(newToken);
  
  const handleLogout = () => {
    if (confirm("Log out of Edward?")) {
      setToken(null);
      setCurrentSessionId(null);
      setSidebarOpen(false);
    }
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      date: new Date().toISOString()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setPrompt("");
    setFile(null);
    setPreview(null);
    if (isMobile) setSidebarOpen(false); // Close sidebar on mobile
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this conversation?")) {
      const newSessions = sessions.filter(s => s.id !== id);
      setSessions(newSessions);
      if (newSessions.length === 0) createNewSession();
      else if (currentSessionId === id) setCurrentSessionId(newSessions[0].id);
      localStorage.setItem('edward_chats', JSON.stringify(newSessions));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!prompt && !file) || isLoading) return;

    if (!currentSessionId) createNewSession();

    const userMessage: Message = { role: 'user', content: prompt, image: preview || undefined };

    // 1. Add User Message (Optimistic)
    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        const newTitle = session.messages.length === 0 ? (prompt.slice(0, 30) + "...") : session.title;
        return { ...session, title: newTitle, messages: [...session.messages, userMessage] };
      }
      return session;
    }));

    setIsLoading(true);
    setPrompt("");
    setFile(null);
    setPreview(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // 2. Add AI Placeholder
    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        return { ...session, messages: [...session.messages, { role: 'ai', content: "" }] };
      }
      return session;
    }));

    const formData = new FormData();
    formData.append("prompt", userMessage.content || "Describe this image");
    formData.append("provider", provider);
    if (file) formData.append("image", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/chats/completion", {
        method: "POST",
        body: formData,
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });

        // --- THE FIXED IMMUTABLE UPDATE ---
        setSessions(prev => prev.map(session => {
          if (session.id === currentSessionId) {
            // Map over messages to create a new array and new object for the last message
            const updatedMessages = session.messages.map((msg, index) => {
              if (index === session.messages.length - 1 && msg.role === 'ai') {
                return { ...msg, content: msg.content + chunkValue };
              }
              return msg;
            });
            return { ...session, messages: updatedMessages };
          }
          return session;
        }));
      }

    } catch (error) {
      console.error(error);
      setSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          // Error handling also needs immutable update
          const updatedMessages = session.messages.map((msg, index) => {
            if (index === session.messages.length - 1 && msg.role === 'ai') {
              return { ...msg, content: "❌ Connection failed." };
            }
            return msg;
          });
          return { ...session, messages: updatedMessages };
        }
        return session;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const theme = {
    bg: isDarkMode ? "#121212" : "#ffffff",
    text: isDarkMode ? "#e0e0e0" : "#374151",
    sidebarBg: isDarkMode ? "#1e1e1e" : "#f3f4f6",
    sidebarHover: isDarkMode ? "#2d2d2d" : "#e5e7eb",
    headerBg: isDarkMode ? "#121212" : "#ffffff",
    inputBg: isDarkMode ? "#2d2d2d" : "#ffffff",
    borderColor: isDarkMode ? "#333" : "#e5e7eb"
  };

  if (!token) return <Login onLogin={handleLogin} />;

  return (
    <div style={{ 
      display: "flex", 
      height: "100vh", 
      width: "100vw", 
      backgroundColor: theme.bg, 
      color: theme.text, 
      fontFamily: "'Inter', system-ui, sans-serif", 
      overflow: "hidden" 
    }}>
      
      {/* MOBILE OVERLAY */}
      {isMobile && isSidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 99 }}
        />
      )}

      {/* SIDEBAR */}
      <aside style={{ 
        width: isMobile ? "80%" : "280px", 
        maxWidth: "300px",
        height: "100%",
        position: isMobile ? "fixed" : "relative",
        zIndex: 100,
        backgroundColor: theme.sidebarBg, 
        borderRight: `1px solid ${theme.borderColor}`, 
        transform: isSidebarOpen ? "translateX(0)" : (isMobile ? "translateX(-100%)" : "none"),
        transition: "transform 0.3s ease-in-out, width 0.3s ease",
        display: !isMobile && !isSidebarOpen ? "none" : "flex",
        flexDirection: "column",
        boxShadow: isMobile && isSidebarOpen ? "5px 0 15px rgba(0,0,0,0.3)" : "none"
      }}>
        <div style={{ padding: "15px" }}>
          {isMobile && (
            <button 
              onClick={() => setSidebarOpen(false)}
              style={{ background: "none", border: "none", color: theme.text, fontSize: "1.5rem", marginBottom: "10px", cursor: "pointer" }}
            >
              ✕
            </button>
          )}

          <button onClick={createNewSession} style={{ 
            width: "100%", padding: "12px", backgroundColor: theme.bg, 
            border: `1px solid ${theme.borderColor}`, borderRadius: "8px", 
            color: theme.text, cursor: "pointer", display: "flex", 
            alignItems: "center", gap: "10px", fontWeight: "500", 
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
          }}>
            <span style={{ fontSize: "1.2rem", color: "#2563eb" }}>+</span> New Chat
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 10px" }}>
          {sessions.map(session => (
            <div key={session.id} onClick={() => { setCurrentSessionId(session.id); if (isMobile) setSidebarOpen(false); }}
              style={{ 
                padding: "12px 15px", borderRadius: "8px", cursor: "pointer", 
                backgroundColor: currentSessionId === session.id ? theme.sidebarHover : "transparent", 
                color: theme.text, marginBottom: "4px", fontSize: "14px",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{session.title}</span>
              {currentSessionId === session.id && (
                <button onClick={(e) => deleteSession(e, session.id)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.6 }}>🗑️</button>
              )}
            </div>
          ))}
        </div>
        <div style={{ padding: "20px", borderTop: `1px solid ${theme.borderColor}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ background: "none", border: "none", color: theme.text, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
            {isDarkMode ? "🌙" : "☀️"} Theme
          </button>
          <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>Log out</button>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
        {/* Header */}
        <header style={{ padding: "10px 20px", borderBottom: `1px solid ${theme.borderColor}`, backgroundColor: theme.headerBg, display: "flex", justifyContent: "space-between", alignItems: "center", height: "60px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: theme.text, padding: "5px" }}>
              {isSidebarOpen ? "" : "☰"}
            </button>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>Edward AI</h2>
          </div>
          <select value={provider} onChange={(e) => setProvider(e.target.value)} style={{ padding: "6px 12px", borderRadius: "6px", border: `1px solid ${theme.borderColor}`, backgroundColor: theme.bg, color: theme.text, fontSize: "13px" }}>
            <option value="gemini">Gemini 2.5</option>
            <option value="groq">Groq</option>
          </select>
        </header>

        {/* Chat Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", scrollBehavior: "smooth" }}>
          {currentMessages.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: "20vh", color: theme.text, opacity: 0.6 }}>
              <div style={{ fontSize: "50px", marginBottom: "15px" }}>⚡</div>
              <h3 style={{ fontWeight: "500", margin: 0 }}>Start a new chat</h3>
            </div>
          ) : (
            <div style={{ width: "100%", maxWidth: "800px", paddingBottom: "20px" }}>
              {currentMessages.map((msg, index) => (
                <ChatMessage key={index} role={msg.role} content={msg.content} image={msg.image} isDark={isDarkMode} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{ padding: "15px", display: "flex", justifyContent: "center", backgroundColor: theme.bg, borderTop: `1px solid ${theme.borderColor}` }}>
          <div style={{ width: "100%", maxWidth: "800px", position: "relative" }}>
            {preview && (
              <div style={{ position: "absolute", top: "-70px", left: "0", backgroundColor: theme.bg, padding: "8px", border: `1px solid ${theme.borderColor}`, borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
                <img src={preview} alt="Preview" style={{ height: "40px", borderRadius: "4px" }} />
                <button onClick={() => { setFile(null); setPreview(null); }} style={{ color: "#ef4444", border: "none", background: "none", cursor: "pointer", fontWeight: "bold" }}>✕</button>
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ 
              display: "flex", gap: "10px", padding: "8px 12px", 
              border: `1px solid ${theme.borderColor}`, borderRadius: "24px", 
              backgroundColor: theme.inputBg, alignItems: "flex-end"
            }}>
              <input type="file" id="file-upload" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
              <label htmlFor="file-upload" style={{ cursor: "pointer", padding: "10px 5px", fontSize: "1.3rem", color: "#888" }}>📎</label>
              
              <textarea 
                ref={textareaRef}
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                onKeyDown={handleKeyDown}
                placeholder="Message..." 
                rows={1}
                style={{ 
                  flex: 1, border: "none", outline: "none", fontSize: "1rem", 
                  backgroundColor: "transparent", color: theme.text, resize: "none",
                  padding: "12px 0", maxHeight: "150px", fontFamily: "inherit"
                }} 
              />
              
              <button type="submit" disabled={isLoading || (!prompt && !file)} style={{ 
                backgroundColor: isLoading || (!prompt && !file) ? theme.borderColor : "#2563eb", 
                color: "white", border: "none", borderRadius: "50%", 
                width: "40px", height: "40px", display: "flex", alignItems: "center", 
                justifyContent: "center", cursor: isLoading ? "wait" : "pointer", 
                marginBottom: "2px"
              }}>
                {isLoading ? "..." : "➤"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;