// AniClash: Beast Rumble - Core Game Rules, Constants & Balance Engine

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.GameRules = factory();
        // Also bind legacy globals for backward compatibility
        root.ELEMENT_SYNERGIES = root.GameRules.ELEMENT_SYNERGIES;
        root.calculateTeamSynergy = root.GameRules.calculateTeamSynergy;
        root.RANK_TIERS = root.GameRules.RANK_TIERS;
        root.GAME_CONSTANTS = root.GameRules.CONSTANTS;
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // 1. OYUN SABİTLERİ (IMMUTABLE GAME CONSTANTS)
    const CONSTANTS = Object.freeze({
        LANES_COUNT: 3,                 // Koridor sayısı (Slot 1, Slot 2, Slot 3)
        DRAFT_POOL_SIZE: 5,             // Oyuncuya sunulan canavar havuzu büyüklüğü
        DAILY_BATTLES_MAX: 3,           // Günlük resmi lig savaşı limiti
        DAILY_RESET_HOUR: 0,            // Gece sıfırlanma saati (00:00)
        PREDICTION_TICKET_COST: 1,      // AI simülasyon ve tahmin için harcanan bilet
        REROLL_TICKET_COST: 1,          // Canavar yenileme için harcanan bilet
        BASE_EXP_PER_WIN: 45,           // Galibiyette kazanılan temel TP
        BASE_EXP_PER_LOSS: 12,          // Mağlubiyette kazanılan temel TP
        BASE_TOKEN_PER_WIN: 15,         // Galibiyet temel Token ödülü
        BASE_TOKEN_PER_LOSS: 4,         // Mağlubiyet teselli Token ödülü
        INITIAL_TOKENS: 250,            // Yeni hesap başlangıç Token miktarı
        INITIAL_PREDICTION_RIGHTS: 3,   // Yeni hesap başlangıç Tahmin Bilet hakkı
        INITIAL_REROLL_RIGHTS: 3,       // Yeni hesap başlangıç Canavar Yenileme Bilet hakkı
        INITIAL_TROPHIES: 150,          // Yeni hesap başlangıç kupası
        LEVEL_STAT_SCALE: 0.12,         // Seviye başına canavar güç çarpanı (+%12)
        LEVEL_EXP_BASE: 100,            // Seviye 1 -> 2 için gereken temel TP
        LEVEL_EXP_GROWTH: 1.30          // Sonraki seviye TP artış çarpanı (+%30)
    });

    // 2. ELEMENT SİNERJİLERİ (ELEMENT SYNERGIES & TEAM BUFFS)
    const ELEMENT_SYNERGIES = Object.freeze({
        'Ateş': {
            name: 'Alev Hiddeti',
            icon: '🔥',
            desc: 'Takım Saldırı Gücü (ATK) +%15 artar',
            color: '#ff4757',
            buff: { atkMult: 1.15 }
        },
        'Toprak': {
            name: 'Kaya Barikatı',
            icon: '🌿',
            desc: 'Tüm takım maça +35 Kalkan (Zırh) ile başlar',
            color: '#2ed573',
            buff: { startShield: 35 }
        },
        'Rüzgar': {
            name: 'Fırtına Çevikliği',
            icon: '🌪️',
            desc: 'Takım Hızı (SPD) +%20 artar (İlk vuruş avantajı)',
            color: '#70a1ff',
            buff: { spdMult: 1.20 }
        },
        'Su': {
            name: 'Hayat Akışı',
            icon: '💧',
            desc: 'Vuruşlarda +%15 Can Çalma sağlar',
            color: '#1e90ff',
            buff: { lifesteal: 0.15 }
        },
        'Işık': {
            name: 'Kutsal Işık',
            icon: '☀️',
            desc: 'Kritik Vuruş Şansı +%18 artar',
            color: '#ffa502',
            buff: { critBonus: 18 }
        },
        'Karanlık': {
            name: 'Gölge Laneti',
            icon: '🌑',
            desc: 'Kritik Şansı +%18 ve +%10 Zırh Delme',
            color: '#a55eea',
            buff: { critBonus: 18, armorPierce: 0.10 }
        },
        'Doğa': {
            name: 'Zehirli Sarmaşık',
            icon: '🍃',
            desc: 'Her tur başı rakibe +12 Doğa Hasarı vurur',
            color: '#26de81',
            buff: { dotDamage: 12 }
        }
    });

    // 3. LİGLER VE KUPA BASAMAKLARI (RANK TIERS)
    const RANK_TIERS = Object.freeze([
        { id: 'bronze', name: 'Bronz Lig', minTrophies: 0, color: '#cd7f32', badge: '🥉' },
        { id: 'silver', name: 'Gümüş Lig', minTrophies: 300, color: '#bdc3c7', badge: '🥈' },
        { id: 'gold', name: 'Altın Lig', minTrophies: 700, color: '#f1c40f', badge: '🥇' },
        { id: 'diamond', name: 'Elmas Lig', minTrophies: 1200, color: '#00cec9', badge: '💎' },
        { id: 'champion', name: 'Efsane Şampiyon', minTrophies: 1800, color: '#e84393', badge: '👑' }
    ]);

    // 4. KURAL VE HESAPLAMA FONKSİYONLARI (RULE ENGINE FUNCTIONS)

    /**
     * Takımdaki canavarların element sinerjisini hesaplar.
     * En az 2 canavar aynı elemente sahipse sinerji aktif olur.
     */
    function calculateTeamSynergy(teamMonsters) {
        if (!teamMonsters || !Array.isArray(teamMonsters)) return null;
        const counts = {};
        teamMonsters.forEach(m => {
            if (!m || !m.element) return;
            counts[m.element] = (counts[m.element] || 0) + 1;
        });

        for (const elem in counts) {
            if (counts[elem] >= 2 && ELEMENT_SYNERGIES[elem]) {
                return {
                    element: elem,
                    count: counts[elem],
                    ...ELEMENT_SYNERGIES[elem]
                };
            }
        }
        return null;
    }

    /**
     * Kupa miktarına göre lig derecesini belirler.
     */
    function getTierForTrophies(trophies = 0) {
        const tr = Math.max(0, Number(trophies) || 0);
        let current = RANK_TIERS[0];
        for (const tier of RANK_TIERS) {
            if (tr >= tier.minTrophies) {
                current = tier;
            }
        }
        return current;
    }

    /**
     * Oyuncunun profiline göre ELO / MMR ve bot zorluk derecesini hesaplar.
     */
    function calculateMatchmakingDifficulty(playerProfile = {}) {
        const level = typeof playerProfile === 'number' ? playerProfile : (playerProfile.level || 1);
        const trophies = (playerProfile && playerProfile.trophies) || 0;
        const winStreak = (playerProfile && playerProfile.winStreak) || 0;
        const winRate = (playerProfile && playerProfile.winRate) || 50;

        // MMR Puanı
        const mmr = trophies + (winStreak * 75) + (winRate >= 60 ? (winRate - 50) * 8 : 0);

        let aiTier = 1;
        let tierName = 'Acemi Arenası';
        let difficultyLabel = '🥉 Standart Rakip';
        let statMultiplier = 1.0;
        let botBadgeClass = 'tier-bronze';

        if (winStreak >= 6 || mmr >= 1200 || trophies >= 1000) {
            // Efsanevi Boss Tier
            aiTier = 4;
            tierName = 'Efsanevi Gladyatör Arenası';
            statMultiplier = 1.25 + Math.min(0.15, (winStreak - 5) * 0.03);
            difficultyLabel = `👑 EFSANEVİ BOSS (+%${Math.round((statMultiplier - 1) * 100)} Güç & Taktik AI)`;
            botBadgeClass = 'tier-master';
        } else if (winStreak >= 3 || mmr >= 650 || trophies >= 500) {
            // Usta Bot Tier
            aiTier = 3;
            tierName = 'Usta Ligi Arenası';
            statMultiplier = 1.15 + ((winStreak - 2) * 0.03);
            difficultyLabel = `🥇 Usta Bot (+%${Math.round((statMultiplier - 1) * 100)} Güç & Odak AI)`;
            botBadgeClass = 'tier-gold';
        } else if (winStreak >= 2 || mmr >= 250 || trophies >= 200) {
            // Taktikçi Bot Tier
            aiTier = 2;
            tierName = 'Gümüş Taktikçi Arenası';
            statMultiplier = 1.07 + ((winStreak - 1) * 0.02);
            difficultyLabel = `🥈 Taktik Rakip (+%${Math.round((statMultiplier - 1) * 100)} Güç)`;
            botBadgeClass = 'tier-silver';
        } else {
            // Standart Acemi Tier
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

    /**
     * İki takımın birebir aynı 3 canavarı seçip seçmediğini denetler.
     * Kural: Oyuncu rakip bot ile birebir aynı 3'lü dizilimi kuramaz.
     */
    function isSameTeam(team1Ids, team2Ids) {
        if (!team1Ids || !team2Ids || team1Ids.length !== team2Ids.length) {
            return false;
        }
        const sig1 = [...team1Ids].filter(Boolean).sort().join('-');
        const sig2 = [...team2Ids].filter(Boolean).sort().join('-');
        return sig1.length > 0 && sig1 === sig2;
    }

    return Object.freeze({
        CONSTANTS,
        ELEMENT_SYNERGIES,
        RANK_TIERS,
        calculateTeamSynergy,
        getTierForTrophies,
        calculateMatchmakingDifficulty,
        isSameTeam
    });
}));
