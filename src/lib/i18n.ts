import type { LanguageCode } from "@/components/LanguageSwitcher";

export type TranslationKey =
  // Navigation
  | "nav.feed" | "nav.following" | "nav.top" | "nav.digest"
  | "nav.videos" | "nav.circles" | "nav.topics"
  // Auth buttons
  | "auth.signIn" | "auth.signOut" | "auth.createAccount"
  // Common actions
  | "common.save" | "common.cancel" | "common.back" | "common.search"
  // User menu
  | "menu.profile" | "menu.saved" | "menu.settings" | "menu.points" | "menu.developer"
  // Settings labels
  | "settings.language" | "settings.theme" | "settings.notifications" | "settings.privacy"
  | "settings.security" | "settings.account"
  // Feed
  | "feed.searchPlaceholder" | "feed.newPapers" | "feed.readPaper";

type Translations = Record<TranslationKey, string>;

const en: Translations = {
  "nav.feed": "Feed", "nav.following": "Following", "nav.top": "Top",
  "nav.digest": "Digest", "nav.videos": "Videos", "nav.circles": "Circles", "nav.topics": "Topics",
  "auth.signIn": "Sign in", "auth.signOut": "Sign out", "auth.createAccount": "Create account",
  "common.save": "Save", "common.cancel": "Cancel", "common.back": "Back", "common.search": "Search",
  "menu.profile": "Profile", "menu.saved": "Saved papers", "menu.settings": "Settings",
  "menu.points": "Points", "menu.developer": "Developer",
  "settings.language": "Language", "settings.theme": "Theme", "settings.notifications": "Notifications",
  "settings.privacy": "Privacy", "settings.security": "Security", "settings.account": "Account",
  "feed.searchPlaceholder": "Search papers…", "feed.newPapers": "new paper", "feed.readPaper": "Read paper",
};

const es: Translations = {
  "nav.feed": "Inicio", "nav.following": "Siguiendo", "nav.top": "Top",
  "nav.digest": "Digest", "nav.videos": "Vídeos", "nav.circles": "Círculos", "nav.topics": "Temas",
  "auth.signIn": "Iniciar sesión", "auth.signOut": "Cerrar sesión", "auth.createAccount": "Crear cuenta",
  "common.save": "Guardar", "common.cancel": "Cancelar", "common.back": "Atrás", "common.search": "Buscar",
  "menu.profile": "Perfil", "menu.saved": "Guardados", "menu.settings": "Ajustes",
  "menu.points": "Puntos", "menu.developer": "Desarrollador",
  "settings.language": "Idioma", "settings.theme": "Tema", "settings.notifications": "Notificaciones",
  "settings.privacy": "Privacidad", "settings.security": "Seguridad", "settings.account": "Cuenta",
  "feed.searchPlaceholder": "Buscar artículos…", "feed.newPapers": "artículo nuevo", "feed.readPaper": "Leer artículo",
};

const fr: Translations = {
  "nav.feed": "Fil", "nav.following": "Abonnements", "nav.top": "Top",
  "nav.digest": "Digest", "nav.videos": "Vidéos", "nav.circles": "Cercles", "nav.topics": "Sujets",
  "auth.signIn": "Se connecter", "auth.signOut": "Se déconnecter", "auth.createAccount": "Créer un compte",
  "common.save": "Enregistrer", "common.cancel": "Annuler", "common.back": "Retour", "common.search": "Rechercher",
  "menu.profile": "Profil", "menu.saved": "Articles sauvegardés", "menu.settings": "Paramètres",
  "menu.points": "Points", "menu.developer": "Développeur",
  "settings.language": "Langue", "settings.theme": "Thème", "settings.notifications": "Notifications",
  "settings.privacy": "Confidentialité", "settings.security": "Sécurité", "settings.account": "Compte",
  "feed.searchPlaceholder": "Rechercher des articles…", "feed.newPapers": "nouvel article", "feed.readPaper": "Lire l'article",
};

const de: Translations = {
  "nav.feed": "Feed", "nav.following": "Folge ich", "nav.top": "Top",
  "nav.digest": "Digest", "nav.videos": "Videos", "nav.circles": "Kreise", "nav.topics": "Themen",
  "auth.signIn": "Anmelden", "auth.signOut": "Abmelden", "auth.createAccount": "Konto erstellen",
  "common.save": "Speichern", "common.cancel": "Abbrechen", "common.back": "Zurück", "common.search": "Suchen",
  "menu.profile": "Profil", "menu.saved": "Gespeicherte Artikel", "menu.settings": "Einstellungen",
  "menu.points": "Punkte", "menu.developer": "Entwickler",
  "settings.language": "Sprache", "settings.theme": "Design", "settings.notifications": "Benachrichtigungen",
  "settings.privacy": "Datenschutz", "settings.security": "Sicherheit", "settings.account": "Konto",
  "feed.searchPlaceholder": "Artikel suchen…", "feed.newPapers": "neuer Artikel", "feed.readPaper": "Artikel lesen",
};

const pt: Translations = {
  "nav.feed": "Feed", "nav.following": "Seguindo", "nav.top": "Top",
  "nav.digest": "Digest", "nav.videos": "Vídeos", "nav.circles": "Círculos", "nav.topics": "Tópicos",
  "auth.signIn": "Entrar", "auth.signOut": "Sair", "auth.createAccount": "Criar conta",
  "common.save": "Salvar", "common.cancel": "Cancelar", "common.back": "Voltar", "common.search": "Buscar",
  "menu.profile": "Perfil", "menu.saved": "Artigos salvos", "menu.settings": "Configurações",
  "menu.points": "Pontos", "menu.developer": "Desenvolvedor",
  "settings.language": "Idioma", "settings.theme": "Tema", "settings.notifications": "Notificações",
  "settings.privacy": "Privacidade", "settings.security": "Segurança", "settings.account": "Conta",
  "feed.searchPlaceholder": "Buscar artigos…", "feed.newPapers": "novo artigo", "feed.readPaper": "Ler artigo",
};

const ar: Translations = {
  "nav.feed": "التغذية", "nav.following": "المتابَعون", "nav.top": "الأفضل",
  "nav.digest": "ملخص", "nav.videos": "فيديوهات", "nav.circles": "الدوائر", "nav.topics": "المواضيع",
  "auth.signIn": "تسجيل الدخول", "auth.signOut": "تسجيل الخروج", "auth.createAccount": "إنشاء حساب",
  "common.save": "حفظ", "common.cancel": "إلغاء", "common.back": "رجوع", "common.search": "بحث",
  "menu.profile": "الملف الشخصي", "menu.saved": "الأبحاث المحفوظة", "menu.settings": "الإعدادات",
  "menu.points": "النقاط", "menu.developer": "مطور",
  "settings.language": "اللغة", "settings.theme": "المظهر", "settings.notifications": "الإشعارات",
  "settings.privacy": "الخصوصية", "settings.security": "الأمان", "settings.account": "الحساب",
  "feed.searchPlaceholder": "ابحث عن أبحاث…", "feed.newPapers": "بحث جديد", "feed.readPaper": "قراءة البحث",
};

const hi: Translations = {
  "nav.feed": "फ़ीड", "nav.following": "अनुसरण", "nav.top": "टॉप",
  "nav.digest": "डाइजेस्ट", "nav.videos": "वीडियो", "nav.circles": "सर्किल", "nav.topics": "विषय",
  "auth.signIn": "साइन इन", "auth.signOut": "साइन आउट", "auth.createAccount": "खाता बनाएं",
  "common.save": "सहेजें", "common.cancel": "रद्द करें", "common.back": "वापस", "common.search": "खोजें",
  "menu.profile": "प्रोफाइल", "menu.saved": "सहेजे गए", "menu.settings": "सेटिंग्स",
  "menu.points": "पॉइंट्स", "menu.developer": "डेवलपर",
  "settings.language": "भाषा", "settings.theme": "थीम", "settings.notifications": "सूचनाएं",
  "settings.privacy": "गोपनीयता", "settings.security": "सुरक्षा", "settings.account": "खाता",
  "feed.searchPlaceholder": "पेपर खोजें…", "feed.newPapers": "नया पेपर", "feed.readPaper": "पेपर पढ़ें",
};

const ja: Translations = {
  "nav.feed": "フィード", "nav.following": "フォロー中", "nav.top": "トップ",
  "nav.digest": "ダイジェスト", "nav.videos": "動画", "nav.circles": "サークル", "nav.topics": "トピック",
  "auth.signIn": "ログイン", "auth.signOut": "ログアウト", "auth.createAccount": "アカウント作成",
  "common.save": "保存", "common.cancel": "キャンセル", "common.back": "戻る", "common.search": "検索",
  "menu.profile": "プロフィール", "menu.saved": "保存済み論文", "menu.settings": "設定",
  "menu.points": "ポイント", "menu.developer": "開発者",
  "settings.language": "言語", "settings.theme": "テーマ", "settings.notifications": "通知",
  "settings.privacy": "プライバシー", "settings.security": "セキュリティ", "settings.account": "アカウント",
  "feed.searchPlaceholder": "論文を検索…", "feed.newPapers": "件の新しい論文", "feed.readPaper": "論文を読む",
};

const ko: Translations = {
  "nav.feed": "피드", "nav.following": "팔로잉", "nav.top": "탑",
  "nav.digest": "다이제스트", "nav.videos": "동영상", "nav.circles": "서클", "nav.topics": "주제",
  "auth.signIn": "로그인", "auth.signOut": "로그아웃", "auth.createAccount": "계정 만들기",
  "common.save": "저장", "common.cancel": "취소", "common.back": "뒤로", "common.search": "검색",
  "menu.profile": "프로필", "menu.saved": "저장된 논문", "menu.settings": "설정",
  "menu.points": "포인트", "menu.developer": "개발자",
  "settings.language": "언어", "settings.theme": "테마", "settings.notifications": "알림",
  "settings.privacy": "개인정보", "settings.security": "보안", "settings.account": "계정",
  "feed.searchPlaceholder": "논문 검색…", "feed.newPapers": "개의 새 논문", "feed.readPaper": "논문 읽기",
};

const zhCN: Translations = {
  "nav.feed": "动态", "nav.following": "关注", "nav.top": "热门",
  "nav.digest": "摘要", "nav.videos": "视频", "nav.circles": "圈子", "nav.topics": "话题",
  "auth.signIn": "登录", "auth.signOut": "退出", "auth.createAccount": "创建账号",
  "common.save": "保存", "common.cancel": "取消", "common.back": "返回", "common.search": "搜索",
  "menu.profile": "个人主页", "menu.saved": "已收藏论文", "menu.settings": "设置",
  "menu.points": "积分", "menu.developer": "开发者",
  "settings.language": "语言", "settings.theme": "主题", "settings.notifications": "通知",
  "settings.privacy": "隐私", "settings.security": "安全", "settings.account": "账号",
  "feed.searchPlaceholder": "搜索论文…", "feed.newPapers": "篇新论文", "feed.readPaper": "阅读论文",
};

const zhTW: Translations = {
  "nav.feed": "動態", "nav.following": "追蹤", "nav.top": "熱門",
  "nav.digest": "摘要", "nav.videos": "影片", "nav.circles": "圈子", "nav.topics": "話題",
  "auth.signIn": "登入", "auth.signOut": "登出", "auth.createAccount": "建立帳號",
  "common.save": "儲存", "common.cancel": "取消", "common.back": "返回", "common.search": "搜尋",
  "menu.profile": "個人頁面", "menu.saved": "已收藏論文", "menu.settings": "設定",
  "menu.points": "點數", "menu.developer": "開發者",
  "settings.language": "語言", "settings.theme": "主題", "settings.notifications": "通知",
  "settings.privacy": "隱私", "settings.security": "安全", "settings.account": "帳號",
  "feed.searchPlaceholder": "搜尋論文…", "feed.newPapers": "篇新論文", "feed.readPaper": "閱讀論文",
};

const ru: Translations = {
  "nav.feed": "Лента", "nav.following": "Подписки", "nav.top": "Топ",
  "nav.digest": "Дайджест", "nav.videos": "Видео", "nav.circles": "Круги", "nav.topics": "Темы",
  "auth.signIn": "Войти", "auth.signOut": "Выйти", "auth.createAccount": "Создать аккаунт",
  "common.save": "Сохранить", "common.cancel": "Отмена", "common.back": "Назад", "common.search": "Поиск",
  "menu.profile": "Профиль", "menu.saved": "Сохранённые статьи", "menu.settings": "Настройки",
  "menu.points": "Очки", "menu.developer": "Разработчик",
  "settings.language": "Язык", "settings.theme": "Тема", "settings.notifications": "Уведомления",
  "settings.privacy": "Конфиденциальность", "settings.security": "Безопасность", "settings.account": "Аккаунт",
  "feed.searchPlaceholder": "Поиск статей…", "feed.newPapers": "новая статья", "feed.readPaper": "Читать статью",
};

const it: Translations = {
  "nav.feed": "Feed", "nav.following": "Seguiti", "nav.top": "Top",
  "nav.digest": "Digest", "nav.videos": "Video", "nav.circles": "Cerchie", "nav.topics": "Argomenti",
  "auth.signIn": "Accedi", "auth.signOut": "Esci", "auth.createAccount": "Crea account",
  "common.save": "Salva", "common.cancel": "Annulla", "common.back": "Indietro", "common.search": "Cerca",
  "menu.profile": "Profilo", "menu.saved": "Articoli salvati", "menu.settings": "Impostazioni",
  "menu.points": "Punti", "menu.developer": "Sviluppatore",
  "settings.language": "Lingua", "settings.theme": "Tema", "settings.notifications": "Notifiche",
  "settings.privacy": "Privacy", "settings.security": "Sicurezza", "settings.account": "Account",
  "feed.searchPlaceholder": "Cerca articoli…", "feed.newPapers": "nuovo articolo", "feed.readPaper": "Leggi articolo",
};

const nl: Translations = {
  "nav.feed": "Feed", "nav.following": "Volgend", "nav.top": "Top",
  "nav.digest": "Digest", "nav.videos": "Video's", "nav.circles": "Kringen", "nav.topics": "Onderwerpen",
  "auth.signIn": "Inloggen", "auth.signOut": "Uitloggen", "auth.createAccount": "Account aanmaken",
  "common.save": "Opslaan", "common.cancel": "Annuleren", "common.back": "Terug", "common.search": "Zoeken",
  "menu.profile": "Profiel", "menu.saved": "Opgeslagen artikelen", "menu.settings": "Instellingen",
  "menu.points": "Punten", "menu.developer": "Ontwikkelaar",
  "settings.language": "Taal", "settings.theme": "Thema", "settings.notifications": "Meldingen",
  "settings.privacy": "Privacy", "settings.security": "Beveiliging", "settings.account": "Account",
  "feed.searchPlaceholder": "Artikelen zoeken…", "feed.newPapers": "nieuw artikel", "feed.readPaper": "Artikel lezen",
};

const tr: Translations = {
  "nav.feed": "Akış", "nav.following": "Takip", "nav.top": "Top",
  "nav.digest": "Özet", "nav.videos": "Videolar", "nav.circles": "Çevreler", "nav.topics": "Konular",
  "auth.signIn": "Giriş yap", "auth.signOut": "Çıkış yap", "auth.createAccount": "Hesap oluştur",
  "common.save": "Kaydet", "common.cancel": "İptal", "common.back": "Geri", "common.search": "Ara",
  "menu.profile": "Profil", "menu.saved": "Kaydedilen makaleler", "menu.settings": "Ayarlar",
  "menu.points": "Puan", "menu.developer": "Geliştirici",
  "settings.language": "Dil", "settings.theme": "Tema", "settings.notifications": "Bildirimler",
  "settings.privacy": "Gizlilik", "settings.security": "Güvenlik", "settings.account": "Hesap",
  "feed.searchPlaceholder": "Makale ara…", "feed.newPapers": "yeni makale", "feed.readPaper": "Makaleyi oku",
};

const pl: Translations = {
  "nav.feed": "Aktualności", "nav.following": "Obserwowani", "nav.top": "Top",
  "nav.digest": "Digest", "nav.videos": "Filmy", "nav.circles": "Kręgi", "nav.topics": "Tematy",
  "auth.signIn": "Zaloguj się", "auth.signOut": "Wyloguj się", "auth.createAccount": "Utwórz konto",
  "common.save": "Zapisz", "common.cancel": "Anuluj", "common.back": "Wróć", "common.search": "Szukaj",
  "menu.profile": "Profil", "menu.saved": "Zapisane artykuły", "menu.settings": "Ustawienia",
  "menu.points": "Punkty", "menu.developer": "Deweloper",
  "settings.language": "Język", "settings.theme": "Motyw", "settings.notifications": "Powiadomienia",
  "settings.privacy": "Prywatność", "settings.security": "Bezpieczeństwo", "settings.account": "Konto",
  "feed.searchPlaceholder": "Szukaj artykułów…", "feed.newPapers": "nowy artykuł", "feed.readPaper": "Czytaj artykuł",
};

const sv: Translations = {
  "nav.feed": "Flöde", "nav.following": "Följer", "nav.top": "Topp",
  "nav.digest": "Digest", "nav.videos": "Videor", "nav.circles": "Cirklar", "nav.topics": "Ämnen",
  "auth.signIn": "Logga in", "auth.signOut": "Logga ut", "auth.createAccount": "Skapa konto",
  "common.save": "Spara", "common.cancel": "Avbryt", "common.back": "Tillbaka", "common.search": "Sök",
  "menu.profile": "Profil", "menu.saved": "Sparade artiklar", "menu.settings": "Inställningar",
  "menu.points": "Poäng", "menu.developer": "Utvecklare",
  "settings.language": "Språk", "settings.theme": "Tema", "settings.notifications": "Aviseringar",
  "settings.privacy": "Integritet", "settings.security": "Säkerhet", "settings.account": "Konto",
  "feed.searchPlaceholder": "Sök artiklar…", "feed.newPapers": "ny artikel", "feed.readPaper": "Läs artikel",
};

const id: Translations = {
  "nav.feed": "Beranda", "nav.following": "Mengikuti", "nav.top": "Teratas",
  "nav.digest": "Digest", "nav.videos": "Video", "nav.circles": "Lingkaran", "nav.topics": "Topik",
  "auth.signIn": "Masuk", "auth.signOut": "Keluar", "auth.createAccount": "Buat akun",
  "common.save": "Simpan", "common.cancel": "Batal", "common.back": "Kembali", "common.search": "Cari",
  "menu.profile": "Profil", "menu.saved": "Artikel tersimpan", "menu.settings": "Pengaturan",
  "menu.points": "Poin", "menu.developer": "Pengembang",
  "settings.language": "Bahasa", "settings.theme": "Tema", "settings.notifications": "Notifikasi",
  "settings.privacy": "Privasi", "settings.security": "Keamanan", "settings.account": "Akun",
  "feed.searchPlaceholder": "Cari artikel…", "feed.newPapers": "artikel baru", "feed.readPaper": "Baca artikel",
};

const vi: Translations = {
  "nav.feed": "Trang chủ", "nav.following": "Đang theo dõi", "nav.top": "Hàng đầu",
  "nav.digest": "Tóm tắt", "nav.videos": "Video", "nav.circles": "Nhóm", "nav.topics": "Chủ đề",
  "auth.signIn": "Đăng nhập", "auth.signOut": "Đăng xuất", "auth.createAccount": "Tạo tài khoản",
  "common.save": "Lưu", "common.cancel": "Hủy", "common.back": "Quay lại", "common.search": "Tìm kiếm",
  "menu.profile": "Hồ sơ", "menu.saved": "Bài báo đã lưu", "menu.settings": "Cài đặt",
  "menu.points": "Điểm", "menu.developer": "Nhà phát triển",
  "settings.language": "Ngôn ngữ", "settings.theme": "Giao diện", "settings.notifications": "Thông báo",
  "settings.privacy": "Quyền riêng tư", "settings.security": "Bảo mật", "settings.account": "Tài khoản",
  "feed.searchPlaceholder": "Tìm kiếm bài báo…", "feed.newPapers": "bài báo mới", "feed.readPaper": "Đọc bài báo",
};

const th: Translations = {
  "nav.feed": "ฟีด", "nav.following": "กำลังติดตาม", "nav.top": "ยอดนิยม",
  "nav.digest": "สรุป", "nav.videos": "วิดีโอ", "nav.circles": "กลุ่ม", "nav.topics": "หัวข้อ",
  "auth.signIn": "เข้าสู่ระบบ", "auth.signOut": "ออกจากระบบ", "auth.createAccount": "สร้างบัญชี",
  "common.save": "บันทึก", "common.cancel": "ยกเลิก", "common.back": "กลับ", "common.search": "ค้นหา",
  "menu.profile": "โปรไฟล์", "menu.saved": "บทความที่บันทึก", "menu.settings": "การตั้งค่า",
  "menu.points": "คะแนน", "menu.developer": "นักพัฒนา",
  "settings.language": "ภาษา", "settings.theme": "ธีม", "settings.notifications": "การแจ้งเตือน",
  "settings.privacy": "ความเป็นส่วนตัว", "settings.security": "ความปลอดภัย", "settings.account": "บัญชี",
  "feed.searchPlaceholder": "ค้นหาบทความ…", "feed.newPapers": "บทความใหม่", "feed.readPaper": "อ่านบทความ",
};

export const translations: Record<LanguageCode, Translations> = {
  en, es, fr, de, pt, ar, hi, ja, ko,
  "zh-CN": zhCN, "zh-TW": zhTW,
  ru, it, nl, tr, pl, sv, id, vi, th,
};

export function t(lang: LanguageCode, key: TranslationKey): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}

// useTranslation hook lives in components to avoid circular deps.
// Import it from "@/components/useTranslation" instead.
