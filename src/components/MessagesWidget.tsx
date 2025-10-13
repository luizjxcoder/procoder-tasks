import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, MoreVertical } from "lucide-react"

interface Message {
  id: string
  sender: string
  content: string
  timestamp: string
  avatar: string
  isOnline: boolean
  unread?: boolean
}

const messages: Message[] = [
  {
    id: "1",
    sender: "John Doe",
    content: "Hi Angela, how are you?",
    timestamp: "2 min ago",
    avatar: "JD",
    isOnline: true,
    unread: true
  },
  {
    id: "2", 
    sender: "Charmie",
    content: "Can we start the design?",
    timestamp: "5 min ago",
    avatar: "CH",
    isOnline: true,
    unread: true
  },
  {
    id: "3",
    sender: "Jason Mandela",
    content: "What's the price of hourly...",
    timestamp: "1 hour ago",
    avatar: "JM",
    isOnline: false,
    unread: false
  },
  {
    id: "4",
    sender: "Charlie Chen",
    content: "Great job on the last sprint!",
    timestamp: "2 hours ago",
    avatar: "CC",
    isOnline: true,
    unread: false
  }
]

export function MessagesWidget() {
  const [newMessage, setNewMessage] = useState("")
  const [chatMessages, setChatMessages] = useState(messages)

  const sendMessage = () => {
    if (!newMessage.trim()) return
    
    const message: Message = {
      id: Date.now().toString(),
      sender: "You",
      content: newMessage,
      timestamp: "now",
      avatar: "YOU",
      isOnline: true
    }
    
    setChatMessages(prev => [message, ...prev])
    setNewMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="bg-gradient-card border border-border rounded-xl p-6 shadow-card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-card-foreground">Messages</h2>
        </div>
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages List */}
      <div className="flex-1 space-y-3 mb-4 overflow-y-auto max-h-80">
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
              message.unread 
                ? "bg-primary/10 border border-primary/20 hover:bg-primary/15" 
                : "hover:bg-secondary/50"
            }`}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">
                  {message.avatar}
                </span>
              </div>
              {message.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success border-2 border-card rounded-full" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-card-foreground truncate">
                  {message.sender}
                </h4>
                <span className="text-xs text-muted-foreground">
                  {message.timestamp}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {message.content}
              </p>
            </div>

            {message.unread && (
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button 
          onClick={sendMessage}
          size="sm"
          className="w-10 h-10 p-0"
          disabled={!newMessage.trim()}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}