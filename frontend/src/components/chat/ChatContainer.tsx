import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Settings, LogOut, Database, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";

export type UserType = "job_seeker" | "employer" | "admin";
export type MessageType = "user" | "assistant" | "system" | "sql";

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  userType?: UserType;
  quickActions?: string[];
  sqlData?: any;
  isError?: boolean;
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

const MESSAGE_TYPE_ICONS: Record<MessageType, React.ComponentType<any>> = {
  user: User,
  assistant: Bot,
  system: Settings,
  sql: Database,
};

const MESSAGE_TYPE_STYLES: Record<MessageType, { bg: string; text: string; border: string }> = {
  user: {
    bg: "bg-chat-user",
    text: "text-chat-user-foreground",
    border: "border-chat-user-border"
  },
  assistant: {
    bg: "bg-chat-assistant",
    text: "text-chat-assistant-foreground",
    border: "border-chat-assistant-border"
  },
  system: {
    bg: "bg-chat-system",
    text: "text-chat-system-foreground",
    border: "border-chat-system-border"
  },
  sql: {
    bg: "bg-chat-sql",
    text: "text-chat-sql-foreground",
    border: "border-chat-sql-border"
  }
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

  const renderSqlData = (sqlData: any) => {
    if (!sqlData) return null;

    if (Array.isArray(sqlData)) {
      return (
        <div className="mt-3 p-3 bg-background/50 rounded-lg border">
          <h4 className="text-sm font-semibold mb-2">Query Results:</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b">
                  {Object.keys(sqlData[0] || {}).map((key) => (
                    <th key={key} className="p-2 text-left font-semibold">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sqlData.map((row, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    {Object.values(row).map((value: any, cellIndex) => (
                      <td key={cellIndex} className="p-2">
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {sqlData.length} row{sqlData.length !== 1 ? 's' : ''} returned
          </div>
        </div>
      );
    }

    return (
      <div className="mt-3 p-3 bg-background/50 rounded-lg border">
        <pre className="text-xs whitespace-pre-wrap">
          {JSON.stringify(sqlData, null, 2)}
        </pre>
      </div>
    );
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
                Your recruitment platform assistant with SQL capabilities
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
            const Icon = MESSAGE_TYPE_ICONS[message.type] || Bot;
            const isUser = message.type === "user";
            const styles = MESSAGE_TYPE_STYLES[message.type] || MESSAGE_TYPE_STYLES.assistant;

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
                    styles.bg,
                    styles.text,
                    message.isError && "bg-destructive text-destructive-foreground"
                  )}
                >
                  {message.isError ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>

                <Card
                  className={cn(
                    "p-3 max-w-[80%] relative",
                    styles.bg,
                    styles.text,
                    styles.border,
                    message.isError && "bg-destructive text-destructive-foreground border-destructive",
                    isUser && "ml-auto"
                  )}
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>

                  {message.sqlData && renderSqlData(message.sqlData)}

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
                    {message.type === 'sql' && ' • Database Query'}
                    {message.isError && ' • Error'}
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
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline">Chatting as: {ROLE_LABELS[userType]}</Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              SQL Agent Enabled
            </Badge>
          </div>

          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                userType === "job_seeker"
                  ? "Ask about job opportunities or data queries..."
                  : userType === "employer"
                  ? "Ask about hiring talent or analytics..."
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

          <div className="text-xs text-muted-foreground mt-2">
            Try: "Show me recent job applications", "How many users registered this month?", 
            "List top skills in demand"
          </div>
        </div>
      </div>
    </div>
  );
}