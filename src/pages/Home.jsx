import React, { useState } from "react";
import { BrainCircuit, Bot, Ticket } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "@/components/ui/input.jsx";
import api from "../api/axios";
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from "../components/ui/card";

const CHAT_MODES = {
    TICKET: "TICKET",
    RAG: "RAG",
};

function Home() {
    const [email, setEmail] = useState(() => localStorage.getItem("userEmail") ?? "");
    const [mode, setMode] = useState(() => localStorage.getItem("chatMode") === CHAT_MODES.RAG ? CHAT_MODES.RAG : CHAT_MODES.TICKET);
    const [project, setProject] = useState(() => localStorage.getItem("ragProject") ?? "");
    const [projectOptions, setProjectOptions] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [projectLoadError, setProjectLoadError] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const loadProjects = React.useCallback(async () => {
        setLoadingProjects(true);
        setProjectLoadError("");
        try {
            const response = await api.get("/projects");
            const projects = Array.isArray(response.data) ? response.data : [];
            setProjectOptions(projects);
            setProject((current) => current || (projects.length > 0 ? projects[0] : ""));
        } catch (err) {
            console.error("Failed to load projects", err);
            setProjectOptions([]);
            setProjectLoadError("Could not load project names from the backend.");
        } finally {
            setLoadingProjects(false);
        }
    }, []);

    React.useEffect(() => {
        if (mode === CHAT_MODES.RAG) {
            loadProjects();
        }
    }, [mode, loadProjects]);

    const handleStart = () => {
        const trimmedEmail = email.trim();
        const trimmedProject = project.trim();

        if (!trimmedEmail.includes("@")) {
            setError("Enter a valid email address.");
            return;
        }

        if (mode === CHAT_MODES.RAG && !trimmedProject) {
            setError("Add a project name before entering RAG mode.");
            return;
        }

        localStorage.setItem("userEmail", trimmedEmail);
        localStorage.setItem("chatMode", mode);
        localStorage.setItem("ragProject", mode === CHAT_MODES.RAG ? trimmedProject : "");
        navigate("/chat");
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.12),_transparent_28%),linear-gradient(180deg,_#fbfbf8_0%,_#f6f4ee_100%)] px-4 py-10">
            <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] [background-size:44px_44px]" />
            <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center">
                <Card className="w-full overflow-hidden border-border/70 bg-background/85 shadow-2xl backdrop-blur-xl">
                    <div className="grid md:grid-cols-[1.05fr_0.95fr]">
                        <div className="border-b bg-gradient-to-br from-primary/10 via-background to-background p-8 md:border-b-0 md:border-r md:p-10">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                                <Bot className="h-4 w-4" />
                                Help Desk AI
                            </div>
                            <CardTitle className="max-w-md text-3xl leading-tight md:text-4xl">
                                Pick the path before you start talking.
                            </CardTitle>
                            <CardDescription className="mt-4 max-w-lg text-base leading-7">
                                Ticket mode is for support requests and resolution drafting.
                                RAG mode is for searching project knowledge and answering curious questions from your docs.
                            </CardDescription>

                            <div className="mt-8 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border bg-background/80 p-4 shadow-sm">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <Ticket className="h-4 w-4" />
                                        Ticket mode
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Keep conversations focused on issue intake and ticket creation.
                                    </p>
                                </div>
                                <div className="rounded-2xl border bg-background/80 p-4 shadow-sm">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <BrainCircuit className="h-4 w-4" />
                                        RAG mode
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Ask questions against a project-specific knowledge base.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <CardContent className="p-8 md:p-10">
                            <div className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-sm font-medium">Email</label>
                                    <Input
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setError("");
                                        }}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium">Mode</label>
                                    <div className="grid grid-cols-2 gap-3 rounded-2xl border bg-muted/30 p-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMode(CHAT_MODES.TICKET);
                                                setError("");
                                            }}
                                            className={`rounded-xl px-4 py-3 text-left transition ${
                                                mode === CHAT_MODES.TICKET
                                                    ? "bg-background shadow-sm ring-1 ring-border"
                                                    : "text-muted-foreground hover:bg-background/60"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 text-sm font-semibold">
                                                <Ticket className="h-4 w-4" />
                                                Ticket
                                            </div>
                                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                Support requests and incident drafting.
                                            </p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMode(CHAT_MODES.RAG);
                                                setError("");
                                            }}
                                            className={`rounded-xl px-4 py-3 text-left transition ${
                                                mode === CHAT_MODES.RAG
                                                    ? "bg-background shadow-sm ring-1 ring-border"
                                                    : "text-muted-foreground hover:bg-background/60"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 text-sm font-semibold">
                                                <BrainCircuit className="h-4 w-4" />
                                                RAG
                                            </div>
                                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                Search project docs and answer from knowledge.
                                            </p>
                                        </button>
                                    </div>
                                </div>

                                {mode === CHAT_MODES.RAG && (
                                    <div>
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <label className="block text-sm font-medium">Project</label>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-3 text-xs text-muted-foreground"
                                                onClick={loadProjects}
                                            >
                                                Refresh
                                            </Button>
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={project}
                                                onChange={(e) => {
                                                    setProject(e.target.value);
                                                    setError("");
                                                }}
                                                className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none ring-offset-background transition-colors focus-visible:ring-1 focus-visible:ring-ring"
                                                disabled={loadingProjects}
                                            >
                                                <option value="">
                                                    {loadingProjects
                                                        ? "Loading projects..."
                                                        : "Select a project from uploaded docs"}
                                                </option>
                                                {[...new Set([...(projectOptions || []), ...(project ? [project] : [])])]
                                                    .filter(Boolean)
                                                    .map((name) => (
                                                        <option key={name} value={name}>
                                                            {name}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                        {!loadingProjects && projectOptions.length === 0 && (
                                            <p className="mt-2 text-xs text-amber-700">
                                                No uploaded projects found yet. Upload a document first, then come back here.
                                            </p>
                                        )}
                                        {projectLoadError && (
                                            <p className="mt-2 text-xs text-red-700">
                                                {projectLoadError}
                                            </p>
                                        )}
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            This list comes from the projects already ingested into the system.
                                        </p>
                                    </div>
                                )}

                                {error && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                        {error}
                                    </div>
                                )}

                                <Button className="w-full" onClick={handleStart}>
                                    Login &amp; Chat
                                </Button>
                            </div>
                        </CardContent>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default Home;
