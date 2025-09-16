import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";

export type UserType = "job_seeker" | "employer" | "admin";
export type MessageType = "user" | "assistant" | "system";

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  userType?: UserType;
  quickActions?: string[];
}

interface ChatContainerProps {
  userType: UserType;
  onSendMessage: (message: string, userType: UserType) => Promise<void>;
  messages: Message[];
  isLoading: boolean;
}

const ROLE_LABELS: Record<UserType, string> = {
  job_seeker: "Job Seeker",
  employer: "Employer",
  admin: "Admin",
};

export default function ChatContainer({
  userType,
  onSendMessage,
  messages,
  isLoading,
}: ChatContainerProps) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");
    await onSendMessage(message, userType);
  };

  const handleQuickAction = async (action: string) => {
    await onSendMessage(action, userType);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getUserTypeIcon = (type: MessageType, msgUserType?: UserType) => {
    if (type === "assistant") return Bot;
    if (type === "system") return Settings;
    return User;
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">Kozi AI Assistant</h1>
              <p className="text-sm text-muted-foreground">
                Your recruitment platform assistant
              </p>
            </div>
          </div>

          {/* User profile */}
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm uppercase">
                  {user.fname?.[0] || "U"}
                </div>
                <div className="text-sm">
                  <p className="font-semibold">
                    {user.fname} {user.lname}
                  </p>
                  <Badge variant="outline">{ROLE_LABELS[userType]}</Badge>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => {
            const Icon = getUserTypeIcon(message.type, message.userType);
            const isUser = message.type === "user";
            const isSystem = message.type === "system";

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2",
                  isUser && "flex-row-reverse"
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                    isUser
                      ? "bg-chat-user text-chat-user-foreground"
                      : isSystem
                      ? "bg-chat-system text-chat-system-foreground"
                      : "bg-chat-assistant text-chat-assistant-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <Card
                  className={cn(
                    "p-3 max-w-[80%] relative",
                    isUser
                      ? "bg-chat-user text-chat-user-foreground ml-auto"
                      : isSystem
                      ? "bg-chat-system text-chat-system-foreground"
                      : "bg-chat-assistant text-chat-assistant-foreground"
                  )}
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>

                  {message.quickActions && message.quickActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
                      {message.quickActions.map((action, index) => (
                        <Button
                          key={index}
                          variant="secondary"
                          size="sm"
                          onClick={() => handleQuickAction(action)}
                          className="text-xs"
                        >
                          {action}
                        </Button>
                      ))}
                    </div>
                  )}

                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </Card>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 animate-in fade-in-0">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-chat-assistant text-chat-assistant-foreground flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <Card className="p-3 bg-chat-assistant text-chat-assistant-foreground">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Kozi is thinking...
                  </span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-card/80 backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-3">
            Chatting as: {ROLE_LABELS[userType]}
          </Badge>

          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                userType === "job_seeker"
                  ? "Ask about job opportunities..."
                  : userType === "employer"
                  ? "Ask about hiring talent..."
                  : "Admin queries, payment reminders, database management..."
              }
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
