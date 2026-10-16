// AniClash: Beast Rumble - Profile & Match History Manager

const ACHIEVEMENTS = [
    { id: 'first_win', name: 'İlk Zafer', desc: 'Arenada ilk maçını kazan', icon: '🎖️', check: p => p.wins >= 1 },
    { id: 'streak_3', name: 'Durdurulamaz', desc: '3 maçlık galibiyet serisi yap', icon: '🔥', check: p => p.bestStreak >= 3 },
    { id: 'streak_5', name: 'Arena Hakimi', desc: '5 maçlık galibiyet serisi yap', icon: '⚡', check: p => p.bestStreak >= 5 },
    { id: 'veteran', name: 'Kıdemli Savaşçı', desc: 'Toplam 10 maç yap', icon: '⚔️', check: p => (p.wins + p.losses) >= 10 },
    { id: 'champion', name: 'Şampiyon Adayı', desc: '1000 kupaya ulaş', icon: '👑', check: p => p.trophies >= 1000 }
];

class ProfileManager {
    constructor(authManager) {
        this.auth = authManager;
    }

    getProfile() {
        if (!this.auth.currentUser) return null;
        return this.auth.currentUser.profile;
    }

    updateBasicInfo(newUsername, newAvatar) {
        if (!this.auth.currentUser) return { success: false };

        const users = this.auth.getUsers();
        const oldName = this.auth.currentUser.username;
        const trimmedNewName = newUsername.trim();

        if (trimmedNewName !== oldName) {
            if (users[trimmedNewName]) {
                return { success: false, message: 'Bu kullanıcı adı zaten kullanımda.' };
            }
            // İsim değişti, eski kaydı silip yenisini ekle
            delete users[oldName];
            this.auth.currentUser.username = trimmedNewName;
            localStorage.setItem(this.auth.STORAGE_CURRENT_USER_KEY, trimmedNewName);
        }

        if (newAvatar) {
            this.auth.currentUser.avatar = newAvatar;
        }

        this.auth.saveCurrentUserData();
        return { success: true };
    }

    recordMatch(isVictory, playerTeam, botTeam, trophyDelta, expDelta, tokenReward = 15, predictionResult = null) {
        const prof = this.getProfile();
        if (!prof) return;

        if (prof.tokens === undefined) prof.tokens = 250;
        if (prof.predictionRights === undefined) prof.predictionRights = 3;
        if (prof.rerollRights === undefined) prof.rerollRights = 3;

        // Token ödülü ekle
        prof.tokens += tokenReward;

        // Maç geçmişi kaydı
        const matchRecord = {
            id: 'm_' + Date.now(),
            date: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            victory: isVictory,
            trophyDelta: trophyDelta,
            expDelta: expDelta,
            tokenReward: tokenReward,
            prediction: predictionResult,
            playerTeam: playerTeam.map(m => ({ name: m.name, emoji: m.emoji, role: m.role })),
            botTeam: botTeam.map(m => ({ name: m.name, emoji: m.emoji, role: m.role }))
        };

        if (!prof.matchHistory) prof.matchHistory = [];
        prof.matchHistory.unshift(matchRecord);
        if (prof.matchHistory.length > 15) {
            prof.matchHistory.pop();
        }

        // İstatistik güncellemeleri
        if (isVictory) {
            prof.wins += 1;
            prof.winStreak += 1;
            if (prof.winStreak > prof.bestStreak) {
                prof.bestStreak = prof.winStreak;
            }
            prof.trophies += trophyDelta;
            this.recordQuestProgress('win', 1);
        } else {
            prof.losses += 1;
            prof.winStreak = 0;
            prof.trophies = Math.max(0, prof.trophies + trophyDelta); // trophyDelta negatif gelir
            this.recordQuestProgress('loss', 1);
        }
        this.recordQuestProgress('match_played', 1);

        this.addExp(expDelta);
        this.auth.saveCurrentUserData();
    }

    getDailyQuest() {
        const prof = this.getProfile();
        if (!prof) return null;

        const today = new Date().toISOString().slice(0, 10);
        const dailyBattles = prof.dailyBattles || {};
        const playedToday = (dailyBattles.date === today) ? (dailyBattles.played || 0) : 0;

        // Yeni gün veya henüz görev objesi yoksa sıfırdan oluştur
        if (!prof.dailyQuest || prof.dailyQuest.date !== today) {
            prof.dailyQuest = {
                date: today,
                id: 'daily_win_1',
                title: 'Bugün 1 Arena Savaşı Kazan',
                desc: '1 Arena maçı kazanarak ödülünü topla!',
                target: 1,
                current: 0,
                rewardTokens: 50,
                rewardExp: 25,
                claimed: false
            };
            this.auth.saveCurrentUserData();
        } else if (playedToday === 0 && (prof.dailyQuest.current > 0 || prof.dailyQuest.claimed)) {
            // Bugün hiç maç yapılmamışsa ama eski hatadan dolayı görev tamamlanmış görünüyorsa sıfırla
            prof.dailyQuest.current = 0;
            prof.dailyQuest.claimed = false;
            this.auth.saveCurrentUserData();
        }

        return prof.dailyQuest;
    }

    recordQuestProgress(type, amount = 1) {
        const prof = this.getProfile();
        if (!prof) return null;

        const quest = this.getDailyQuest();
        if (!quest || quest.claimed) return quest;

        if (quest.id === 'daily_win_1' && type === 'win') {
            quest.current = Math.min(quest.target, quest.current + amount);
        } else if (quest.id === 'daily_play_2' && (type === 'win' || type === 'loss' || type === 'match_played')) {
            quest.current = Math.min(quest.target, quest.current + amount);
        }

        this.auth.saveCurrentUserData();
        return quest;
    }

    claimDailyQuest() {
        const prof = this.getProfile();
        if (!prof) return { success: false, message: 'Profil bulunamadı.' };

        const quest = this.getDailyQuest();
        if (!quest) return { success: false, message: 'Görev bulunamadı.' };
        if (quest.current < quest.target) return { success: false, message: 'Görev henüz tamamlanmadı!' };
        if (quest.claimed) return { success: false, message: 'Bu görev ödülü zaten alındı!' };

        quest.claimed = true;
        prof.tokens = (prof.tokens || 0) + quest.rewardTokens;
        this.addExp(quest.rewardExp);
        this.auth.saveCurrentUserData();

        return {
            success: true,
            rewardTokens: quest.rewardTokens,
            rewardExp: quest.rewardExp
        };
    }

    addExp(amount) {
        const prof = this.getProfile();
        if (!prof) return;

        prof.exp += amount;
        while (prof.exp >= prof.expToNext) {
            prof.exp -= prof.expToNext;
            prof.level += 1;
            prof.expToNext = Math.round(prof.expToNext * 1.3);
        }
    }

    getStats() {
        const prof = this.getProfile();
        if (!prof) return null;

        const totalMatches = (prof.wins || 0) + (prof.losses || 0);
        const winRate = totalMatches > 0 ? Math.round((prof.wins / totalMatches) * 100) : 0;

        const unlockedAchievements = ACHIEVEMENTS.map(ach => ({
            ...ach,
            unlocked: ach.check(prof)
        }));

        return {
            totalMatches,
            winRate,
            wins: prof.wins || 0,
            losses: prof.losses || 0,
            winStreak: prof.winStreak || 0,
            bestStreak: prof.bestStreak || 0,
            trophies: prof.trophies || 0,
            level: prof.level || 1,
            exp: prof.exp || 0,
            expToNext: prof.expToNext || 100,
            achievements: unlockedAchievements,
            matchHistory: prof.matchHistory || []
        };
    }
    // --- 7 GÜNLÜK GİRİŞ TAKVİMİ & ÖDÜLLERİ ---
    getDailyLoginRewardsList() {
        return [
            { day: 1, rewardText: '50 Altın Token', icon: '🪙', tokens: 50, tickets: 0, avatar: null },
            { day: 2, rewardText: '1 Taktik Bileti', icon: '🎟️', tokens: 0, tickets: 1, avatar: null },
            { day: 3, rewardText: '100 Altın Token', icon: '🪙', tokens: 100, tickets: 0, avatar: null },
            { day: 4, rewardText: '2 Taktik Bileti', icon: '🎟️', tokens: 0, tickets: 2, avatar: null },
            { day: 5, rewardText: '200 Altın Token', icon: '💰', tokens: 200, tickets: 0, avatar: null },
            { day: 6, rewardText: '3 Taktik Bileti', icon: '🎟️', tokens: 0, tickets: 3, avatar: null },
            { day: 7, rewardText: '500 Token + 👑 Efsanevi Avatar', icon: '👑', tokens: 500, tickets: 3, avatar: '👑' }
        ];
    }

    getDailyLoginStatus() {
        const prof = this.getProfile();
        if (!prof) return null;

        const today = new Date().toISOString().slice(0, 10);
        if (!prof.dailyLogin) {
            prof.dailyLogin = {
                lastClaimDate: null,
                currentStreak: 1,
                claimedToday: false
            };
        }

        const dl = prof.dailyLogin;
        if (dl.lastClaimDate === today) {
            dl.claimedToday = true;
        } else {
            dl.claimedToday = false;
            if (dl.lastClaimDate) {
                const lastDate = new Date(dl.lastClaimDate);
                const curDate = new Date(today);
                const diffDays = Math.round((curDate - lastDate) / (1000 * 60 * 60 * 24));
                if (diffDays > 1) {
                    dl.currentStreak = 1;
                }
            }
        }

        this.auth.saveCurrentUserData();
        return {
            ...dl,
            rewards: this.getDailyLoginRewardsList(),
            canClaim: !dl.claimedToday
        };
    }

    claimDailyLoginReward() {
        const prof = this.getProfile();
        if (!prof) return { success: false, message: 'Profil bulunamadı.' };

        const status = this.getDailyLoginStatus();
        if (!status || !status.canClaim) {
            return { success: false, message: 'Bugünkü giriş ödülünüzü zaten aldınız!' };
        }

        const streakIdx = Math.max(0, Math.min(6, status.currentStreak - 1));
        const reward = status.rewards[streakIdx];
        const today = new Date().toISOString().slice(0, 10);

        if (reward.tokens) prof.tokens = (prof.tokens || 0) + reward.tokens;
        if (reward.tickets) prof.predictionRights = (prof.predictionRights || 0) + reward.tickets;
        if (reward.avatar && !prof.unlockedAvatars?.includes(reward.avatar)) {
            prof.unlockedAvatars = prof.unlockedAvatars || [];
            prof.unlockedAvatars.push(reward.avatar);
        }

        prof.dailyLogin.lastClaimDate = today;
        prof.dailyLogin.claimedToday = true;
        prof.dailyLogin.currentStreak = (status.currentStreak % 7) + 1;

        this.auth.saveCurrentUserData();
        return {
            success: true,
            message: `Tebrikler! ${status.currentStreak}. Gün Ödülü (${reward.rewardText}) hesabınıza tanımlandı!`,
            reward: reward,
            newTokens: prof.tokens,
            newTickets: prof.predictionRights
        };
    }
}

if (typeof window !== 'undefined') {
    window.ProfileManager = ProfileManager;
    window.profileMgr = new ProfileManager(window.authMgr);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfileManager;
}
