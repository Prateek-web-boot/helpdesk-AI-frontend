import React, { useState, useRef } from "react";
import { Mic, Loader2, StopCircle } from "lucide-react";
import { Button } from "./ui/button";
import axios from "../api/axios";

function AudioRecorder({ onTranscription }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
                await uploadAudio(audioBlob);
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone access denied", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
            setIsRecording(false);
        }
    };

    const uploadAudio = async (blob) => {
        setIsTranscribing(true);
        const formData = new FormData();
        formData.append("file", blob, "recording.wav");
        try {
            const res = await axios.post("/transcribe", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            onTranscription(res.data);
        } catch (err) {
            console.error("Transcription failed", err);
        } finally {
            setIsTranscribing(false);
        }
    };

    return (
        <div className="relative flex items-center justify-center">
            {/* The Dispersing Light Effect (Yellow Glow) */}
            {isRecording && (
                <span className="absolute inline-flex h-full w-full rounded-xl bg-yellow-400 opacity-75 animate-ping"></span>
            )}

            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTranscribing}
                className={`relative z-10 rounded-xl h-12 w-12 shrink-0 transition-all duration-300 ${
                    isRecording
                        ? "bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.8)] hover:bg-yellow-500"
                        : "text-muted-foreground hover:bg-accent"
                }`}
            >
                {isTranscribing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : isRecording ? (
                    <Mic className="h-5 w-5 animate-bounce" />
                ) : (
                    <Mic className="h-5 w-5" />
                )}
            </Button>
        </div>
    );
}

export default AudioRecorder;