import { useState, useCallback } from "react";
import { Message, UserType } from "@/components/chat/ChatContainer";
import ChatContainer from "@/components/chat/ChatContainer";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";

export default function Dashboard() {
  const { user } = useAuthStore();
  const userType = (user?.role || "job_seeker") as UserType;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "assistant",
      content: `Welcome to Kozi AI Assistant! 🤝
I can help ${userType === "job_seeker" ? "Job Seekers find opportunities" : userType === "employer" ? "Employers hire the best talent" : "Admins manage the platform"} efficiently.

I can also help you retrieve data from our database. Try asking questions like:
- "Show me the latest job postings"
- "How many users registered this month?"
- "What are the top skills in demand?"`,
      timestamp: new Date(),
      quickActions:
        userType === "job_seeker"
          ? ["Browse jobs", "Update my CV", "Get application tips", "Show my applications", "Show job seekers", "Top skills"]
          : userType === "employer"
          ? ["Post a job", "View candidates", "Manage interviews", "Company statistics", "Show employers", "Recent jobs"]
          : ["View platform stats", "Manage users", "Check payments", "System analytics", "All users", "Database stats"],
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const detectQueryType = (message: string): 'chat' | 'sql' => {
    const sqlKeywords = [
      'show', 'list', 'count', 'how many', 'statistics', 'analytics',
      'data', 'retrieve', 'get', 'find', 'search', 'query', 'report',
      'top', 'latest', 'recent', 'total', 'average', 'sum', 'view', 
      'filter', 'where', 'group by', 'order by', 'join', 'select', 
      'from', 'database', 'table', 'record', 'entries', 'all'
    ];
    
    const chatKeywords = [
      'hello', 'hi', 'hey', 'help', 'how are you', 'what can you do',
      'explain', 'tell me about', 'advice', 'suggestion', 'recommend',
      'thank', 'thanks', 'please', 'could you', 'would you'
    ];
    
    const lowerMessage = message.toLowerCase();
    
    // If it contains SQL keywords and not chat keywords, it's SQL
    const hasSql = sqlKeywords.some(keyword => lowerMessage.includes(keyword));
    const hasChat = chatKeywords.some(keyword => lowerMessage.includes(keyword));
    
    return hasSql && !hasChat ? 'sql' : 'chat';
  };

  // Add this helper function to format SQL results
const formatSQLResult = (content: string): string => {
  // Clean up markdown table formatting for better display
  return content
    .replace(/```/g, '') // Remove markdown code blocks
    .replace(/\|\s*---/g, '│———') // Better table borders
    .replace(/\|/g, '│') // Better pipe characters
    .replace(/\\n/g, '\n') // Convert escaped newlines
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1'); // Remove italics
};

  const handleSendMessage = useCallback(
    async (message: string, currentUserType: UserType) => {
      setIsLoading(true);

      const userMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: message,
        timestamp: new Date(),
        userType: currentUserType,
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        const queryType = detectQueryType(message);
        
        if (queryType === 'sql') {
          // Use SQL Agent for database queries with streaming
          const evtSource = new EventSource(
            `/api/sql-agent/stream?input=${encodeURIComponent(message)}`
          );

          let assistantContent = "";
          let streamId = `stream-${Date.now()}`;

          setMessages((prev) => [
            ...prev,
            { 
              id: streamId, 
              type: "assistant", 
              content: "", 
              timestamp: new Date(),
              isStreaming: true 
            },
          ]);

// Add this format function at the top of your component
const formatSQLContent = (content: string): string => {
  return content
    .replace(/\\n/g, '\n') // Convert escaped newlines
    .replace(/\|\s*---/g, '| ——— ') // Better table borders
    .replace(/\*\*(.*?)\*\*/g, '**$1**') // Keep bold for emphasis
    .replace(/✅/g, '✅ ')
    .replace(/❌/g, '❌ ')
    .replace(/🔍/g, '🔍 ')
    .replace(/📊/g, '📊 ')
    .replace(/📭/g, '📭 ');
};

// Update the message handler in your handleSendMessage function:
evtSource.onmessage = (e) => {
  try {
    if (e.data === '[DONE]') {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamId ? { 
            ...msg, 
            id: Date.now().toString(), 
            isStreaming: false,
            content: formatSQLContent(assistantContent)
          } : msg
        )
      );
      evtSource.close();
      setIsLoading(false);
      return;
    }

    const data = JSON.parse(e.data);
    
    if (data.content) {
      assistantContent += data.content;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamId ? { 
            ...msg, 
            content: formatSQLContent(assistantContent)
          } : msg
        )
      );
    }
  } catch (error) {
    if (e.data !== "[DONE]") {
      assistantContent += e.data;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamId ? { 
            ...msg, 
            content: formatSQLContent(assistantContent)
          } : msg
        )
      );
    }
  }
};

          evtSource.onerror = (err) => {
            console.error("SQL Agent SSE error:", err);
            toast({
              title: "Error",
              description: "Failed to process your database query",
              variant: "destructive",
            });
            evtSource.close();
            
            // Update the stream message with error
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamId 
                  ? { 
                      ...msg, 
                      content: assistantContent + "\n\n❌ Failed to complete the query. Please try again.",
                      isStreaming: false 
                    } 
                  : msg
              )
            );
            setIsLoading(false);
          };

          // Close the stream after 30 seconds timeout
          setTimeout(() => {
            if (evtSource.readyState !== EventSource.CLOSED) {
              evtSource.close();
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamId 
                    ? { 
                        ...msg, 
                        content: assistantContent + "\n\n⏰ Query timeout. Please try a simpler query.",
                        isStreaming: false 
                      } 
                    : msg
                )
              );
              setIsLoading(false);
            }
          }, 30000);

        } else {
          // Use regular chat for general conversations
          const allMessages = [...messages, userMessage];
          const evtSource = new EventSource(
            `/api/chat/stream?messages=${encodeURIComponent(
              JSON.stringify(allMessages)
            )}`
          );

          let assistantContent = "";
          let streamId = `stream-${Date.now()}`;

          setMessages((prev) => [
            ...prev,
            { 
              id: streamId, 
              type: "assistant", 
              content: "", 
              timestamp: new Date(),
              isStreaming: true 
            },
          ]);

          evtSource.onmessage = (e) => {
            if (e.data === "[DONE]") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamId ? { ...msg, id: Date.now().toString(), isStreaming: false } : msg
                )
              );
              evtSource.close();
              setIsLoading(false);
              return;
            }

            assistantContent += e.data;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamId ? { ...msg, content: assistantContent } : msg
              )
            );
          };

          evtSource.onerror = (err) => {
            console.error("SSE error:", err);
            toast({
              title: "Error",
              description: "Failed to fetch AI response",
              variant: "destructive",
            });
            evtSource.close();
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamId 
                  ? { 
                      ...msg, 
                      content: assistantContent + "\n\n❌ Failed to complete the response.",
                      isStreaming: false 
                    } 
                  : msg
              )
            );
            setIsLoading(false);
          };
        }
      } catch (err) {
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to process your message",
          variant: "destructive",
        });
        
        // Add error message
        const errorMessage: Message = {
          id: Date.now().toString(),
          type: "assistant",
          content: "❌ Sorry, I couldn't process your query. Please try again.",
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
      }
    },
    [messages]
  );

  return (
    <ChatContainer
      userType={userType}
      onSendMessage={handleSendMessage}
      messages={messages}
      isLoading={isLoading}
    />
  );
}