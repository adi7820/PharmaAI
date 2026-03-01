import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Mic, MicOff, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function VoiceAssistant() {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  if (!user || user.role !== "consumer") return null;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", blob, "voice.webm");
        try {
          const res = await api.post("/ai-pharmacist/stt", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          if (res.data.text) {
            navigate(`/ai-pharmacist?q=${encodeURIComponent(res.data.text)}`);
            setIsOpen(false);
          }
        } catch {
          toast.error("Voice recognition failed");
        }
      };
      mediaRecorder.start();
      setIsRecording(true);
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, 10000);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" data-testid="voice-assistant">
      {isOpen && (
        <div className="mb-3 bg-white rounded-2xl shadow-2xl border border-border/40 p-4 w-64 animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <p className="font-heading text-sm font-semibold">AI Pharmacist</p>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <Button
            onClick={() => { navigate("/ai-pharmacist"); setIsOpen(false); }}
            className="w-full bg-primary text-primary-foreground rounded-full text-sm mb-2"
            data-testid="voice-chat-btn"
          >
            <MessageCircle className="h-4 w-4 mr-2" /> Chat with AI
          </Button>
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "outline"}
            className="w-full rounded-full text-sm"
            data-testid="voice-record-btn"
          >
            {isRecording ? <><MicOff className="h-4 w-4 mr-2" /> Stop</> : <><Mic className="h-4 w-4 mr-2" /> Speak</>}
          </Button>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 ${
          isRecording ? "bg-red-500 animate-pulse" : "bg-primary animate-pulse-glow"
        }`}
        data-testid="voice-fab"
      >
        {isRecording ? <MicOff className="h-6 w-6 text-white" /> : <Mic className="h-6 w-6 text-primary-foreground" />}
      </button>
    </div>
  );
}
