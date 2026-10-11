// AniClash: Beast Rumble - Advanced Leaderboards & League Inspector

const RANK_TIERS = [
    { id: 'bronze', name: 'Bronz Lig', minTrophies: 0, color: '#cd7f32', badge: '🥉' },
    { id: 'silver', name: 'Gümüş Lig', minTrophies: 300, color: '#bdc3c7', badge: '🥈' },
    { id: 'gold', name: 'Altın Lig', minTrophies: 700, color: '#f1c40f', badge: '🥇' },
    { id: 'diamond', name: 'Elmas Lig', minTrophies: 1200, color: '#00cec9', badge: '💎' },
    { id: 'champion', name: 'Efsane Şampiyon', minTrophies: 1800, color: '#e84393', badge: '👑' }
];

const BOT_ROSTER = [
    { name: 'ArenaKralı', avatar: '👑', fav: 'lion', title: 'Kadim Şampiyon', allTime: 1950, monthly: 1450, weekly: 780 },
    { name: 'VahşiPençe', avatar: '⚔️', fav: 'wolf', title: 'Gece Avcısı', allTime: 1720, monthly: 1280, weekly: 690 },
    { name: 'GölgeKurt', avatar: '💀', fav: 'wolf', title: 'Sessiz Katil', allTime: 1540, monthly: 1120, weekly: 610 },
    { name: 'EjderYürek', avatar: '🔥', fav: 'dragon', title: 'Ateş Hakimi', allTime: 1380, monthly: 980, weekly: 530 },
    { name: 'MegaGoril', avatar: '🔱', fav: 'gorilla', title: 'Orman Devi', allTime: 1210, monthly: 860, weekly: 460 },
    { name: 'SiberTilki', avatar: '🔮', fav: 'fox', title: 'Büyü Ustası', allTime: 1050, monthly: 740, weekly: 390 },
    { name: 'YenilmezBoğa', avatar: '🛡️', fav: 'bull', title: 'Durdurulamaz', allTime: 890, monthly: 620, weekly: 330 },
    { name: 'KartalGözü', avatar: '🎯', fav: 'eagle', title: 'Göklerin Efendisi', allTime: 750, monthly: 510, weekly: 280 },
    { name: 'KediReis', avatar: '💎', fav: 'cat', title: '9 Canlı Efsane', allTime: 600, monthly: 420, weekly: 230 },
    { name: 'FırtınaAtı', avatar: '🌪️', fav: 'horse', title: 'Rüzgar Sürücüsü', allTime: 460, monthly: 320, weekly: 180 },
    { name: 'ZırhlıDomuz', avatar: '🪓', fav: 'pig', title: 'Demir Kalkan', allTime: 340, monthly: 230, weekly: 130 },
    { name: 'HızlıÖrdek99', avatar: '⚡', fav: 'duck', title: 'Suikast Ustası', allTime: 220, monthly: 150, weekly: 90 },
    { name: 'AyıBozkurt', avatar: '🌌', fav: 'bear', title: 'Dev Yıkıcı', allTime: 110, monthly: 80, weekly: 45 }
];

class LeaderboardManager {
    constructor(authManager) {
        this.auth = authManager;
        this.currentTimeframe = 'weekly'; // 'weekly' | 'monthly' | 'all_time'
        this.currentFilter = 'all';
        this.searchQuery = '';
    }

    getCurrentTier() {
        const trophies = this.auth.currentUser ? (this.auth.currentUser.profile.trophies || 0) : 0;
        return this.getTierForTrophies(trophies);
    }

    getTierForTrophies(trophies) {
        if (typeof GameRules !== 'undefined' && typeof GameRules.getTierForTrophies === 'function') {
            return GameRules.getTierForTrophies(trophies);
        }
        const tiers = (typeof RANK_TIERS !== 'undefined' ? RANK_TIERS : []);
        let current = tiers[0] || { id: 'bronze', name: 'Bronz Lig', minTrophies: 0, color: '#cd7f32', badge: '🥉' };
        for (const tier of tiers) {
            if (trophies >= tier.minTrophies) {
                current = tier;
            }
        }
        return current;
    }

    getRankTier(trophies) {
        return this.getTierForTrophies(trophies);
    }

    // Haftalık (Pzt-Paz) ve Aylık Kalan Süre Hesaplama
    getTimeframeBannerData() {
        const now = new Date();

        if (this.currentTimeframe === 'weekly') {
            // Haftanın bitişi: Pazar 23:59:59
            // JS getDay(): 0 Pazar, 1 Pazartesi, ... 6 Cumartesi
            const currentDay = now.getDay(); // 0 is Sunday
            const daysUntilSunday = currentDay === 0 ? 0 : 7 - currentDay;
            const targetSunday = new Date(now);
            targetSunday.setDate(now.getDate() + daysUntilSunday);
            targetSunday.setHours(23, 59, 59, 999);

            const diffMs = Math.max(0, targetSunday - now);
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

            const pad = (n) => String(n).padStart(2, '0');

            return {
                icon: '🗓️',
                title: 'HAFTALIK ARENA SIRALAMASI (PZT - PAZ)',
                timer: `⏳ Sezon Bitişi: ${diffDays} Gün ${pad(diffHours)}:${pad(diffMins)}:${pad(diffSecs)} (Pazar 23:59)`,
                sub: 'Her Pazartesi 00:00\'da haftalık sıralama ödülleri dağıtılır ve sıfırlanır.'
            };
        } else if (this.currentTimeframe === 'monthly') {
            // Ay sonu: Bu ayın son günü 23:59:59
            const year = now.getFullYear();
            const month = now.getMonth();
            const lastDayOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

            const diffMs = Math.max(0, lastDayOfMonth - now);
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

            const pad = (n) => String(n).padStart(2, '0');
            const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            const curMonthName = monthNames[month];

            return {
                icon: '📅',
                title: `AYLIK ŞAMPİYONLAR LİSTESİ (${curMonthName.toUpperCase()} ${year})`,
                timer: `⏳ Ay Sonu Sıfırlanma: ${diffDays} Gün ${pad(diffHours)}:${pad(diffMins)}:${pad(diffSecs)}`,
                sub: `${curMonthName} ayı boyunca kazanılan en yüksek lig dereceleri listelenir.`
            };
        } else {
            // Tüm Zamanlar
            return {
                icon: '👑',
                title: 'TÜM ZAMANLAR ONUR LİSTESİ',
                timer: '⭐ Kalıcı Kariyer Sıralaması',
                sub: 'AnimalsVs arenasının gelmiş geçmiş en yüksek kupalı efsane oyuncuları.'
            };
        }
    }

    generateFullLeaderboard() {
        const playerProfile = (this.auth.currentUser && this.auth.currentUser.profile) || {};
        const playerName = (this.auth.currentUser && this.auth.currentUser.username) || 'Oyuncu';
        const playerAvatar = (this.auth.currentUser && this.auth.currentUser.avatar) || '🎮';
        const careerTrophies = playerProfile.trophies !== undefined ? playerProfile.trophies : 150;
        const pWins = playerProfile.wins || 0;
        const pLosses = playerProfile.losses || 0;
        const totalPMatches = pWins + pLosses;
        const pWinRate = totalPMatches > 0 ? Math.round((pWins / totalPMatches) * 100) : 0;

        // Zaman dilimine göre kupa ve istatistik ölçekleme
        let playerTrophies = careerTrophies;
        let playerDisplayWins = pWins;
        let playerDisplayLosses = pLosses;

        if (this.currentTimeframe === 'weekly') {
            // Haftalık skor: Bu haftaki dinamik kupa (Kariyer kupasının ~%40'ı + haftalık galibiyetler)
            playerTrophies = Math.max(30, Math.round(careerTrophies * 0.38 + (pWins * 22)));
            playerDisplayWins = Math.max(0, Math.min(pWins, Math.round(pWins * 0.6) + 1));
            playerDisplayLosses = Math.max(0, Math.min(pLosses, Math.round(pLosses * 0.5)));
        } else if (this.currentTimeframe === 'monthly') {
            // Aylık skor: Bu ayki kupa (Kariyer kupasının ~%75'i + aylık galibiyetler)
            playerTrophies = Math.max(60, Math.round(careerTrophies * 0.72 + (pWins * 18)));
            playerDisplayWins = Math.max(0, Math.min(pWins, Math.round(pWins * 0.85) + 2));
            playerDisplayLosses = Math.max(0, Math.min(pLosses, Math.round(pLosses * 0.8)));
        } else {
            // Tüm zamanlar: Gerçek kariyer istatistikleri
            playerTrophies = careerTrophies;
        }

        const list = [];

        // 1. Oyuncu Kaydı
        list.push({
            id: 'player_user',
            name: playerName,
            avatar: playerAvatar,
            trophies: playerTrophies,
            level: playerProfile.level || 1,
            wins: playerDisplayWins,
            losses: playerDisplayLosses,
            winRate: pWinRate,
            winStreak: playerProfile.winStreak || 0,
            favoriteMonster: playerProfile.favoriteMonster || 'duck',
            title: this.currentTimeframe === 'weekly' ? 'Haftalık Aday' : (this.currentTimeframe === 'monthly' ? 'Aylık Gladyatör' : 'Arena Şampiyonu'),
            isPlayer: true
        });

        // 2. Bot Yarışmacıları (Sabit ve dengeli kupa baremleri ile adil sıralama)
        BOT_ROSTER.forEach((b, idx) => {
            let botTrophies = 0;
            let botWins = 0;
            let botLosses = 0;

            if (this.currentTimeframe === 'weekly') {
                botTrophies = b.weekly;
                botWins = Math.max(2, Math.round(botTrophies / 25) + (idx % 3));
                botLosses = Math.max(1, Math.round(botWins * 0.35));
            } else if (this.currentTimeframe === 'monthly') {
                botTrophies = b.monthly;
                botWins = Math.max(5, Math.round(botTrophies / 20) + idx);
                botLosses = Math.max(2, Math.round(botWins * 0.38));
            } else {
                botTrophies = b.allTime;
                botWins = Math.max(8, Math.round(botTrophies / 15) + idx * 2);
                botLosses = Math.max(3, Math.round(botWins * 0.4));
            }

            const winRate = Math.round((botWins / (botWins + botLosses)) * 100);
            const level = Math.max(1, Math.floor(botTrophies / 180) + 1);

            list.push({
                id: 'bot_' + idx,
                name: b.name,
                avatar: b.avatar,
                trophies: botTrophies,
                level: level,
                wins: botWins,
                losses: botLosses,
                winRate: winRate,
                winStreak: (idx % 4),
                favoriteMonster: b.fav,
                title: b.title,
                isPlayer: false
            });
        });

        // Kupaya göre büyükten küçüğe sırala
        list.sort((a, b) => b.trophies - a.trophies);

        // Rank numarası ve lig belirle
        return list.map((item, index) => ({
            rank: index + 1,
            tier: this.getTierForTrophies(item.trophies),
            ...item
        }));
    }

    getFilteredLeaderboard() {
        let board = this.generateFullLeaderboard();

        // Lig Filtresi
        if (this.currentFilter !== 'all') {
            board = board.filter(item => item.tier.id === this.currentFilter);
        }

        // İsim Arama Filtresi
        if (this.searchQuery && this.searchQuery.trim() !== '') {
            const q = this.searchQuery.toLowerCase().trim();
            board = board.filter(item => item.name.toLowerCase().includes(q));
        }

        return board;
    }
}

if (typeof window !== 'undefined') {
    window.LeaderboardManager = LeaderboardManager;
    window.leaderboardMgr = new LeaderboardManager(window.authMgr);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeaderboardManager;
}
