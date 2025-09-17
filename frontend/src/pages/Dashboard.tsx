import { useState, useCallback } from "react";
import { Message, UserType } from "@/components/chat/ChatContainer";
import ChatContainer from "@/components/chat/ChatContainer";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";

export default function Dashboard() {
  const { user, token } = useAuthStore();
  const userType = (user?.role || "job_seeker") as UserType;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "assistant",
      content: `Welcome to Kozi AI Assistant! 🤝
I can help ${userType === "job_seeker"
        ? "Job Seekers find opportunities"
        : userType === "employer"
        ? "Employers hire the best talent"
        : "Admins manage the platform"} efficiently.

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

  // 🔍 Use OpenAI classifier
  const analyzeQueryType = async (message: string): Promise<'chat' | 'sql' | 'gmail'> => {
    try {
      const response = await fetch("/api/classifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, userType }),
      });

      if (!response.ok) throw new Error("Failed to classify");

      const data = await response.json();
      return data.type || "chat";
    } catch (error) {
      console.error("Classifier failed, defaulting to chat:", error);
      return "chat";
    }
  };

  const formatSQLContent = (content: string): string => {
    return content
      .replace(/\\n/g, "\n")
      .replace(/\|\s*---/g, "| ——— ")
      .replace(/\*\*(.*?)\*\*/g, "**$1**")
      .replace(/✅/g, "✅ ")
      .replace(/❌/g, "❌ ")
      .replace(/🔍/g, "🔍 ")
      .replace(/📊/g, "📊 ")
      .replace(/📭/g, "📭 ");
  };

  const handleGmailQuery = async (message: string, streamId: string) => {
    try {
      if (!token) throw new Error("Authentication token is missing");

      const response = await fetch("/api/gmail/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ input: message }),
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Authentication failed");
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamId
            ? {
                ...msg,
                content:
                  data.output || data.message || data.content || "Email action completed successfully",
                isStreaming: false,
              }
            : msg
        )
      );
    } catch (error: any) {
      console.error("Gmail query error:", error);
      let errorMessage = "❌ Failed to process email request. Please try again.";

      if (error.message.includes("Authentication failed")) {
        errorMessage = "❌ Authentication failed. Please log in again to use Gmail features.";
      } else if (error.message.includes("token is missing")) {
        errorMessage = "❌ Authentication required. Please log in again.";
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamId
            ? { ...msg, content: errorMessage, isStreaming: false }
            : msg
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

      const userMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: message,
        timestamp: new Date(),
        userType: currentUserType,
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        // 🔍 Classify query
        const queryType = await analyzeQueryType(message);

        // Gmail restriction
        if (queryType === "gmail") {
          if (currentUserType !== "admin") {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                type: "assistant",
                content: "❌ Gmail functionality is only available for administrators.",
                timestamp: new Date(),
              },
            ]);
            setIsLoading(false);
            return;
          }
          if (!token) {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                type: "assistant",
                content: "❌ Authentication required. Please log in again to use Gmail features.",
                timestamp: new Date(),
              },
            ]);
            setIsLoading(false);
            return;
          }
        }

        // 🛑 Enforce Kozi-only chat
        if (queryType === "chat" && !message.toLowerCase().includes("kozi")) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              type: "assistant",
              content: "❌ Sorry, I can only assist with the Kozi platform. Please ask about jobs, employers, or your account.",
              timestamp: new Date(),
            },
          ]);
          setIsLoading(false);
          return;
        }

        let streamId = `stream-${Date.now()}`;
        let assistantContent = "";

        // Add streaming placeholder
        setMessages((prev) => [
          ...prev,
          { id: streamId, type: "assistant", content: "", timestamp: new Date(), isStreaming: true },
        ]);

        // Handle Gmail
        if (queryType === "gmail") {
          await handleGmailQuery(message, streamId);
          setIsLoading(false);
          return;
        }

        // Handle chat + sql with SSE
        const apiEndpoint =
          queryType === "chat"
            ? `/api/chat/stream?messages=${encodeURIComponent(JSON.stringify([...messages, userMessage]))}`
            : `/api/sql-agent/stream?input=${encodeURIComponent(message)}`;

        const evtSource = new EventSource(apiEndpoint);

        evtSource.onmessage = (e) => {
          try {
            if (e.data === "[DONE]") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamId
                    ? {
                        ...msg,
                        id: Date.now().toString(),
                        isStreaming: false,
                        content: queryType === "sql" ? formatSQLContent(assistantContent) : assistantContent,
                      }
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
                    ? {
                        ...msg,
                        content: queryType === "sql" ? formatSQLContent(assistantContent) : assistantContent,
                      }
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
                    ? {
                        ...msg,
                        content: queryType === "sql" ? formatSQLContent(assistantContent) : assistantContent,
                      }
                    : msg
                )
              );
            }
          }
        };

        evtSource.onerror = (err) => {
          console.error("SSE error:", err, "Endpoint:", apiEndpoint);
          toast({
            title: "Error",
            description: `Failed to process your ${queryType} query`,
            variant: "destructive",
          });
          evtSource.close();

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamId
                ? {
                    ...msg,
                    content:
                      assistantContent +
                      `\n\n❌ Failed to complete the ${queryType} query. Please try again.`,
                    isStreaming: false,
                  }
                : msg
            )
          );
          setIsLoading(false);
        };

        // Timeout safeguard
        setTimeout(() => {
          if (evtSource.readyState !== EventSource.CLOSED) {
            evtSource.close();
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamId
                  ? {
                      ...msg,
                      content: assistantContent + `\n\n⏰ ${queryType} query timeout. Please try again.`,
                      isStreaming: false,
                    }
                  : msg
              )
            );
            setIsLoading(false);
          }
        }, 30000);
      } catch (err) {
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to process your message",
          variant: "destructive",
        });

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "assistant",
            content: "❌ Sorry, I couldn't process your query. Please try again.",
            timestamp: new Date(),
          },
        ]);
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
