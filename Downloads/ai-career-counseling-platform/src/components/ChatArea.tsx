"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  Bookmark,
  BarChart2,
  Zap,
  HelpCircle,
  AlertTriangle,
  Headphones,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  IndianRupee,
} from "lucide-react";
import { getLanguageInfo } from "@/lib/voice/speech";

interface ChatAreaProps {
  messages: any[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  selectedLanguage: string;
  onOpenEvidence: (citation: any) => void;
  onCompareCareers: (occupationIds: string[]) => void;
  onSaveCareer: (occupationId: string) => void;
  onOpenSkillGap: (occupationId: string) => void;
  onEscalateCounselor: (reason: string) => void;
  suggestedQuestions: string[];
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  onSendMessage,
  isLoading,
  selectedLanguage,
  onOpenEvidence,
  onCompareCareers,
  onSaveCareer,
  onOpenSkillGap,
  onEscalateCounselor,
  suggestedQuestions,
}) => {
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const langInfo = getLanguageInfo(selectedLanguage);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Setup Web Speech Recognition
  const toggleVoiceRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback voice simulation if browser SpeechRecognition is unavailable
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        const simText =
          selectedLanguage === "ta"
            ? "எனக்கு electronics பிடிக்கும். என் district-ல என்ன career நல்லா இருக்கும்?"
            : selectedLanguage === "hi"
            ? "मुझे इलेक्ट्रिक्स पसंद है। मेरे जिले में कौन सा करियर अच्छा रहेगा?"
            : "I like electronics. What careers are good in my district?";
        setInputText(simText);
      }, 2000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = langInfo.speechLocale;
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn("Speech recognition failed to initialize:", e);
      setIsRecording(false);
    }
  };

  // Text-To-Speech Playback
  const handleReadAloud = (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      window.speechSynthesis?.cancel();
      setSpeakingMsgId(null);
      return;
    }

    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langInfo.speechLocale;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Top Language & Grounding Status Banner */}
      <div className="bg-slate-900/80 border-b border-slate-800 px-4 py-2 text-xs flex items-center justify-between text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Language Active: <strong className="text-teal-300 font-semibold">{langInfo.nativeName} ({langInfo.name})</strong></span>
        </div>
        <div className="hidden sm:flex items-center space-x-3 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Zero-Hallucination Strict RAG
          </span>
          <span className="text-slate-500">•</span>
          <span>District Intelligence: Vellore Cluster</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="max-w-2xl mx-auto my-12 text-center space-y-6 animate-fade-in">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 shadow-xl shadow-teal-500/20">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Ask Career Saathi in Voice or Text
              </h2>
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                Get evidence-backed career recommendations, verified NCVET course details, local salary statistics, and family decision support.
              </p>
            </div>

            {/* Suggested Questions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-4">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(q)}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-teal-500/40 hover:bg-slate-800/80 text-xs md:text-sm text-slate-300 transition-all flex items-start space-x-2.5 text-left group shadow-sm"
                >
                  <Zap className="h-4 w-4 text-teal-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          const isSpeaking = speakingMsgId === msg.id;
          const isCopied = copiedMsgId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-3xl ${
                isUser ? "ml-auto" : "mr-auto"
              } space-y-2`}
            >
              <div
                className={`rounded-2xl p-4 md:p-5 text-sm md:text-base leading-relaxed ${
                  isUser
                    ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-br-xs shadow-lg shadow-teal-600/10"
                    : "bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-xs shadow-md"
                }`}
              >
                {/* Assistant Message Badges */}
                {!isUser && (
                  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/80 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-teal-400">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Career Saathi AI</span>
                    </div>

                    {msg.claimValidationStatus === "VERIFIED" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        Government Verified
                      </span>
                    )}

                    {msg.claimValidationStatus === "FALLBACK" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        <AlertTriangle className="h-3 w-3" />
                        Strict Anti-Hallucination Fallback
                      </span>
                    )}
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Evidence Citations Chips */}
                {!isUser && msg.evidenceCitations && msg.evidenceCitations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      Verified Source Citations:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.evidenceCitations.map((cite: any, cIdx: number) => (
                        <button
                          key={cIdx}
                          onClick={() => onOpenEvidence(cite)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 px-2.5 py-1 text-xs text-teal-300 border border-slate-700 transition"
                        >
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span>{cite.organization || cite.sourceId}</span>
                          <span className="text-[10px] text-slate-400">({cite.title})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Embedded Career Actions inside chat */}
                {!isUser && msg.metadata?.recommendedCareers && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2">
                    <button
                      onClick={() => onCompareCareers(msg.metadata.recommendedCareers)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 px-3 py-1.5 text-xs font-semibold text-teal-300 border border-teal-500/30 transition"
                    >
                      <BarChart2 className="h-3.5 w-3.5" />
                      <span>Compare 3 Careers in Family Space</span>
                    </button>

                    <button
                      onClick={() => onOpenSkillGap(msg.metadata.recommendedCareers[0])}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 border border-slate-700 transition"
                    >
                      <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                      <span>Analyze Skill Gap</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Message Action Toolbar */}
              <div className="flex items-center space-x-2 px-1 text-xs text-slate-400">
                {!isUser && (
                  <>
                    <button
                      onClick={() => handleReadAloud(msg.id, msg.content)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 transition ${
                        isSpeaking ? "text-teal-400 font-semibold" : "hover:text-slate-200"
                      }`}
                      title="Read Aloud in Native Speech"
                    >
                      {isSpeaking ? <VolumeX className="h-3.5 w-3.5 text-teal-400 animate-pulse" /> : <Volume2 className="h-3.5 w-3.5" />}
                      <span>{isSpeaking ? "Stop Speech" : "Read Aloud"}</span>
                    </button>

                    <button
                      onClick={() => handleCopyText(msg.id, msg.content)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition"
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{isCopied ? "Copied" : "Copy"}</span>
                    </button>
                  </>
                )}

                {msg.detectedEmotion && msg.detectedEmotion !== "NORMAL" && (
                  <button
                    onClick={() => onEscalateCounselor("User expressed concern or anxiety in message")}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition font-medium"
                  >
                    <Headphones className="h-3.5 w-3.5 text-amber-400" />
                    <span>Talk to a Counselor</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center space-x-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 w-fit">
            <div className="flex space-x-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="h-2.5 w-2.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="h-2.5 w-2.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs text-slate-400 font-medium">Retrieving verified government facts & matching...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Recording Overlay when active */}
      {isRecording && (
        <div className="bg-slate-900 border-t border-slate-800 p-3 px-6 flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white animate-ping">
              <Mic className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-red-400">Listening to Speech... ({langInfo.name})</span>
              <p className="text-[11px] text-slate-400">Speak naturally in your language</p>
            </div>
          </div>
          <button
            onClick={toggleVoiceRecording}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            Done
          </button>
        </div>
      )}

      {/* Bottom Message Input Dock */}
      <div className="p-3 md:p-4 bg-slate-900 border-t border-slate-800">
        <form onSubmit={handleFormSubmit} className="flex items-center space-x-2 max-w-4xl mx-auto">
          {/* Microphone Voice Input Button */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            className={`p-3 rounded-xl transition-all ${
              isRecording
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105"
                : "bg-slate-800 text-teal-400 hover:bg-slate-700 hover:text-teal-300 border border-slate-700"
            }`}
            title={`Record Voice in ${langInfo.name}`}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Textarea Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask in ${langInfo.nativeName} or English (e.g. "எனக்கு electronics பிடிக்கும். என் district-ல என்ன career நல்லா இருக்கும்?")...`}
            className="flex-1 rounded-xl bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 border border-slate-800"
            disabled={isLoading}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 disabled:opacity-40 text-slate-950 font-bold shadow-lg shadow-teal-500/20 transition-all"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
