"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, MessageSquare } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface LectureChatProps {
  courseId?: string;
  recordingId?: string;
  transcript?: string;
  placeholder?: string;
  title?: string;
}

export default function LectureChat({
  courseId,
  recordingId,
  transcript,
  placeholder = "Ask about your lectures...",
  title = "Ask about lectures",
}: LectureChatProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/lectures/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          recordingId,
          message: userMessage,
          transcript,
        }),
      });

      if (!res.ok) throw new Error("Chat failed");
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't process that. Try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-medium mb-4 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        {title}
      </h3>

      {chatMessages.length > 0 && (
        <ScrollArea className="h-48 mb-4 border rounded-lg p-4">
          <div className="space-y-4">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      <div className="flex gap-2">
        <Textarea
          placeholder={placeholder}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendChat();
            }
          }}
          className="min-h-[60px]"
        />
        <Button
          onClick={handleSendChat}
          disabled={chatLoading || !chatInput.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
