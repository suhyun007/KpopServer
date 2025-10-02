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
  start_time?: string; // 시간 (HH:MM)
  end_time?: string; // 시간 (HH:MM)
  timezone?: string; // 타임존 (예: "Asia/Seoul", "America/Los_Angeles")
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
  category?: "BOY_GROUP" | "GIRL_GROUP" | "COED_GROUP" | "SOLO" | "MC" | "ETC";
  agency?: string;
  fandom_name?: string;
  instagram_id?: string;
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
    start_time: "",
    end_time: "",
    timezone: "",
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

  // 스크래핑 데이터 관련 상태
  const [scrapedConcerts, setScrapedConcerts] = useState<any[]>([]);
  const [scrapedLoading, setScrapedLoading] = useState(false);

  // 아티스트 관련 상태
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistSearchTerm, setArtistSearchTerm] = useState<string>("");
  const [artistForm, setArtistForm] = useState<Artist>({
    artist_name_en: "",
    artist_name_kr: "",
    rank: 1,
    fan_count: "",
    color_code: "",
    category: "BOY_GROUP",
    agency: "",
    fandom_name: "",
    instagram_id: "",
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
      // 콘서트 탭에서도 아티스트 데이터를 가져와야 셀렉트 박스에 표시됨
      fetchAllArtists(); // 모든 아티스트 조회
      if (activeTab === 'concerts') {
        fetchConcerts();
      } else {
        fetchArtists(); // 아티스트 탭에서는 페이징된 데이터
      }
    }
  }, [activeTab]);

  const handleLogin = async () => {
    try {
      // 간단한 비밀번호 체크 (실제 환경에서는 더 강력한 인증 필요)
      if (password === 'adminowner') {
        setIsAuthenticated(true);
        localStorage.setItem('admin_authenticated', 'true');
        // 콘서트 탭에서도 아티스트 데이터를 가져와야 셀렉트 박스에 표시됨
        fetchAllArtists(); // 모든 아티스트 조회
        if (activeTab === 'concerts') {
          fetchConcerts();
        } else {
          fetchArtists(); // 아티스트 탭에서는 페이징된 데이터
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
    const res = await fetch("/api/concerts?show_all=true"); // 관리자용: 모든 콘서트 조회
    const json = await res.json();
    if (json.success) setConcerts(json.concerts);
  }

  // 콘서트용 아티스트 조회 (모든 아티스트)
  async function fetchAllArtists() {
    try {
      const res = await fetch("/api/artists?search=true"); // 이름순 정렬로 모든 아티스트 조회
      const json = await res.json();
      if (json.success) setArtists(json.artists || []);
    } catch (e: any) {
      console.error("Failed to fetch all artists:", e);
    }
  }

  async function fetchScrapedConcerts() {
    setScrapedLoading(true);
    try {
      const res = await fetch("/api/scraped-concerts");
      const json = await res.json();
      if (json.success) setScrapedConcerts(json.concerts);
    } catch (error) {
      console.error("Failed to fetch scraped concerts:", error);
    } finally {
      setScrapedLoading(false);
    }
  }

  async function toggleProcessedStatus(id: number, currentStatus: boolean) {
    try {
      const res = await fetch(`/api/scraped-concerts?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processed: !currentStatus })
      });
      
      const json = await res.json();
      if (json.success) {
        // 로컬 상태 업데이트
        setScrapedConcerts(prev => 
          prev.map(concert => 
            concert.id === id 
              ? { ...concert, processed: !currentStatus }
              : concert
          )
        );
      } else {
        alert(`처리 상태 변경 실패: ${json.error}`);
      }
    } catch (error) {
      console.error("Failed to toggle processed status:", error);
      alert("처리 상태 변경 중 오류가 발생했습니다.");
    }
  }


  async function handleConcertSubmit(e: React.FormEvent) {
    e.preventDefault();
    setConcertLoading(true);
    setConcertError(null);
    try {
      const isUpdate = concertForm.id;
      const url = isUpdate ? `/api/concerts?id=${concertForm.id}` : "/api/concerts";
      const method = isUpdate ? "PUT" : "POST";
      
      // 날짜와 시간을 조합해서 ISO 형식으로 변환
      const processedForm = {
        ...concertForm,
        artist_id: concertForm.artist_id || undefined,
        start_date: concertForm.start_date ? (() => {
          if (concertForm.start_time) {
            // 날짜 + 시간을 조합해서 ISO 형식으로 저장
            const dateTimeString = `${concertForm.start_date}T${concertForm.start_time}:00`;
            return new Date(dateTimeString).toISOString();
          } else {
            // 시간이 없으면 자정으로 설정
            return new Date(concertForm.start_date + 'T00:00:00').toISOString();
          }
        })() : undefined,
        end_date: concertForm.end_date ? (() => {
          if (concertForm.end_time) {
            const dateTimeString = `${concertForm.end_date}T${concertForm.end_time}:00`;
            return new Date(dateTimeString).toISOString();
          } else {
            return new Date(concertForm.end_date + 'T00:00:00').toISOString();
          }
        })() : undefined
      };
      
      // start_time, end_time 필드는 제거 (DB에 저장하지 않음)
      delete processedForm.start_time;
      delete processedForm.end_time;
      
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processedForm),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed");
      alert(isUpdate ? "콘서트가 성공적으로 수정되었습니다!" : "콘서트가 성공적으로 등록되었습니다!");
      setConcertForm({ artist_id: undefined, artist_name_en: "", artist_name_kr: "", start_date: "", end_date: "", start_time: "", end_time: "", timezone: "", concert_type: "CONCERT", venue_name_en: "", venue_name_kr: "", city: "", country: "", ticket_price: "", description: "", memo: "" });
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
    // 필요한 필드만 추출해서 폼에 설정 (동적 필드 제외)
    const processedConcert = {
      id: concert.id,
      artist_id: concert.artist_id,
      artist_name_en: concert.artist_name_en || '',
      artist_name_kr: concert.artist_name_kr || '',
      start_date: concert.start_date ? concert.start_date.split('T')[0] : '',
      end_date: concert.end_date ? concert.end_date.split('T')[0] : '',
      start_time: concert.start_date ? (() => {
        const dateTime = new Date(concert.start_date);
        const hours = dateTime.getHours().toString().padStart(2, '0');
        const minutes = dateTime.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      })() : '',
      end_time: concert.end_date ? (() => {
        const dateTime = new Date(concert.end_date);
        const hours = dateTime.getHours().toString().padStart(2, '0');
        const minutes = dateTime.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      })() : '',
      timezone: concert.timezone || '',
      concert_type: concert.concert_type || 'CONCERT',
      venue_name_en: concert.venue_name_en || '',
      venue_name_kr: concert.venue_name_kr || '',
      city: concert.city || '',
      country: concert.country || '',
      ticket_price: concert.ticket_price || '',
      description: concert.description || '',
      memo: concert.memo || ''
    };
    setConcertForm(processedConcert);
  }

  function handleConcertNew() {
    setConcertForm({ artist_id: undefined, artist_name_en: "", artist_name_kr: "", start_date: "", end_date: "", start_time: "", end_time: "", timezone: "", concert_type: "CONCERT", venue_name_en: "", venue_name_kr: "", city: "", country: "", ticket_price: "", description: "", memo: "" });
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
      const url = isUpdate ? `/api/artists?id=${artistForm.id}` : "/api/artists";
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
          console.error("Failed to save translation:", e);
          // 번역 저장 실패해도 아티스트 등록은 성공으로 처리
        }
      }
      
      alert(isUpdate ? "아티스트가 성공적으로 수정되었습니다!" : "아티스트가 성공적으로 등록되었습니다!");
      setArtistForm({ artist_name_en: "", artist_name_kr: "", rank: 1, fan_count: "", color_code: "", category: "BOY_GROUP", agency: "", fandom_name: "", instagram_id: "" });
      setTranslations({ ko: "", en: "", ja: "", zh: "", es: "" });
      fetchArtists(); // 아티스트 탭용 페이징 데이터
      fetchAllArtists(); // 콘서트 셀렉트 박스용 전체 데이터
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
        res = await fetch(`/api/artist-translations?id=${existingTranslation.id}`, {
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
      
      console.log("Response status:", res.status);
      console.log("Response ok:", res.ok);
      
      const json = await res.json();
      console.log("Response JSON:", json);
      
      if (!json.success) throw new Error(json.error || "Failed to save translation");
    } catch (e: any) {
      console.error("Translation save error:", e);
      console.error("Error type:", typeof e);
      console.error("Error details:", e);
    }
  }

  async function handleArtistDelete(id?: number) {
    if (!id) return;
    const ok = window.confirm("삭제하시겠습니까?");
    if (!ok) return;
    await fetch(`/api/artists/${id}`, { method: "DELETE" });
    fetchArtists(); // 아티스트 탭용 페이징 데이터
    fetchAllArtists(); // 콘서트 셀렉트 박스용 전체 데이터
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
      instagram_id: artist.instagram_id || "",
      created_at: artist.created_at || undefined,
      updated_at: artist.updated_at || undefined,
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
      console.error("Failed to fetch translations:", e);
      setAvailableTranslations([]);
      setTranslations({ ko: "", en: "", ja: "", zh: "", es: "" });
    }
  }

  function handleArtistNew() {
    setArtistForm({ artist_name_en: "", artist_name_kr: "", rank: 1, fan_count: "", color_code: "", category: "BOY_GROUP", agency: "", fandom_name: "", instagram_id: "" });
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
      fetchArtists(); // 아티스트 탭용 페이징 데이터
      fetchAllArtists(); // 콘서트 셀렉트 박스용 전체 데이터
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
    timeInput: { height: 38, borderRadius: 8, border: "1px solid #e3e3e7", padding: "0 12px", fontSize: "14px", fontFamily: "monospace" },
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
                    <label style={styles.label}>아티스트 선택</label>
                    <select 
                      style={styles.select as any} 
                      value={concertForm.artist_id || ""} 
                      onChange={(e) => {
                        const selectedArtistId = e.target.value ? parseInt(e.target.value) : undefined;
                        const selectedArtist = artists.find(a => a.id === selectedArtistId);
                        setConcertForm({ 
                          ...concertForm, 
                          artist_id: selectedArtistId,
                          artist_name_en: selectedArtist?.artist_name_en || "",
                          artist_name_kr: selectedArtist?.artist_name_kr || ""
                        });
                      }}
                      required
                    >
                      <option value="">아티스트를 선택하세요</option>
                      {artists.map((artist) => (
                        <option key={artist.id} value={artist.id}>
                          {artist.artist_name_en}{artist.artist_name_kr ? ` (${artist.artist_name_kr})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>시작날짜</label>
                    <input type="date" style={styles.input as any} value={concertForm.start_date} onChange={(e) => setConcertForm({ ...concertForm, start_date: e.target.value })} required />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>시작시간 (24시간 형식)</label>
                    <input 
                      type="time" 
                      step="60" 
                      style={styles.timeInput as any} 
                      value={concertForm.start_time || ""} 
                      onChange={(e) => setConcertForm({ ...concertForm, start_time: e.target.value })}
                      placeholder="HH:MM"
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>종료날짜 (선택)</label>
                    <input type="date" style={styles.input as any} value={concertForm.end_date || ""} onChange={(e) => setConcertForm({ ...concertForm, end_date: e.target.value })} />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>종료시간 (24시간 형식)</label>
                    <input 
                      type="time" 
                      step="60" 
                      style={styles.timeInput as any} 
                      value={concertForm.end_time || ""} 
                      onChange={(e) => setConcertForm({ ...concertForm, end_time: e.target.value })}
                      placeholder="HH:MM"
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>타임존</label>
                    <select style={styles.select as any} value={concertForm.timezone || ""} onChange={(e) => setConcertForm({ ...concertForm, timezone: e.target.value })}>
                      <option value="">선택하세요</option>
                      
                      <optgroup label="아시아">
                        <option value="Asia/Seoul">Asia/Seoul (한국)</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (일본)</option>
                        <option value="Asia/Shanghai">Asia/Shanghai (중국)</option>
                        <option value="Asia/Hong_Kong">Asia/Hong_Kong (홍콩)</option>
                        <option value="Asia/Taipei">Asia/Taipei (대만)</option>
                        <option value="Asia/Singapore">Asia/Singapore (싱가포르)</option>
                        <option value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur (말레이시아)</option>
                        <option value="Asia/Bangkok">Asia/Bangkok (태국)</option>
                        <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (베트남)</option>
                        <option value="Asia/Manila">Asia/Manila (필리핀)</option>
                        <option value="Asia/Jakarta">Asia/Jakarta (인도네시아)</option>
                        <option value="Asia/Kolkata">Asia/Kolkata (인도)</option>
                        <option value="Asia/Dubai">Asia/Dubai (UAE)</option>
                      </optgroup>
                      
                      <optgroup label="미국/캐나다">
                        <option value="America/New_York">America/New_York (미국 동부)</option>
                        <option value="America/Chicago">America/Chicago (미국 중부)</option>
                        <option value="America/Denver">America/Denver (미국 산지)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (미국 서부)</option>
                        <option value="America/Anchorage">America/Anchorage (알래스카)</option>
                        <option value="Pacific/Honolulu">Pacific/Honolulu (하와이)</option>
                        <option value="America/Toronto">America/Toronto (캐나다 동부)</option>
                        <option value="America/Vancouver">America/Vancouver (캐나다 서부)</option>
                      </optgroup>
                      
                      <optgroup label="유럽">
                        <option value="Europe/London">Europe/London (영국)</option>
                        <option value="Europe/Paris">Europe/Paris (프랑스)</option>
                        <option value="Europe/Berlin">Europe/Berlin (독일)</option>
                        <option value="Europe/Rome">Europe/Rome (이탈리아)</option>
                        <option value="Europe/Madrid">Europe/Madrid (스페인)</option>
                        <option value="Europe/Amsterdam">Europe/Amsterdam (네덜란드)</option>
                        <option value="Europe/Stockholm">Europe/Stockholm (스웨덴)</option>
                        <option value="Europe/Moscow">Europe/Moscow (러시아)</option>
                      </optgroup>
                      
                      <optgroup label="오세아니아">
                        <option value="Australia/Sydney">Australia/Sydney (호주 동부)</option>
                        <option value="Australia/Melbourne">Australia/Melbourne (호주 남동부)</option>
                        <option value="Australia/Perth">Australia/Perth (호주 서부)</option>
                        <option value="Pacific/Auckland">Pacific/Auckland (뉴질랜드)</option>
                      </optgroup>
                      
                      <optgroup label="기타">
                        <option value="Africa/Cairo">Africa/Cairo (이집트)</option>
                        <option value="Africa/Johannesburg">Africa/Johannesburg (남아프리카)</option>
                        <option value="America/Sao_Paulo">America/Sao_Paulo (브라질)</option>
                        <option value="America/Mexico_City">America/Mexico_City (멕시코)</option>
                        <option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos_Aires (아르헨티나)</option>
                      </optgroup>
                    </select>
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
                      <option value="GOODS">GOODS</option>
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

       {/* 스크래핑 데이터 섹션 */}
       <div style={styles.card}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
           <h2 style={styles.sectionTitle}>스크래핑된 콘서트 데이터</h2>
           <button 
             style={styles.primaryBtn as any} 
             onClick={fetchScrapedConcerts}
             disabled={scrapedLoading}
           >
             {scrapedLoading ? '로딩중...' : '새로고침'}
           </button>
         </div>
              <div style={styles.tableWrap}>
                <table style={styles.table as any}>
                  <thead>
                    <tr>
                      <th style={styles.th as any}>처리</th>
                      <th style={styles.th as any}>제목</th>
                      <th style={styles.th as any}>날짜</th>
                      <th style={styles.th as any}>도시</th>
                      <th style={styles.th as any}>소스</th>
                      <th style={styles.th as any}>스크래핑 시각</th>
                      <th style={styles.th as any}>처리 상태</th>
                      <th style={styles.th as any}>티켓 URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scrapedConcerts.length === 0 && !scrapedLoading && (
                      <tr>
                        <td colSpan={8} style={styles.empty as any}>스크래핑된 데이터가 없습니다.</td>
                      </tr>
                    )}
                    {scrapedLoading && (
                      <tr>
                        <td colSpan={8} style={styles.empty as any}>로딩중...</td>
                      </tr>
                    )}
                    {scrapedConcerts.map((scraped) => (
                      <tr key={scraped.id}>
                        <td style={{...styles.td, textAlign: 'center'} as any}>
                          <input
                            type="checkbox"
                            checked={scraped.processed || false}
                            onChange={() => toggleProcessedStatus(scraped.id, scraped.processed || false)}
                            style={{ 
                              width: 16, 
                              height: 16, 
                              cursor: 'pointer',
                              accentColor: '#D4AF37'
                            }}
                          />
                        </td>
                        <td style={styles.td as any}>{scraped.title || 'N/A'}</td>
                        <td style={styles.td as any}>{scraped.date || 'N/A'}</td>
                        <td style={styles.td as any}>{scraped.city || 'N/A'}</td>
                        <td style={styles.td as any}>{scraped.source || 'N/A'}</td>
                        <td style={styles.td as any}>{scraped.scraped_at ? new Date(scraped.scraped_at).toLocaleString() : 'N/A'}</td>
                        <td style={styles.td as any}>
                          <span style={{ 
                            color: scraped.processed ? '#27ae60' : '#e74c3c',
                            fontWeight: 'bold'
                          }}>
                            {scraped.processed ? '처리완료' : '미처리'}
                          </span>
                        </td>
                        <td style={styles.td as any}>
                          {scraped.ticket_url ? (
                            <a 
                              href={scraped.ticket_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: '#3498db', textDecoration: 'underline' }}
                            >
                              링크
                            </a>
                          ) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                          (() => {
                            // ISO 형식에서 날짜 부분만 추출
                            const startDate = c.start_date ? c.start_date.split('T')[0] : '';
                            const endDate = c.end_date ? c.end_date.split('T')[0] : '';
                            
                            return c.end_date && endDate !== startDate 
                              ? `${startDate} ~ ${endDate}`
                              : startDate;
                          })()
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
                      <option value="COED_GROUP">COED_GROUP</option>
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
                  <div style={styles.field}>
                    <label style={styles.label}>인스타그램 ID</label>
                    <input style={styles.input as any} value={artistForm.instagram_id || ""} onChange={(e) => setArtistForm({ ...artistForm, instagram_id: e.target.value })} placeholder="@username 또는 username" />
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
              
              {/* 아티스트 검색 */}
              <div style={styles.field}>
                <label style={styles.label}>아티스트 검색</label>
                <input 
                  style={styles.input as any} 
                  value={artistSearchTerm} 
                  onChange={(e) => setArtistSearchTerm(e.target.value)} 
                  placeholder="영문명 또는 한글명으로 검색..."
                />
              </div>
              
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
                    {artists.length > 0 && artists.filter((a) => {
                      if (!artistSearchTerm) return true;
                      const searchLower = artistSearchTerm.toLowerCase();
                      return (
                        a.artist_name_en.toLowerCase().includes(searchLower) ||
                        (a.artist_name_kr && a.artist_name_kr.includes(artistSearchTerm))
                      );
                    }).length === 0 && (
                      <tr>
                        <td colSpan={6} style={styles.empty as any}>검색 결과가 없습니다.</td>
                      </tr>
                    )}
                    {artists
                      .filter((a) => {
                        if (!artistSearchTerm) return true;
                        const searchLower = artistSearchTerm.toLowerCase();
                        return (
                          a.artist_name_en.toLowerCase().includes(searchLower) ||
                          (a.artist_name_kr && a.artist_name_kr.includes(artistSearchTerm))
                        );
                      })
                      .map((a, index) => (
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