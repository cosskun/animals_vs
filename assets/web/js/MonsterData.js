// AniClash: Beast Rumble - Monster Data & Skill Definitions (12+ Canavar)

const MONSTER_TEMPLATES = [
    {
        id: 'duck',
        name: 'Ördek (Duck)',
        emoji: '🦆',
        role: 'Hızlı Suikastçı',
        color: '#f1c40f',
        category: 'speed',
        hpRange: [75, 105],
        atkRange: [28, 44],
        spdRange: [16, 24],
        critRange: [18, 32],
        skillName: 'Mega Vak-Vak',
        skillDesc: 'Düşmanı sersemletir ve yüksek kritik hasar vurur.',
        element: 'Rüzgar',
        tacticalTip: 'Yüksek sersemletme şansı sayesinde tehlikeli düşmanların turunu kilitler.'
    },
    {
        id: 'pig',
        name: 'Domuz (Pig)',
        emoji: '🐗',
        role: 'Zırhlı Tank',
        color: '#e84393',
        category: 'tank',
        hpRange: [140, 190],
        atkRange: [18, 28],
        spdRange: [8, 14],
        critRange: [5, 15],
        skillName: 'Toslama Saldırısı',
        skillDesc: 'Kendine zırh kalkanı basar ve sert vurur.',
        element: 'Toprak',
        tacticalTip: 'Yüksek canı ve kalkan basma yeteneğiyle hasar emici ön hat canavarıdır.'
    },
    {
        id: 'horse',
        name: 'At (Horse)',
        emoji: '🐎',
        role: 'Dengeli Savaşçı',
        color: '#d63031',
        category: 'speed',
        hpRange: [105, 145],
        atkRange: [24, 38],
        spdRange: [16, 24],
        critRange: [12, 22],
        skillName: 'Yıldırım Nalı',
        skillDesc: 'Hedefe art arda 2 güçlü çifte tekme vurur.',
        element: 'Ateş',
        tacticalTip: 'Hızlı ve dengeli ataklarıyla erken turlarda düşman zırhını eritir.'
    },
    {
        id: 'wolf',
        name: 'Kurt (Wolf)',
        emoji: '🐺',
        role: 'Vahşi DPS',
        color: '#636e72',
        category: 'dps',
        hpRange: [90, 130],
        atkRange: [32, 48],
        spdRange: [15, 23],
        critRange: [20, 35],
        skillName: 'Kanlı Uluma',
        skillDesc: 'Sert saldırı yapar ve verdiği hasarın bir kısmını can çalar.',
        element: 'Karanlık',
        tacticalTip: 'Can çalma yeteneği ile hem vurur hem yaşar; birebir koridorlarda çok güçlüdür.'
    },
    {
        id: 'bear',
        name: 'Ayı (Bear)',
        emoji: '🐻',
        role: 'Dev Yıkıcı',
        color: '#a0522d',
        category: 'tank',
        hpRange: [150, 200],
        atkRange: [26, 40],
        spdRange: [6, 12],
        critRange: [10, 25],
        skillName: 'Ayı Pençesi',
        skillDesc: 'Tüm rakip canavarlara alan hasarı savurur.',
        element: 'Toprak',
        tacticalTip: 'Alan hasarı ile aynı anda 3 rakip canavara birden vuruş indirir.'
    },
    {
        id: 'eagle',
        name: 'Kartal (Eagle)',
        emoji: '🦅',
        role: 'Hava Avcısı',
        color: '#0984e3',
        category: 'speed',
        hpRange: [80, 115],
        atkRange: [34, 46],
        spdRange: [18, 26],
        critRange: [20, 35],
        skillName: 'Gök Dalışı',
        skillDesc: 'Düşmanın kalkanını yok sayarak kritik delip geçer.',
        element: 'Rüzgar',
        tacticalTip: 'Tankların arkasına gizlenen kalkanlı canavarları delip geçmek için birebirdir.'
    },
    {
        id: 'fox',
        name: 'Tilki (Fox)',
        emoji: '🦊',
        role: 'Kurnaz Büyücü',
        color: '#e67e22',
        category: 'special',
        hpRange: [85, 120],
        atkRange: [26, 40],
        spdRange: [16, 25],
        critRange: [15, 28],
        skillName: 'Ateş Hilesi',
        skillDesc: 'Düşmanı 2 tur boyunca alevler içinde yakar.',
        element: 'Ateş',
        tacticalTip: 'Yanma etkisi yüksek can havuzuna sahip boss ve tankları eritir.'
    },
    {
        id: 'lion',
        name: 'Aslan (Lion)',
        emoji: '🦁',
        role: 'Kraliyet Lideri',
        color: '#f39c12',
        category: 'dps',
        hpRange: [115, 155],
        atkRange: [28, 44],
        spdRange: [13, 20],
        critRange: [14, 26],
        skillName: 'Kral Kükremesi',
        skillDesc: 'Düşmanı korkutarak hasar verir ve saldırısını kırar.',
        element: 'Işık',
        tacticalTip: 'Rakibin en güçlü vuran koridoruna koyularak rakibin atağı etkisiz kılınır.'
    },
    {
        id: 'cat',
        name: 'Kedi (Cat)',
        emoji: '🐱',
        role: 'Çevik Kaçıcı',
        color: '#9b59b6',
        category: 'speed',
        hpRange: [70, 105],
        atkRange: [25, 38],
        spdRange: [20, 28],
        critRange: [25, 45],
        skillName: 'Dokuz Can',
        skillDesc: 'Ölümcül hasarı savuşturur ve can tazeler.',
        element: 'Işık',
        tacticalTip: '9 can pasifi sayesinde bir kez ölümden döner, rakibin turlarını boşa harcatır.'
    },
    {
        id: 'bull',
        name: 'Boğa (Bull)',
        emoji: '🐂',
        role: 'Öfkeli Ezici',
        color: '#c0392b',
        category: 'tank',
        hpRange: [130, 175],
        atkRange: [26, 40],
        spdRange: [10, 16],
        critRange: [10, 22],
        skillName: 'Kırmızı Öfke',
        skillDesc: 'Canı azaldıkça atağı ikiye katlanır ve öfkeyle çarpar.',
        element: 'Ateş',
        tacticalTip: 'Ön safta hasar aldıkça güçlenir, düşük canla canavarları tek darbede indirebilir.'
    },
    {
        id: 'dragon',
        name: 'Ejder Dino (Dragon)',
        emoji: '🐲',
        role: 'Efsanevi Canavar',
        color: '#10ac84',
        category: 'dps',
        hpRange: [120, 160],
        atkRange: [30, 48],
        spdRange: [14, 22],
        critRange: [18, 30],
        skillName: 'Ejder Nefesi',
        skillDesc: 'Önündeki hedefe ve yanındaki komşu slota lav püskürtür.',
        element: 'Ateş',
        tacticalTip: 'Orta slotta (Slot 2) konumlandırıldığında tüm rakip takıma sıçrayan hasar verir.'
    },
    {
        id: 'gorilla',
        name: 'Goril (Gorilla)',
        emoji: '🦍',
        role: 'Zırh Kıran',
        color: '#57606f',
        category: 'tank',
        hpRange: [135, 185],
        atkRange: [28, 45],
        spdRange: [11, 18],
        critRange: [12, 24],
        skillName: 'Göğüs Tokadı',
        skillDesc: 'Düşmanı geri savurur ve saldırı gücünü yükseltir.',
        element: 'Toprak',
        tacticalTip: 'Yüksek canı ve zırh kırma gücü ile rakip tankların en büyük kabusudur.'
    },
    {
        id: 'tiger',
        name: 'Kaplan (Tiger)',
        emoji: '🐯',
        role: 'Yırtıcı Avcı',
        color: '#e17055',
        category: 'dps',
        hpRange: [95, 135],
        atkRange: [33, 49],
        spdRange: [17, 25],
        critRange: [22, 38],
        skillName: 'Pençe Kasırgası',
        skillDesc: 'Hedefe art arda 3 ölümcül pençe darbesi indirir.',
        element: 'Ateş',
        tacticalTip: 'Yüksek kritik vuruş ihtimaliyle hızlıca rakip koridoru düşürmek için idealdir.'
    },
    {
        id: 'shark',
        name: 'Köpekbalığı (Shark)',
        emoji: '🦈',
        role: 'Okyanus Yargıcı',
        color: '#00cec9',
        category: 'dps',
        hpRange: [100, 140],
        atkRange: [31, 47],
        spdRange: [15, 23],
        critRange: [20, 35],
        skillName: 'Derin İnfaz',
        skillDesc: 'Canı %50 altındaki hedeflere 2.2x ölümcül infaz hasarı vurur.',
        element: 'Su',
        tacticalTip: 'Yaralı düşmanları temizlemede en ölümcül koridor canavarıdır.'
    },
    {
        id: 'snake',
        name: 'Kobra (Snake)',
        emoji: '🐍',
        role: 'Zehir Ustası',
        color: '#00b894',
        category: 'special',
        hpRange: [80, 115],
        atkRange: [27, 42],
        spdRange: [19, 27],
        critRange: [18, 30],
        skillName: 'Ölümcül Toksin',
        skillDesc: 'Düşmanı zehirler ve her tur artan zehir hasarı uygular.',
        element: 'Doğa',
        tacticalTip: 'Yüksek hızlıdır; maça erken başlayıp rakibe zehir bırakarak onu zayıflatır.'
    },
    {
        id: 'rhino',
        name: 'Gergedan (Rhino)',
        emoji: '🦏',
        role: 'Ağır Balyoz',
        color: '#636e72',
        category: 'tank',
        hpRange: [145, 195],
        atkRange: [24, 37],
        spdRange: [7, 13],
        critRange: [8, 18],
        skillName: 'Boynuz Barikatı',
        skillDesc: 'Kendine devasa koruyucu kalkan açar ve karşı koridora tos atar.',
        element: 'Toprak',
        tacticalTip: 'En yüksek dayanıklılığa sahip tanklardan biridir; arkasındaki koridoru korur.'
    },
    {
        id: 'panda',
        name: 'Mistik Panda (Panda)',
        emoji: '🐼',
        role: 'Chi Hakimi',
        color: '#fdcb6e',
        category: 'special',
        hpRange: [110, 150],
        atkRange: [25, 39],
        spdRange: [12, 19],
        critRange: [15, 26],
        skillName: 'Zen Dalgası',
        skillDesc: 'Kendi canını yeniler ve takımına enerji desteği sağlar.',
        element: 'Işık',
        tacticalTip: 'Savaşın uzun sürdüğü taktiksel maçlarda takımın hayatta kalma garantisidir.'
    },
    {
        id: 'phoenix',
        name: 'Zümrüdüanka (Phoenix)',
        emoji: '🦚',
        role: 'Kadim Alev Kuşu',
        color: '#fd79a8',
        category: 'special',
        hpRange: [90, 125],
        atkRange: [32, 48],
        spdRange: [18, 26],
        critRange: [20, 36],
        skillName: 'Küllerden Doğuş',
        skillDesc: 'Büyük alev patlamasıyla hasar vurur ve canını tazeler.',
        element: 'Ateş',
        tacticalTip: 'Hava üstünlüğü ve can tazeleme yeteneği ile zorlu anlarda maçı çevirir.'
    }
];

class MonsterFactory {
    static randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static createMonster(templateId, level = 1, isBot = false, slotIndex = 0, statMultiplier = 1.0, aiTier = 1) {
        const template = MONSTER_TEMPLATES.find(t => t.id === templateId) || MONSTER_TEMPLATES[0];
        const levelMultiplier = 1 + (level - 1) * 0.12;
        const totalMult = levelMultiplier * (statMultiplier || 1.0);

        const baseHp = this.randomBetween(template.hpRange[0], template.hpRange[1]);
        const baseAtk = this.randomBetween(template.atkRange[0], template.atkRange[1]);
        const baseSpd = this.randomBetween(template.spdRange[0], template.spdRange[1]);
        const baseCrit = this.randomBetween(template.critRange[0], template.critRange[1]);

        const scaledHp = Math.round(baseHp * totalMult);
        const scaledAtk = Math.round(baseAtk * totalMult);
        const scaledSpd = Math.round(baseSpd * (1 + (level - 1) * 0.05 + ((statMultiplier || 1.0) - 1) * 0.25));
        const scaledCrit = Math.min(60, Math.round(baseCrit * (1 + ((statMultiplier || 1.0) - 1) * 0.4)));

        return {
            instanceId: 'm_' + Math.random().toString(36).substr(2, 9),
            templateId: template.id,
            name: template.name,
            emoji: template.emoji,
            role: template.role,
            color: template.color,
            level: level,
            maxHp: scaledHp,
            currentHp: scaledHp,
            atk: scaledAtk,
            spd: scaledSpd,
            crit: scaledCrit,
            skillName: template.skillName,
            skillDesc: template.skillDesc,
            element: template.element,
            isBot: isBot,
            aiTier: aiTier, // 1: Acemi, 2: Taktikçi, 3: Usta, 4: Boss
            slotIndex: slotIndex, // 0, 1 veya 2 (Slot 1, Slot 2, Slot 3)
            shield: 0,
            burnTurns: 0,
            hasExtraLife: template.id === 'cat',
            isStunned: false,
            energy: 0,
            maxEnergy: 100
        };
    }

    // Oyuncuya maç öncesi 5 rastgele canavar önerisi üretir
    static get5DraftRecommendations(playerLevel = 1) {
        const shuffled = [...MONSTER_TEMPLATES].sort(() => 0.5 - Math.random());
        const chosen5 = shuffled.slice(0, 5);

        return chosen5.map(tpl => this.createMonster(tpl.id, playerLevel, false, -1));
    }
}

const ELEMENT_SYNERGIES = {
    'Ateş': {
        name: 'Alev Hiddeti',
        icon: '🔥',
        desc: 'Takım Saldırı Gücü +%15 artar',
        color: '#ff4757',
        buff: { atkMult: 1.15 }
    },
    'Toprak': {
        name: 'Taş Muhafız',
        icon: '🌿',
        desc: 'Tüm takım maça +35 Kalkan ile başlar',
        color: '#2ed573',
        buff: { startShield: 35 }
    },
    'Rüzgar': {
        name: 'Fırtına Çevikliği',
        icon: '🌪️',
        desc: 'Takım Hızı +%20 artar (İlk vuruş avantajı)',
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
};

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

const TITAN_BOSS_DATA = {
    id: 'titan_ignis',
    name: 'Kadim Titan Ejderha (Ignis)',
    emoji: '🐲',
    role: 'Haftalık Dünya Bossu',
    color: '#ff4757',
    element: 'Ateş',
    maxHp: 2500,
    currentHp: 2500,
    atk: 52,
    spd: 12,
    crit: 25,
    skillName: 'Kıyamet Alevi',
    skillDesc: 'Tüm koridorlardaki canavarlara aynı anda lav püskürtür.',
    isBoss: true
};

// Global browser bindings
if (typeof window !== 'undefined') {
    window.MONSTER_TEMPLATES = MONSTER_TEMPLATES;
    window.ELEMENT_SYNERGIES = (typeof GameRules !== 'undefined' && GameRules.ELEMENT_SYNERGIES) || ELEMENT_SYNERGIES;
    window.calculateTeamSynergy = (typeof GameRules !== 'undefined' && GameRules.calculateTeamSynergy) || calculateTeamSynergy;
    window.TITAN_BOSS_DATA = TITAN_BOSS_DATA;
    window.MonsterFactory = MonsterFactory;
}

// Node.js CommonJS export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MONSTER_TEMPLATES,
        ELEMENT_SYNERGIES: (typeof GameRules !== 'undefined' && GameRules.ELEMENT_SYNERGIES) || ELEMENT_SYNERGIES,
        calculateTeamSynergy: (typeof GameRules !== 'undefined' && GameRules.calculateTeamSynergy) || calculateTeamSynergy,
        TITAN_BOSS_DATA,
        MonsterFactory
    };
}
