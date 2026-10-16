// AniClash: Beast Rumble - Authentication & User Session Manager

class AuthManager {
    constructor() {
        this.STORAGE_USERS_KEY = 'aniclash_registered_users';
        this.STORAGE_CURRENT_USER_KEY = 'aniclash_active_session_user';
        this.currentUser = null;
        this.migrateLegacyData();
        this.ensureDefaultUsers();
        this.loadSession();
    }

    migrateLegacyData() {
        try {
            if (!localStorage.getItem(this.STORAGE_USERS_KEY) && localStorage.getItem('animalsvs_registered_users')) {
                localStorage.setItem(this.STORAGE_USERS_KEY, localStorage.getItem('animalsvs_registered_users'));
            }
            if (!localStorage.getItem(this.STORAGE_CURRENT_USER_KEY) && localStorage.getItem('animalsvs_active_session_user')) {
                localStorage.setItem(this.STORAGE_CURRENT_USER_KEY, localStorage.getItem('animalsvs_active_session_user'));
            }
        } catch (e) {}
    }

    getUsers() {
        try {
            const data = localStorage.getItem(this.STORAGE_USERS_KEY) || localStorage.getItem('animalsvs_registered_users');
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }

    saveUsers(users) {
        try {
            localStorage.setItem(this.STORAGE_USERS_KEY, JSON.stringify(users));
        } catch (e) {}
    }

    ensureDefaultUsers() {
        this.ensureAdminUser();
        const users = this.getUsers();
        if (!users['rumeysa']) {
            users['rumeysa'] = {
                username: 'rumeysa',
                password: '1234',
                avatar: '🦊',
                isAdmin: false,
                createdAt: new Date().toISOString(),
                profile: {
                    trophies: 200,
                    level: 2,
                    exp: 40,
                    expToNext: 150,
                    wins: 0,
                    losses: 0,
                    winStreak: 0,
                    bestStreak: 0,
                    totalDamageDealt: 0,
                    tokens: 350,
                    predictionRights: 5,
                    rerollRights: 5,
                    dailyBattles: {
                        date: new Date().toISOString().slice(0, 10),
                        played: 0,
                        max: 3
                    },
                    dailyQuest: {
                        date: new Date().toISOString().slice(0, 10),
                        id: 'daily_win_1',
                        title: 'Bugün 1 Arena Savaşı Kazan',
                        desc: '1 Arena maçı kazanarak ödülünü topla!',
                        target: 1,
                        current: 0,
                        rewardTokens: 50,
                        rewardExp: 25,
                        claimed: false
                    },
                    matchHistory: [],
                    favoriteMonster: 'fox'
                }
            };
            this.saveUsers(users);
        } else if (users['rumeysa'].profile) {
            // Rumeysa test hesabı için günlük hakları 3/3 olarak tazele
            users['rumeysa'].profile.dailyBattles = {
                date: new Date().toISOString().slice(0, 10),
                played: 0,
                max: 3
            };
            if (!users['rumeysa'].profile.dailyBattles.played || users['rumeysa'].profile.dailyBattles.played === 0) {
                users['rumeysa'].profile.dailyQuest = {
                    date: new Date().toISOString().slice(0, 10),
                    id: 'daily_win_1',
                    title: 'Bugün 1 Arena Savaşı Kazan',
                    desc: '1 Arena maçı kazanarak ödülünü topla!',
                    target: 1,
                    current: 0,
                    rewardTokens: 50,
                    rewardExp: 25,
                    claimed: false
                };
            }
            if (users['rumeysa'].profile.rerollRights === undefined) {
                users['rumeysa'].profile.rerollRights = 5;
            }
            this.saveUsers(users);
        }
    }

    ensureAdminUser() {
        const users = this.getUsers();
        if (!users['admin']) {
            users['admin'] = {
                username: 'admin',
                password: 'admin',
                avatar: '👑',
                isAdmin: true,
                createdAt: new Date().toISOString(),
                profile: {
                    trophies: 2800,
                    level: 50,
                    exp: 9999,
                    expToNext: 10000,
                    wins: 120,
                    losses: 0,
                    winStreak: 30,
                    bestStreak: 30,
                    totalDamageDealt: 99999,
                    tokens: 99999,
                    predictionRights: 999,
                    rerollRights: 999,
                    dailyBattles: {
                        date: new Date().toISOString().slice(0, 10),
                        played: 0,
                        max: 999999
                    },
                    matchHistory: [],
                    favoriteMonster: 'dragon'
                }
            };
            this.saveUsers(users);
        } else {
            users['admin'].isAdmin = true;
            if (users['admin'].profile) {
                users['admin'].profile.tokens = Math.max(users['admin'].profile.tokens || 0, 99999);
                users['admin'].profile.predictionRights = Math.max(users['admin'].profile.predictionRights || 0, 999);
                users['admin'].profile.rerollRights = Math.max(users['admin'].profile.rerollRights || 0, 999);
            }
            this.saveUsers(users);
        }
    }

    loadSession() {
        try {
            const username = localStorage.getItem(this.STORAGE_CURRENT_USER_KEY);
            if (username) {
                const users = this.getUsers();
                if (users[username]) {
                    this.currentUser = users[username];
                    if (username.toLowerCase() === 'rumeysa' && this.currentUser.profile) {
                        this.currentUser.profile.dailyBattles = {
                            date: new Date().toISOString().slice(0, 10),
                            played: 0,
                            max: 3
                        };
                        users[username] = this.currentUser;
                        this.saveUsers(users);
                    }
                    if (this.currentUser && this.currentUser.profile && this.currentUser.profile.rerollRights === undefined) {
                        this.currentUser.profile.rerollRights = 3;
                        users[username] = this.currentUser;
                        this.saveUsers(users);
                    }
                }
            }
        } catch (e) {}
    }

    resetDailyBattles(username = null) {
        const target = username || (this.currentUser ? this.currentUser.username : 'rumeysa');
        const users = this.getUsers();
        if (users[target] && users[target].profile) {
            users[target].profile.dailyBattles = {
                date: new Date().toISOString().slice(0, 10),
                played: 0,
                max: 3
            };
            this.saveUsers(users);
            if (this.currentUser && this.currentUser.username.toLowerCase() === target.toLowerCase()) {
                this.currentUser.profile.dailyBattles = users[target].profile.dailyBattles;
            }
        }
    }

    register(username, password, avatar = '⚔️') {
        const cleanName = (username || '').trim();
        const cleanPass = (password || '').trim();
        if (!cleanName || cleanName.length < 3) {
            return { success: false, message: 'Kullanıcı adı en az 3 karakter olmalıdır.' };
        }
        if (!cleanPass || cleanPass.length < 4) {
            return { success: false, message: 'Şifre en az 4 karakter olmalıdır.' };
        }

        const users = this.getUsers();
        const existingKey = Object.keys(users).find(k => k.toLowerCase() === cleanName.toLowerCase());
        if (existingKey) {
            return { success: false, message: `"${cleanName}" kullanıcı adı zaten kayıtlı! Lütfen "GİRİŞ YAP" sekmesinden giriş yapınız.` };
        }

        const newUser = {
            username: cleanName,
            password: cleanPass,
            avatar: avatar || '⚔️',
            isAdmin: false,
            createdAt: new Date().toISOString(),
            profile: {
                trophies: 150,
                level: 1,
                exp: 0,
                expToNext: 100,
                wins: 0,
                losses: 0,
                winStreak: 0,
                bestStreak: 0,
                totalDamageDealt: 0,
                tokens: 250,
                predictionRights: 3,
                rerollRights: 3,
                dailyBattles: {
                    date: new Date().toISOString().slice(0, 10),
                    played: 0,
                    max: 3
                },
                matchHistory: [],
                favoriteMonster: 'duck'
            }
        };

        users[cleanName] = newUser;
        this.saveUsers(users);
        return { success: true, message: 'Kullanıcı kaydı başarılı! Lütfen giriş yapınız.', user: newUser };
    }

    login(username, password) {
        const cleanName = (username || '').trim();
        const cleanPass = (password || '').trim();

        if (!cleanName) {
            return { success: false, message: 'Lütfen kullanıcı adınızı giriniz.' };
        }
        if (!cleanPass) {
            return { success: false, message: 'Lütfen şifrenizi giriniz.' };
        }

        const users = this.getUsers();
        let user = users[cleanName];
        if (!user) {
            const foundKey = Object.keys(users).find(k => k.toLowerCase() === cleanName.toLowerCase());
            if (foundKey) {
                user = users[foundKey];
            }
        }

        if (!user) {
            return { 
                success: false, 
                message: `"${cleanName}" adında kayıtlı kullanıcı bulunamadı. Lütfen "KAYIT OL" sekmesinden hesap oluşturunuz.` 
            };
        }

        if (user.password !== password && user.password !== cleanPass) {
            return { success: false, message: 'Hatalı şifre girdiniz! Lütfen şifrenizi kontrol edip tekrar deneyiniz.' };
        }

        this.currentUser = user;
        localStorage.setItem(this.STORAGE_CURRENT_USER_KEY, user.username);
        return { success: true, user: user };
    }

    loginAsGuest() {
        const guestId = 'Misafir_' + Math.floor(1000 + Math.random() * 9000);
        const guestAvatars = ['⚔️', '⚡', '👑', '🛡️', '🔥', '💎', '🌟', '🔮'];
        const randomAvatar = guestAvatars[Math.floor(Math.random() * guestAvatars.length)];
        const regRes = this.register(guestId, 'guest123', randomAvatar);
        if (regRes.success) {
            return this.login(guestId, 'guest123');
        }
        return regRes;
    }

    loginAsAdmin() {
        this.ensureAdminUser();
        return this.login('admin', 'admin');
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem(this.STORAGE_CURRENT_USER_KEY);
    }

    saveCurrentUserData() {
        if (!this.currentUser) return;
        const users = this.getUsers();
        users[this.currentUser.username] = this.currentUser;
        this.saveUsers(users);
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    isAdmin() {
        return this.currentUser && (this.currentUser.isAdmin === true || this.currentUser.username.toLowerCase() === 'admin');
    }

    // --- GÜNLÜK 3 MAÇ SINIRI MOTORU (ADMİN İÇİN TAMAMEN SINIRSIZ) ---
    getDailyBattleStatus() {
        if (!this.currentUser) {
            return { played: 0, max: 3, remaining: 3, canPlay: true, resetTimeStr: '00:00' };
        }

        // Admin Kullanıcısı İçin Sınırsız Erişim
        if (this.isAdmin()) {
            return {
                played: 0,
                max: 999,
                remaining: 999,
                canPlay: true,
                isAdmin: true,
                resetTimeStr: 'Sınırsız (Admin)'
            };
        }

        if (!this.currentUser.profile) {
            this.currentUser.profile = {};
        }

        const today = new Date().toISOString().slice(0, 10);
        let daily = this.currentUser.profile.dailyBattles;

        if (!daily || daily.date !== today) {
            daily = {
                date: today,
                played: 0,
                max: 3
            };
            this.currentUser.profile.dailyBattles = daily;
            this.saveCurrentUserData();
        }

        const max = daily.max || 3;
        const played = daily.played || 0;
        const remaining = Math.max(0, max - played);

        // Gece 00:00'a kalan süre hesabı
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const msDiff = midnight - now;
        const hours = Math.floor(msDiff / (1000 * 60 * 60));
        const mins = Math.floor((msDiff % (1000 * 60 * 60)) / (1000 * 60));
        const resetTimeStr = `${hours} sa ${mins} dk`;

        return {
            played: played,
            max: max,
            remaining: remaining,
            canPlay: remaining > 0,
            resetTimeStr: resetTimeStr
        };
    }

    consumeDailyBattle() {
        if (this.isAdmin()) return true; // Admin için limit düşmez

        const status = this.getDailyBattleStatus();
        if (!status.canPlay) return false;

        this.currentUser.profile.dailyBattles.played = (this.currentUser.profile.dailyBattles.played || 0) + 1;
        this.saveCurrentUserData();
        return true;
    }
}

if (typeof window !== 'undefined') {
    window.AuthManager = AuthManager;
    window.authMgr = new AuthManager();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
