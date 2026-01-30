"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, MessageSquare, Sparkles } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  model?: "jess" | "sonnet";
}

interface LectureChatProps {
  courseId?: string;
  recordingId?: string;
  transcript?: string;
  placeholder?: string;
  title?: string;
}

// Format message content to highlight @jess mentions
function formatMessageContent(content: string, isUser: boolean) {
  const parts = content.split(/(@jess)/gi);
  
  return parts.map((part, i) => {
    if (part.toLowerCase() === "@jess") {
      return (
        <span
          key={i}
          className={`inline-flex items-center px-1.5 py-0.5 rounded font-medium text-sm ${
            isUser 
              ? "bg-primary-foreground/20 text-primary-foreground" 
              : "bg-violet-500/20 text-violet-400"
          }`}
        >
          @jess
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function LectureChat({
  courseId,
  recordingId,
  transcript,
  placeholder = "Ask about your lectures... (tag @jess for full capabilities)",
  title = "Ask about lectures",
}: LectureChatProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  // Update input content with highlighting
  const updateInputDisplay = () => {
    if (!inputRef.current) return;
    
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const cursorOffset = range ? getCursorOffset(inputRef.current, range) : 0;
    
    // Get plain text and update with highlighting
    const text = inputRef.current.innerText || "";
    const highlighted = text.replace(
      /(@jess)/gi,
      '<span class="inline-flex items-center px-1.5 py-0.5 rounded font-medium text-sm bg-violet-500/20 text-violet-400">@jess</span>'
    );
    
    if (inputRef.current.innerHTML !== highlighted) {
      inputRef.current.innerHTML = highlighted;
      // Restore cursor position
      restoreCursorPosition(inputRef.current, cursorOffset);
    }
    
    setChatInput(text);
  };

  const getCursorOffset = (element: HTMLElement, range: Range): number => {
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  };

  const restoreCursorPosition = (element: HTMLElement, offset: number) => {
    const selection = window.getSelection();
    if (!selection) return;
    
    const range = document.createRange();
    let currentOffset = 0;
    let found = false;
    
    const walkTree = (node: Node): boolean => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent?.length || 0;
        if (currentOffset + textLength >= offset) {
          range.setStart(node, offset - currentOffset);
          range.setEnd(node, offset - currentOffset);
          return true;
        }
        currentOffset += textLength;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        for (const child of Array.from(node.childNodes)) {
          if (walkTree(child)) return true;
        }
      }
      return false;
    };
    
    found = walkTree(element);
    
    if (found) {
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Fallback: place at end
      range.selectNodeContents(element);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const handleSendChat = async () => {
    const text = inputRef.current?.innerText?.trim() || chatInput.trim();
    if (!text) return;

    const userMessage = text;
    
    // Clear input
    if (inputRef.current) {
      inputRef.current.innerHTML = "";
    }
    setChatInput("");
    
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);

    try {
      // Determine context level
      let level: 'recording' | 'course' | 'all' = 'all';
      if (recordingId) level = 'recording';
      else if (courseId) level = 'course';

      const res = await fetch("/api/lectures/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          context: {
            level,
            courseId,
            recordingId,
            transcript,
          },
        }),
      });

      if (!res.ok) throw new Error("Chat failed");
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, model: data.model },
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  const hasJessMention = chatInput.toLowerCase().includes("@jess");

  return (
    <Card className="p-4">
      <h3 className="font-medium mb-4 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        {title}
        {hasJessMention && (
          <span className="flex items-center gap-1 text-xs text-violet-400 ml-2">
            <Sparkles className="h-3 w-3" />
            Full capabilities enabled
          </span>
        )}
      </h3>

      {chatMessages.length > 0 && (
        <ScrollArea className="h-64 mb-4 border rounded-lg p-4" ref={scrollRef}>
          <div className="space-y-4">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="whitespace-pre-wrap">
                    {formatMessageContent(msg.content, msg.role === "user")}
                  </div>
                  {msg.role === "assistant" && msg.model === "jess" && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-violet-400">
                      <Sparkles className="h-3 w-3" />
                      via Jess
                    </div>
                  )}
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
        <div className="relative flex-1">
          <div
            ref={inputRef}
            contentEditable
            onInput={updateInputDisplay}
            onKeyDown={handleKeyDown}
            data-placeholder={placeholder}
            className="min-h-[60px] max-h-[150px] overflow-y-auto w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
          />
        </div>
        <Button
          onClick={handleSendChat}
          disabled={chatLoading || !chatInput.trim()}
          className={hasJessMention ? "bg-violet-600 hover:bg-violet-700" : ""}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        Tag <span className="text-violet-400 font-medium">@jess</span> to enable full AI capabilities (actions, tasks, tools)
      </p>
    </Card>
  );
}
