
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- 로컬 스토리지 키 ---
const STORAGE_KEYS = {
  MEMBERS: 'golf_zoo_members_v2',
  NOTICES: 'golf_zoo_notices_v2',
  FINANCES: 'golf_zoo_finances_v2',
  MEETINGS: 'golf_zoo_meetings_v2'
};

// --- 아이콘 컴포넌트 (SVG 인라인 사용으로 로딩 에러 방지) ---
const Icon = ({ name, size = 20 }: { name: string; size?: number }) => {
  const icons: Record<string, React.ReactNode> = {
    dashboard: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>,
    calendar: <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>,
    notice: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>,
    wallet: <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>,
    users: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>,
    plus: <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>,
    trash: <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>,
    refresh: <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>,
    x: <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>,
    magic: <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name] || <circle cx="12" cy="12" r="10" />}
    </svg>
  );
};

function App() {
  const [view, setView] = useState('DASHBOARD');
  const [members, setMembers] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [finances, setFinances] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [modal, setModal] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('data');
    if (sharedData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(sharedData)));
        if (confirm('새로운 데이터를 동기화하시겠습니까?')) {
          setMembers(decoded.members || []);
          setNotices(decoded.notices || []);
          setFinances(decoded.finances || []);
          setMeetings(decoded.meetings || []);
          window.history.replaceState({}, "", window.location.pathname);
        }
      } catch(e) { console.error("Sync Error"); }
    }
    const load = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
    setMembers(load(STORAGE_KEYS.MEMBERS));
    setNotices(load(STORAGE_KEYS.NOTICES));
    setFinances(load(STORAGE_KEYS.FINANCES));
    setMeetings(load(STORAGE_KEYS.MEETINGS));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
    localStorage.setItem(STORAGE_KEYS.FINANCES, JSON.stringify(finances));
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
  }, [members, notices, finances, meetings]);

  const totalBalance = useMemo(() => 
    finances.reduce((acc, curr) => curr.type === 'INCOME' ? acc + curr.amount : acc - curr.amount, 0)
  , [finances]);

  const handleShare = () => {
    const data = btoa(encodeURIComponent(JSON.stringify({members, notices, finances, meetings})));
    const url = `${window.location.origin}${window.location.pathname}?data=${data}`;
    navigator.clipboard.writeText(url).then(() => alert('동기화 링크가 복사되었습니다! 카톡에 붙여넣으세요.'));
  };

  const handleAiNotice = async (topic: string) => {
    if (!topic) return alert('주제를 입력하세요.');
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `골프 모임 '동물원'의 공지사항을 작성해줘. 주제: ${topic}. 제목과 본문을 명확히 구분해줘.`,
      });
      const text = response.text || "";
      const lines = text.split('\n');
      const title = lines[0].replace(/제목: |# /g, '') || "새 공지사항";
      const content = lines.slice(1).join('\n').trim();
      setNotices([{ id: Date.now().toString(), title, content, date: new Date().toISOString().split('T')[0] }, ...notices]);
      setModal(null);
    } catch (e) {
      alert('AI 작성 중 오류가 발생했습니다.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const Modal = ({ title, onClose, children }: any) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-xl text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 p-2"><Icon name="x" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-900">
      {/* 사이드바 (데스크탑 전용) */}
      <nav className="hidden lg:flex flex-col w-64 bg-white border-r p-8 sticky top-0 h-screen">
        <div className="flex items-center space-x-3 mb-12">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold italic shadow-lg">Z</div>
          <span className="text-xl font-bold tracking-tight">동물원 골프</span>
        </div>
        <div className="space-y-3 flex-1">
          {[
            { id: 'DASHBOARD', n: '홈', i: 'dashboard' },
            { id: 'ATTENDANCE', n: '참석체크', i: 'calendar' },
            { id: 'NOTICES', n: '공지사항', i: 'notice' },
            { id: 'FINANCES', n: '회비/정산', i: 'wallet' },
            { id: 'MEMBERS', n: '회원관리', i: 'users' },
          ].map(m => (
            <button key={m.id} onClick={() => setView(m.id)} className={`w-full flex items-center space-x-4 px-5 py-3 rounded-2xl font-bold transition-all ${view === m.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
              <Icon name={m.i} /> <span>{m.n}</span>
            </button>
          ))}
        </div>
        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
          <div className="text-[0.6rem] font-bold text-emerald-600 mb-1 uppercase tracking-widest">Balance</div>
          <div className="text-xl font-bold">{totalBalance.toLocaleString()}원</div>
        </div>
      </nav>

      {/* 모바일 하단바 */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 flex justify-around p-4 shadow-xl">
        {['DASHBOARD', 'ATTENDANCE', 'NOTICES', 'FINANCES', 'MEMBERS'].map((v, i) => (
          <button key={v} onClick={() => setView(v)} className={`p-3 transition-colors ${view === v ? 'text-emerald-600' : 'text-slate-300'}`}>
            <Icon name={['dashboard', 'calendar', 'notice', 'wallet', 'users'][i]} size={24} />
          </button>
        ))}
      </nav>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 p-6 lg:p-12 pb-24 max-w-5xl mx-auto w-full overflow-x-hidden">
        {view === 'DASHBOARD' && (
          <div className="space-y-10">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-5xl font-bold tracking-tighter text-slate-800">클럽 동물원</h1>
                <p className="text-slate-500 font-medium text-lg mt-2 italic">Zoo Golf Club Management</p>
              </div>
              <button onClick={handleShare} className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:scale-[1.02] transition-all">
                <Icon name="refresh" size={18}/>
                <span>전체 데이터 공유하기</span>
              </button>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">잔고</h3>
                <p className="text-3xl font-bold text-emerald-600">{totalBalance.toLocaleString()}원</p>
              </div>
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">회원</h3>
                <p className="text-3xl font-bold text-slate-800">{members.length}명</p>
              </div>
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">예정</h3>
                <p className="text-3xl font-bold text-slate-800 truncate">{meetings[0]?.location || '미정'}</p>
              </div>
            </div>
          </div>
        )}

        {view === 'ATTENDANCE' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-4xl font-bold tracking-tight">참석체크</h2>
              <button onClick={() => setModal('ADD_MEETING')} className="bg-emerald-600 text-white p-5 rounded-2xl shadow-xl hover:bg-emerald-700 transition-colors"><Icon name="plus" size={24}/></button>
            </div>
            {meetings.map(m => (
              <div key={m.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-6">
                <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
                  <div>
                    <div className="font-bold text-2xl text-slate-800">{m.location}</div>
                    <div className="text-slate-400 font-bold">{m.date}</div>
                  </div>
                  <button onClick={() => { if(confirm('삭제할까요?')) setMeetings(meetings.filter(x => x.id !== m.id)) }} className="text-slate-200 hover:text-red-500 transition-colors p-2"><Icon name="trash"/></button>
                </div>
                <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {members.map(mem => (
                    <div key={mem.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <span className="font-bold text-slate-700">{mem.name}</span>
                      <div className="flex bg-white p-1 rounded-xl shadow-inner border">
                        {['참석', '불참'].map(status => (
                          <button key={status} onClick={() => {
                            setMeetings(meetings.map(mt => mt.id === m.id ? { ...mt, attendance: { ...mt.attendance, [mem.id]: status } } : mt));
                          }} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${m.attendance?.[mem.id] === status ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-300'}`}>{status}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {members.length === 0 && <p className="col-span-full py-4 text-center text-slate-400 font-bold italic">먼저 회원을 등록해 주세요.</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'NOTICES' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-4xl font-bold tracking-tight">공지사항</h2>
              <div className="flex space-x-3">
                <button onClick={() => setModal('AI_NOTICE')} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl shadow-xl font-bold flex items-center space-x-2"><Icon name="magic" size={18}/><span>AI 작성</span></button>
                <button onClick={() => setModal('ADD_NOTICE')} className="bg-emerald-600 text-white p-4 rounded-2xl shadow-xl"><Icon name="plus" size={24}/></button>
              </div>
            </div>
            {notices.map(n => (
              <div key={n.id} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative group mb-6">
                <button onClick={() => { if(confirm('삭제할까요?')) setNotices(notices.filter(x => x.id !== n.id)) }} className="absolute top-10 right-10 text-slate-200 group-hover:text-red-500 transition-colors p-2"><Icon name="trash" size={20}/></button>
                <div className="text-emerald-600 text-xs font-bold mb-4 bg-emerald-50 inline-block px-3 py-1 rounded-full">{n.date}</div>
                <h3 className="text-3xl font-bold mb-6 text-slate-800">{n.title}</h3>
                <p className="text-slate-500 font-medium text-lg leading-relaxed whitespace-pre-wrap">{n.content}</p>
              </div>
            ))}
          </div>
        )}

        {view === 'FINANCES' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-4xl font-bold tracking-tight">회비/정산</h2>
              <button onClick={() => setModal('ADD_FINANCE')} className="bg-emerald-600 text-white p-5 rounded-2xl shadow-xl"><Icon name="plus" size={24}/></button>
            </div>
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400">
                  <tr><th className="p-8">내역</th><th className="p-8 text-right">금액</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {finances.map(f => (
                    <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-8">
                        <div className="text-xs font-bold text-slate-400 mb-1">{f.date}</div>
                        <div className="font-bold text-xl text-slate-800">{f.description}</div>
                      </td>
                      <td className={`p-8 text-right font-bold text-2xl ${f.type === 'INCOME' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {f.type === 'INCOME' ? '+' : '-'}{f.amount.toLocaleString()}원
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {finances.length === 0 && <div className="p-20 text-center text-slate-300 font-bold italic text-xl">데이터가 없습니다.</div>}
            </div>
          </div>
        )}

        {view === 'MEMBERS' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-4xl font-bold tracking-tight">회원 리스트</h2>
              <button onClick={() => setModal('ADD_MEMBER')} className="bg-emerald-600 text-white p-5 rounded-2xl shadow-xl"><Icon name="plus" size={24}/></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map(m => (
                <div key={m.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-5">
                    <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-emerald-50">{m.name[0]}</div>
                    <div>
                      <div className="font-bold text-xl text-slate-800">{m.name}</div>
                      <div className="text-xs font-bold text-emerald-600 uppercase">{m.role}</div>
                    </div>
                  </div>
                  <button onClick={() => { if(confirm('삭제할까요?')) setMembers(members.filter(x => x.id !== m.id)) }} className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-red-500 transition-all p-2"><Icon name="trash" size={22}/></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 모달 시스템 */}
      {modal === 'ADD_MEMBER' && (
        <Modal title="새 회원 등록" onClose={() => setModal(null)}>
          <form onSubmit={(e: any) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            setMembers([...members, { id: Date.now().toString(), name: fd.get('n'), role: fd.get('r') }]);
            setModal(null);
          }} className="space-y-4">
            <input name="n" placeholder="이름" required className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-emerald-600" />
            <select name="r" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none">
              <option value="회원">일반 회원</option><option value="총무">모임 총무</option><option value="회장">모임 회장</option>
            </select>
            <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold shadow-lg">회원 추가</button>
          </form>
        </Modal>
      )}

      {modal === 'ADD_MEETING' && (
        <Modal title="라운딩 일정" onClose={() => setModal(null)}>
          <form onSubmit={(e: any) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            setMeetings([{ id: Date.now().toString(), date: fd.get('d'), location: fd.get('l'), attendance: {} }, ...meetings]);
            setModal(null);
          }} className="space-y-4">
            <input name="d" type="date" required className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" />
            <input name="l" placeholder="골프장 명칭" required className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" />
            <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold shadow-lg">일정 등록</button>
          </form>
        </Modal>
      )}

      {modal === 'AI_NOTICE' && (
        <Modal title="AI 공지사항 생성" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <input id="ai_topic" placeholder="예: 4월 정기 라운딩 참여 독려" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-indigo-200 focus:border-indigo-600" />
            <button 
              disabled={isAiLoading}
              onClick={() => handleAiNotice((document.getElementById('ai_topic') as HTMLInputElement).value)} 
              className={`w-full ${isAiLoading ? 'bg-slate-300' : 'bg-indigo-600'} text-white py-5 rounded-2xl font-bold shadow-lg flex justify-center items-center space-x-2`}
            >
              {isAiLoading ? <span>작성 중...</span> : <><Icon name="magic" /><span>AI로 작성하기</span></>}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'ADD_FINANCE' && (
        <Modal title="회비/지출 추가" onClose={() => setModal(null)}>
          <form onSubmit={(e: any) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            setFinances([{ id: Date.now().toString(), date: fd.get('d'), description: fd.get('ds'), amount: Number(fd.get('a')), type: fd.get('t') }, ...finances]);
            setModal(null);
          }} className="space-y-4">
            <input name="d" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" />
            <input name="ds" placeholder="내역 설명" required className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" />
            <input name="a" type="number" placeholder="금액" required className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" />
            <div className="flex space-x-3">
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="t" value="INCOME" defaultChecked className="hidden peer" />
                <div className="p-4 text-center bg-slate-100 rounded-2xl peer-checked:bg-emerald-600 peer-checked:text-white font-bold transition-all">입금 (+)</div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="t" value="EXPENSE" className="hidden peer" />
                <div className="p-4 text-center bg-slate-100 rounded-2xl peer-checked:bg-red-500 peer-checked:text-white font-bold transition-all">지출 (-)</div>
              </label>
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold shadow-lg">정산 내역 추가</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
