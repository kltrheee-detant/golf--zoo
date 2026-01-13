
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// --- 아이콘 컴포넌트 (SVG 내장으로 외부 로딩 오류 방지) ---
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
    x: <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('data');
    if (sharedData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(sharedData)));
        if (confirm('새로운 데이터를 동기화할까요?')) {
          setMembers(decoded.members || []);
          setNotices(decoded.notices || []);
          setFinances(decoded.finances || []);
          setMeetings(decoded.meetings || []);
          window.history.replaceState({}, "", window.location.pathname);
        }
      } catch(e) { console.error("Sync Error", e); }
    }
    const load = (k: string) => JSON.parse(localStorage.getItem(k) || '[]');
    setMembers(load('zoo_m')); setNotices(load('zoo_n')); setFinances(load('zoo_f')); setMeetings(load('zoo_mt'));
  }, []);

  useEffect(() => {
    localStorage.setItem('zoo_m', JSON.stringify(members));
    localStorage.setItem('zoo_n', JSON.stringify(notices));
    localStorage.setItem('zoo_f', JSON.stringify(finances));
    localStorage.setItem('zoo_mt', JSON.stringify(meetings));
  }, [members, notices, finances, meetings]);

  const totalBalance = useMemo(() => finances.reduce((a, c) => c.type === 'INCOME' ? a + c.amount : a - c.amount, 0), [finances]);

  const share = () => {
    const data = btoa(encodeURIComponent(JSON.stringify({members, notices, finances, meetings})));
    const url = `${window.location.origin}${window.location.pathname}?data=${data}`;
    navigator.clipboard.writeText(url).then(() => alert('공유 링크가 복사되었습니다! 카톡방에 전달하세요.'));
  };

  const Modal = ({ title, onSave, children }: any) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b flex justify-between font-black text-xl bg-slate-50">
          {title}
          <button onClick={() => setModal(null)} className="text-slate-400 p-1"><Icon name="x" /></button>
        </div>
        <form onSubmit={(e: any) => { e.preventDefault(); onSave(new FormData(e.target)); setModal(null); }} className="p-6 space-y-4">
          {children}
          <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition-colors">저장하기</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 font-sans antialiased text-slate-900">
      {/* 사이드바 (데스크탑) */}
      <nav className="hidden lg:flex flex-col w-64 bg-white border-r p-8 sticky top-0 h-screen">
        <div className="flex items-center space-x-3 mb-10">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg shadow-emerald-100">Z</div>
          <span className="text-xl font-black tracking-tight">동물원 골프</span>
        </div>
        <div className="space-y-2 flex-1">
          {[
            {id:'DASHBOARD', n:'대시보드', i:'dashboard'},
            {id:'ATTENDANCE', n:'참석체크', i:'calendar'},
            {id:'NOTICES', n:'공지사항', i:'notice'},
            {id:'FINANCES', n:'회비내역', i:'wallet'},
            {id:'MEMBERS', n:'회원관리', i:'users'}
          ].map(m => (
            <button key={m.id} onClick={() => setView(m.id)} className={`w-full flex items-center space-x-4 px-4 py-3 rounded-2xl font-bold transition-all ${view === m.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
              <Icon name={m.i} /> <span>{m.n}</span>
            </button>
          ))}
        </div>
        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
          <div className="text-[0.6rem] font-black text-emerald-600 mb-1 uppercase tracking-widest">Available Balance</div>
          <div className="text-xl font-black">{totalBalance.toLocaleString()}원</div>
        </div>
      </nav>

      {/* 모바일 하단바 */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 flex justify-around p-4 shadow-xl">
        {['DASHBOARD', 'ATTENDANCE', 'NOTICES', 'FINANCES', 'MEMBERS'].map((v, i) => (
          <button key={v} onClick={() => setView(v)} className={view === v ? 'text-emerald-600' : 'text-slate-300'}>
            <Icon name={['dashboard', 'calendar', 'notice', 'wallet', 'users'][i]} />
          </button>
        ))}
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 p-6 lg:p-12 pb-24 max-w-5xl mx-auto w-full">
        {view === 'DASHBOARD' && (
          <div className="space-y-10">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div><h1 className="text-5xl font-black tracking-tighter text-slate-800">클럽 동물원</h1><p className="text-slate-500 font-bold text-lg">즐거운 라운딩을 위한 필수 동반자</p></div>
              <button onClick={share} className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-transform"><Icon name="refresh" size={18}/><span>전체 데이터 공유</span></button>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm"><h3 className="text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">모임 잔액</h3><p className="text-3xl font-black text-emerald-600">{totalBalance.toLocaleString()}원</p></div>
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm"><h3 className="text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">정회원</h3><p className="text-3xl font-black">{members.length}명</p></div>
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm"><h3 className="text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">다음 예정지</h3><p className="text-3xl font-black">{meetings[0]?.location || '미정'}</p></div>
            </div>
          </div>
        )}

        {view === 'ATTENDANCE' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center"><h2 className="text-4xl font-black">참석체크</h2><button onClick={()=>setModal('MT')} className="bg-emerald-600 text-white p-5 rounded-2xl shadow-xl hover:rotate-90 transition-transform"><Icon name="plus" size={24}/></button></div>
            {meetings.map(m => (
              <div key={m.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
                  <div><div className="font-black text-2xl text-slate-800">{m.location}</div><div className="text-slate-400 font-bold">{m.date}</div></div>
                  <button onClick={()=>{if(confirm('삭제?'))setMeetings(meetings.filter(i=>i.id!==m.id))}} className="text-slate-200 hover:text-red-500 p-2 transition-colors"><Icon name="trash"/></button>
                </div>
                <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {members.map(mem => (
                    <div key={mem.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <span className="font-black text-slate-700">{mem.name}</span>
                      <div className="flex bg-white p-1 rounded-xl shadow-inner">
                        {['참석', '불참'].map(s => (
                          <button key={s} onClick={() => {
                            setMeetings(meetings.map(mt => mt.id === m.id ? {...mt, attendance: {...mt.attendance, [mem.id]: s}} : mt));
                          }} className={`px-5 py-2 rounded-lg text-sm font-black transition-all ${m.attendance?.[mem.id] === s ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-300'}`}>{s}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {members.length === 0 && <p className="col-span-full text-center text-slate-400 py-4 font-bold">회원관리 탭에서 먼저 회원을 등록해주세요.</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'NOTICES' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center"><h2 className="text-4xl font-black">공지사항</h2><button onClick={()=>setModal('N')} className="bg-emerald-600 text-white p-5 rounded-2xl shadow-xl"><Icon name="plus" size={24}/></button></div>
            {notices.map(n => (
              <div key={n.id} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative group">
                <button onClick={()=>{if(confirm('삭제?'))setNotices(notices.filter(i=>i.id!==n.id))}} className="absolute top-10 right-10 text-slate-200 group-hover:text-red-500 transition-colors"><Icon name="trash" size={20}/></button>
                <div className="text-emerald-600 text-xs font-black mb-4 uppercase tracking-[0.2em] bg-emerald-50 inline-block px-3 py-1 rounded-full">{n.date}</div>
                <h3 className="text-3xl font-black mb-6 text-slate-800">{n.title}</h3>
                <p className="text-slate-500 font-medium text-lg leading-relaxed whitespace-pre-wrap">{n.content}</p>
              </div>
            ))}
          </div>
        )}

        {view === 'FINANCES' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center"><h2 className="text-4xl font-black">회비내역</h2><button onClick={()=>setModal('F')} className="bg-emerald-600 text-white p-5 rounded-2xl shadow-xl"><Icon name="plus" size={24}/></button></div>
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-xs font-black border-b border-slate-100"><tr className=""><th className="p-8">상세 내역</th><th className="p-8 text-right">금액</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {finances.map(f => (
                    <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-8">
                        <div className="text-xs font-bold text-slate-400 mb-1">{f.date}</div>
                        <div className="font-black text-xl text-slate-800">{f.description}</div>
                      </td>
                      <td className={`p-8 text-right font-black text-2xl ${f.type==='INCOME'?'text-emerald-600':'text-red-500'}`}>
                        {f.type==='INCOME'?'+':'-'}{f.amount.toLocaleString()}원
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {finances.length === 0 && <div className="p-20 text-center text-slate-300 font-black text-xl">기록된 내역이 없습니다.</div>}
            </div>
          </div>
        )}

        {view === 'MEMBERS' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center"><h2 className="text-4xl font-black">회원관리</h2><button onClick={()=>setModal('M')} className="bg-emerald-600 text-white p-5 rounded-2xl shadow-xl"><Icon name="plus" size={24}/></button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map(m => (
                <div key={m.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-5">
                    <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-100">{m.name[0]}</div>
                    <div><div className="font-black text-xl text-slate-800">{m.name}</div><div className="text-xs font-black text-emerald-600 uppercase tracking-widest">{m.role}</div></div>
                  </div>
                  <button onClick={()=>{if(confirm('삭제?'))setMembers(members.filter(i=>i.id!==m.id))}} className="text-slate-200 group-hover:text-red-500 transition-colors"><Icon name="trash" size={20}/></button>
                </div>
              ))}
              {members.length === 0 && <div className="col-span-full py-20 bg-slate-100 rounded-[2rem] border border-dashed border-slate-200 text-center text-slate-400 font-bold">등록된 회원이 없습니다.</div>}
            </div>
          </div>
        )}
      </main>

      {/* 모달 시스템 */}
      {modal === 'M' && (
        <Modal title="회원 등록" onSave={(fd: any) => setMembers([...members, {id:Date.now().toString(), name:fd.get('n'), role:fd.get('r')}])}>
          <input name="n" placeholder="이름" required className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-emerald-600 transition-all" />
          <select name="r" className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-emerald-600 transition-all">
            <option value="회원">일반 회원</option><option value="총무">모임 총무</option><option value="회장">모임 회장</option>
          </select>
        </Modal>
      )}
      {modal === 'N' && (
        <Modal title="공지사항 작성" onSave={(fd: any) => setNotices([{id:Date.now().toString(), title:fd.get('t'), content:fd.get('c'), date:new Date().toISOString().split('T')[0]}, ...notices])}>
          <input name="t" placeholder="공지 제목" required className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none" />
          <textarea name="c" placeholder="공지 내용" required className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none h-40" />
        </Modal>
      )}
      {modal === 'MT' && (
        <Modal title="라운딩 추가" onSave={(fd: any) => setMeetings([{id:Date.now().toString(), date:fd.get('d'), location:fd.get('l'), attendance:{}}, ...meetings])}>
          <input name="d" type="date" required className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none" />
          <input name="l" placeholder="골프장 위치" required className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none" />
        </Modal>
      )}
      {modal === 'F' && (
        <Modal title="회비 기록" onSave={(fd: any) => setFinances([{id:Date.now().toString(), date:fd.get('d'), description:fd.get('ds'), amount:Number(fd.get('a')), type:fd.get('t')}, ...finances])}>
          <input name="d" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none" />
          <input name="ds" placeholder="내역 설명" required className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none" />
          <input name="a" type="number" placeholder="금액" required className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none" />
          <div className="flex space-x-3">
            <label className="flex-1 cursor-pointer"><input type="radio" name="t" value="INCOME" defaultChecked className="hidden peer" /><div className="p-4 text-center bg-slate-100 rounded-2xl peer-checked:bg-emerald-600 peer-checked:text-white font-black transition-all">입금 (+)</div></label>
            <label className="flex-1 cursor-pointer"><input type="radio" name="t" value="EXPENSE" className="hidden peer" /><div className="p-4 text-center bg-slate-100 rounded-2xl peer-checked:bg-red-500 peer-checked:text-white font-black transition-all">지출 (-)</div></label>
          </div>
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
