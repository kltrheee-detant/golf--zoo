
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  FileText, 
  Wallet, 
  LayoutDashboard, 
  Plus, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Menu, 
  X, 
  Sparkles, 
  Trash2, 
  Share2, 
  Copy, 
  Info,
  RefreshCw
} from 'lucide-react';
import { ViewType, Member, Meeting, Notice, FinancialRecord, AttendanceStatus } from './types';
import { geminiService } from './services/geminiService';

const generateId = () => Math.random().toString(36).substr(2, 9);

// UTF-8 안전한 Base64 인코딩/디코딩 함수
function safeBtoa(str: string) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => 
    String.fromCharCode(parseInt(p1, 16))
  ));
}

function safeAtob(str: string) {
  try {
    return decodeURIComponent(Array.prototype.map.call(atob(str), (c: string) => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
  } catch (e) {
    return null;
  }
}

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('DASHBOARD');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [members, setMembers] = useState<Member[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [finances, setFinances] = useState<FinancialRecord[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [modalType, setModalType] = useState<ViewType | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // 데이터 로드 로직
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('data');

    if (sharedData) {
      const decodedStr = safeAtob(sharedData);
      if (decodedStr) {
        try {
          const decoded = JSON.parse(decodedStr);
          if (confirm('공유받은 데이터가 있습니다. 현재 데이터를 덮어쓰고 업데이트할까요?')) {
            setMembers(decoded.members || []);
            setNotices(decoded.notices || []);
            setFinances(decoded.finances || []);
            setMeetings(decoded.meetings || []);
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          }
        } catch (e) {
          console.error("JSON 파싱 오류", e);
        }
      }
    }

    // 로컬 스토리지 로드
    try {
      const savedMembers = localStorage.getItem('zoo_members');
      const savedNotices = localStorage.getItem('zoo_notices');
      const savedFinances = localStorage.getItem('zoo_finances');
      const savedMeetings = localStorage.getItem('zoo_meetings');

      if (savedMembers) setMembers(JSON.parse(savedMembers));
      if (savedNotices) setNotices(JSON.parse(savedNotices));
      if (savedFinances) setFinances(JSON.parse(savedFinances));
      if (savedMeetings) setMeetings(JSON.parse(savedMeetings));
    } catch (e) {
      console.error("로컬 스토리지 로드 실패", e);
    }
  }, []);

  // 데이터 저장 로직
  useEffect(() => { if (members.length > 0) localStorage.setItem('zoo_members', JSON.stringify(members)); }, [members]);
  useEffect(() => { if (notices.length > 0) localStorage.setItem('zoo_notices', JSON.stringify(notices)); }, [notices]);
  useEffect(() => { if (finances.length > 0) localStorage.setItem('zoo_finances', JSON.stringify(finances)); }, [finances]);
  useEffect(() => { if (meetings.length > 0) localStorage.setItem('zoo_meetings', JSON.stringify(meetings)); }, [meetings]);

  const totalBalance = finances.reduce((acc, curr) => 
    curr.type === 'INCOME' ? acc + curr.amount : acc - curr.amount, 0
  );

  const handleAttendanceChange = (meetingId: string, memberId: string, status: AttendanceStatus) => {
    setMeetings(prev => prev.map(m => 
      m.id === meetingId 
        ? { ...m, attendance: { ...m.attendance, [memberId]: status } } 
        : m
    ));
  };

  const deleteItem = (type: ViewType, id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    if (type === 'MEMBERS') setMembers(prev => prev.filter(m => m.id !== id));
    if (type === 'NOTICES') setNotices(prev => prev.filter(n => n.id !== id));
    if (type === 'FINANCES') setFinances(prev => prev.filter(f => f.id !== id));
    if (type === 'ATTENDANCE') setMeetings(prev => prev.filter(m => m.id !== id));
  };

  const copyToClipboard = (text: string, msg: string = '복사되었습니다!') => {
    navigator.clipboard.writeText(text).then(() => {
      alert(msg);
    }).catch(err => {
      alert('복사 실패: ' + err);
    });
  };

  const shareDataLink = () => {
    const data = { members, notices, finances, meetings };
    const encodedData = safeBtoa(JSON.stringify(data));
    const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
    copyToClipboard(shareUrl, '회원용 데이터 동기화 링크가 복사되었습니다!');
  };

  const shareAttendance = (meeting: Meeting) => {
    const attending = members.filter(m => meeting.attendance[m.id] === AttendanceStatus.ATTENDING).map(m => m.name);
    const absent = members.filter(m => meeting.attendance[m.id] === AttendanceStatus.ABSENT).map(m => m.name);
    const text = `[참석현황]\n⛳ ${meeting.location}\n📅 ${meeting.date}\n✅ 참석: ${attending.join(', ')}\n❌ 불참: ${absent.join(', ')}`;
    copyToClipboard(text);
  };

  const Modal = ({ title, children, onClose, onSave }: any) => (
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
            <button type="submit" className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100">저장</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2"><div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold italic">Z</div><h1 className="font-bold text-lg text-slate-800">동물원</h1></div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
      </div>

      {/* Sidebar - Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white p-6" onClick={e => e.stopPropagation()}>
             <div className="flex items-center space-x-3 mb-10"><div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold italic">Z</div><h1 className="text-xl font-bold">동물원</h1></div>
             <nav className="space-y-2">
                {['DASHBOARD', 'ATTENDANCE', 'NOTICES', 'FINANCES', 'MEMBERS'].map((id) => (
                  <button key={id} onClick={() => { setActiveView(id as any); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl ${activeView === id ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>
                    {id === 'DASHBOARD' && <LayoutDashboard size={20} />}
                    {id === 'ATTENDANCE' && <Calendar size={20} />}
                    {id === 'NOTICES' && <FileText size={20} />}
                    {id === 'FINANCES' && <Wallet size={20} />}
                    {id === 'MEMBERS' && <Users size={20} />}
                    <span>{id === 'DASHBOARD' ? '대시보드' : id === 'ATTENDANCE' ? '참석체크' : id === 'NOTICES' ? '공지사항' : id === 'FINANCES' ? '회비내역' : '회원관리'}</span>
                  </button>
                ))}
             </nav>
          </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 p-6 sticky top-0 h-screen">
        <div className="flex items-center space-x-3 mb-10 px-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl italic">Z</div>
          <h1 className="text-xl font-bold text-slate-800">동물원</h1>
        </div>
        <nav className="space-y-2">
          {['DASHBOARD', 'ATTENDANCE', 'NOTICES', 'FINANCES', 'MEMBERS'].map((id) => (
            <button key={id} onClick={() => setActiveView(id as any)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${activeView === id ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}>
              {id === 'DASHBOARD' && <LayoutDashboard size={20} />}
              {id === 'ATTENDANCE' && <Calendar size={20} />}
              {id === 'NOTICES' && <FileText size={20} />}
              {id === 'FINANCES' && <Wallet size={20} />}
              {id === 'MEMBERS' && <Users size={20} />}
              <span>{id === 'DASHBOARD' ? '대시보드' : id === 'ATTENDANCE' ? '참석체크' : id === 'NOTICES' ? '공지사항' : id === 'FINANCES' ? '회비내역' : '회원관리'}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto p-4 bg-emerald-50 rounded-2xl text-center">
          <p className="text-xs text-emerald-700 font-bold mb-1">현재 잔액</p>
          <p className="text-xl font-black text-slate-900">{totalBalance.toLocaleString()}원</p>
        </div>
      </aside>

      <main className="flex-1 p-4 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto w-full">
        {activeView === 'DASHBOARD' && (
          <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div><h2 className="text-3xl font-black text-slate-900">대시보드</h2><p className="text-slate-500">오늘의 모임 상태</p></div>
              <button onClick={shareDataLink} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 shadow-lg"><RefreshCw size={18} /><span>회원 데이터 공유 링크</span></button>
            </header>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start space-x-4">
              <Info className="text-emerald-600 mt-1" size={20} />
              <div className="text-sm text-slate-600 leading-relaxed">
                위의 <b>[회원 데이터 공유 링크]</b>를 카톡방에 올리면, 회원들도 총무님이 입력한 내용을 똑같은 앱 화면으로 볼 수 있습니다. (데이터는 링크를 통해 전송됩니다)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-400 text-sm mb-2 uppercase">다음 라운딩</h3>
                <p className="text-xl font-black text-slate-800">{meetings[0]?.date || '미정'}</p>
                <p className="text-sm text-slate-500">{meetings[0]?.location || '일정을 추가해주세요'}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-400 text-sm mb-2 uppercase">최근 공지</h3>
                <p className="text-xl font-black text-slate-800 truncate">{notices[0]?.title || '공지 없음'}</p>
                <p className="text-sm text-slate-500">{notices[0]?.date || '오늘'}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-400 text-sm mb-2 uppercase">회비 잔액</h3>
                <p className="text-xl font-black text-emerald-600">{totalBalance.toLocaleString()}원</p>
                <p className="text-sm text-slate-500">회비 관리를 시작하세요</p>
              </div>
            </div>
          </div>
        )}

        {activeView === 'ATTENDANCE' && (
          <div className="space-y-8 animate-fade-in">
            <header className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-slate-900">참석체크</h2>
              <button onClick={() => setModalType('ATTENDANCE')} className="bg-emerald-600 text-white p-3 rounded-full shadow-lg"><Plus size={24} /></button>
            </header>
            <div className="space-y-6">
              {meetings.map(m => (
                <div key={m.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <div><h3 className="text-xl font-black text-slate-800">{m.location}</h3><p className="text-slate-500">{m.date}</p></div>
                    <div className="flex space-x-2">
                      <button onClick={() => shareAttendance(m)} className="p-2 text-yellow-600 bg-yellow-50 rounded-lg"><Copy size={20} /></button>
                      <button onClick={() => deleteItem('ATTENDANCE', m.id)} className="p-2 text-red-400"><Trash2 size={20} /></button>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {members.map(member => (
                      <div key={member.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-2xl">
                        <span className="font-bold text-slate-700">{member.name}</span>
                        <div className="flex space-x-1">
                          {[AttendanceStatus.ATTENDING, AttendanceStatus.ABSENT].map(status => (
                            <button key={status} onClick={() => handleAttendanceChange(m.id, member.id, status)} className={`px-4 py-1.5 rounded-xl text-sm font-bold ${m.attendance[member.id] === status ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {meetings.length === 0 && <div className="text-center py-20 text-slate-400 italic">등록된 월례회 일정이 없습니다.</div>}
            </div>
          </div>
        )}

        {activeView === 'NOTICES' && (
          <div className="space-y-8 animate-fade-in">
            <header className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-slate-900">공지사항</h2>
              <button onClick={() => setModalType('NOTICES')} className="bg-emerald-600 text-white p-3 rounded-full shadow-lg"><Plus size={24} /></button>
            </header>
            <div className="grid gap-4">
              {notices.map(n => (
                <div key={n.id} className={`p-6 bg-white rounded-3xl border ${n.isImportant ? 'border-orange-200 bg-orange-50/20' : 'border-slate-100'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-slate-400">{n.date}</span>
                    <button onClick={() => deleteItem('NOTICES', n.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-2">{n.title}</h3>
                  <p className="text-slate-600 whitespace-pre-wrap">{n.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'FINANCES' && (
          <div className="space-y-8 animate-fade-in">
            <header className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-slate-900">회비내역</h2>
              <button onClick={() => setModalType('FINANCES')} className="bg-emerald-600 text-white p-3 rounded-full shadow-lg"><Plus size={24} /></button>
            </header>
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider"><tr className="border-b border-slate-100"><th className="px-6 py-4">일자</th><th className="px-6 py-4">내용</th><th className="px-6 py-4 text-right">금액</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {finances.map(f => (
                    <tr key={f.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-sm text-slate-400">{f.date}</td>
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
            <header className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-slate-900">회원관리</h2>
              <button onClick={() => setModalType('MEMBERS')} className="bg-emerald-600 text-white p-3 rounded-full shadow-lg"><Plus size={24} /></button>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map(m => (
                <div key={m.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">{m.name[0]}</div>
                    <div><h3 className="font-bold text-slate-800">{m.name}</h3><p className="text-xs text-slate-400">{m.role}</p></div>
                  </div>
                  <button onClick={() => deleteItem('MEMBERS', m.id)} className="text-slate-300 hover:text-red-500"><X size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 모달 렌더링 */}
      {modalType === 'MEMBERS' && (
        <Modal title="회원 추가" onClose={() => setModalType(null)} onSave={(fd: FormData) => {
          setMembers([...members, { id: generateId(), name: fd.get('name') as string, role: fd.get('role') as any, phoneNumber: fd.get('phone') as string }]);
          setModalType(null);
        }}>
          <input name="name" placeholder="회원 이름" required className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none" />
          <select name="role" className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none"><option value="회원">회원</option><option value="총무">총무</option><option value="회장">회장</option></select>
          <input name="phone" placeholder="연락처" className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none" />
        </Modal>
      )}

      {modalType === 'ATTENDANCE' && (
        <Modal title="라운딩 추가" onClose={() => setModalType(null)} onSave={(fd: FormData) => {
          setMeetings([{ id: generateId(), date: fd.get('date') as string, location: fd.get('location') as string, attendance: {} }, ...meetings]);
          setModalType(null);
        }}>
          <input name="date" type="date" required className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none" />
          <input name="location" placeholder="골프장 장소" required className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none" />
        </Modal>
      )}

      {modalType === 'NOTICES' && (
        <Modal title="공지 작성" onClose={() => setModalType(null)} onSave={(fd: FormData) => {
          setNotices([{ id: generateId(), title: fd.get('title') as string, content: fd.get('content') as string, date: new Date().toISOString().split('T')[0], isImportant: true }, ...notices]);
          setModalType(null);
        }}>
          <input name="title" placeholder="제목" required className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none" />
          <textarea name="content" placeholder="공지 내용" required className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none h-32" />
        </Modal>
      )}

      {modalType === 'FINANCES' && (
        <Modal title="회비 기록" onClose={() => setModalType(null)} onSave={(fd: FormData) => {
          setFinances([{ id: generateId(), date: fd.get('date') as string, description: fd.get('desc') as string, amount: Number(fd.get('amount')), type: fd.get('type') as any }, ...finances]);
          setModalType(null);
        }}>
          <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none" />
          <input name="desc" placeholder="내역 설명" required className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none" />
          <input name="amount" type="number" placeholder="금액" required className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none" />
          <div className="flex space-x-2">
            <label className="flex-1"><input type="radio" name="type" value="INCOME" defaultChecked className="hidden peer" /><div className="p-3 text-center bg-slate-100 rounded-xl peer-checked:bg-emerald-600 peer-checked:text-white font-bold transition">입금 (+)</div></label>
            <label className="flex-1"><input type="radio" name="type" value="EXPENSE" className="hidden peer" /><div className="p-3 text-center bg-slate-100 rounded-xl peer-checked:bg-red-500 peer-checked:text-white font-bold transition">지출 (-)</div></label>
          </div>
        </Modal>
      )}
    </div>
  );
}
