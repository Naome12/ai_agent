import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Briefcase, UserCheck, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

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
  onUserTypeChange: (type: UserType) => void;
  onSendMessage: (message: string, userType: UserType) => Promise<void>;
  messages: Message[];
  isLoading: boolean;
}

const USER_TYPE_CONFIG = {
  job_seeker: {
    label: "Job Seeker",
    icon: User,
    color: "bg-primary",
    description: "Looking for opportunities"
  },
  employer: {
    label: "Employer", 
    icon: Briefcase,
    color: "bg-accent",
    description: "Hiring talent"
  },
  admin: {
    label: "Admin",
    icon: Settings,
    color: "bg-muted",
    description: "Platform management"
  }
};

export default function ChatContainer({ 
  userType, 
  onUserTypeChange, 
  onSendMessage, 
  messages, 
  isLoading 
}: ChatContainerProps) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (msgUserType) return USER_TYPE_CONFIG[msgUserType].icon;
    return User;
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
          
          <div className="flex gap-2">
            {(Object.keys(USER_TYPE_CONFIG) as UserType[]).map((type) => {
              const config = USER_TYPE_CONFIG[type];
              const Icon = config.icon;
              return (
                <Button
                  key={type}
                  variant={userType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => onUserTypeChange(type)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {config.label}
                </Button>
              );
            })}
          </div>
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
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                  isUser ? "bg-chat-user text-chat-user-foreground" :
                  isSystem ? "bg-chat-system text-chat-system-foreground" :
                  "bg-chat-assistant text-chat-assistant-foreground"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                
                <Card className={cn(
                  "p-3 max-w-[80%] relative",
                  isUser ? "bg-chat-user text-chat-user-foreground ml-auto" :
                  isSystem ? "bg-chat-system text-chat-system-foreground" :
                  "bg-chat-assistant text-chat-assistant-foreground"
                )}>
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
                  <span className="text-sm text-muted-foreground">Kozi is thinking...</span>
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
            Chatting as: {USER_TYPE_CONFIG[userType].label} - {USER_TYPE_CONFIG[userType].description}
          </Badge>
          
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                userType === "job_seeker" ? "Ask about job opportunities..." :
                userType === "employer" ? "Ask about hiring talent..." :
                "Admin queries, payment reminders, database management..."
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