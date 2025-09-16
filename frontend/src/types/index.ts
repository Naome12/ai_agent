// src/types.ts
export type UserType = "job_seeker" | "employer" | "admin";

export interface Message {
  id: string;
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  userType?: UserType; // optional for system/assistant
  quickActions?: string[]; // optional for assistant messages
}
