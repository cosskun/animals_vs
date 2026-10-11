// AniClash: Beast Rumble - Bot Generator with Adaptive Difficulty, ELO/MMR Matchmaking & History

class BotGenerator {
    constructor() {
        this.STORAGE_KEY = 'aniclash_bot_lineups_history_v2';
        this.history = this.loadHistory();
    }

    loadHistory() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY) || localStorage.getItem('animalsvs_bot_lineups_history_v2');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    saveHistory() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.history));
        } catch (e) {}
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
    }

    getTeamSignature(templateIds) {
        return [...templateIds].sort().join('-');
    }

    // Oyuncunun Kupa, Galibiyet Serisi ve Seviyesine Göre Zorluk & ELO/MMR Hesaplama
    calculateMatchmakingDifficulty(playerProfile = {}) {
        if (typeof GameRules !== 'undefined' && typeof GameRules.calculateMatchmakingDifficulty === 'function') {
            return GameRules.calculateMatchmakingDifficulty(playerProfile);
        }

        const level = typeof playerProfile === 'number' ? playerProfile : (playerProfile.level || 1);
        const trophies = (playerProfile && playerProfile.trophies) || 0;
        const winStreak = (playerProfile && playerProfile.winStreak) || 0;
        const winRate = (playerProfile && playerProfile.winRate) || 50;

        // MMR Puanı
        const mmr = trophies + (winStreak * 75) + (winRate >= 60 ? (winRate - 50) * 8 : 0);

        let aiTier = 1;
        let tierName = 'Acemi Arenası';
        let difficultyLabel = '🥉 Acemi Rakip';
        let statMultiplier = 1.0;
        let botBadgeClass = 'tier-bronze';

        if (winStreak >= 6 || mmr >= 1200 || trophies >= 1000) {
            // EFSANEVİ BOSS & SERİ KIRAN TİER
            aiTier = 4;
            tierName = 'Efsanevi Gladyatör Arenası';
            statMultiplier = 1.25 + Math.min(0.15, (winStreak - 5) * 0.03); // +25% to +40%
            difficultyLabel = `👑 EFSANEVİ BOSS (+%${Math.round((statMultiplier - 1) * 100)} Güç & Taktik AI)`;
            botBadgeClass = 'tier-master';
        } else if (winStreak >= 3 || mmr >= 650 || trophies >= 500) {
            // USTA & YÜKSEK SERİ TİER
            aiTier = 3;
            tierName = 'Usta Ligi Arenası';
            statMultiplier = 1.15 + ((winStreak - 2) * 0.03); // +15% to +24%
            difficultyLabel = `🥇 Usta Bot (+%${Math.round((statMultiplier - 1) * 100)} Güç & Odak AI)`;
            botBadgeClass = 'tier-gold';
        } else if (winStreak >= 2 || mmr >= 250 || trophies >= 200) {
            // TAKTİKÇİ / DENGELİ TİER
            aiTier = 2;
            tierName = 'Gümüş Taktikçi Arenası';
            statMultiplier = 1.07 + ((winStreak - 1) * 0.02); // +7% to +11%
            difficultyLabel = `🥈 Taktik Rakip (+%${Math.round((statMultiplier - 1) * 100)} Güç)`;
            botBadgeClass = 'tier-silver';
        } else {
            // ÇAYLAK / ACEMİ
            aiTier = 1;
            tierName = 'Bronz Başlangıç Arenası';
            statMultiplier = 1.0;
            difficultyLabel = '🥉 Standart Rakip';
            botBadgeClass = 'tier-bronze';
        }

        return {
            level,
            trophies,
            winStreak,
            mmr,
            aiTier,
            tierName,
            difficultyLabel,
            statMultiplier: Math.round(statMultiplier * 100) / 100,
            statBonusPct: Math.round((statMultiplier - 1) * 100),
            botBadgeClass
        };
    }

    // Akıllı Rol ve Sinerji Seçimi
    selectSmartBotComposition(aiTier) {
        // Rol Grupları
        const tanks = ['pig', 'bear', 'gorilla', 'bull']; // Dayanıklı ön hat
        const assassins = ['duck', 'eagle', 'cat']; // Yüksek hız ve kritik
        const burstDps = ['wolf', 'dragon', 'lion', 'fox', 'horse']; // Yüksek hasar ve yetenek

        const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

        if (aiTier >= 3) {
            // Usta / Efsane Kompozisyonu: 1 Tank + 1 Suikastçı + 1 Yıkıcı Burst (Maksimum Sinerji)
            const t = pickOne(tanks);
            const a = pickOne(assassins.filter(id => id !== t));
            const d = pickOne(burstDps.filter(id => id !== t && id !== a));
            // Slot dizilimini taktiksel yap: Tank ortada veya Slot 1'de, DPS'ler yanlarda
            return Math.random() > 0.5 ? [t, d, a] : [d, t, a];
        } else if (aiTier === 2) {
            // Taktikçi Kompozisyonu: 1 Dayanıklı + 2 Karma Hasar
            const t = pickOne(tanks);
            const remaining = MONSTER_TEMPLATES.map(m => m.id).filter(id => id !== t);
            const shuffled = remaining.sort(() => 0.5 - Math.random());
            return [t, shuffled[0], shuffled[1]];
        } else {
            // Acemi: Rastgele 3
            const allIds = MONSTER_TEMPLATES.map(m => m.id);
            const shuffled = [...allIds].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, 3);
        }
    }

    // Benzersiz ve ELO/MMR uyumlu 3'lü bot takımı üretir
    generateUniqueBotTeam(playerProfile = {}) {
        const diff = this.calculateMatchmakingDifficulty(playerProfile);
        const allIds = MONSTER_TEMPLATES.map(t => t.id);
        const maxAttempts = 100;
        let attempts = 0;
        let chosenIds = [];

        while (attempts < maxAttempts) {
            attempts++;
            chosenIds = this.selectSmartBotComposition(diff.aiTier);
            const signature = this.getTeamSignature(chosenIds);

            if (!this.history.includes(signature)) {
                this.history.push(signature);
                if (this.history.length > 50) {
                    this.history.shift();
                }
                this.saveHistory();
                break;
            }
        }

        if (attempts >= maxAttempts) {
            this.clearHistory();
            this.history.push(this.getTeamSignature(chosenIds));
            this.saveHistory();
        }

        const team = chosenIds.map((id, slotIdx) => 
            MonsterFactory.createMonster(id, diff.level, true, slotIdx, diff.statMultiplier, diff.aiTier)
        );

        // Takıma ve maça matchmaking metadata ekle
        team.matchmaking = diff;
        return team;
    }

    // Oyuncu ile botun aynı 3 canavarı seçip seçmediği kontrolü
    isSameTeam(playerTeamIds, botTeamIds) {
        if (typeof GameRules !== 'undefined' && typeof GameRules.isSameTeam === 'function') {
            return GameRules.isSameTeam(playerTeamIds, botTeamIds);
        }
        if (!playerTeamIds || !botTeamIds || playerTeamIds.length !== botTeamIds.length) {
            return false;
        }
        return this.getTeamSignature(playerTeamIds) === this.getTeamSignature(botTeamIds);
    }
}

if (typeof window !== 'undefined') {
    window.BotGenerator = BotGenerator;
    window.botGen = new BotGenerator();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BotGenerator;
}
