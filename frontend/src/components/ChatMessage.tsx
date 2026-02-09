import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatMessageProps {
  role: 'user' | 'ai';
  content: string;
  image?: string;
}

export default function ChatMessage({ role, content, image }: ChatMessageProps) {
  return (
    <div style={{
      display: "flex",
      justifyContent: role === 'user' ? "flex-end" : "flex-start",
      marginBottom: "20px",
    }}>
      <div style={{
        maxWidth: "85%",
        padding: "15px 20px",
        borderRadius: "12px",
        backgroundColor: role === 'user' ? "#007bff" : "transparent", // AI gets transparent bg to blend with theme
        color: role === 'user' ? "white" : "inherit",
        // Only add shadow/border to User. AI text blends into the background for a clean look
        boxShadow: role === 'user' ? "0 2px 5px rgba(0,0,0,0.1)" : "none",
        border: role === 'ai' ? "none" : "none",
      }}>
        
        {/* User Role Label or AI Name */}
        <div style={{ fontSize: "12px", marginBottom: "5px", opacity: 0.7, fontWeight: "bold" }}>
          {role === 'user' ? "You" : "Edward"}
        </div>

        {/* Image Preview */}
        {image && (
          <img 
            src={image} 
            alt="Upload" 
            style={{ maxWidth: "100%", borderRadius: "8px", marginBottom: "10px", border: "1px solid rgba(255,255,255,0.2)" }} 
          />
        )}

        {/* THE MAGIC: Markdown Renderer */}
        <div className="markdown-body" style={{ fontSize: "16px", lineHeight: "1.6" }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div style={{ borderRadius: "8px", overflow: "hidden", marginTop: "10px", marginBottom: "10px" }}>
                    <div style={{ backgroundColor: "#2d2d2d", padding: "5px 10px", fontSize: "12px", color: "#ccc", display: "flex", justifyContent: "space-between" }}>
                      <span>{match[1]}</span>
                      <span>Copy</span>
                    </div>
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code className={className} {...props} style={{ 
                    backgroundColor: role === 'user' ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)", 
                    padding: "2px 5px", 
                    borderRadius: "4px" 
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
}