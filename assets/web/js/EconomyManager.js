// AniClash: Beast Rumble - Token Economy, Prediction Rights & Store Manager

const TOKEN_PACKAGES_REAL_MONEY = [
    { id: 'tok_100', name: 'Başlangıç Kesesi', tokens: 100, bonus: 0, priceTL: '19.99 ₺', icon: '💰', badge: 'Popüler' },
    { id: 'tok_500', name: 'Savaşçı Sandığı', tokens: 500, bonus: 50, priceTL: '89.99 ₺', icon: '📦', badge: '+%10 Bonus' },
    { id: 'tok_1200', name: 'Gladyatör Hazinesi', tokens: 1200, bonus: 200, priceTL: '179.99 ₺', icon: '💎', badge: '+%16 Bonus' },
    { id: 'tok_3000', name: 'Efsanevi VIP Kasa', tokens: 3000, bonus: 600, priceTL: '349.99 ₺', icon: '👑', badge: 'EN ÇOK KAZANDIRAN' }
];

const PREDICTION_PACKAGES_TOKEN = [
    { id: 'pred_1', name: 'Tekli Tahmin Hakkı', rights: 1, costToken: 40, icon: '🎟️', desc: '1 Maç İçin Tahmin' },
    { id: 'pred_5', name: '5\'li Fırsat Paketi', rights: 5, costToken: 175, icon: '🎫', desc: '5 Maç İçin (25 Token Tasarruf)', badge: 'Avantajlı' },
    { id: 'pred_15', name: '15\'li Mega Tahmin Paketi', rights: 15, costToken: 450, icon: '🏆', desc: '15 Maç İçin (150 Token Tasarruf)', badge: 'VIP Paket' }
];

class EconomyManager {
    constructor(authManager) {
        this.auth = authManager;
    }

    getProfile() {
        if (!this.auth.currentUser) return null;
        const prof = this.auth.currentUser.profile;
        if (prof.tokens === undefined) prof.tokens = 250;
        if (prof.predictionRights === undefined) prof.predictionRights = 3;
        return prof;
    }

    getTokens() {
        const prof = this.getProfile();
        return prof ? prof.tokens : 0;
    }

    getPredictionRights() {
        const prof = this.getProfile();
        return prof ? prof.predictionRights : 0;
    }

    addTokens(amount) {
        const prof = this.getProfile();
        if (!prof) return;
        prof.tokens = (prof.tokens || 0) + amount;
        this.auth.saveCurrentUserData();
    }

    consumePredictionRight() {
        if (this.auth && this.auth.isAdmin()) return true; // Admin için sınırsız hak
        const prof = this.getProfile();
        if (!prof || (prof.predictionRights || 0) <= 0) {
            return false;
        }
        prof.predictionRights -= 1;
        this.auth.saveCurrentUserData();
        return true;
    }

    buyPredictionRightsWithTokens(packageId) {
        const pkg = PREDICTION_PACKAGES_TOKEN.find(p => p.id === packageId);
        if (!pkg) return { success: false, message: 'Paket bulunamadı.' };

        const prof = this.getProfile();
        if (!prof) return { success: false, message: 'Giriş yapılmadı.' };

        if (prof.tokens < pkg.costToken) {
            return { 
                success: false, 
                message: `Yetersiz Token! Bu paket için ${pkg.costToken} Token gerekiyor (Mevcut: ${prof.tokens} Token).` 
            };
        }

        prof.tokens -= pkg.costToken;
        prof.predictionRights = (prof.predictionRights || 0) + pkg.rights;
        this.auth.saveCurrentUserData();

        return { 
            success: true, 
            message: `Tebrikler! ${pkg.rights} adet Tahmin Hakkı başarıyla satın alındı.`,
            newTokens: prof.tokens,
            newRights: prof.predictionRights
        };
    }

    simulateRealMoneyPurchase(packageId, cardDetails) {
        const pkg = TOKEN_PACKAGES_REAL_MONEY.find(p => p.id === packageId);
        if (!pkg) return { success: false, message: 'Paket bulunamadı.' };

        const prof = this.getProfile();
        if (!prof) return { success: false, message: 'Giriş yapılmadı.' };

        const totalTokens = pkg.tokens + pkg.bonus;
        prof.tokens = (prof.tokens || 0) + totalTokens;
        this.auth.saveCurrentUserData();

        return {
            success: true,
            message: `Ödeme Başarılı! ${totalTokens} Token hesabınıza yüklendi.`,
            package: pkg,
            totalAdded: totalTokens,
            newTokens: prof.tokens
        };
    }
}

if (typeof window !== 'undefined') {
    window.TOKEN_PACKAGES_REAL_MONEY = TOKEN_PACKAGES_REAL_MONEY;
    window.PREDICTION_PACKAGES_TOKEN = PREDICTION_PACKAGES_TOKEN;
    window.EconomyManager = EconomyManager;
    window.economyMgr = new EconomyManager(window.authMgr);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TOKEN_PACKAGES_REAL_MONEY,
        PREDICTION_PACKAGES_TOKEN,
        EconomyManager
    };
}
