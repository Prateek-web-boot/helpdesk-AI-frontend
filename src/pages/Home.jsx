import React, {useState} from "react";
import { Button } from "../components/ui/button";
import { Bot } from "lucide-react";
import { useNavigate } from "react-router";
import {Input} from "@/components/ui/input.jsx";

function Home() {
    const [email, setEmail] = useState("");
    const navigate = useNavigate();

    const handleStart = () => {
        if (!email.includes("@")) return alert("Valid email required");
        localStorage.setItem("userEmail", email);
        navigate("/chat");
    };

    return (
        <div className="h-screen w-screen flex    flex-col justify-center items-center gap-5">
            <Bot size={80} />
            <h1 className="text-4xl font-bold">Welcome to Help Desk AI</h1>
            <div className="w-80 space-y-4">
                <Input
                    placeholder="Enter your email to see history"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <Button className="w-full" onClick={handleStart}>Login & Chat</Button>
            </div>
        </div>
    );
}

export default Home;