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
I can help ${userType === "job_seeker" ? "Job Seekers find opportunities" : userType === "employer" ? "Employers hire the best talent" : "Admins manage the platform"} efficiently.`,
      timestamp: new Date(),
      quickActions:
        userType === "job_seeker"
          ? ["Browse jobs", "Update my CV", "Get application tips"]
          : userType === "employer"
          ? ["Post a job", "View candidates", "Manage interviews"]
          : ["View platform stats", "Manage users", "Check payments"],
    },
  ]);

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
        const allMessages = [...messages, userMessage];
        const evtSource = new EventSource(
          `/api/chat/stream?messages=${encodeURIComponent(
            JSON.stringify(allMessages)
          )}`
        );

        let assistantContent = "";

        setMessages((prev) => [
          ...prev,
          { id: "stream", type: "assistant", content: "", timestamp: new Date() },
        ]);

        evtSource.onmessage = (e) => {
          if (e.data === "[DONE]") {
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

  return (
    <ChatContainer
      userType={userType}
      onSendMessage={handleSendMessage}
      messages={messages}
      isLoading={isLoading}
    />
  );
}
