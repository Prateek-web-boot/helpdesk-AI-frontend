import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftRight, BrainCircuit, Search, MoreVertical, Send, Plus, LogOut, Ticket } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import MessageBubble from "../components/MessageBubble";
import { v4 as uuidv4 } from "uuid";
import { Spinner } from "../components/ui/spinner";
import { useNavigate } from "react-router";
import AudioRecorder from "../components/AudioRecorder";
import axios from "../api/axios";

function Chat() {
    // --- State Management ---
    const [conversations, setConversations] = useState([]); // Real sidebar data
    const [activeChatId, setActiveChatId] = useState(() => uuidv4()); // The UUID of current session
    const [messages, setMessages] = useState(() => [
        {
            id: uuidv4(),
            author: "bot",
            text: "Hello! I am your AI assistant. How can I help you today?",
            at: new Date().toLocaleTimeString(),
        }
    ]);
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);
    const [chatMode] = useState(() => localStorage.getItem("chatMode") === "RAG" ? "RAG" : "TICKET");
    const [ragProject] = useState(() => localStorage.getItem("ragProject") ?? "");
    const [userEmail] = useState(() => localStorage.getItem("userEmail") ?? "");


    const endRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // --- 1. Fetch Sidebar History ---
    const fetchSidebar = useCallback(async () => {
        if (!userEmail) {
            return;
        }

        try {
            const res = await axios.get(`/conversations?email=${userEmail}`);
            setConversations(res.data);
        } catch (err) {
            console.error("Failed to load sidebar", err);
        }
    }, [userEmail]);

    // Initialize: Check login and load sidebar
    useEffect(() => {
        if (!userEmail) {
            navigate("/");
            return;
        }

        fetchSidebar();
    }, [fetchSidebar, navigate, userEmail]);

    // --- 2. Fetch Messages when a Sidebar Item is Clicked ---
    const selectConversation = async (convo) => {
        setError("");
        setActiveChatId(convo.id);
        try {
            const res = await axios.get(`/conversations/${convo.id}/messages`);
            const history = res.data;

            // Map Spring AI DTO (role/content) to UI format (author/text)
            const formatted = history.map(msg => ({
                id: uuidv4(),
                author: msg.role === 'user' ? 'user' : 'bot',
                text: msg.content,
                at: "Previous"
            }));
            setMessages(formatted);
        } catch (err) {
            console.error("Error loading messages", err);
            setMessages([]);
        }
    };

    // --- 3. Start a New Empty Chat ---
    const handleNewChat = () => {
        setError("");
        const newId = uuidv4();
        setActiveChatId(newId);
        setMessages([
            {
                id: uuidv4(),
                author: "bot",
                text: "Hello! I am your AI assistant. How can I help you today?",
                at: new Date().toLocaleTimeString(),
            }
        ]);
        setDraft("");
        inputRef.current?.focus();
    };


    const[error, setError] = useState("");

    // --- 4. Send Message Logic ---
    async function sendMessages() {
        setError("");


        const textMessage = draft.trim();
        if (!textMessage || sending) return;

        if (chatMode === "RAG" && !ragProject.trim()) {
            setError("Pick a project before sending a RAG question.");
            return;
        }

        setDraft(""); // Immediate UI feedback
        setSending(true);

        // Add user message to UI
        const userMsgObj = {
            id: uuidv4(),
            author: "user",
            text: textMessage,
            at: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, userMsgObj]);

        try {
            const response = await axios.post("/chat", {
                uQuery: textMessage,
                mode: chatMode,
                project: chatMode === "RAG" ? ragProject.trim() : "",
            },{
                headers: {
                    "conversationId": activeChatId,
                    "userEmail": userEmail
                }
            });

            const aiResponseText = response.data;

            // Add bot response to UI
            setMessages((prev) => [
                ...prev,
                {
                    id: uuidv4(),
                    author: "bot",
                    text: aiResponseText,
                    at: new Date().toLocaleTimeString(),
                },
            ]);

            // Refresh sidebar (in case this was the first message, a new title was created)
            fetchSidebar();

        } catch (error) {
            if(error.response && error.response.status === 429) {
                setMessages((prev) => [...prev, {
                    id: uuidv4(),
                    author: "bot",
                    text: "⚠️ Slow down! You've reached your message limit for now. Please try again in a few minutes.",
                    at: new Date().toLocaleTimeString(),
                }]);
                setError("Whoa! You're sending messages too fast. Please wait a minute.");
            } else {
                setError("Something went wrong. Please try again later.");
            }
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    }

    // Scroll to bottom helper
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessages();
        }
    };


    return (
        // Fixed: added 'h-screen' and 'overflow-hidden' to the main wrapper
        <div className="fixed top-0 left-0 right-0 mx-auto h-screen max-w-7xl grid grid-cols-1 md:grid-cols-[300px_1fr] border-x overflow-hidden">
            {/* Sidebar */}
            <aside className="hidden md:flex md:flex-col border-r bg-muted/30 h-full overflow-hidden">
                <div className="p-3 flex items-center gap-2">
                    <Button onClick={handleNewChat} size={"icon"} variant={"outline"} className={"h-8 w-8"}>
                        <Plus className="h-4 w-4" />
                    </Button>
                    <div className="relative w-full">
                        <input
                            placeholder="Search..."
                            type="text"
                            className="h-9 w-full pl-8 border rounded-md bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <Search className="h-4 w-4 pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                </div>
                <Separator />

                {/* Sidebar Scrollable Area */}
                <ScrollArea className="flex-1">
                    <ul className="p-2 space-y-1">
                        {conversations.map((c) => (
                            <li key={c.id}>
                                <button
                                    onClick={() => selectConversation(c)}
                                    className={`w-full rounded-xl px-3 py-3 text-left hover:bg-accent transition ${
                                        activeChatId === c.id ? "bg-accent shadow-sm" : ""
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                {c.title?.substring(0, 2).toUpperCase() || "CH"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                        <span className="truncate block text-sm font-medium">
                                            {c.title || "New Conversation"}
                                        </span>
                                            <p className="truncate text-[10px] text-muted-foreground">
                                                {new Date(c.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </ScrollArea>

                <div className="p-4 border-t">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                            localStorage.removeItem("userEmail");
                            navigate("/");
                        }}
                    >
                        <LogOut className="h-4 w-4" /> Logout
                    </Button>
                </div>
            </aside>

            {/* Right Chat Area */}
            {/* Fixed: flex-col and overflow-hidden ensures the scrollarea takes the remaining space */}
            <section className="flex flex-col h-full overflow-hidden bg-background">

                {/* Header */}
                <header className="flex-none flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur">
                    <div className="flex gap-3 items-center">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">AI</AvatarFallback>
                        </Avatar>
                        <div className="leading-tight">
                            <div className="text-sm font-semibold">Brio Support</div>
                            <div className="text-xs">
                                {sending ? (
                                    <span className="text-primary animate-pulse">Typing...</span>
                                ) : (
                                    <span className="text-green-500">Online</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="hidden items-center gap-3 rounded-full border bg-muted/40 px-3 py-2 text-left transition hover:bg-accent sm:flex"
                        >
                            <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                    chatMode === "RAG" ? "bg-amber-500" : "bg-slate-900"
                                }`}
                            />
                            <div className="leading-tight">
                                <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                    {chatMode === "RAG" ? (
                                        <BrainCircuit className="h-3.5 w-3.5" />
                                    ) : (
                                        <Ticket className="h-3.5 w-3.5" />
                                    )}
                                    {chatMode === "RAG" ? "RAG mode" : "Ticket mode"}
                                </div>
                                {chatMode === "RAG" && ragProject ? (
                                    <div className="max-w-44 truncate text-xs text-muted-foreground">
                                        {ragProject}
                                    </div>
                                ) : null}
                            </div>
                            <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </div>
                </header>

                {error && (
                    <div className="mx-auto mt-3 w-full max-w-3xl px-6">
                        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                            {error}
                        </div>
                    </div>
                )}

                {/* Messages Area - The flex-1 is critical here */}
                <ScrollArea className="flex-1 h-[calc(100vh-160px)] w-full">
                    <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
                        {messages.map((chat) => (
                            <MessageBubble key={chat.id} author={chat.author} at={chat.at}>
                                {chat.text}
                            </MessageBubble>
                        ))}

                        {sending && (
                            <div className="flex justify-start">
                                <div className="bg-muted rounded-2xl px-4 py-3 flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        {/* Invisible div to anchor the scroll */}
                        <div ref={endRef} className="h-1" />
                    </div>
                </ScrollArea>

                {/* Composer */}
                <footer className="flex-none p-4 border-t bg-background">
                    <div className="mx-auto flex max-w-3xl items-center gap-3">
                        <Input
                            ref={inputRef}
                            value={draft}
                            onKeyDown={handleKeyDown}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder="Message Brio..."
                            className="flex-1 rounded-xl h-12 bg-muted/50 border-none focus-visible:ring-1"
                        />
                        <AudioRecorder
                            onTranscription={(text) => {
                                setDraft(text); // Put transcribed text into input
                                // Optional: sendMessages(); // Auto-send if you want it to be hands-free
                                inputRef.current?.focus();
                            }}
                        />
                        <Button
                            disabled={sending}
                            onClick={sendMessages}
                            size="icon"
                            className="rounded-xl h-12 w-12 shrink-0"
                        >
                            {sending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </footer>
            </section>
        </div>
    );
}

export default Chat;
