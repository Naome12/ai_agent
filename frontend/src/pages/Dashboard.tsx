import { useState, useCallback } from "react";
import { Message, UserType } from "@/components/chat/ChatContainer";
import ChatContainer from "@/components/chat/ChatContainer";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";

// Use VITE API URL
const API_URL = import.meta.env.VITE_API_URL || "https://ai-agent-khzn.onrender.com/api";

export default function Dashboard() {
  const { user, token } = useAuthStore();
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
          : ["View platform stats", "Manage users", "Check payments", "System analytics", "All users", "Database stats", "Check emails"],
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const detectQueryType = (message: string): 'chat' | 'sql' | 'gmail' => {
    const sqlKeywords = [
      'show', 'list', 'count', 'how many', 'statistics', 'analytics',
      'data', 'retrieve', 'get', 'find', 'search', 'query', 'report',
      'top', 'latest', 'recent', 'total', 'average', 'sum', 'view', 
      'filter', 'where', 'group by', 'order by', 'join', 'select', 
      'from', 'database', 'table', 'record', 'entries', 'all'
    ];
    
    const gmailKeywords = [
      'email', 'emails', 'gmail', 'inbox', 'message', 'messages',
      'unread', 'read', 'sent', 'draft', 'drafts', 'spam', 'starred',
      'important', 'attachment', 'attachments', 'search email',
      'find email', 'check mail', 'my emails', 'email from',
      'recent emails', 'latest emails', 'send email'
    ];
    
    const chatKeywords = [
      'hello', 'hi', 'hey', 'help', 'how are you', 'what can you do',
      'explain', 'tell me about', 'advice', 'suggestion', 'recommend',
      'thank', 'thanks', 'please', 'could you', 'would you'
    ];
    
    const lowerMessage = message.toLowerCase();
    
    const hasGmail = gmailKeywords.some(keyword => lowerMessage.includes(keyword));
    const hasSql = sqlKeywords.some(keyword => lowerMessage.includes(keyword));
    const hasChat = chatKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (hasGmail && userType === "admin") return 'gmail';
    return hasSql && !hasChat ? 'sql' : 'chat';
  };

  const formatSQLContent = (content: string): string => {
    return content
      .replace(/\\n/g, '\n')
      .replace(/\|\s*---/g, '| ——— ')
      .replace(/\*\*(.*?)\*\*/g, '**$1**')
      .replace(/✅/g, '✅ ')
      .replace(/❌/g, '❌ ');
  };

  const handleGmailQuery = async (message: string, streamId: string) => {
    try {
      if (!token) throw new Error("Authentication token is missing");

      const response = await fetch(`${API_URL}/gmail/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ input: message })
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Authentication failed. Please log in again.");
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamId
            ? { ...msg, content: data.output || data.message || data.content || "Email action completed successfully", isStreaming: false }
            : msg
        )
      );
    } catch (error: any) {
      console.error("Gmail query error:", error);
      let errorMessage = "❌ Failed to process email request. Please try again.";
      if (error.message.includes("Authentication failed")) errorMessage = "❌ Authentication failed. Please log in again to use Gmail features.";
      else if (error.message.includes("token is missing")) errorMessage = "❌ Authentication required. Please log in again.";

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamId ? { ...msg, content: errorMessage, isStreaming: false } : msg
        )
      );

      if (error.message.includes("Authentication")) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to access Gmail features",
          variant: "destructive",
        });
      }
    }
  };

  const handleSendMessage = useCallback(
    async (message: string, currentUserType: UserType) => {
      setIsLoading(true);
      const userMessage: Message = { id: Date.now().toString(), type: "user", content: message, timestamp: new Date(), userType: currentUserType };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const queryType = detectQueryType(message);

        if (queryType === 'gmail') {
          if (currentUserType !== 'admin') {
            setMessages((prev) => [...prev, { id: Date.now().toString(), type: "assistant", content: "❌ Gmail functionality is only available for administrators.", timestamp: new Date() }]);
            setIsLoading(false);
            return;
          }
          if (!token) {
            setMessages((prev) => [...prev, { id: Date.now().toString(), type: "assistant", content: "❌ Authentication required. Please log in again to use Gmail features.", timestamp: new Date() }]);
            setIsLoading(false);
            return;
          }
        }

        let streamId = `stream-${Date.now()}`;
        let assistantContent = "";
        setMessages((prev) => [...prev, { id: streamId, type: "assistant", content: "", timestamp: new Date(), isStreaming: true }]);

        if (queryType === 'gmail') {
          await handleGmailQuery(message, streamId);
          setIsLoading(false);
          return;
        }

        let apiEndpoint = '';
        if (queryType === 'chat') {
          const allMessages = [...messages, userMessage];
          apiEndpoint = `${API_URL}/chat/stream?messages=${encodeURIComponent(JSON.stringify(allMessages))}`;
        } else {
          apiEndpoint = `${API_URL}/sql-agent/stream?input=${encodeURIComponent(message)}`;
        }

        console.log("Calling API endpoint:", apiEndpoint);

        const evtSource = new EventSource(apiEndpoint);

        evtSource.onmessage = (e) => {
          try {
            if (e.data === '[DONE]') {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamId
                    ? { ...msg, id: Date.now().toString(), isStreaming: false, content: queryType === 'sql' ? formatSQLContent(assistantContent) : assistantContent }
                    : msg
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
                  msg.id === streamId
                    ? { ...msg, content: queryType === 'sql' ? formatSQLContent(assistantContent) : assistantContent }
                    : msg
                )
              );
            }
          } catch {
            if (e.data !== "[DONE]") {
              assistantContent += e.data;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamId
                    ? { ...msg, content: queryType === 'sql' ? formatSQLContent(assistantContent) : assistantContent }
                    : msg
                )
              );
            }
          }
        };

        evtSource.onerror = (err) => {
          console.error("SSE error:", err, "Endpoint:", apiEndpoint);
          toast({ title: "Error", description: `Failed to process your ${queryType} query`, variant: "destructive" });
          evtSource.close();

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamId
                ? { ...msg, content: assistantContent + `\n\n❌ Failed to complete the ${queryType} query. Please try again.`, isStreaming: false }
                : msg
            )
          );
          setIsLoading(false);
        };

        setTimeout(() => {
          if (evtSource.readyState !== EventSource.CLOSED) {
            evtSource.close();
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamId
                  ? { ...msg, content: assistantContent + `\n\n⏰ ${queryType} query timeout. Please try again.`, isStreaming: false }
                  : msg
              )
            );
            setIsLoading(false);
          }
        }, 30000);

      } catch (err) {
        console.error(err);
        toast({ title: "Error", description: "Failed to process your message", variant: "destructive" });
        setMessages((prev) => [...prev, { id: Date.now().toString(), type: "assistant", content: "❌ Sorry, I couldn't process your query. Please try again.", timestamp: new Date() }]);
        setIsLoading(false);
      }
    },
    [messages, userType, token]
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
