
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Users, FileText, Wallet, LayoutDashboard, 
  Plus, Menu, X, Trash2, Info, RefreshCw, Copy, Check
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- 내부 타입 정의 (별도 파일 필요 없음) ---
const AttendanceStatus = {
  ATTENDING: '참석',
  ABSENT: '불참',
  PENDING: '미정'
} as const;

// --- ID 생성기 ---
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- 앱 컴포넌트 시작 ---
export default function App() {
  const [activeView, setActiveView] = useState('DASHBOARD');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 데이터 상태
  const [members, setMembers] = useState([]);
  const [notices, setNotices] = useState([]);
  const [finances, setFinances] = useState([]);
  const [meetings, setMeetings] = useState([]);
  
  const [modalType, setModalType] = useState(null);

  // 초기 데이터 로드 및 공유 링크 처리
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('data');

    if (sharedData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(sharedData)));
        if (decoded && confirm('공유받은 데이터가 있습니다. 현재 데이터를 덮어쓰고 동기화할까요?')) {
          setMembers(decoded.members || []);
          setNotices(decoded.notices || []);
          setFinances(decoded.finances || []);
          setMeetings(decoded.meetings || []);
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
      } catch (e) {
        console.error("데이터 복원 실패");
      }
    }

    // 로컬 스토리지 로드
    const load = (key, fallback) => {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    };
    
    setMembers(load('zoo_members', []));
    setNotices(load('zoo_notices', []));
    setFinances(load('zoo_finances', []));
    setMeetings(load('zoo_meetings', []));
  }, []);

  // 데이터 변경 시 자동 저장
  useEffect(() => { localStorage.setItem('zoo_members', JSON.stringify(members)); }, [members]);
  useEffect(() => { localStorage.setItem('zoo_notices', JSON.stringify(notices)); }, [notices]);
  useEffect(() => { localStorage.setItem('zoo_finances', JSON.stringify(finances)); }, [finances]);
  useEffect(() => { localStorage.setItem('zoo_meetings', JSON.stringify(meetings)); }, [meetings]);

  // 총 잔액 계산
  const totalBalance = useMemo(() => finances.reduce((acc, curr) => 
    curr.type === 'INCOME' ? acc + curr.amount : acc - curr.amount, 0
  ), [finances]);

  // 공유 링크 생성
  const shareDataLink = () => {
    try {
      const data = { members, notices, finances, meetings };
      const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
      const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encoded}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('동기화 링크가 복사되었습니다! 카톡방에 공유하세요.');
      });
    } catch (e) {
      alert('링크 생성 중 오류가 발생했습니다.');
    }
  };

  const deleteItem = (type, id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    if (type === 'MEMBERS') setMembers(members.filter(m => m.id !== id));
    if (type === 'NOTICES') setNotices(notices.filter(n => n.id !== id));
    if (type === 'FINANCES') setFinances(finances.filter(f => f.id !== id));
    if (type === 'ATTENDANCE') setMeetings(meetings.filter(m => m.id !== id));
  };

  const Modal = ({ title, children, onClose, onSave }) => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X size={24} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(new FormData(e.currentTarget)); }} className="p-6 space-y-4">
          {children}
          <div className="pt-4 flex space-x-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">취소</button>
            <button type="submit" className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg">저장</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 p-6 sticky top-0 h-screen">
        <div className="flex items-center space-x-3 mb-10 px-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl italic">Z</div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">동물원 골프</h1>
        </div>
        <nav className="space-y-2 flex-1">
          {[
            { id: 'DASHBOARD', label: '대시보드', icon: LayoutDashboard },
            { id: 'ATTENDANCE', label: '참석체크', icon: Calendar },
            { id: 'NOTICES', label: '공지사항', icon: FileText },
            { id: 'FINANCES', label: '회비내역', icon: Wallet },
            { id: 'MEMBERS', label: '회원관리', icon: Users }
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveView(item.id)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${activeView === item.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}>
              <item.icon size={20} />
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto p-4 bg-emerald-50 rounded-2xl text-center">
          <p className="text-xs text-emerald-700 font-bold mb-1 italic">Balance</p>
          <p className="text-xl font-black text-slate-900">{totalBalance.toLocaleString()}원</p>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2"><div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold italic">Z</div><h1 className="font-bold text-lg">동물원</h1></div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
             <nav className="space-y-4 pt-10">
                {['DASHBOARD', 'ATTENDANCE', 'NOTICES', 'FINANCES', 'MEMBERS'].map((id) => (
                  <button key={id} onClick={() => { setActiveView(id); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl font-bold ${activeView === id ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>
                    {id}
                  </button>
                ))}
             </nav>
          </div>
        </div>
      )}

      {/* Main View */}
      <main className="flex-1 p-4 lg:p-10 pt-24 lg:pt-10 max-w-7xl mx-auto w-full">
        {activeView === 'DASHBOARD' && (
          <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div><h2 className="text-4xl font-black text-slate-900">모임 현황</h2><p className="text-slate-500 font-medium">동물원 골프 모임의 최신 상태입니다.</p></div>
              <button onClick={shareDataLink} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 shadow-xl hover:bg-emerald-700 transition active:scale-95"><RefreshCw size={20} /><span>데이터 동기화 링크 생성</span></button>
            </header>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start space-x-4">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><Info size={24} /></div>
              <div className="text-sm text-slate-600">
                <p className="font-bold text-slate-900 mb-1">📢 데이터 공유 안내</p>
                총무님이 내용을 입력한 후 <b>[동기화 링크 생성]</b>을 눌러 카톡방에 보내주세요.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-400 text-xs mb-3 uppercase">다음 라운딩</h3>
                <p className="text-2xl font-black truncate">{meetings[0]?.date || '미정'}</p>
                <p className="text-sm text-slate-500 mt-1">{meetings[0]?.location || '일정 없음'}</p>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-400 text-xs mb-3 uppercase">최근 공지</h3>
                <p className="text-2xl font-black truncate">{notices[0]?.title || '공지 없음'}</p>
                <p className="text-sm text-slate-500 mt-1">{notices[0]?.date || '-'}</p>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-400 text-xs mb-3 uppercase">회비 잔액</h3>
                <p className="text-2xl font-black text-emerald-600">{totalBalance.toLocaleString()}원</p>
                <p className="text-sm text-slate-500 mt-1">안전하게 관리 중</p>
              </div>
            </div>
          </div>
        )}

        {activeView === 'ATTENDANCE' && (
          <div className="space-y-8 animate-fade-in">
            <header className="flex justify-between items-center"><h2 className="text-3xl font-black text-slate-900">참석체크</h2><button onClick={() => setModalType('ATTENDANCE')} className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg"><Plus size={24} /></button></header>
            <div className="grid gap-6">
              {meetings.map(m => (
                <div key={m.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <div><h3 className="text-xl font-black text-slate-800">{m.location}</h3><p className="text-slate-500 font-bold">{m.date}</p></div>
                    <button onClick={() => deleteItem('ATTENDANCE', m.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={20} /></button>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {members.map(member => (
                      <div key={member.id} className="flex justify-between items-center p-4 bg-slate-50/50 rounded-2xl">
                        <span className="font-bold text-slate-700">{member.name}</span>
                        <div className="flex bg-white p-1 rounded-xl shadow-inner">
                          {['참석', '불참'].map(s => (
                            <button key={s} onClick={() => {
                              setMeetings(meetings.map(meet => meet.id === m.id ? {...meet, attendance: {...meet.attendance, [member.id]: s}} : meet));
                            }} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${m.attendance[member.id] === s ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}>{s}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {meetings.length === 0 && <p className="text-center py-20 text-slate-400">등록된 일정이 없습니다.</p>}
            </div>
          </div>
        )}

        {activeView === 'NOTICES' && (
           <div className="space-y-8 animate-fade-in">
              <header className="flex justify-between items-center"><h2 className="text-3xl font-black text-slate-900">공지사항</h2><button onClick={() => setModalType('NOTICES')} className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg"><Plus size={24} /></button></header>
              <div className="grid gap-4">
                {notices.map(n => (
                  <div key={n.id} className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm group">
                    <div className="flex justify-between items-start mb-4"><span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{n.date}</span><button onClick={() => deleteItem('NOTICES', n.id)} className="text-slate-200 group-hover:text-red-500 transition"><Trash2 size={18} /></button></div>
                    <h3 className="text-2xl font-black text-slate-800 mb-3">{n.title}</h3>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                  </div>
                ))}
              </div>
           </div>
        )}

        {activeView === 'FINANCES' && (
          <div className="space-y-8 animate-fade-in">
            <header className="flex justify-between items-center"><h2 className="text-3xl font-black text-slate-900">회비내역</h2><button onClick={() => setModalType('FINANCES')} className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg"><Plus size={24} /></button></header>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-xs font-black uppercase"><tr className="border-b border-slate-100"><th className="px-6 py-5">날짜</th><th className="px-6 py-5">내역</th><th className="px-6 py-5 text-right">금액</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {finances.map(f => (
                    <tr key={f.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-sm font-bold text-slate-400">{f.date}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{f.description}</td>
                      <td className={`px-6 py-4 text-right font-black ${f.type === 'INCOME' ? 'text-emerald-600' : 'text-red-500'}`}>{f.type === 'INCOME' ? '+' : '-'}{f.amount.toLocaleString()}원</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'MEMBERS' && (
          <div className="space-y-8 animate-fade-in">
            <header className="flex justify-between items-center"><h2 className="text-3xl font-black text-slate-900">회원관리</h2><button onClick={() => setModalType('MEMBERS')} className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg"><Plus size={24} /></button></header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map(m => (
                <div key={m.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center group">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center font-black text-white">{m.name[0]}</div>
                    <div><h3 className="font-black text-slate-800">{m.name}</h3><p className="text-xs font-bold text-slate-400 uppercase">{m.role}</p></div>
                  </div>
                  <button onClick={() => deleteItem('MEMBERS', m.id)} className="text-slate-200 group-hover:text-red-500 transition"><Trash2 size={20} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {modalType === 'MEMBERS' && (
        <Modal title="회원 등록" onClose={() => setModalType(null)} onSave={(fd) => {
          setMembers([...members, { id: generateId(), name: fd.get('name'), role: fd.get('role'), phoneNumber: fd.get('phone') }]);
          setModalType(null);
        }}>
          <input name="name" placeholder="이름" required className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none font-bold" />
          <select name="role" className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none font-bold"><option value="회원">회원</option><option value="총무">총무</option><option value="회장">회장</option></select>
          <input name="phone" placeholder="연락처" className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none font-bold" />
        </Modal>
      )}

      {modalType === 'ATTENDANCE' && (
        <Modal title="일정 추가" onClose={() => setModalType(null)} onSave={(fd) => {
          setMeetings([{ id: generateId(), date: fd.get('date'), location: fd.get('location'), attendance: {} }, ...meetings]);
          setModalType(null);
        }}>
          <input name="date" type="date" required className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none font-bold" />
          <input name="location" placeholder="장소" required className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none font-bold" />
        </Modal>
      )}

      {modalType === 'NOTICES' && (
        <Modal title="공지사항 작성" onClose={() => setModalType(null)} onSave={(fd) => {
          setNotices([{ id: generateId(), title: fd.get('title'), content: fd.get('content'), date: new Date().toISOString().split('T')[0] }, ...notices]);
          setModalType(null);
        }}>
          <input name="title" placeholder="제목" required className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none font-bold" />
          <textarea name="content" placeholder="내용" required className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none h-40 font-bold" />
        </Modal>
      )}

      {modalType === 'FINANCES' && (
        <Modal title="회비 추가" onClose={() => setModalType(null)} onSave={(fd) => {
          setFinances([{ id: generateId(), date: fd.get('date'), description: fd.get('desc'), amount: Number(fd.get('amount')), type: fd.get('type') }, ...finances]);
          setModalType(null);
        }}>
          <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none font-bold" />
          <input name="desc" placeholder="내용" required className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none font-bold" />
          <input name="amount" type="number" placeholder="금액" required className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none font-bold" />
          <div className="flex space-x-2">
            <label className="flex-1"><input type="radio" name="type" value="INCOME" defaultChecked className="hidden peer" /><div className="p-4 text-center bg-slate-100 rounded-2xl peer-checked:bg-emerald-600 peer-checked:text-white font-black transition">입금 (+)</div></label>
            <label className="flex-1"><input type="radio" name="type" value="EXPENSE" className="hidden peer" /><div className="p-4 text-center bg-slate-100 rounded-2xl peer-checked:bg-red-500 peer-checked:text-white font-black transition">지출 (-)</div></label>
          </div>
        </Modal>
      )}
    </div>
  );
}
