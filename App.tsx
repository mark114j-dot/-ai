
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Role, Message, ChatThread } from './types';
import { geminiService } from './services/geminiService';
import { PlusIcon, SidebarIcon, SendIcon, TrashIcon, UserIcon, BotIcon } from './components/Icons';

const DOMAINS = ["科技", "金融", "醫學", "法律", "工程", "藝術", "戰略"];

const App: React.FC = () => {
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    const saved = localStorage.getItem('omni_core_threads');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find(t => t.id === activeThreadId) || null;

  useEffect(() => {
    localStorage.setItem('omni_core_threads', JSON.stringify(threads));
  }, [threads]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeThread?.messages, isTyping, scrollToBottom]);

  const createNewThread = () => {
    const newThread: ChatThread = {
      id: Date.now().toString(),
      title: '新智力序列 ' + new Date().toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      messages: [],
      updatedAt: Date.now()
    };
    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
  };

  const deleteThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreads(prev => prev.filter(t => t.id !== id));
    if (activeThreadId === id) setActiveThreadId(null);
  };

  const handleSend = async (customPrompt?: string) => {
    const messageContent = customPrompt || input;
    if (!messageContent.trim() || isTyping) return;

    let currentThreadId = activeThreadId;
    if (!currentThreadId) {
      const newThread: ChatThread = {
        id: Date.now().toString(),
        title: messageContent.slice(0, 20),
        messages: [],
        updatedAt: Date.now()
      };
      setThreads(prev => [newThread, ...prev]);
      currentThreadId = newThread.id;
      setActiveThreadId(currentThreadId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: messageContent,
      timestamp: Date.now()
    };

    const botMessageId = (Date.now() + 1).toString();
    const botMessage: Message = {
      id: botMessageId,
      role: Role.MODEL,
      content: '',
      timestamp: Date.now()
    };

    setThreads(prev => prev.map(t => {
      if (t.id === currentThreadId) {
        return { ...t, messages: [...t.messages, userMessage, botMessage], updatedAt: Date.now() };
      }
      return t;
    }));

    if (!customPrompt) setInput('');
    setIsTyping(true);

    try {
      const streamer = geminiService.streamChat(activeThread?.messages || [], messageContent);
      let fullContent = '';

      for await (const chunk of streamer) {
        fullContent += chunk;
        setThreads(prev => prev.map(t => {
          if (t.id === currentThreadId) {
            return {
              ...t,
              messages: t.messages.map(m => m.id === botMessageId ? { ...m, content: fullContent } : m)
            };
          }
          return t;
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/^### (.*$)/gim, '<h3 class="font-bold text-slate-100 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-teal-400 font-black uppercase tracking-widest mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-white font-extrabold text-2xl mb-4">$1</h1>')
      .replace(/^\> (.*$)/gim, '<blockquote class="border-l-2 border-indigo-500 pl-4 italic text-slate-400 my-4">$1</blockquote>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="text-indigo-300">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="text-slate-500">$1</em>')
      .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      .replace(/\n/gim, '<br />');
  };

  return (
    <div className="flex h-screen bg-[#050505] text-slate-100 overflow-hidden font-sans">
      
      {/* 側邊欄 - 精緻毛玻璃 */}
      <aside className={`
        ${isSidebarOpen ? 'w-72' : 'w-0'} 
        glass-panel flex-shrink-0 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4, 0, 0.2, 1)] z-50
      `}>
        <div className="p-6">
          <button 
            onClick={createNewThread}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-semibold tracking-wide"
          >
            <PlusIcon className="w-4 h-4 text-indigo-400" />
            啟動新序列
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-3 mb-4">歷史智慧軌跡</p>
          {threads.map(thread => (
            <div
              key={thread.id}
              onClick={() => setActiveThreadId(thread.id)}
              className={`
                group flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all
                ${activeThreadId === thread.id 
                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'}
              `}
            >
              <div className="flex items-center gap-3 truncate">
                <div className={`w-1.5 h-1.5 rounded-full ${activeThreadId === thread.id ? 'bg-indigo-400 shadow-[0_0_8px_#818cf8]' : 'bg-slate-800'}`} />
                <span className="truncate text-xs font-medium">{thread.title}</span>
              </div>
              <button 
                onClick={(e) => deleteThread(thread.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-all"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">核心引擎狀態</p>
            <div className="grid grid-cols-2 gap-2">
              {DOMAINS.map(d => (
                <div key={d} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-teal-500/50" />
                  <span className="text-[9px] font-bold text-slate-500">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* 主介面 */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* 精緻頂欄 */}
        <header className="h-20 border-b border-white/5 flex items-center px-8 justify-between bg-black/20 backdrop-blur-xl z-40">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2.5 hover:bg-white/5 rounded-xl transition-all text-slate-500 hover:text-slate-200"
            >
              <SidebarIcon className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                 <h1 className="font-bold text-sm tracking-[0.2em] text-white uppercase">Omni-Core</h1>
                 <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-teal-500/20 text-teal-400 border border-teal-500/30">FLASH_SPEED</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide">極速引擎模式 // 延遲最低化</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
               <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">反應延遲</span>
               <span className="text-[10px] font-bold text-teal-500">OPTIMIZED</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative">
               <div className={`w-2.5 h-2.5 rounded-full ${isTyping ? 'bg-teal-500 animate-ping' : 'bg-teal-500 shadow-[0_0_10px_#14b8a6]'}`} />
            </div>
          </div>
        </header>

        {/* 對話區 */}
        <div className="flex-1 overflow-y-auto px-6 md:px-20 lg:px-32 py-10 space-y-12 custom-scroll">
          {activeThread && activeThread.messages.length > 0 ? (
            <>
              {activeThread.messages.map((msg, idx) => (
                <div key={msg.id} className={`flex w-full ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-6 max-w-[95%] md:max-w-[85%] ${msg.role === Role.USER ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="flex-shrink-0 mt-1">
                      <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center transition-all border
                        ${msg.role === Role.USER ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}
                      `}>
                        {msg.role === Role.USER ? <UserIcon className="w-5 h-5" /> : <BotIcon className="w-5 h-5" />}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className={`text-[10px] font-bold uppercase tracking-widest text-slate-600 ${msg.role === Role.USER ? 'text-right' : 'text-left'}`}>
                        {msg.role === Role.USER ? '指令輸入員' : '智力合成結果'}
                      </div>
                      <div className={`
                        p-6 md:p-8 rounded-[1.75rem] leading-relaxed text-[15.5px] border transition-all
                        ${msg.role === Role.USER 
                          ? 'bg-[#111] border-white/5 text-white shadow-lg' 
                          : 'bg-transparent border-transparent text-slate-300'}
                      `}>
                        <div 
                          className="prose-omega"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content || (isTyping && idx === activeThread.messages.length - 1 ? '<span class="text-teal-500 italic font-mono text-sm tracking-widest animate-pulse">正在解析現實結構...</span>' : '')) }}
                        />
                      </div>
                      
                      {msg.role === Role.MODEL && !isTyping && idx === activeThread.messages.length - 1 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {["深層模擬", "風險重定向", "創新路徑"].map((chip) => (
                            <button 
                              key={chip}
                              onClick={() => handleSend(chip)}
                              className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg bg-white/5 border border-white/5 hover:bg-indigo-500/20 hover:border-indigo-500/30 text-slate-500 hover:text-indigo-300 transition-all"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-12 py-20">
              <div className="relative float-animation">
                <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-20"></div>
                <div className="relative w-32 h-32 glass-panel rounded-3xl flex items-center justify-center shadow-2xl">
                   <BotIcon className="w-14 h-14 text-indigo-400" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">Omni <span className="text-indigo-500">Core</span></h2>
                <p className="text-slate-500 max-w-lg mx-auto text-base font-medium leading-relaxed">
                  文明級全域智慧核心已初始化。數據維度已對齊。<br />
                  請下達您的核心目標。
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                {[
                  "建構 5 年期職涯發展戰略",
                  "診斷當前資產配置的結構性風險",
                  "模擬科技突破對個人產業的衝擊",
                  "設計一套跨領域的邏輯思考框架"
                ].map((prompt, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="p-5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-left transition-all group"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-indigo-300 transition-colors">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 指令終端 - 懸浮感設計 */}
        <div className="px-6 md:px-20 lg:px-40 pb-12 pt-6">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-teal-500 rounded-[2rem] blur opacity-10 group-focus-within:opacity-25 transition-all duration-500"></div>
            <div className="relative glass-panel rounded-[2rem] p-3 flex items-end gap-3 transition-all focus-within:shadow-[0_0_50px_rgba(99,102,241,0.15)]">
              <div className="p-3.5 mb-1 text-slate-600">
                 <div className="w-5 h-5 flex items-center justify-center border border-current rounded font-mono text-[9px] font-black">Ω</div>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="輸入全域指令..."
                className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-64 py-4 px-1 text-[16px] outline-none font-medium placeholder-slate-700 text-slate-200"
                rows={1}
                style={{ height: 'auto', minHeight: '48px' }}
                ref={(el) => {
                  if (el) {
                    el.style.height = 'auto';
                    el.style.height = `${el.scrollHeight}px`;
                  }
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className={`
                  p-4 rounded-2xl transition-all flex-shrink-0 mb-1 shadow-xl
                  ${input.trim() && !isTyping 
                    ? 'bg-indigo-600 text-white hover:scale-105 active:scale-95' 
                    : 'bg-white/5 text-slate-700 cursor-not-allowed'}
                `}
              >
                <SendIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-between items-center px-8 mt-4">
               <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                 <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">極速通道已同步</span>
               </div>
               <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">Flash Engine Active</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
