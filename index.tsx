
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- 데이터 모델 ---
interface Member { id: string; name: string; role: string; }
interface Notice { id: string; title: string; content: string; date: string; }
interface Finance { id: string; date: string; desc: string; amount: number; type: 'IN' | 'OUT'; }
interface Meeting { id: string; date: string; location: string; attendance: Record<string, 'Y' | 'N'>; }

// --- 프리미엄 아이콘 세트 ---
const Icon = ({ name, className = "w-5 h-5" }: { name: string; className?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    home: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />,
    check: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    calendar: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />,
    notice: <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.448a13.435 13.435 0 01-1.492-4.225m9.9 4.47l.92.519c.542.305 1.229.13 1.568-.391a9.233 9.233 0 011.63-1.9c.474-.41.519-1.118.117-1.587l-.548-.641a5.27 5.27 0 00-3.087-1.424m-9.9-9.18c.253-.962.584-1.892.985-2.783.247-.55.06-1.21-.463-1.511l-.657-.38c-.551-.318-1.26-.117-1.527.448a13.453 13.453 0 01-1.492 4.225m9.9-4.47l.92-.519c.542-.305 1.229-.13 1.568.391a9.233 9.233 0 011.63 1.9c.474.41.519 1.118.117 1.587l-.548.641a5.27 5.27 0 00-3.087-1.424M10.34 15.84a43.59 43.59 0 005.82 0M10.34 8.16a43.59 43.59 0 005.82 0M15.84 8.16a4.5 4.5 0 010 9m0-9v9" />,
    wallet: <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />,
    users: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />,
    plus: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />,
    magic: <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />,
    share: <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />,
    trash: <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      {paths[name]}
    </svg>
  );
};

// --- 메인 앱 컴포넌트 ---
function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [members, setMembers] = useState<Member[]>(() => JSON.parse(localStorage.getItem('zoo_members_v4') || '[]'));
  const [notices, setNotices] = useState<Notice[]>(() => JSON.parse(localStorage.getItem('zoo_notices_v4') || '[]'));
  const [finances, setFinances] = useState<Finance[]>(() => JSON.parse(localStorage.getItem('zoo_finances_v4') || '[]'));
  const [meetings, setMeetings] = useState<Meeting[]>(() => JSON.parse(localStorage.getItem('zoo_meetings_v4') || '[]'));
  const [modal, setModal] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // 로컬 스토리지 동기화
  useEffect(() => {
    localStorage.setItem('zoo_members_v4', JSON.stringify(members));
    localStorage.setItem('zoo_notices_v4', JSON.stringify(notices));
    localStorage.setItem('zoo_finances_v4', JSON.stringify(finances));
    localStorage.setItem('zoo_meetings_v4', JSON.stringify(meetings));
  }, [members, notices, finances, meetings]);

  const totalBalance = useMemo(() => 
    finances.reduce((acc, cur) => cur.type === 'IN' ? acc + cur.amount : acc - cur.amount, 0),
  [finances]);

  const handleAiNotice = async (topic: string) => {
    if (!topic) return;
    setIsAiProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `골프 모임 '동물원'의 공지사항을 정중하고 격조 있게 작성해줘. 주제: ${topic}. 제목과 본문을 나누어줘.`,
      });
      const text = res.text || '';
      const parts = text.split('\n');
      const title = parts[0].replace(/제목: |# /g, '') || "새로운 소식";
      const content = parts.slice(1).join('\n').trim();
      setNotices([{ id: Date.now().toString(), title, content, date: new Date().toLocaleDateString() }, ...notices]);
      setModal(null);
    } catch (e) {
      alert('AI 작성 실패. API 키 또는 네트워크를 확인하세요.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const NavItem = ({ id, icon, label }: { id: string, icon: string, label: string }) => (
    <button onClick={() => setActiveTab(id)} className={`flex flex-col items-center justify-center flex-1 transition-all duration-300 ${activeTab === id ? 'text-emerald-700' : 'text-slate-400'}`}>
      <div className={`p-2 rounded-2xl transition-all ${activeTab === id ? 'bg-emerald-50' : ''}`}>
        <Icon name={icon} className="w-6 h-6" />
      </div>
      <span className="text-[10px] font-bold mt-1 tracking-tight">{label}</span>
    </button>
  );

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative flex flex-col shadow-2xl overflow-hidden">
      {/* 프리미엄 헤더 */}
      <header className="px-8 pt-12 pb-6 glass sticky top-0 z-50 border-b border-slate-50 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 leading-none">ZOO GOLF</h1>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Live Club Manager</span>
          </div>
        </div>
        <button onClick={() => {
          const data = btoa(encodeURIComponent(JSON.stringify({ m: members, n: notices, f: finances, mt: meetings })));
          navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?data=${data}`);
          alert('공유 링크가 복사되었습니다. 카톡에 전달하세요.');
        }} className="p-3 bg-slate-50 rounded-2xl text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100">
          <Icon name="share" className="w-5 h-5" />
        </button>
      </header>

      {/* 메인 뷰포트 */}
      <main className="flex-1 overflow-y-auto px-6 pb-32 pt-4">
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 자산 관리 카드 */}
            <div className="golf-gradient p-10 rounded-[3rem] text-white shadow-2xl shadow-emerald-200/50 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150"></div>
              <div className="relative z-10">
                <span className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">Total Club Asset</span>
                <div className="text-4xl font-black mt-2 tracking-tight">₩{totalBalance.toLocaleString()}</div>
                <div className="mt-10 pt-6 border-t border-white/10 flex justify-between items-end">
                  <div>
                    <div className="text-[10px] opacity-60 font-bold uppercase">Members</div>
                    <div className="text-xl font-bold">{members.length}명</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] opacity-60 font-bold uppercase">Next Round</div>
                    <div className="text-xl font-bold">{meetings[0]?.location || 'TBD'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 빠른 접근 뉴스 */}
            <section className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2">최신 공지</h3>
              {notices.length > 0 ? (
                <div className="premium-card bg-white p-6 rounded-[2.5rem] hover:bg-slate-50 transition-colors">
                  <div className="text-[10px] font-bold text-emerald-600 mb-2">{notices[0].date}</div>
                  <div className="font-bold text-slate-800 text-lg mb-2 truncate">{notices[0].title}</div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{notices[0].content}</p>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-300 font-bold italic text-sm">등록된 공지가 없습니다.</div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'check' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-400">
            <div className="flex justify-between items-end px-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">참석 체크</h2>
              <button onClick={() => setModal('add_mt')} className="bg-emerald-600 text-white p-4 rounded-2xl shadow-xl shadow-emerald-100 hover:scale-105 active:scale-95 transition-all"><Icon name="plus"/></button>
            </div>
            {meetings.map(m => (
              <div key={m.id} className="premium-card bg-white rounded-[2.5rem] overflow-hidden">
                <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <div className="font-black text-slate-800 text-lg">{m.location}</div>
                    <div className="text-[10px] font-bold text-slate-400">{m.date}</div>
                  </div>
                  <button onClick={() => setMeetings(meetings.filter(x => x.id !== m.id))} className="text-slate-300 hover:text-red-500 transition-colors"><Icon name="trash" className="w-5 h-5"/></button>
                </div>
                <div className="p-6 grid grid-cols-2 gap-3">
                  {members.map(mem => (
                    <button 
                      key={mem.id}
                      onClick={() => {
                        const newMt = meetings.map(mt => mt.id === m.id ? { ...mt, attendance: { ...mt.attendance, [mem.id]: (mt.attendance[mem.id] === 'Y' ? 'N' : 'Y') as 'Y' | 'N' } } : mt);
                        setMeetings(newMt);
                      }}
                      className={`flex flex-col items-center justify-center p-4 rounded-[1.5rem] border transition-all duration-300 ${m.attendance[mem.id] === 'Y' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}
                    >
                      <span className="text-sm font-black">{mem.name}</span>
                      <span className="text-[9px] font-bold mt-1 opacity-70">{m.attendance[mem.id] === 'Y' ? '참석' : '미정'}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'notice' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-400">
            <div className="flex justify-between items-end px-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">공지사항</h2>
              <div className="flex gap-2">
                <button onClick={() => setModal('ai_n')} className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 hover:bg-black transition-all"><Icon name="magic" className="w-4 h-4"/> AI 작성</button>
                <button onClick={() => setModal('add_n')} className="bg-emerald-600 text-white p-3 rounded-2xl shadow-xl transition-all"><Icon name="plus"/></button>
              </div>
            </div>
            {notices.map(n => (
              <div key={n.id} className="premium-card bg-white p-8 rounded-[2.5rem] relative group hover:shadow-md transition-all">
                <div className="text-[9px] font-black text-emerald-600 mb-3 bg-emerald-50 inline-block px-3 py-1 rounded-full">{n.date}</div>
                <h3 className="text-xl font-black text-slate-800 mb-4 leading-tight">{n.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                <button onClick={() => setNotices(notices.filter(x => x.id !== n.id))} className="absolute top-8 right-8 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Icon name="trash" className="w-5 h-5"/></button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-400">
             <div className="flex justify-between items-end px-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">회비/정산</h2>
              <button onClick={() => setModal('add_f')} className="bg-emerald-600 text-white p-3 rounded-2xl shadow-lg transition-all"><Icon name="plus"/></button>
            </div>
            <div className="premium-card bg-white rounded-[2.5rem] overflow-hidden divide-y divide-slate-50">
                {finances.map(f => (
                    <div key={f.id} className="p-6 flex justify-between items-center group hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${f.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {f.type === 'IN' ? 'IN' : 'OUT'}
                            </div>
                            <div>
                                <div className="font-bold text-slate-800 leading-none mb-1.5">{f.desc}</div>
                                <div className="text-[10px] font-bold text-slate-300">{f.date}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className={`text-xl font-black ${f.type === 'IN' ? 'text-emerald-600' : 'text-red-500'}`}>
                                {f.type === 'IN' ? '+' : '-'}{f.amount.toLocaleString()}
                            </div>
                            <button onClick={() => setFinances(finances.filter(x => x.id !== f.id))} className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-red-400 transition-all"><Icon name="trash" className="w-4 h-4"/></button>
                        </div>
                    </div>
                ))}
                {finances.length === 0 && <div className="p-12 text-center text-slate-300 font-bold italic">정산 내역이 없습니다.</div>}
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-400">
             <div className="flex justify-between items-end px-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">회원 목록</h2>
              <button onClick={() => setModal('add_m')} className="bg-emerald-600 text-white p-3 rounded-2xl shadow-lg transition-all"><Icon name="plus"/></button>
            </div>
            <div className="grid grid-cols-1 gap-3">
                {members.map(m => (
                    <div key={m.id} className="bg-white p-5 rounded-[1.5rem] flex items-center justify-between group premium-card hover:bg-emerald-50 transition-colors">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-emerald-600 font-black text-2xl shadow-inner group-hover:bg-white">{m.name[0]}</div>
                            <div>
                                <div className="font-black text-slate-800 text-lg leading-none mb-1">{m.name}</div>
                                <div className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase">{m.role}</div>
                            </div>
                        </div>
                        <button onClick={() => setMembers(members.filter(x => x.id !== m.id))} className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-red-400 transition-all"><Icon name="trash" className="w-5 h-5"/></button>
                    </div>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* 하단 고정 메뉴 */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-24 bg-white/90 border-t border-slate-100 glass z-50 flex items-center safe-bottom px-4 rounded-t-[2.5rem] shadow-[0_-15px_30px_rgba(0,0,0,0.02)]">
        <NavItem id="home" icon="home" label="홈" />
        <NavItem id="check" icon="check" label="참석" />
        <NavItem id="notice" icon="notice" label="공지" />
        <NavItem id="wallet" icon="wallet" label="회비" />
        <NavItem id="members" icon="회원" label="회원" />
      </nav>

      {/* 모달 관리 */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-t-[3.5rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20 duration-500">
            <div className="p-10 pb-4 flex justify-between items-center">
              <h4 className="text-2xl font-black text-slate-900 tracking-tighter">상세 정보</h4>
              <button onClick={() => setModal(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all"><Icon name="plus" className="w-6 h-6 rotate-45"/></button>
            </div>
            <form onSubmit={(e: any) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              if (modal === 'add_m') setMembers([...members, { id: Date.now().toString(), name: fd.get('n') as string, role: fd.get('r') as string }]);
              if (modal === 'add_mt') setMeetings([{ id: Date.now().toString(), date: fd.get('d') as string, location: fd.get('l') as string, attendance: {} }, ...meetings]);
              if (modal === 'add_f') setFinances([{ id: Date.now().toString(), date: fd.get('d') as string, desc: fd.get('ds') as string, amount: Number(fd.get('a')), type: fd.get('t') as any }, ...finances]);
              if (modal === 'add_n') setNotices([{ id: Date.now().toString(), title: fd.get('t') as string, content: fd.get('c') as string, date: new Date().toLocaleDateString() }, ...notices]);
              setModal(null);
            }} className="p-10 space-y-5">
              {modal === 'add_m' && (
                <><input name="n" placeholder="성함" required className="w-full p-5 bg-slate-50 rounded-[1.5rem] font-bold outline-none border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all"/><select name="r" className="w-full p-5 bg-slate-50 rounded-[1.5rem] font-bold outline-none"><option value="일반회원">일반회원</option><option value="총무">총무</option><option value="회장">회장</option></select></>
              )}
              {modal === 'add_mt' && (
                <><input name="d" type="date" required className="w-full p-5 bg-slate-50 rounded-[1.5rem] font-bold outline-none"/><input name="l" placeholder="골프장 이름" required className="w-full p-5 bg-slate-50 rounded-[1.5rem] font-bold outline-none"/></>
              )}
              {modal === 'add_f' && (
                <><input name="d" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full p-5 bg-slate-50 rounded-[1.5rem] font-bold outline-none"/><input name="ds" placeholder="정산 내역" required className="w-full p-5 bg-slate-50 rounded-[1.5rem] font-bold outline-none"/><input name="a" type="number" placeholder="금액" required className="w-full p-5 bg-slate-50 rounded-[1.5rem] font-bold outline-none"/><div className="flex gap-2"><label className="flex-1 cursor-pointer"><input type="radio" name="t" value="IN" defaultChecked className="hidden peer"/><div className="p-4 text-center bg-slate-50 rounded-2xl font-black peer-checked:bg-emerald-600 peer-checked:text-white transition-all text-xs">입금 (+)</div></label><label className="flex-1 cursor-pointer"><input type="radio" name="t" value="OUT" className="hidden peer"/><div className="p-4 text-center bg-slate-50 rounded-2xl font-black peer-checked:bg-red-500 peer-checked:text-white transition-all text-xs">지출 (-)</div></label></div></>
              )}
              {modal === 'add_n' && (
                <><input name="t" placeholder="제목" required className="w-full p-5 bg-slate-50 rounded-[1.5rem] font-bold outline-none"/><textarea name="c" placeholder="내용" required className="w-full p-5 bg-slate-50 rounded-[1.5rem] font-bold h-40 outline-none"/></>
              )}
              {modal === 'ai_n' && (
                <div className="space-y-4">
                    <input id="ai_topic_v" placeholder="주제 (예: 월례회 참여 독려)" className="w-full p-5 bg-slate-50 rounded-[1.5rem] font-bold outline-none border-2 border-emerald-100 focus:border-emerald-600 focus:bg-white transition-all"/>
                    <button type="button" onClick={() => handleAiNotice((document.getElementById('ai_topic_v') as HTMLInputElement).value)} disabled={isAiProcessing} className={`w-full p-6 rounded-[1.5rem] font-black shadow-xl flex items-center justify-center gap-3 transition-all ${isAiProcessing ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white hover:bg-black shadow-emerald-100'}`}>
                        {isAiProcessing ? '생성 중...' : <><Icon name="magic"/> AI로 작성하기</>}
                    </button>
                </div>
              )}
              {modal !== 'ai_n' && <button type="submit" className="w-full bg-emerald-600 text-white py-6 rounded-[1.5rem] font-black shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition-all transform active:scale-95">저장하기</button>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// 렌더링
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
