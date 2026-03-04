import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Loader2, Mic, MicOff, Camera, Volume2, User, Pill } from "lucide-react";
import { toast } from "sonner";

export default function AiPharmacistPage() {
  const { api } = useAuth();
  const { t, language } = useLanguage();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const chatEndRef = useRef(null);

  // Handle initial query from voice or prescription
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q) { setInput(q); }
    if (location.state?.prescription) {
      const meds = location.state.prescription;
      const names = meds.map(m => m.medicine_name).filter(Boolean).join(", ");
      if (names) {
        setMessages([{
          role: "system", content: `Prescription uploaded. Found: ${names}`,
          medicines: meds,
        }]);
      }
    }
  }, [location]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text) => {
    if (!text?.trim()) return;
    const userMsg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post("/ai-pharmacist/chat", { message: text, language, session_id: sessionId });
      setSessionId(res.data.session_id);
      setMessages(prev => [...prev, { role: "assistant", content: res.data.response }]);
    } catch { toast.error("AI failed"); }
    finally { setLoading(false); }
  };

  const handleTTS = async (text, idx) => {
    setPlayingAudio(idx);
    try {
      const res = await api.post("/ai-pharmacist/tts", { text: text.slice(0, 2000), language });
      const audio = new Audio(`data:audio/mp3;base64,${res.data.audio_base64}`);
      audio.onended = () => setPlayingAudio(null);
      audio.play();
    } catch { toast.error("Voice failed"); setPlayingAudio(null); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const fd = new FormData();
        fd.append("file", blob, "voice.webm");
        try {
          const res = await api.post("/ai-pharmacist/stt", fd, { headers: { "Content-Type": "multipart/form-data" } });
          if (res.data.text) sendMessage(res.data.text);
        } catch { toast.error("Voice recognition failed"); }
      };
      mr.start();
      setIsRecording(true);
      setTimeout(() => { if (mr.state === "recording") { mr.stop(); setIsRecording(false); } }, 10000);
    } catch { toast.error("Mic access denied"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRxUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setLoading(true);
    setMessages(prev => [...prev, { role: "user", content: "Uploaded prescription image" }]);
    try {
      const res = await api.post("/prescriptions/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const meds = res.data.extracted_medicines || [];
      const names = meds.map(m => m.medicine_name).filter(Boolean);
      setMessages(prev => [...prev, { role: "system", content: `Found ${names.length} medicines: ${names.join(", ")}`, medicines: meds }]);
      if (names.length) sendMessage(`Explain these medicines to me: ${names.join(", ")}`);
    } catch { toast.error("Failed to read prescription"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="ai-pharmacist-page">
      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col px-4 sm:px-6 py-4">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><Bot className="h-5 w-5 text-primary" /></div>
          <div><h1 className="font-heading text-lg font-extrabold">{t("ai.title")}</h1><p className="text-[10px] text-muted-foreground">{t("ai.subtitle")}</p></div>
          <label className="ml-auto">
            <Button variant="outline" size="sm" className="text-xs rounded-full gap-1 cursor-pointer" asChild><span><Camera className="h-3 w-3" />{t("ai.upload_rx")}</span></Button>
            <input type="file" accept="image/*" className="hidden" onChange={handleRxUpload} data-testid="ai-rx-upload" />
          </label>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-0">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 text-primary/20 mx-auto mb-3" />
              <p className="text-xs text-muted-foreground">{t("ai.placeholder")}</p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {["Paracetamol usage", "Metformin side effects", "Can I take Crocin with Combiflam?"].map((q) => (
                  <button key={q} onClick={() => sendMessage(q)} className="text-[10px] bg-muted px-3 py-1.5 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">{q}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role !== "user" && <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"><Bot className="h-3.5 w-3.5 text-primary" /></div>}
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${msg.role === "user" ? "bg-primary text-primary-foreground" : msg.role === "system" ? "bg-secondary/10 border border-secondary/20" : "bg-white border border-border/30 shadow-sm"}`}>
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                {msg.medicines && (
                  <div className="mt-2 space-y-1">
                    {msg.medicines.map((m, j) => (
                      <div key={j} className="flex items-center gap-1.5 bg-white/50 rounded-lg px-2 py-1">
                        <Pill className="h-3 w-3 text-primary" />
                        <span className="text-[10px] font-semibold">{m.medicine_name}</span>
                        {m.dosage && <Badge className="text-[8px] bg-muted border-0">{m.dosage}</Badge>}
                        {m.frequency && <Badge className="text-[8px] bg-muted border-0">{m.frequency}</Badge>}
                      </div>
                    ))}
                  </div>
                )}
                {msg.role === "assistant" && (
                  <button onClick={() => handleTTS(msg.content, i)} className="mt-1.5 text-[10px] text-primary/60 hover:text-primary flex items-center gap-0.5" data-testid={`tts-btn-${i}`}>
                    <Volume2 className={`h-3 w-3 ${playingAudio === i ? "animate-pulse" : ""}`} />{t("ai.play_voice")}
                  </button>
                )}
              </div>
              {msg.role === "user" && <div className="w-7 h-7 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"><User className="h-3.5 w-3.5 text-secondary-foreground" /></div>}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2"><div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center"><Bot className="h-3.5 w-3.5 text-primary" /></div>
              <div className="bg-white border border-border/30 rounded-2xl px-4 py-3 shadow-sm"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-border/40 p-1.5 shadow-sm">
          <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-xl ${isRecording ? "bg-red-100 text-red-600" : ""}`}
            onClick={isRecording ? stopRecording : startRecording} data-testid="ai-mic-btn">
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder={t("ai.placeholder")} className="border-0 shadow-none focus-visible:ring-0 text-xs h-9"
            data-testid="ai-chat-input" />
          <Button size="icon" className="h-9 w-9 rounded-xl bg-primary text-primary-foreground" onClick={() => sendMessage(input)} disabled={loading || !input.trim()} data-testid="ai-send-btn">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-center text-[9px] text-muted-foreground mt-2">{t("ai.disclaimer")}</p>
      </div>
    </div>
  );
}
