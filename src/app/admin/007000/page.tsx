"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Concert = {
  id?: number;
  artist_id?: number;
  artist_name_en: string;
  artist_name_kr?: string;
  start_date: string; // ISO date
  end_date?: string; // ISO date
  concert_type: "CONCERT" | "FANMEETING" | "TOUR" | "SHOWCASE" | "SCHEDULE" | "ETC";
  venue_name_en?: string;
  venue_name_kr?: string;
  city?: string;
  country?: string;
  ticket_price?: string;
  description?: string;
  memo?: string;
};

type Artist = {
  id?: number;
  artist_name_en: string;
  artist_name_kr?: string;
  rank: number;
  fan_count?: string | number;
  color_code?: string;
  category?: "BOY_GROUP" | "GIRL_GROUP" | "SOLO" | "MC" | "ETC";
  agency?: string;
  fandom_name?: string;
  created_at?: string;
  updated_at?: string;
  artist_translations?: ArtistTranslation[];
};

type ArtistTranslation = {
  id?: number;
  artist_id: number;
  lang: string;
  description: string;
  created_at?: string;
  updated_at?: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'concerts' | 'artists'>('concerts');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  // 콘서트 관련 상태
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [concertForm, setConcertForm] = useState<Concert>({
    artist_id: undefined,
    artist_name_en: "",
    artist_name_kr: "",
    start_date: "",
    end_date: "",
    concert_type: "CONCERT",
    venue_name_en: "",
    venue_name_kr: "",
    city: "",
    country: "",
    ticket_price: "",
    description: "",
    memo: "",
  });
  const [concertLoading, setConcertLoading] = useState(false);
  const [concertError, setConcertError] = useState<string | null>(null);

  // 아티스트 관련 상태
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistForm, setArtistForm] = useState<Artist>({
    artist_name_en: "",
    artist_name_kr: "",
    rank: 1,
    fan_count: "",
    color_code: "",
    category: "BOY_GROUP",
    agency: "",
    fandom_name: "",
  });
  const [translations, setTranslations] = useState<{[key: string]: string}>({
    ko: "",
    en: "",
    ja: "",
    zh: "",
    es: ""
  });
  const [availableTranslations, setAvailableTranslations] = useState<ArtistTranslation[]>([]);
  const [artistLoading, setArtistLoading] = useState(false);
  const [artistError, setArtistError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalArtists, setTotalArtists] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 15;

  useEffect(() => {
    // 로컬 스토리지에서 인증 상태 확인
    const authStatus = localStorage.getItem('admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      if (activeTab === 'concerts') {
        fetchConcerts();
      } else {
        fetchArtists();
      }
    }
  }, [activeTab]);

  const handleLogin = async () => {
    try {
      // 간단한 비밀번호 체크 (실제 환경에서는 더 강력한 인증 필요)
      if (password === 'adminowner') {
        setIsAuthenticated(true);
        localStorage.setItem('admin_authenticated', 'true');
        if (activeTab === 'concerts') {
          fetchConcerts();
        } else {
          fetchArtists();
        }
      } else {
        alert('비밀번호가 올바르지 않습니다.');
      }
    } catch (error) {
      alert('로그인 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
    setPassword('');
  };

  // 콘서트 관련 함수들
  async function fetchConcerts() {
    const res = await fetch("/api/concerts");
    const json = await res.json();
    if (json.success) setConcerts(json.concerts);
  }

  async function handleConcertSubmit(e: React.FormEvent) {
    e.preventDefault();
    setConcertLoading(true);
    setConcertError(null);
    try {
      const isUpdate = concertForm.id;
      const url = isUpdate ? `/api/concerts/${concertForm.id}` : "/api/concerts";
      const method = isUpdate ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...concertForm,
          artist_id: concertForm.artist_id || undefined
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed");
      alert(isUpdate ? "콘서트가 성공적으로 수정되었습니다!" : "콘서트가 성공적으로 등록되었습니다!");
      setConcertForm({ artist_id: undefined, artist_name_en: "", artist_name_kr: "", start_date: "", end_date: "", concert_type: "CONCERT", venue_name_en: "", venue_name_kr: "", city: "", country: "", ticket_price: "", description: "", memo: "" });
      fetchConcerts();
    } catch (e: any) {
      setConcertError(e.message);
    } finally {
      setConcertLoading(false);
    }
  }

  async function handleConcertDelete(id?: number) {
    if (!id) return;
    const ok = window.confirm("삭제하시겠습니까?");
    if (!ok) return;
    await fetch(`/api/concerts/${id}`, { method: "DELETE" });
    fetchConcerts();
  }

  function handleConcertEdit(concert: Concert) {
    setConcertForm(concert);
  }

  function handleConcertNew() {
    setConcertForm({ artist_id: undefined, artist_name_en: "", artist_name_kr: "", start_date: "", end_date: "", concert_type: "CONCERT", venue_name_en: "", venue_name_kr: "", city: "", country: "", ticket_price: "", description: "", memo: "" });
  }

  // 아티스트 관련 함수들
  async function fetchArtists(page: number = 1) {
    try {
      const offset = (page - 1) * itemsPerPage;
      const res = await fetch(`/api/artists?page=${page}&limit=${itemsPerPage}&offset=${offset}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed");
      setArtists(json.artists || []);
      setTotalArtists(json.total || 0);
      setTotalPages(json.totalPages || 0);
      setCurrentPage(page);
    } catch (e: any) {
      setArtistError(e.message);
    }
  }

  async function handleArtistSubmit(e: React.FormEvent) {
    e.preventDefault();
    setArtistLoading(true);
    setArtistError(null);
    try {
      const isUpdate = artistForm.id;
      const url = isUpdate ? `/api/artists/${artistForm.id}` : "/api/artists";
      const method = isUpdate ? "PUT" : "POST";

      // created_at, updated_at 필드 제거하고 전송
      const { created_at, updated_at, ...artistData } = artistForm;
      
      // 신규 등록이면 created_at, updated_at 모두 현재 시간
      // 수정이면 updated_at만 현재 시간
      const now = new Date().toISOString();
      const dataToSend = isUpdate 
        ? { ...artistData, updated_at: now }
        : { ...artistData, created_at: now, updated_at: now };
      
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed");
      
      const artistId = json.artist?.id || artistForm.id;
      
      // 모든 언어 번역 저장 (등록/수정 모두)
      if (artistId) {
        try {
          const updatedTranslations = [...availableTranslations];
          
          for (const [lang, description] of Object.entries(translations)) {
            if (description.trim()) {
              await saveTranslation(artistId, lang, description);
              
              const existingIndex = updatedTranslations.findIndex(t => t.lang === lang);
              
              if (existingIndex >= 0) {
                // 기존 번역 업데이트
                updatedTranslations[existingIndex] = {
                  ...updatedTranslations[existingIndex],
                  description: description
                };
              } else {
                // 새 번역 추가
                updatedTranslations.push({
                  id: Date.now(), // 임시 ID
                  artist_id: artistId,
                  lang: lang,
                  description: description,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
              }
            }
          }
          
          setAvailableTranslations(updatedTranslations);
          
          // 아티스트 목록의 번역 상태도 실시간 업데이트
          setArtists(prevArtists => 
            prevArtists.map(artist => 
              artist.id === artistId 
                ? { ...artist, artist_translations: updatedTranslations }
                : artist
            )
          );
        } catch (e: any) {
          console.error("Failed to save translation:", e.message);
          // 번역 저장 실패해도 아티스트 등록은 성공으로 처리
        }
      }
      
      alert(isUpdate ? "아티스트가 성공적으로 수정되었습니다!" : "아티스트가 성공적으로 등록되었습니다!");
      setArtistForm({ artist_name_en: "", artist_name_kr: "", rank: 1, fan_count: "", color_code: "", category: "BOY_GROUP", agency: "", fandom_name: "" });
      setTranslations({ ko: "", en: "", ja: "", zh: "", es: "" });
      fetchArtists();
    } catch (e: any) {
      setArtistError(e.message);
    } finally {
      setArtistLoading(false);
    }
  }

  async function saveTranslation(artistId: number, lang: string, description: string) {
    try {
      // 기존 번역이 있는지 확인
      const checkRes = await fetch(`/api/artist-translations?artist_id=${artistId}&lang=${lang}`);
      const checkJson = await checkRes.json();
      
      let res;
      if (checkJson.success && checkJson.translations && checkJson.translations.length > 0) {
        // 기존 번역이 있으면 업데이트
        const existingTranslation = checkJson.translations[0];
        res = await fetch(`/api/artist-translations/${existingTranslation.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: description
          }),
        });
      } else {
        // 새 번역 생성
        res = await fetch("/api/artist-translations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            artist_id: artistId,
            lang: lang,
            description: description
          }),
        });
      }
      
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to save translation");
    } catch (e: any) {
      console.error("Translation save error:", e.message);
    }
  }

  async function handleArtistDelete(id?: number) {
    if (!id) return;
    const ok = window.confirm("삭제하시겠습니까?");
    if (!ok) return;
    await fetch(`/api/artists/${id}`, { method: "DELETE" });
    fetchArtists();
  }

  async function handleArtistEdit(artist: Artist) {
    console.log("Editing artist:", artist); // 디버깅용
    console.log("fan_count value:", artist.fan_count); // 디버깅용
    
    // 모든 필드를 명시적으로 설정
    setArtistForm({
      id: artist.id,
      artist_name_en: artist.artist_name_en || "",
      artist_name_kr: artist.artist_name_kr || "",
      rank: artist.rank || 1,
      fan_count: artist.fan_count ?? "", // null/undefined 체크
      color_code: artist.color_code || "",
      category: artist.category || "BOY_GROUP",
      agency: artist.agency || "",
      fandom_name: artist.fandom_name || "",
      created_at: artist.created_at,
      updated_at: artist.updated_at,
    });
    
    // 해당 아티스트의 번역 정보 조회
    try {
      if (artist.id) {
        const res = await fetch(`/api/artist-translations?artist_id=${artist.id}`);
        const json = await res.json();
        if (json.success && json.translations && json.translations.length > 0) {
          // 모든 번역 정보 저장
          setAvailableTranslations(json.translations);
          
          // 모든 언어 번역을 상태에 설정
          const translationMap: {[key: string]: string} = {
            ko: "",
            en: "",
            ja: "",
            zh: "",
            es: ""
          };
          
          json.translations.forEach((translation: ArtistTranslation) => {
            if (translationMap.hasOwnProperty(translation.lang)) {
              translationMap[translation.lang] = translation.description || "";
            }
          });
          
          setTranslations(translationMap);
        } else {
          // 번역이 없으면 기본값으로 설정
          setAvailableTranslations([]);
          setTranslations({ ko: "", en: "", ja: "", zh: "", es: "" });
        }
      } else {
        // ID가 없으면 기본값으로 설정
        setAvailableTranslations([]);
        setTranslations({ ko: "", en: "", ja: "", zh: "", es: "" });
      }
    } catch (e: any) {
      console.error("Failed to fetch translations:", e.message);
      setAvailableTranslations([]);
      setTranslations({ ko: "", en: "", ja: "", zh: "", es: "" });
    }
  }

  function handleArtistNew() {
    setArtistForm({ artist_name_en: "", artist_name_kr: "", rank: 1, fan_count: "", color_code: "", category: "BOY_GROUP", agency: "", fandom_name: "" });
    setTranslations({ ko: "", en: "", ja: "", zh: "", es: "" });
    setAvailableTranslations([]);
  }

  async function handleRankChange(artistId: number, newRank: number) {
    try {
      const res = await fetch(`/api/artists/${artistId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rank: newRank }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed");
      fetchArtists(); // 목록 새로고침
    } catch (e: any) {
      alert("순위 변경 중 오류가 발생했습니다: " + e.message);
    }
  }

  async function swapRanks(artist1: Artist, artist2: Artist) {
    try {
      // 임시 순위를 사용하여 중복 키 오류 방지
      const tempRank = 9999; // 임시 순위
      
      // 1단계: 첫 번째 아티스트를 임시 순위로 변경
      await handleRankChange(artist1.id!, tempRank);
      
      // 2단계: 두 번째 아티스트를 첫 번째 아티스트의 원래 순위로 변경
      await handleRankChange(artist2.id!, artist1.rank);
      
      // 3단계: 첫 번째 아티스트를 두 번째 아티스트의 원래 순위로 변경
      await handleRankChange(artist1.id!, artist2.rank);
      
    } catch (e: any) {
      alert("순위 변경 중 오류가 발생했습니다: " + e.message);
    }
  }

  const styles = {
    page: { background: "#f7f7f8", minHeight: "100vh", padding: "32px 16px" },
    container: { maxWidth: 1120, margin: "0 auto" },
    header: { marginBottom: 24 },
    title: { margin: 0, fontSize: 24, fontWeight: 800 as const },
    subtitle: { margin: "8px 0 0", color: "#666" },
    tabContainer: { display: "flex", gap: 8, marginBottom: 20 },
    tab: (active: boolean) => ({ 
      padding: "12px 24px", 
      borderRadius: 8, 
      background: active ? "#D4AF37" : "#e3e3e7", 
      color: active ? "#fff" : "#333",
      border: "none",
      cursor: "pointer",
      fontWeight: 600 as const
    }),
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
    card: { background: "#fff", borderRadius: 12, boxShadow: "0 6px 18px rgba(0,0,0,0.06)", padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 700 as const, margin: "0 0 16px" },
    formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    field: { display: "grid", gap: 6 },
    label: { fontSize: 12, fontWeight: 600 as const, color: "#333" },
    input: { height: 38, borderRadius: 8, border: "1px solid #e3e3e7", padding: "0 12px" },
    select: { height: 38, borderRadius: 8, border: "1px solid #e3e3e7", padding: "0 8px", background: "#fff" },
    textarea: { minHeight: 80, borderRadius: 8, border: "1px solid #e3e3e7", padding: 12, resize: "vertical" as const },
    actions: { display: "flex", gap: 8, marginTop: 10 },
    primaryBtn: { background: "#D4AF37", color: "#fff", border: 0, height: 40, borderRadius: 8, padding: "0 14px", fontWeight: 700 as const, cursor: "pointer" },
    dangerBtn: { fontSize:10, background: "#e74c3c", color: "#fff", border: 0, height: 20, borderRadius: 8, padding: "0 5px", cursor: "pointer" },
    swapBtn: { fontSize:8, background: "#3498db", color: "#fff", border: 0, height: 16, borderRadius: 6, padding: "0px 3px 0px 3px", cursor: "pointer", fontWeight: 600 as const },
    tableWrap: { overflow: "auto" },
    table: { width: "100%", borderCollapse: "separate" as const, borderSpacing: 0 },
    th: { textAlign: "left" as const, fontSize: 10, color: "#666", padding: "10px 12px", borderBottom: "1px solid #eee", background: "#fafafa" },
    td: { padding: "5px", fontSize: 10, borderBottom: "1px solid #f0f0f0" },
    badge: (color: string) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 999, background: color, color: "#fff", fontSize: 10, fontWeight: 600 as const }),
    empty: { color: "#888", padding: 10, fontSize: 10, textAlign: "center" as const },
    pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 16, padding: "12px 0" },
    pageBtn: { background: "#f0f0f0", border: "1px solid #ddd", padding: "6px 12px", borderRadius: 4, cursor: "pointer", fontSize: 12 },
    pageBtnActive: { background: "#D4AF37", color: "#fff", border: "1px solid #D4AF37" },
    pageInfo: { fontSize: 12, color: "#666", margin: "0 8px" }
  } as const;

  function typeColor(type: Concert["concert_type"]) {
    switch (type) {
      case "CONCERT": return "#4CAF50";
      case "FANMEETING": return "#9C27B0";
      case "TOUR": return "#2196F3";
      case "SHOWCASE": return "#FF9800";
      case "SCHEDULE": return "#607D8B";
      default: return "#7f8c8d";
    }
  }

  // 로그인 화면
  if (!isAuthenticated) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.title}>관리자 로그인</h1>
            <p style={styles.subtitle}>관리 페이지에 접근하려면 비밀번호를 입력하세요.</p>
          </div>
          <div style={styles.card}>
            <div style={styles.field}>
              <label style={styles.label}>비밀번호</label>
              <input 
                type="password" 
                style={styles.input as any} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="비밀번호를 입력하세요"
              />
            </div>
            <div style={styles.actions}>
              <button style={styles.primaryBtn as any} onClick={handleLogin}>로그인</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={styles.title}>K-pop Admin</h1>
              <p style={styles.subtitle}>콘서트 및 아티스트 정보를 관리하세요.</p>
            </div>
            <button style={styles.dangerBtn as any} onClick={handleLogout}>로그아웃</button>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div style={styles.tabContainer}>
          <button 
            style={styles.tab(activeTab === 'concerts') as any} 
            onClick={() => setActiveTab('concerts')}
          >
            콘서트 관리
          </button>
          <button 
            style={styles.tab(activeTab === 'artists') as any} 
            onClick={() => setActiveTab('artists')}
          >
            아티스트 관리
          </button>
        </div>

        {/* 콘서트 관리 탭 */}
        {activeTab === 'concerts' && (
          <div style={styles.grid}>
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={styles.sectionTitle}>{concertForm.id ? '콘서트 수정' : '새 콘서트 등록'}</h2>
                {concertForm.id && (
                  <button style={styles.primaryBtn as any} onClick={handleConcertNew}>새로 등록</button>
                )}
              </div>
              <form onSubmit={handleConcertSubmit}>
                <div style={styles.formGrid}>
                  <div style={styles.field}>
                    <label style={styles.label}>Artist EN</label>
                    <input style={styles.input as any} value={concertForm.artist_name_en} onChange={(e) => setConcertForm({ ...concertForm, artist_name_en: e.target.value })} required />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Artist KR</label>
                    <input style={styles.input as any} value={concertForm.artist_name_kr} onChange={(e) => setConcertForm({ ...concertForm, artist_name_kr: e.target.value })} />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>시작날짜</label>
                    <input type="date" style={styles.input as any} value={concertForm.start_date} onChange={(e) => setConcertForm({ ...concertForm, start_date: e.target.value })} required />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>종료날짜 (선택)</label>
                    <input type="date" style={styles.input as any} value={concertForm.end_date || ""} onChange={(e) => setConcertForm({ ...concertForm, end_date: e.target.value })} />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Type</label>
                    <select style={styles.select as any} value={concertForm.concert_type} onChange={(e) => setConcertForm({ ...concertForm, concert_type: e.target.value as Concert["concert_type"] })}>
                      <option value="CONCERT">CONCERT</option>
                      <option value="FANMEETING">FANMEETING</option>
                      <option value="TOUR">TOUR</option>
                      <option value="SHOWCASE">SHOWCASE</option>
                      <option value="SCHEDULE">SCHEDULE</option>
                      <option value="ETC">ETC</option>
                    </select>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Venue EN</label>
                    <input style={styles.input as any} value={concertForm.venue_name_en} onChange={(e) => setConcertForm({ ...concertForm, venue_name_en: e.target.value })} />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Venue KR</label>
                    <input style={styles.input as any} value={concertForm.venue_name_kr} onChange={(e) => setConcertForm({ ...concertForm, venue_name_kr: e.target.value })} />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>City</label>
                    <input style={styles.input as any} value={concertForm.city} onChange={(e) => setConcertForm({ ...concertForm, city: e.target.value })} />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Country</label>
                    <input style={styles.input as any} value={concertForm.country} onChange={(e) => setConcertForm({ ...concertForm, country: e.target.value })} />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Ticket Price</label>
                    <input style={styles.input as any} value={concertForm.ticket_price} onChange={(e) => setConcertForm({ ...concertForm, ticket_price: e.target.value })} />
                  </div>

                  <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
                    <label style={styles.label}>Description</label>
                    <textarea style={styles.textarea as any} value={concertForm.description} onChange={(e) => setConcertForm({ ...concertForm, description: e.target.value })} />
                  </div>
                  <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
                    <label style={styles.label}>Memo</label>
                    <textarea style={styles.textarea as any} value={concertForm.memo} onChange={(e) => setConcertForm({ ...concertForm, memo: e.target.value })} />
                  </div>
                </div>
                <div style={styles.actions}>
                  <button type="submit" style={styles.primaryBtn as any} disabled={concertLoading}>
                    {concertLoading ? "Saving..." : (concertForm.id ? "수정" : "등록")}
                  </button>
                  {concertError && <span style={{ color: "#e74c3c", fontWeight: 600 }}>{concertError}</span>}
                </div>
              </form>
            </div>

            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>콘서트 목록</h2>
              <div style={styles.tableWrap}>
                <table style={styles.table as any}>
                  <thead>
                    <tr>
                      <th style={styles.th as any}>Date</th>
                      <th style={styles.th as any}>Artist</th>
                      <th style={styles.th as any}>Type</th>
                      <th style={styles.th as any}>Location</th>
                      <th style={styles.th as any}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {concerts.length === 0 && (
                      <tr>
                        <td colSpan={5} style={styles.empty as any}>등록된 콘서트가 없습니다.</td>
                      </tr>
                    )}
                    {concerts.map((c) => (
                      <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => handleConcertEdit(c)}>
                        <td style={styles.td as any}>{
                          c.end_date && c.end_date !== c.start_date 
                            ? `${c.start_date} ~ ${c.end_date}`
                            : c.start_date
                        }</td>
                        <td style={styles.td as any}>{c.artist_name_en}{c.artist_name_kr ? ` / ${c.artist_name_kr}` : ""}</td>
                        <td style={styles.td as any}><span style={styles.badge(typeColor(c.concert_type))}>{c.concert_type}</span></td>
                        <td style={styles.td as any}>{[c.city, c.country].filter(Boolean).join(", ")}{c.memo ? ` / ${c.memo}` : ""}</td>
                        <td style={{...styles.td, textAlign: 'center'} as any}>
                          <button style={styles.dangerBtn as any} onClick={(e) => { e.stopPropagation(); handleConcertDelete(c.id); }}>del</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 아티스트 관리 탭 */}
        {activeTab === 'artists' && (
          <div style={styles.grid}>
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={styles.sectionTitle}>{artistForm.id ? '아티스트 수정' : '새 아티스트 등록'}</h2>
                {artistForm.id && (
                  <button style={styles.primaryBtn as any} onClick={handleArtistNew}>새로 등록</button>
                )}
              </div>
              <form onSubmit={handleArtistSubmit}>
                <div style={styles.formGrid}>
                  <div style={styles.field}>
                    <label style={styles.label}>Artist EN</label>
                    <input style={styles.input as any} value={artistForm.artist_name_en} onChange={(e) => setArtistForm({ ...artistForm, artist_name_en: e.target.value })} required />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Artist KR</label>
                    <input style={styles.input as any} value={artistForm.artist_name_kr || ""} onChange={(e) => setArtistForm({ ...artistForm, artist_name_kr: e.target.value })} />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>순위</label>
                    <input type="number" min="1" max="100" style={styles.input as any} value={artistForm.rank} onChange={(e) => setArtistForm({ ...artistForm, rank: parseInt(e.target.value) || 1 })} required />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>팬 수</label>
                    <input style={styles.input as any} value={artistForm.fan_count ?? ""} onChange={(e) => setArtistForm({ ...artistForm, fan_count: e.target.value })} placeholder="예: 1.2M, 500K" />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>색상 코드</label>
                    <input style={styles.input as any} value={artistForm.color_code || ""} onChange={(e) => setArtistForm({ ...artistForm, color_code: e.target.value })} placeholder="#FF0000" />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>카테고리</label>
                    <select style={styles.select as any} value={artistForm.category || "BOY_GROUP"} onChange={(e) => setArtistForm({ ...artistForm, category: e.target.value as Artist["category"] })}>
                      <option value="BOY_GROUP">BOY_GROUP</option>
                      <option value="GIRL_GROUP">GIRL_GROUP</option>
                      <option value="SOLO">SOLO</option>
                      <option value="MC">MC</option>
                      <option value="ETC">ETC</option>
                    </select>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>소속사</label>
                    <input style={styles.input as any} value={artistForm.agency || ""} onChange={(e) => setArtistForm({ ...artistForm, agency: e.target.value })} />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>팬덤명</label>
                    <input style={styles.input as any} value={artistForm.fandom_name || ""} onChange={(e) => setArtistForm({ ...artistForm, fandom_name: e.target.value })} />
                  </div>

                  <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
                    <label style={styles.label}>한국어 설명</label>
                    <textarea 
                      style={styles.textarea as any} 
                      value={translations.ko} 
                      onChange={(e) => setTranslations({ ...translations, ko: e.target.value })}
                      placeholder="한국어 설명을 입력하세요"
                    />
                  </div>
                  <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
                    <label style={styles.label}>English Description</label>
                    <textarea 
                      style={styles.textarea as any} 
                      value={translations.en} 
                      onChange={(e) => setTranslations({ ...translations, en: e.target.value })}
                      placeholder="Enter English description"
                    />
                  </div>
                  <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
                    <label style={styles.label}>日本語説明</label>
                    <textarea 
                      style={styles.textarea as any} 
                      value={translations.ja} 
                      onChange={(e) => setTranslations({ ...translations, ja: e.target.value })}
                      placeholder="日本語で説明を入力してください"
                    />
                  </div>
                  <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
                    <label style={styles.label}>中文说明</label>
                    <textarea 
                      style={styles.textarea as any} 
                      value={translations.zh} 
                      onChange={(e) => setTranslations({ ...translations, zh: e.target.value })}
                      placeholder="请输入中文说明"
                    />
                  </div>
                  <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
                    <label style={styles.label}>Descripción en Español</label>
                    <textarea 
                      style={styles.textarea as any} 
                      value={translations.es} 
                      onChange={(e) => setTranslations({ ...translations, es: e.target.value })}
                      placeholder="Ingrese la descripción en español"
                    />
                  </div>
                </div>
                <div style={styles.actions}>
                  <button type="submit" style={styles.primaryBtn as any} disabled={artistLoading}>
                    {artistLoading ? "Saving..." : (artistForm.id ? "수정" : "등록")}
                  </button>
                  {artistError && <span style={{ color: "#e74c3c", fontWeight: 600 }}>{artistError}</span>}
                </div>
              </form>
            </div>

            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>아티스트 목록</h2>
              <div style={styles.tableWrap}>
                <table style={styles.table as any}>
                  <thead>
                    <tr>
                        <th style={{...styles.th, width: 45} as any}>순위</th>
                        <th style={styles.th as any}>Artist</th>
                        <th style={styles.th as any}>팬 수</th>
                        <th style={styles.th as any}>카테고리</th>
                        <th style={styles.th as any}>번역</th>
                        <th style={{...styles.th, width: 30}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {artists.length === 0 && (
                      <tr>
                        <td colSpan={6} style={styles.empty as any}>등록된 아티스트가 없습니다.</td>
                      </tr>
                    )}
                    {artists.map((a, index) => (
                      <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => handleArtistEdit(a)}>
                        <td style={styles.td as any}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {index > 0 && (
                                <button 
                                  style={styles.swapBtn as any} 
                                  onClick={(e) => { e.stopPropagation(); swapRanks(a, artists[index - 1]); }}
                                  title="위로 이동">
                                  ▲
                                </button>
                              )}
                              {index < artists.length - 1 && (
                                <button 
                                  style={styles.swapBtn as any} 
                                  onClick={(e) => { e.stopPropagation(); swapRanks(a, artists[index + 1]); }}
                                  title="아래로 이동">
                                  ▼
                                </button>
                              )}
                            </div>  
                            <span style={styles.badge("#D4AF37")}>{a.rank}</span>
                          </div>
                        </td>
                        <td style={styles.td as any}>{a.artist_name_en}{a.artist_name_kr ? ` / ${a.artist_name_kr}` : ""}</td>
                        <td style={styles.td as any}>{a.fan_count || "0"}</td>
                        <td style={styles.td as any}>{a.category || ""}</td>
                        <td style={{...styles.td, textAlign: 'center'} as any}>
                          {a.artist_translations && a.artist_translations.some((t: any) => t.lang === 'ko') ? (
                            <span style={styles.badge("#4CAF50")}>있음</span>
                          ) : (
                            <span style={{ color: '#999' }}>없음</span>
                          )}
                        </td>
                        <td style={{...styles.td, textAlign: 'center'} as any}>
                          <button style={styles.dangerBtn as any} onClick={(e) => { e.stopPropagation(); handleArtistDelete(a.id); }}>del</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* 페이징 UI */}
              {totalPages > 1 && (
                <div style={styles.pagination}>
                  <button 
                    style={styles.pageBtn as any}
                    onClick={() => fetchArtists(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    이전
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        style={{
                          ...styles.pageBtn,
                          ...(pageNum === currentPage ? styles.pageBtnActive : {})
                        } as any}
                        onClick={() => fetchArtists(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button 
                    style={styles.pageBtn as any}
                    onClick={() => fetchArtists(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    다음
                  </button>
                  
                  <span style={styles.pageInfo}>
                    {currentPage} / {totalPages} 페이지 (총 {totalArtists}개)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}