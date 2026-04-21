import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Bot, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AITutor() {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const isConnectedRef = useRef(false);
  const isMutedRef = useRef(false);
  
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);
  
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);

  const playNext = () => {
    if (audioQueueRef.current.length === 0 || !audioContextRef.current) {
      isPlayingRef.current = false;
      return;
    }
    isPlayingRef.current = true;
    const buffer = audioQueueRef.current.shift()!;
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 1.25; 
    source.connect(audioContextRef.current.destination);
    source.onended = playNext;
    source.start();
  };

  const cleanup = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  };

  const connect = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
          systemInstruction: "You are Academia AI Tutor, a helpful academic assistant. You help students and faculty understand their data, risk scores, and roadmaps. You speak quickly, concisely, and encouragingly. You have a friendly girl's voice. Answer questions based on the academic context provided. If the user asks about their risk, explain the factors (CGPA, Attendance, etc.) and suggest roadmap steps. Be proactive and supportive.",
        },
        callbacks: {
          onopen: async () => {
            setIsConnected(true);
            setIsConnecting(false);
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const source = audioCtx.createMediaStreamSource(stream);
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
              if (isMutedRef.current || !isConnectedRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                let s = Math.max(-1, Math.min(1, inputData[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              const bytes = new Uint8Array(pcm16.buffer);
              let binary = '';
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64 = btoa(binary);
              
              sessionPromise.then((session: any) => {
                session.sendRealtimeInput({
                  audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
            
            source.connect(processor);
            processor.connect(audioCtx.destination);

            const activeScreen = document.querySelector('.screen.active');
            if (activeScreen) {
              const text = (activeScreen as HTMLElement).innerText.substring(0, 2000);
              sessionPromise.then((session: any) => {
                session.sendRealtimeInput({
                  text: `The user is currently looking at this screen content:\n${text}`
                });
              });
            }
          },
          onmessage: (message: LiveServerMessage) => {
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                const base64Audio = part.inlineData?.data;
                if (base64Audio && audioContextRef.current) {
                  const binary = atob(base64Audio);
                  const bytes = new Uint8Array(binary.length);
                  for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                  }
                  const pcmData = new Int16Array(bytes.buffer);
                  const audioBuffer = audioContextRef.current.createBuffer(1, pcmData.length, 24000);
                  const channelData = audioBuffer.getChannelData(0);
                  for (let i = 0; i < pcmData.length; i++) {
                    channelData[i] = pcmData[i] / 32768.0;
                  }
                  
                  audioQueueRef.current.push(audioBuffer);
                  if (!isPlayingRef.current) {
                    playNext();
                  }
                }
              }
            }
            
            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
            }
          },
          onclose: () => {
            setIsConnected(false);
            setIsConnecting(false);
            cleanup();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setIsConnected(false);
            setIsConnecting(false);
            cleanup();
          }
        }
      });
      
      sessionRef.current = sessionPromise;
      
    } catch (err) {
      console.error("Failed to connect:", err);
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (sessionRef.current) {
      sessionRef.current.then((s: any) => s.close());
    }
    setIsConnected(false);
    cleanup();
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[10000] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4 mb-4 w-72 shadow-2xl shadow-red-900/20"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[#e8e8e8] font-medium flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#cc1f1f]" />
                AI Tutor
              </h3>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-[#a0a0a0] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="text-sm text-[#a0a0a0] mb-4 leading-relaxed">
              {isConnected 
                ? "I'm listening! Ask me anything about your academic dashboard." 
                : isConnecting 
                  ? "Connecting to AI Tutor..." 
                  : "Connect to start a real-time voice conversation with your AI tutor."}
            </div>
            
            <div className="flex gap-2">
              {!isConnected ? (
                <button 
                  onClick={connect}
                  disabled={isConnecting}
                  className="flex-1 bg-[#cc1f1f] hover:bg-[#e02020] disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_20px_rgba(204,31,31,0.18)] flex items-center justify-center gap-2"
                >
                  {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isConnecting ? "Connecting..." : "Connect"}
                </button>
              ) : (
                <>
                  <button 
                    onClick={disconnect}
                    className="flex-1 bg-[#242424] hover:bg-[#2a2a2a] text-white py-2 rounded-lg text-sm font-medium transition-colors border border-[#333]"
                  >
                    Disconnect
                  </button>
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2 rounded-lg transition-colors border ${isMuted ? 'bg-[rgba(204,31,31,0.15)] text-[#cc1f1f] border-[rgba(204,31,31,0.3)]' : 'bg-[#242424] text-white hover:bg-[#2a2a2a] border-[#333]'}`}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${isConnected ? 'bg-[#cc1f1f] shadow-[0_0_30px_rgba(204,31,31,0.4)]' : 'bg-[#1c1c1c] border border-[#333]'}`}
      >
        <Bot className={`w-7 h-7 ${isConnected ? 'text-white' : 'text-[#cc1f1f]'}`} />
        {isConnected && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#080808] animate-pulse" />
        )}
      </motion.button>
    </div>
  );
}
