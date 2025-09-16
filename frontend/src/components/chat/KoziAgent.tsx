import { useState, useCallback } from "react";
import { Message, UserType } from "@/types";
import ChatContainer from "./ChatContainer";
import { toast } from "@/hooks/use-toast";

export default function KoziAgent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "assistant",
      content: `Welcome to Kozi AI Assistant! 🤝
I can help Job Seekers, Employers, and Admins navigate our platform efficiently.`,
      timestamp: new Date(),
      quickActions: ["I need a job", "I want to hire someone", "Show me platform statistics"],
    },
  ]);

  const [userType, setUserType] = useState<UserType>("job_seeker");
  const [isLoading, setIsLoading] = useState(false);

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
        // open SSE with serialized messages
        const allMessages = [...messages, userMessage];
        const evtSource = new EventSource(
          `/api/chat/stream?messages=${encodeURIComponent(JSON.stringify(allMessages))}`
        );

        let assistantContent = "";

        // placeholder for streaming assistant message
        setMessages((prev) => [
          ...prev,
          { id: "stream", type: "assistant", content: "", timestamp: new Date() },
        ]);

        evtSource.onmessage = (e) => {
          if (e.data === "[DONE]") {
            // finalize
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === "stream" ? { ...msg, id: Date.now().toString() } : msg
              )
            );
            evtSource.close();
            setIsLoading(false);
            return;
          }

          assistantContent += e.data;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === "stream" ? { ...msg, content: assistantContent } : msg
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
          setIsLoading(false);
        };
      } catch (err) {
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to fetch AI response",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    },
    [messages]
  );

  const handleUserTypeChange = useCallback((newUserType: UserType) => {
    setUserType(newUserType);

    const systemMessage: Message = {
      id: Date.now().toString(),
      type: "system",
      content: `Switched to ${newUserType} mode. I'm optimized to help with ${newUserType} tasks.`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, systemMessage]);
  }, []);

  return (
    <ChatContainer
      userType={userType}
      onUserTypeChange={handleUserTypeChange}
      onSendMessage={handleSendMessage}
      messages={messages}
      isLoading={isLoading}
    />
  );
}
