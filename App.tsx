
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
  RefreshCw,
  Link
} from 'lucide-react';
import { ViewType, Member, Meeting, Notice, FinancialRecord, AttendanceStatus } from './types';
import { geminiService } from './services/geminiService';

const generateId = () => Math.random().toString(36).substr(2, 9);

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

  // 1. Load data on init (Check URL first, then LocalStorage)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('data');

    if (sharedData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(sharedData)));
        if (confirm('공유받은 데이터가 있습니다. 현재 내 데이터를 덮어쓰고 업데이트할까요?')) {
          setMembers(decoded.members || []);
          setNotices(decoded.notices || []);
          setFinances(decoded.finances || []);
          setMeetings(decoded.meetings || []);
          // Remove param from URL without refreshing
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
      } catch (e) {
        console.error("데이터 복구 실패", e);
      }
    }

    // If no URL data or canceled, load from LocalStorage
    const savedMembers = localStorage.getItem('zoo_members');
    const savedNotices = localStorage.getItem('zoo_notices');
    const savedFinances = localStorage.getItem('zoo_finances');
    const savedMeetings = localStorage.getItem('zoo_meetings');

    if (savedMembers) setMembers(JSON.parse(savedMembers));
    if (savedNotices) setNotices(JSON.parse(savedNotices));
    if (savedFinances) setFinances(JSON.parse(savedFinances));
    if (savedMeetings) setMeetings(JSON.parse(savedMeetings));
  }, []);

  // 2. Save data to LocalStorage on changes
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
    });
  };

  const shareNotice = (notice: Notice) => {
    const text = `[동물원 골프모임 공지]\n\n📌 ${notice.title}\n📅 일자: ${notice.date}\n\n${notice.content}\n\n많은 관심 부탁드립니다!`;
    copyToClipboard(text, '공지사항이 복사되었습니다.');
  };

  const shareAttendance = (meeting: Meeting) => {
    const attending = members.filter(m => meeting.attendance[m.id] === AttendanceStatus.ATTENDING).map(m => m.name);
    const absent = members.filter(m => meeting.attendance[m.id] === AttendanceStatus.ABSENT).map(m => m.name);
    const pending = members.filter(m => !meeting.attendance[m.id] || meeting.attendance[m.id] === AttendanceStatus.PENDING).map(m => m.name);

    const text = `[동물원 월례회 참석현황]\n\n⛳ 장소: ${meeting.location}\n📅 일시: ${meeting.date}\n\n✅ 참석 (${attending.length}명):\n${attending.join(', ') || '없음'}\n\n❌ 불참 (${absent.length}명):\n${absent.join(', ') || '없음'}\n\n⏳ 미정 (${pending.length}명):\n${pending.join(', ') || '없음'}\n\n명단 확인 부탁드립니다!`;
    copyToClipboard(text, '참석 명단이 복사되었습니다.');
  };

  const shareSummary = () => {
    const lastMeeting = meetings[0];
    const lastNotice = notices[0];
    const text = `[동물원 골프모임 요약]\n\n💰 현재 잔액: ${totalBalance.toLocaleString()}원\n\n${lastMeeting ? `⛳ 다음 라운딩: ${lastMeeting.date} (${lastMeeting.location})\n` : ''}${lastNotice ? `📢 최신 공지: ${lastNotice.title}\n` : ''}\n세부 내용은 모임방에서 확인하세요!`;
    copyToClipboard(text, '전체 요약이 복사되었습니다.');
  };

  // NEW: Share Data Link
  const shareDataLink = () => {
    const data = { members, notices, finances, meetings };
    const encodedData = btoa(encodeURIComponent(JSON.stringify(data)));
    const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
    copyToClipboard(shareUrl, '회원용 데이터 동기화 링크가 생성되었습니다!\n이 링크를 카톡방에 올리면 회원들도 동일한 데이터를 보게 됩니다.');
  };

  const runFinanceAnalysis = async () => {
    if (finances.length === 0) return alert('분석할 데이터가 없습니다.');
    setIsAiLoading(true);
    try {
      const summary = await geminiService.analyzeFinances(finances);
      setAiAnalysis(summary || "분석 결과를 가져올 수 없습니다.");
    } catch (e) {
      setAiAnalysis("오류가 발생했습니다.");
    } finally { setIsAiLoading(false); }
  };

  const Modal = ({ title, children, onClose, onSave }: any) => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X size={24} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(new FormData(e.currentTarget)); }} className="p-6 space-y-4">
          {children}
          <div className="pt-4 flex space-x-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition">취소</button>
            <button type="submit" className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-100">저장하기</button>
          </div>
        </form>
      </div>
    </div>
  );

  const Navigation = () => {
    const navItems = [
      { id: 'DASHBOARD', label: '대시보드', icon: LayoutDashboard },
      { id: 'ATTENDANCE', label: '참석체크', icon: Calendar },
      { id: 'NOTICES', label: '공지사항', icon: FileText },
      { id: 'FINANCES', label: '회비내역', icon: Wallet },
      { id: 'MEMBERS', label: '회원관리', icon: Users },
    ];
    return (
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => { setActiveView(item.id as ViewType); setIsMobileMenuOpen(false); }}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeView === item.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-600 hover:bg-slate-100'}`}>
            <item.icon size={20} /><span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Modals */}
      {modalType === 'MEMBERS' && (
        <Modal title="새 회원 등록" onClose={() => setModalType(null)} onSave={(fd: FormData) => {
          setMembers([...members, { id: generateId(), name: fd.get('name') as string, role: fd.get('role') as any, phoneNumber: fd.get('phone') as string }]);
          setModalType(null);
        }}>
          <div className="space-y-4">
            <div><label className="block text-sm font-bold text-slate-700 mb-1">이름</label>
            <input name="name" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="이름 입력" /></div>
            <div><label className="block text-sm font-bold text-slate-700 mb-1">역할</label>
            <select name="role" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none">
              <option value="회원">회원</option><option value="총무">총무</option><option value="회장">회장</option>
            </select></div>
            <div><label className="block text-sm font-bold text-slate-700 mb-1">연락처</label>
            <input name="phone" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="010-0000-0000" /></div>
          </div>
        </Modal>
      )}

      {modalType === 'ATTENDANCE' && (
        <Modal title="새 일정 추가" onClose={() => setModalType(null)} onSave={(fd: FormData) => {
          setMeetings([...meetings, { id: generateId(), date: fd.get('date') as string, location: fd.get('location') as string, attendance: {} }]);
          setModalType(null);
        }}>
          <div className="space-y-4">
            <div><label className="block text-sm font-bold text-slate-700 mb-1">날짜</label>
            <input name="date" type="date" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
            <div><label className="block text-sm font-bold text-slate-700 mb-1">장소</label>
            <input name="location" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="골프장 이름" /></div>
          </div>
        </Modal>
      )}

      {modalType === 'NOTICES' && (
        <Modal title="공지사항 작성" onClose={() => setModalType(null)} onSave={(fd: FormData) => {
          setNotices([{ id: generateId(), title: fd.get('title') as string, content: fd.get('content') as string, date: new Date().toISOString().split('T')[0], isImportant: fd.get('important') === 'on' }, ...notices]);
          setModalType(null);
        }}>
          <div className="space-y-4">
            <div><label className="block text-sm font-bold text-slate-700 mb-1">제목</label>
            <input name="title" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
            <div><label className="block text-sm font-bold text-slate-700 mb-1">내용</label>
            <textarea name="content" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none h-32" /></div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" name="important" id="important" className="w-4 h-4 rounded text-emerald-600" />
              <label htmlFor="important" className="text-sm font-bold text-slate-700">중요 공지</label>
            </div>
          </div>
        </Modal>
      )}

      {modalType === 'FINANCES' && (
        <Modal title="회비 내역 추가" onClose={() => setModalType(null)} onSave={(fd: FormData) => {
          setFinances([{ id: generateId(), date: fd.get('date') as string, description: fd.get('desc') as string, amount: Number(fd.get('amount')), type: fd.get('type') as any }, ...finances]);
          setModalType(null);
        }}>
          <div className="space-y-4">
            <div><label className="block text-sm font-bold text-slate-700 mb-1">날짜</label>
            <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
            <div><label className="block text-sm font-bold text-slate-700 mb-1">내용</label>
            <input name="desc" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="입금 또는 지출 항목" /></div>
            <div><label className="block text-sm font-bold text-slate-700 mb-1">금액</label>
            <input name="amount" type="number" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="0" /></div>
            <div><label className="block text-sm font-bold text-slate-700 mb-1">유형</label>
            <div className="flex space-x-2">
              <label className="flex-1 cursor-pointer"><input type="radio" name="type" value="INCOME" defaultChecked className="hidden peer" /><div className="text-center py-2 bg-slate-100 peer-checked:bg-emerald-100 peer-checked:text-emerald-700 rounded-xl font-bold transition">입금 (+)</div></label>
              <label className="flex-1 cursor-pointer"><input type="radio" name="type" value="EXPENSE" className="hidden peer" /><div className="text-center py-2 bg-slate-100 peer-checked:bg-red-100 peer-checked:text-red-700 rounded-xl font-bold transition">지출 (-)</div></label>
            </div></div>
          </div>
        </Modal>
      )}

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 p-6 sticky top-0 h-screen">
        <div className="flex items-center space-x-3 mb-10 px-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl italic">Z</div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">동물원</h1>
        </div>
        <Navigation />
        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="p-4 bg-emerald-50 rounded-2xl">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">현재 잔액</p>
            <p className="text-xl font-bold text-slate-900">{totalBalance.toLocaleString()}원</p>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2"><div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold italic">Z</div><h1 className="font-bold text-lg">동물원</h1></div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto w-full overflow-y-auto">
        {activeView === 'DASHBOARD' && (
          <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div><h2 className="text-3xl font-extrabold text-slate-900">대시보드</h2><p className="text-slate-500 mt-1">오늘의 '동물원' 모임 현황입니다.</p></div>
              <div className="flex space-x-2">
                <button onClick={shareDataLink} className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition shadow-md">
                  <RefreshCw size={18} /><span>회원과 데이터 동기화</span>
                </button>
                <button onClick={shareSummary} className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg font-bold hover:bg-yellow-500 transition shadow-sm">
                  <Copy size={18} /><span>요약 복사</span>
                </button>
                <button onClick={runFinanceAnalysis} disabled={isAiLoading} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-md disabled:opacity-50">
                  <Sparkles size={18} /><span>AI 분석</span>
                </button>
              </div>
            </header>

            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start space-x-3">
              <Info className="text-indigo-600 mt-0.5 shrink-0" size={18} />
              <div className="text-sm text-indigo-800 leading-relaxed">
                <p><strong>💡 회원들과 똑같은 화면을 공유하려면?</strong></p>
                <p>상단의 <span className="font-bold">[회원과 데이터 동기화]</span> 버튼을 누르면 특수 링크가 복사됩니다. 이 링크를 받은 회원이 접속하면 내가 입력한 명단과 회비 내역이 그대로 회원 앱에 복사됩니다!</p>
              </div>
            </div>

            {aiAnalysis && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 relative overflow-hidden animate-in slide-in-from-top duration-300">
                <div className="flex items-center space-x-2 mb-3"><Sparkles className="text-indigo-600" size={20} /><h3 className="font-bold text-indigo-900">AI 분석 결과</h3></div>
                <p className="text-indigo-800 leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
                <button onClick={() => setAiAnalysis(null)} className="absolute top-4 right-4 text-indigo-400 hover:text-indigo-600"><X size={16} /></button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-slate-800">예정된 월례회</h3><Calendar size={18} className="text-emerald-600" /></div>
                {meetings.length > 0 ? (
                  <div><p className="text-lg font-bold text-emerald-700">{meetings[0].date}</p><p className="text-slate-500 text-sm">{meetings[0].location}</p></div>
                ) : <p className="text-slate-400 text-sm italic">예정된 일정이 없습니다.</p>}
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-slate-800">최근 공지</h3><FileText size={18} className="text-orange-500" /></div>
                {notices.length > 0 ? <p className="text-sm font-semibold text-slate-800 truncate">{notices[0].title}</p> : <p className="text-slate-400 text-sm italic">공지가 없습니다.</p>}
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-slate-800">재정 현황</h3><Wallet size={18} className="text-blue-500" /></div>
                <p className="text-2xl font-black text-slate-900">{totalBalance.toLocaleString()}원</p>
              </div>
            </div>
          </div>
        )}

        {activeView === 'ATTENDANCE' && (
          <div className="space-y-8">
            <header className="flex justify-between items-end">
              <div><h2 className="text-3xl font-extrabold text-slate-900">참석체크</h2><p className="text-slate-500 mt-1">월례회 참석 인원을 관리하세요.</p></div>
              <button onClick={() => setModalType('ATTENDANCE')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-emerald-700 transition shadow-md"><Plus size={18} /><span>새 일정 추가</span></button>
            </header>
            <div className="space-y-6">
              {meetings.length === 0 && <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">등록된 일정이 없습니다.</div>}
              {meetings.map(meeting => (
                <div key={meeting.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div><h3 className="text-xl font-bold text-slate-800">{meeting.location}</h3><p className="text-slate-500 font-medium">{meeting.date}</p></div>
                    <div className="flex items-center space-x-4">
                       <button onClick={() => shareAttendance(meeting)} className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-400 text-yellow-900 rounded-lg text-sm font-bold hover:bg-yellow-500 transition">
                         <Copy size={14} /><span>카톡 복사</span>
                       </button>
                       <div className="text-center"><p className="text-xs text-slate-400 font-bold">참석</p><p className="text-lg font-bold text-emerald-600">{Object.values(meeting.attendance).filter(s => s === AttendanceStatus.ATTENDING).length}</p></div>
                       <button onClick={() => deleteItem('ATTENDANCE', meeting.id)} className="text-slate-300 hover:text-red-500 transition"><Trash2 size={20} /></button>
                    </div>
                  </div>
                  <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-2">
                    {members.map(member => {
                      const status = meeting.attendance[member.id] || AttendanceStatus.PENDING;
                      return (
                        <div key={member.id} className="flex items-center justify-between p-3 border border-slate-50 rounded-xl hover:bg-slate-50">
                          <span className="font-bold text-slate-700">{member.name} <span className="text-xs font-normal text-slate-400">{member.role}</span></span>
                          <div className="flex space-x-1">
                            <button onClick={() => handleAttendanceChange(meeting.id, member.id, AttendanceStatus.ATTENDING)} className={`p-1.5 rounded-lg ${status === AttendanceStatus.ATTENDING ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-emerald-50'}`}><CheckCircle2 size={16} /></button>
                            <button onClick={() => handleAttendanceChange(meeting.id, member.id, AttendanceStatus.ABSENT)} className={`p-1.5 rounded-lg ${status === AttendanceStatus.ABSENT ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-red-50'}`}><XCircle size={16} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'NOTICES' && (
          <div className="space-y-8">
            <header className="flex justify-between items-end">
              <div><h2 className="text-3xl font-extrabold text-slate-900">공지사항</h2><p className="text-slate-500 mt-1">새로운 소식을 회원들과 공유하세요.</p></div>
              <button onClick={() => setModalType('NOTICES')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-emerald-700 transition shadow-md"><Plus size={18} /><span>공지 작성</span></button>
            </header>
            <div className="grid gap-4">
              {notices.length === 0 && <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">공지사항이 없습니다.</div>}
              {notices.map(notice => (
                <div key={notice.id} className={`bg-white p-6 rounded-2xl shadow-sm border group transition ${notice.isImportant ? 'border-orange-200 bg-orange-50/20' : 'border-slate-100 hover:border-emerald-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      {notice.isImportant && <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded">필독</span>}
                      <span className="text-xs text-slate-400">{notice.date}</span>
                    </div>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => shareNotice(notice)} className="text-slate-400 hover:text-yellow-600 p-1" title="카톡으로 공유"><Share2 size={18} /></button>
                      <button onClick={() => deleteItem('NOTICES', notice.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{notice.title}</h3>
                  <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{notice.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'FINANCES' && (
          <div className="space-y-8">
            <header className="flex justify-between items-end">
              <div><h2 className="text-3xl font-extrabold text-slate-900">회비 내역</h2><p className="text-slate-500 mt-1">투명한 회비 운영을 위해 내역을 기록하세요.</p></div>
              <button onClick={() => setModalType('FINANCES')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-emerald-700 transition shadow-md"><Plus size={18} /><span>내역 추가</span></button>
            </header>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead><tr className="bg-slate-50/50 text-slate-400 text-xs uppercase font-bold"><th className="px-6 py-4">일자</th><th className="px-6 py-4">항목</th><th className="px-6 py-4 text-right">금액</th><th className="px-6 py-4"></th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {finances.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 text-sm text-slate-500">{record.date}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{record.description}</td>
                      <td className={`px-6 py-4 text-right font-bold ${record.type === 'INCOME' ? 'text-emerald-600' : 'text-red-500'}`}>{record.type === 'INCOME' ? '+' : '-'}{record.amount.toLocaleString()}원</td>
                      <td className="px-6 py-4 text-right"><button onClick={() => deleteItem('FINANCES', record.id)} className="text-slate-300 hover:text-red-500 p-2 transition"><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {finances.length === 0 && <div className="text-center py-20 text-slate-400">데이터가 없습니다.</div>}
            </div>
          </div>
        )}

        {activeView === 'MEMBERS' && (
          <div className="space-y-8">
             <header className="flex justify-between items-end">
              <div><h2 className="text-3xl font-extrabold text-slate-900">회원 관리</h2><p className="text-slate-500 mt-1">회원 정보를 등록하고 관리하세요.</p></div>
              <button onClick={() => setModalType('MEMBERS')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-emerald-700 transition shadow-md"><Plus size={18} /><span>회원 등록</span></button>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map(member => (
                <div key={member.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 group relative">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-black text-xl">{member.name.charAt(0)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between"><h3 className="font-bold text-slate-800">{member.name}</h3><span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">{member.role}</span></div>
                    <p className="text-sm text-slate-400 mt-1">{member.phoneNumber}</p>
                  </div>
                  <button onClick={() => deleteItem('MEMBERS', member.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-2"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
