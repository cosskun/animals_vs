// AniClash: Beast Rumble - Main Application Orchestrator

document.addEventListener('DOMContentLoaded', () => {
    // Top-level views
    const views = {
        auth: document.getElementById('auth-view'),
        lobby: document.getElementById('lobby-view'),
        draft: document.getElementById('draft-view'),
        battle: document.getElementById('battle-view')
    };

    const modals = {
        profile: document.getElementById('profile-modal'),
        leaderboard: document.getElementById('leaderboard-modal'),
        playerDetail: document.getElementById('player-detail-modal'),
        store: document.getElementById('store-modal'),
        checkout: document.getElementById('checkout-modal'),
        info: document.getElementById('info-modal'),
        bestiary: document.getElementById('bestiary-modal'),
        dailyLogin: document.getElementById('daily-login-modal'),
        bossRaid: document.getElementById('boss-raid-modal'),
        result: document.getElementById('result-modal')
    };

    // State Variables
    let currentBotTeam = [];
    let candidate5Monsters = []; // 5 adet önerilen canavar
    let playerSlots = [null, null, null]; // Slot 0, Slot 1, Slot 2
    let currentBattle = null;
    let selectedPrediction = 'none';
    let selectedCheckoutPkg = null;
    let lastSimResult = null;
    let isBossRaidMode = false;

    // Yaratıcı Avatar Sembolleri (Canavarlardan bağımsız kahraman/gladyatör armaları)
    const CREATIVE_AVATARS = [
        '⚔️', '👑', '🛡️', '⚡', '🔥', '💎',
        '💀', '🌟', '🎯', '🔮', '🔱', '🌪️',
        '🪓', '🌌', '🚀', '🎭', '🥊', '⚜️'
    ];

    let selectedRegAvatar = '⚔️';
    let editProfileAvatar = '⚔️';

    // Sound FX init
    window.soundFX.init();

    // --- ÖZEL OYUN POPUP & UYARI SİSTEMİ (NATIVE DANDİK ALERT YERİNE) ---
    function showGameAlert({ title = 'Bilgi', message = '', type = 'info', icon = null, btnText = 'TAMAM', onConfirm = null }) {
        const modal = document.getElementById('game-alert-modal');
        if (!modal) return;
        const iconWrap = document.getElementById('game-alert-icon-wrap');
        const iconEl = document.getElementById('game-alert-icon');
        const titleEl = document.getElementById('game-alert-title');
        const msgEl = document.getElementById('game-alert-message');
        const okBtn = document.getElementById('btn-game-alert-ok');
        const cancelBtn = document.getElementById('btn-game-alert-cancel');

        let defaultIcon = '✨';
        if (type === 'success') defaultIcon = '🎉';
        else if (type === 'error' || type === 'insufficient') defaultIcon = '⚠️';
        else if (type === 'warning') defaultIcon = '⚡';
        else if (type === 'reward') defaultIcon = '🎁';

        if (iconWrap) iconWrap.className = `game-alert-icon-wrap ${type}`;
        if (iconEl) iconEl.textContent = icon || defaultIcon;
        if (titleEl) titleEl.textContent = title;
        if (msgEl) msgEl.innerHTML = message.replace(/\n/g, '<br>');
        if (okBtn) {
            okBtn.textContent = btnText;
            okBtn.style.background = '';
        }
        if (cancelBtn) cancelBtn.classList.add('hidden');

        modal.classList.remove('hidden');

        if (okBtn) {
            okBtn.onclick = () => {
                window.soundFX.playClick();
                modal.classList.add('hidden');
                if (onConfirm) onConfirm();
            };
        }
    }

    function showConfirmDialog({ title = 'Onay', message = '', type = 'warning', icon = '⚠️', confirmText = 'EVET', cancelText = 'VAZGEÇ', onConfirm = null, onCancel = null }) {
        const modal = document.getElementById('game-alert-modal');
        if (!modal) return;
        const iconWrap = document.getElementById('game-alert-icon-wrap');
        const iconEl = document.getElementById('game-alert-icon');
        const titleEl = document.getElementById('game-alert-title');
        const msgEl = document.getElementById('game-alert-message');
        const okBtn = document.getElementById('btn-game-alert-ok');
        const cancelBtn = document.getElementById('btn-game-alert-cancel');

        if (iconWrap) iconWrap.className = `game-alert-icon-wrap ${type}`;
        if (iconEl) iconEl.textContent = icon;
        if (titleEl) titleEl.textContent = title;
        if (msgEl) msgEl.innerHTML = message.replace(/\n/g, '<br>');
        if (okBtn) {
            okBtn.textContent = confirmText;
            okBtn.style.background = '#ff4757';
        }
        if (cancelBtn) {
            cancelBtn.textContent = cancelText;
            cancelBtn.classList.remove('hidden');
        }

        modal.classList.remove('hidden');

        if (okBtn) {
            okBtn.onclick = () => {
                window.soundFX.playClick();
                modal.classList.add('hidden');
                if (cancelBtn) cancelBtn.classList.add('hidden');
                if (okBtn) okBtn.style.background = '';
                if (onConfirm) onConfirm();
            };
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => {
                window.soundFX.playClick();
                modal.classList.add('hidden');
                cancelBtn.classList.add('hidden');
                if (okBtn) okBtn.style.background = '';
                if (onCancel) onCancel();
            };
        }
    }

    window.alert = function(msg) {
        let type = 'info';
        let title = 'Bildirim';
        let icon = '✨';
        const text = String(msg || '');
        const lower = text.toLowerCase();
        if (lower.includes('tebrikler') || lower.includes('başarıyla') || lower.includes('eklendi') || lower.includes('satın alındı')) {
            type = 'success';
            title = 'Tebrikler!';
            icon = '🎉';
        } else if (lower.includes('yetersiz') || lower.includes('hata') || lower.includes('geçersiz') || lower.includes('alınmış')) {
            type = 'error';
            title = 'Yetersiz Bakiye!';
            icon = '⚠️';
        } else if (lower.includes('tahmin hakkınız kalmamış') || lower.includes('bulunmuyor')) {
            type = 'warning';
            title = 'Tahmin Hakkı Uyarısı';
            icon = '🎟️';
        }
        showGameAlert({ title, message: text, type, icon });
    };

    // Screen Switching
    function switchScreen(screenName) {
        if (screenName === 'lobby') {
            isBossRaidMode = false;
        }
        Object.keys(views).forEach(key => {
            if (views[key]) views[key].classList.add('hidden');
        });
        if (views[screenName]) {
            views[screenName].classList.remove('hidden');
        }
        updateGlobalHeader();
    }

    function openModal(modalName) {
        if (modals[modalName]) modals[modalName].classList.remove('hidden');
    }

    function closeModal(modalName) {
        if (modals[modalName]) modals[modalName].classList.add('hidden');
    }

    function closeAllModals() {
        Object.keys(modals).forEach(k => {
            if (modals[k]) modals[k].classList.add('hidden');
        });
    }

    // --- GLOBAL HEADER UPDATE ---
    function updateGlobalHeader() {
        if (!window.authMgr.isLoggedIn()) {
            document.getElementById('game-header-bar').style.display = 'none';
            return;
        }

        document.getElementById('game-header-bar').style.display = 'flex';
        const user = window.authMgr.currentUser;
        const prof = user.profile;
        const tier = window.leaderboardMgr.getCurrentTier();

        const tokens = prof.tokens !== undefined ? prof.tokens : 250;
        const tickets = prof.predictionRights !== undefined ? prof.predictionRights : 3;

        const isAdmin = window.authMgr.isAdmin();
        document.getElementById('header-avatar').textContent = user.avatar || '🎮';
        if (isAdmin) {
            document.getElementById('header-username').innerHTML = `${user.username} <span style="font-size:0.6rem; background:#ffa502; color:#1e293b; padding:1px 4px; border-radius:4px; font-weight:900;">👑 ADMİN</span>`;
            document.getElementById('player-tier').textContent = `👑 Efsane Şampiyon (Admin)`;
        } else {
            document.getElementById('header-username').textContent = user.username;
            document.getElementById('player-tier').textContent = `${tier.badge} ${tier.name}`;
        }
        const trophiesValEl = document.getElementById('player-trophies-val');
        if (trophiesValEl) {
            trophiesValEl.textContent = prof.trophies;
        } else {
            const trophEl = document.getElementById('player-trophies');
            if (trophEl) trophEl.textContent = `🏆 ${prof.trophies}`;
        }
        
        // Token ve Tahmin Hakları
        const tokenEl = document.getElementById('player-tokens');
        const ticketEl = document.getElementById('player-tickets');
        if (tokenEl) tokenEl.textContent = isAdmin ? '∞' : tokens;
        if (ticketEl) ticketEl.textContent = isAdmin ? '∞' : tickets;

        const lobbyTokEl = document.getElementById('lobby-stat-tokens');
        const lobbyTktEl = document.getElementById('lobby-stat-tickets');
        if (lobbyTokEl) lobbyTokEl.innerHTML = `<span class="token-coin-icon"></span> <span>${isAdmin ? '∞' : tokens}</span>`;
        if (lobbyTktEl) lobbyTktEl.innerHTML = `<span class="ticket-badge-icon"></span> <span>${isAdmin ? '∞ Sınırsız' : `${tickets} Hak`}</span>`;

        const predCountEl = document.getElementById('pred-rights-count');
        if (predCountEl) predCountEl.textContent = isAdmin ? '∞' : tickets;

        const storeTokEl = document.getElementById('store-current-tokens');
        const storeTktEl = document.getElementById('store-current-tickets');
        if (storeTokEl) storeTokEl.textContent = isAdmin ? '∞' : tokens;
        if (storeTktEl) storeTktEl.textContent = isAdmin ? '∞' : tickets;

        const expPct = Math.min(100, Math.round((prof.exp / prof.expToNext) * 100));
        document.getElementById('player-exp-bar').style.width = `${expPct}%`;

        const streakBadge = document.getElementById('win-streak-badge');
        if (prof.winStreak >= 2) {
            streakBadge.style.display = 'inline-flex';
            streakBadge.textContent = `🔥 ${prof.winStreak} Seri`;
        } else {
            streakBadge.style.display = 'none';
        }

        // Günlük Savaş Hakkı (Günde 3 Maç Sınırı)
        const dailyStatus = window.authMgr.getDailyBattleStatus();
        const dailyCountEl = document.getElementById('player-daily-battles-count');
        if (dailyCountEl) {
            dailyCountEl.textContent = isAdmin ? '∞ / Sınırsız' : `${dailyStatus.remaining}/${dailyStatus.max}`;
            dailyCountEl.style.color = '#2ed573';
        }

        const dot1 = document.getElementById('dot-battle-1');
        const dot2 = document.getElementById('dot-battle-2');
        const dot3 = document.getElementById('dot-battle-3');
        if (dot1 && dot2 && dot3) {
            dot1.className = `daily-battle-dot ${isAdmin || dailyStatus.remaining >= 1 ? 'active' : ''}`;
            dot2.className = `daily-battle-dot ${isAdmin || dailyStatus.remaining >= 2 ? 'active' : ''}`;
            dot3.className = `daily-battle-dot ${isAdmin || dailyStatus.remaining >= 3 ? 'active' : ''}`;
        }

        const dailyTextEl = document.getElementById('daily-battle-status-text');
        updateLiveCountdowns();

        const quickPlayBtn = document.getElementById('btn-quick-play');
        if (quickPlayBtn) {
            if (isAdmin) {
                quickPlayBtn.textContent = '🔥 HIZLI ARENA SAVAŞI BUL (ADMİN - SINIRSIZ)';
                quickPlayBtn.style.opacity = '1';
            } else if (dailyStatus.canPlay) {
                quickPlayBtn.textContent = '🔥 HIZLI ARENA SAVAŞI BUL';
                quickPlayBtn.style.opacity = '1';
            } else {
                quickPlayBtn.textContent = '⚡ GÜNLÜK HAK DOLDU (0/3)';
                quickPlayBtn.style.opacity = '0.9';
            }
        }

        updateLobbyDailyQuest();
    }

    // --- CANLI VE DİNAMİK GERİ SAYIM SAYACI (HER SANİYE AKAN TİCKER) ---
    function updateLiveCountdowns() {
        // 1. Gece 00:00'a Kalan Günlük Savaş Yenilenme Sayacı
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const msDiff = Math.max(0, midnight - now);

        const hours = Math.floor(msDiff / (1000 * 60 * 60));
        const mins = Math.floor((msDiff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((msDiff % (1000 * 60)) / 1000);

        const pad = (n) => String(n).padStart(2, '0');
        const timeFormatted = `${pad(hours)}:${pad(mins)}:${pad(secs)}`;

        const dailyTextEl = document.getElementById('daily-battle-status-text');
        if (dailyTextEl && window.authMgr && window.authMgr.isLoggedIn()) {
            const dailyStatus = window.authMgr.getDailyBattleStatus();
            if (window.authMgr.isAdmin()) {
                dailyTextEl.innerHTML = `⚡ <b style="color: #ffa502;">Admin Modu: Sınırsız Savaş & Sınırsız Hak</b>`;
            } else if (dailyStatus.canPlay) {
                dailyTextEl.innerHTML = `Günlük Savaş: <b>${dailyStatus.remaining} / ${dailyStatus.max} Kalan</b> (⏳ Sıfırlanma: <b>${timeFormatted}</b>)`;
            } else {
                dailyTextEl.innerHTML = `<b style="color: #ff4757;">⚡ Günlük Limit Doldu (0/3)</b> • ⏳ Sıfırlanma: <b>${timeFormatted}</b>`;
            }
        }

        // 2. Lider Tablosu Geri Sayım Canlı Güncellemesi (Açıksa)
        const timerEl = document.getElementById('lb-tf-timer');
        if (timerEl && window.leaderboardMgr) {
            const bannerData = window.leaderboardMgr.getTimeframeBannerData();
            timerEl.textContent = bannerData.timer;
        }
    }

    function updateLobbyDailyQuest() {
        if (!window.profileMgr) return;
        const quest = window.profileMgr.getDailyQuest();
        if (!quest) return;

        const descEl = document.getElementById('quest-desc-text');
        const fillEl = document.getElementById('quest-progress-fill');
        const textEl = document.getElementById('quest-progress-text');
        const claimBtn = document.getElementById('btn-claim-quest');
        const rewardTextEl = document.getElementById('quest-reward-text');

        if (descEl) descEl.textContent = quest.title;
        if (rewardTextEl) rewardTextEl.textContent = `+${quest.rewardTokens} Token`;

        const pct = Math.min(100, Math.round((quest.current / quest.target) * 100));
        if (fillEl) fillEl.style.width = `${pct}%`;

        if (textEl) {
            if (quest.claimed) {
                textEl.textContent = `✅ Tamamlandı (${quest.current}/${quest.target})`;
                textEl.style.color = '#10b981';
            } else if (quest.current >= quest.target) {
                textEl.textContent = `🎉 Görev Tamamlandı! (${quest.current}/${quest.target})`;
                textEl.style.color = '#10b981';
            } else {
                textEl.textContent = `${quest.current} / ${quest.target} (%${pct})`;
                textEl.style.color = 'var(--text-muted)';
            }
        }

        if (claimBtn) {
            if (quest.claimed) {
                claimBtn.classList.remove('hidden');
                claimBtn.className = 'btn-claim-quest claimed';
                claimBtn.textContent = '✅ Ödül Alındı';
                claimBtn.disabled = true;
            } else if (quest.current >= quest.target) {
                claimBtn.classList.remove('hidden');
                claimBtn.className = 'btn-claim-quest';
                claimBtn.textContent = `🎁 Ödülü Al (+${quest.rewardTokens})`;
                claimBtn.disabled = false;
            } else {
                claimBtn.classList.add('hidden');
            }
        }
    }

    // --- AUTHENTICATION & LOGIN/REGISTER ---
    function initAuth() {
        const tabLogin = document.getElementById('tab-btn-login');
        const tabRegister = document.getElementById('tab-btn-register');
        const formLogin = document.getElementById('form-login');
        const formRegister = document.getElementById('form-register');
        const authAlert = document.getElementById('auth-alert');

        tabLogin.onclick = () => {
            window.soundFX.playClick();
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            formLogin.classList.remove('hidden');
            formRegister.classList.add('hidden');
            authAlert.style.display = 'none';
        };

        tabRegister.onclick = () => {
            window.soundFX.playClick();
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            formRegister.classList.remove('hidden');
            formLogin.classList.add('hidden');
            authAlert.style.display = 'none';
        };

        // Yaratıcı Avatar Seçici (Kayıt ekranı)
        const avatarContainer = document.getElementById('reg-avatar-picker');
        avatarContainer.innerHTML = '';
        CREATIVE_AVATARS.forEach(emoji => {
            const span = document.createElement('div');
            span.className = `avatar-opt ${emoji === selectedRegAvatar ? 'selected' : ''}`;
            span.textContent = emoji;
            span.onclick = () => {
                window.soundFX.playClick();
                selectedRegAvatar = emoji;
                avatarContainer.querySelectorAll('.avatar-opt').forEach(el => el.classList.remove('selected'));
                span.classList.add('selected');
            };
            avatarContainer.appendChild(span);
        });

        // GİRİŞ HOŞ GELDİN KARŞILAMA EFEKTİ & POPUP
        let welcomeTimeout = null;
        function triggerLoginWelcome(user, onComplete) {
            try {
                const overlay = document.getElementById('login-welcome-overlay');
                if (!overlay) {
                    if (onComplete) onComplete();
                    return;
                }

                if (welcomeTimeout) {
                    clearTimeout(welcomeTimeout);
                    welcomeTimeout = null;
                }

                // Ses Efekti: Zafer / Hoş Geldin Fanfarı
                if (window.soundFX && window.soundFX.playWelcome) {
                    window.soundFX.playWelcome();
                }

                // Kullanıcı Bilgilerini Doldur
                const prof = (user && user.profile) || {};
                const isAdmin = user && (user.isAdmin || user.username.toLowerCase() === 'admin');
                
                const avEl = document.getElementById('welcome-user-avatar');
                const nameEl = document.getElementById('welcome-user-name');
                const tierEl = document.getElementById('welcome-user-tier');
                const quoteEl = document.getElementById('welcome-user-quote');
                const progressFill = document.getElementById('welcome-progress-fill');

                if (avEl) avEl.textContent = (user && user.avatar) || '🦁';
                if (nameEl) nameEl.textContent = (user && user.username) || 'Oyuncu';

                if (isAdmin) {
                    if (tierEl) {
                        tierEl.textContent = '👑 ADMİN • Seviye 50';
                        tierEl.style.color = '#ffa502';
                    }
                    if (quoteEl) quoteEl.innerHTML = '⚡ <b>Tüm Kısıtlamalar Devre Dışı!</b><br>Sınırsız Savaş & Tahmin Yetkisi Aktif!';
                } else {
                    const trophies = prof.trophies || 0;
                    const level = prof.level || 1;
                    let rank = { name: 'Bronz Lig', badge: '🥉' };
                    if (window.leaderboardMgr && typeof window.leaderboardMgr.getTierForTrophies === 'function') {
                        rank = window.leaderboardMgr.getTierForTrophies(trophies);
                    }
                    if (tierEl) {
                        tierEl.textContent = `${rank.badge} ${rank.name} • Seviye ${level}`;
                        tierEl.style.color = '';
                    }
                    if (quoteEl) quoteEl.innerHTML = '⚔️ <b>Günlük 3 Savaş Hakkın Hazır!</b><br>Taktik koridorlarını kur ve kupaları topla!';
                }

                // Partikül Kıvılcımları Üret
                const particlesContainer = document.getElementById('welcome-particles');
                if (particlesContainer) {
                    particlesContainer.innerHTML = '';
                    const emojis = ['✨', '⭐', '💥', '🔥', '🌟', '🎉', '⚡'];
                    for (let i = 0; i < 14; i++) {
                        const p = document.createElement('div');
                        p.className = 'welcome-sparkle';
                        p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                        p.style.left = `${Math.random() * 85 + 5}%`;
                        p.style.top = `${Math.random() * 70 + 15}%`;
                        p.style.animationDelay = `${Math.random() * 0.4}s`;
                        particlesContainer.appendChild(p);
                    }
                }

                // İlerleme çubuğunu sıfırla & animasyon başlat
                if (progressFill) {
                    progressFill.style.transition = 'none';
                    progressFill.style.width = '0%';
                    setTimeout(() => {
                        progressFill.style.transition = 'width 1.0s linear';
                        progressFill.style.width = '100%';
                    }, 30);
                }

                // Overlay'i Göster
                overlay.classList.remove('hidden');
                overlay.classList.remove('welcome-anim-out');

                let isCompleted = false;
                const closeWelcome = () => {
                    if (isCompleted) return;
                    isCompleted = true;
                    if (welcomeTimeout) {
                        clearTimeout(welcomeTimeout);
                        welcomeTimeout = null;
                    }
                    overlay.classList.add('welcome-anim-out');
                    setTimeout(() => {
                        overlay.classList.add('hidden');
                        overlay.classList.remove('welcome-anim-out');
                        if (onComplete) onComplete();
                    }, 180);
                };

                // Ekrana dokunulduğunda hemen geç
                overlay.onclick = closeWelcome;

                // Otomatik 1.2 saniye sonra kapat
                welcomeTimeout = setTimeout(closeWelcome, 1200);
            } catch (err) {
                console.error("Welcome popup error:", err);
                if (onComplete) onComplete();
            }
        }

        // Form Submit & Login / Register Handlers
        const handleLoginSubmit = () => {
            window.soundFX.playClick();
            const u = document.getElementById('login-username').value;
            const p = document.getElementById('login-password').value;
            const res = window.authMgr.login(u, p);
            if (res.success) {
                authAlert.style.display = 'none';
                triggerLoginWelcome(res.user, () => {
                    switchScreen('lobby');
                });
            } else {
                authAlert.className = 'auth-alert-box error';
                authAlert.innerHTML = `⚠️ <b>Giriş Yapılamadı:</b><br>${res.message}`;
                authAlert.style.display = 'block';
            }
        };

        const handleRegisterSubmit = () => {
            window.soundFX.playClick();
            const u = document.getElementById('reg-username').value;
            const p = document.getElementById('reg-password').value;
            const res = window.authMgr.register(u, p, selectedRegAvatar);
            if (res.success) {
                tabLogin.classList.add('active');
                tabRegister.classList.remove('active');
                formLogin.classList.remove('hidden');
                formRegister.classList.add('hidden');

                document.getElementById('login-username').value = u;
                document.getElementById('login-password').value = p;
                document.getElementById('reg-username').value = '';
                document.getElementById('reg-password').value = '';

                authAlert.className = 'auth-alert-box success';
                authAlert.innerHTML = '🎉 <b>Kullanıcı kaydı başarılı!</b><br>Şifreniz otomatik dolduruldu, "GİRİŞ YAP" butonuna basarak başlayabilirsiniz.';
                authAlert.style.display = 'block';
            } else {
                authAlert.className = 'auth-alert-box error';
                authAlert.innerHTML = `⚠️ <b>Kayıt Yapılamadı:</b><br>${res.message}`;
                authAlert.style.display = 'block';
            }
        };

        formLogin.onsubmit = (e) => {
            e.preventDefault();
            handleLoginSubmit();
        };

        document.getElementById('btn-submit-login').onclick = (e) => {
            e.preventDefault();
            handleLoginSubmit();
        };

        formRegister.onsubmit = (e) => {
            e.preventDefault();
            handleRegisterSubmit();
        };

        document.getElementById('btn-submit-register').onclick = (e) => {
            e.preventDefault();
            handleRegisterSubmit();
        };

        document.getElementById('btn-guest-login').onclick = () => {
            window.soundFX.playClick();
            const res = window.authMgr.loginAsGuest();
            if (res.success) {
                triggerLoginWelcome(res.user, () => {
                    switchScreen('lobby');
                });
            }
        };

        const btnAdmin = document.getElementById('btn-admin-login');
        if (btnAdmin) {
            btnAdmin.onclick = () => {
                window.soundFX.playClick();
                const res = window.authMgr.loginAsAdmin();
                if (res.success) {
                    triggerLoginWelcome(res.user, () => {
                        switchScreen('lobby');
                    });
                }
            };
        }

        // ÇIKIŞ VEDA EFEKTİ & POPUP
        let logoutTimeout = null;
        function triggerLogoutFarewell(user, onComplete) {
            try {
                const overlay = document.getElementById('logout-farewell-overlay');
                if (!overlay) {
                    if (onComplete) onComplete();
                    return;
                }

                if (logoutTimeout) {
                    clearTimeout(logoutTimeout);
                    logoutTimeout = null;
                }

                // Ses Efekti: Yumuşak Veda Fanfarı
                if (window.soundFX && window.soundFX.playLogout) {
                    window.soundFX.playLogout();
                }

                const avEl = document.getElementById('logout-user-avatar');
                const nameEl = document.getElementById('logout-user-name');
                const statusEl = document.getElementById('logout-user-status');
                const progressFill = document.getElementById('logout-progress-fill');

                if (avEl) avEl.textContent = (user && user.avatar) || '🎮';
                if (nameEl) nameEl.textContent = (user && user.username) || 'Savaşçı';

                // Partikül Kıvılcımları (Yıldızlar, ay, galaksi simgeleri)
                const particlesContainer = document.getElementById('logout-particles');
                if (particlesContainer) {
                    particlesContainer.innerHTML = '';
                    const emojis = ['✨', '⭐', '🌌', '💫', '🌙', '💤', '🔮', '🌟'];
                    for (let i = 0; i < 14; i++) {
                        const p = document.createElement('div');
                        p.className = 'welcome-sparkle logout-sparkle';
                        p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                        p.style.left = `${Math.random() * 85 + 5}%`;
                        p.style.top = `${Math.random() * 70 + 15}%`;
                        p.style.animationDelay = `${Math.random() * 0.4}s`;
                        particlesContainer.appendChild(p);
                    }
                }

                // İlerleme çubuğu animasyonu
                if (progressFill) {
                    progressFill.style.transition = 'none';
                    progressFill.style.width = '0%';
                    setTimeout(() => {
                        progressFill.style.transition = 'width 1.0s linear';
                        progressFill.style.width = '100%';
                    }, 30);
                }

                overlay.classList.remove('hidden');
                overlay.classList.remove('welcome-anim-out');

                let isCompleted = false;
                const closeLogout = () => {
                    if (isCompleted) return;
                    isCompleted = true;
                    if (logoutTimeout) {
                        clearTimeout(logoutTimeout);
                        logoutTimeout = null;
                    }
                    overlay.classList.add('welcome-anim-out');
                    setTimeout(() => {
                        overlay.classList.add('hidden');
                        overlay.classList.remove('welcome-anim-out');
                        if (onComplete) onComplete();
                    }, 180);
                };

                // Dokunulduğunda hemen kapat
                overlay.onclick = closeLogout;
                logoutTimeout = setTimeout(closeLogout, 1200);
            } catch (err) {
                console.error("Logout popup error:", err);
                if (onComplete) onComplete();
            }
        }

        document.getElementById('btn-logout').onclick = () => {
            window.soundFX.playClick();
            const currentUser = window.authMgr.currentUser;
            triggerLogoutFarewell(currentUser, () => {
                window.authMgr.logout();
                switchScreen('auth');
            });
        };
    }

    // --- PROFILE DASHBOARD & MODAL ---
    function renderProfileModal() {
        const stats = window.profileMgr.getStats();
        if (!stats) return;

        const user = window.authMgr.currentUser;
        if (!user) return;
        editProfileAvatar = user.avatar || '⚔️';

        const elAvatar = document.getElementById('prof-modal-avatar');
        if (elAvatar) elAvatar.textContent = editProfileAvatar;

        const elUsername = document.getElementById('prof-modal-username');
        if (elUsername) elUsername.value = user.username;

        const elMatches = document.getElementById('prof-stat-matches');
        if (elMatches) elMatches.textContent = stats.totalMatches;

        const elWinRate = document.getElementById('prof-stat-winrate');
        if (elWinRate) elWinRate.textContent = `%${stats.winRate}`;

        const elStreak = document.getElementById('prof-stat-streak');
        if (elStreak) elStreak.textContent = `${stats.bestStreak} Maç`;

        const elTrophies = document.getElementById('prof-stat-trophies');
        if (elTrophies) elTrophies.textContent = `🏆 ${stats.trophies} Kupa`;

        const elLevel = document.getElementById('prof-stat-level');
        if (elLevel) elLevel.textContent = `Seviye ${stats.level}`;

        // Profil Avatar Seçici Izgarası
        const profAvatarContainer = document.getElementById('prof-avatar-picker');
        if (profAvatarContainer) {
            profAvatarContainer.innerHTML = '';
            CREATIVE_AVATARS.forEach(emoji => {
                const opt = document.createElement('div');
                opt.className = `avatar-opt ${emoji === editProfileAvatar ? 'selected' : ''}`;
                opt.textContent = emoji;
                opt.onclick = () => {
                    window.soundFX.playClick();
                    editProfileAvatar = emoji;
                    if (elAvatar) elAvatar.textContent = emoji;
                    profAvatarContainer.querySelectorAll('.avatar-opt').forEach(el => el.classList.remove('selected'));
                    opt.classList.add('selected');
                };
                profAvatarContainer.appendChild(opt);
            });
        }

        // Başarımlar / Rozetler
        const achContainer = document.getElementById('prof-achievements-list');
        if (achContainer) {
            achContainer.innerHTML = '';
            (stats.achievements || []).forEach(ach => {
                const item = document.createElement('div');
                item.className = `ach-badge-card ${ach.unlocked ? 'unlocked' : 'locked'}`;
                item.innerHTML = `
                    <div class="ach-icon">${ach.icon}</div>
                    <div class="ach-text">
                        <div class="ach-name">${ach.name}</div>
                        <div class="ach-desc">${ach.desc}</div>
                    </div>
                    <div class="ach-status">${ach.unlocked ? '✅' : '🔒'}</div>
                `;
                achContainer.appendChild(item);
            });
        }

        // Maç Geçmişi
        const historyContainer = document.getElementById('prof-match-history');
        if (historyContainer) {
            historyContainer.innerHTML = '';
            const history = stats.matchHistory || [];
            if (history.length === 0) {
                historyContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 10px;">Henüz tamamlanmış maç bulunmuyor.</p>';
            } else {
                history.forEach(match => {
                    const row = document.createElement('div');
                    row.className = `match-history-row ${match.victory ? 'win' : 'loss'}`;
                    
                    const pIcons = (match.playerTeam || []).map(t => t.emoji).join(' ');
                    const bIcons = (match.botTeam || []).map(t => t.emoji).join(' ');
                    const deltaTag = match.trophyDelta >= 0 ? `+${match.trophyDelta}` : `${match.trophyDelta}`;

                    row.innerHTML = `
                        <div class="match-res-tag">${match.victory ? 'ZAFER' : 'BOZGUN'}</div>
                        <div class="match-teams-icons">
                            <span>${pIcons}</span>
                            <span style="font-size: 0.65rem; color: var(--text-muted);">VS</span>
                            <span>${bIcons}</span>
                        </div>
                        <div class="match-delta ${match.victory ? 'win' : 'loss'}">🏆 ${deltaTag}</div>
                        <div class="match-time">${match.date || ''}</div>
                    `;
                    historyContainer.appendChild(row);
                });
            }
        }

        openModal('profile');
    }

    document.getElementById('btn-save-profile').onclick = () => {
        window.soundFX.playClick();
        const newName = document.getElementById('prof-modal-username').value;
        const res = window.profileMgr.updateBasicInfo(newName, editProfileAvatar);
        if (res.success) {
            updateGlobalHeader();
            closeModal('profile');
        } else {
            alert(res.message || 'Hata oluştu!');
        }
    };

    // --- 5'Lİ DRAFT VE 3'LÜ SLOT DİZİLİMİ ---
    function prepareNewMatch() {
        window.soundFX.playClick();
        isBossRaidMode = false;

        // Günlük Savaş Hakkı Kontrolü (Günde Max 3 Maç)
        const dailyStatus = window.authMgr.getDailyBattleStatus();
        if (!dailyStatus.canPlay) {
            switchScreen('lobby');
            showGameAlert({
                title: 'Günlük Savaş Limiti Doldu',
                message: `Bugün için 3 maçlık savaş hakkınızı doldurdunuz (3/3).\n\n⏰ Günlük haklarınız her gece saat <b>00:00</b>'da yenilenir.\nSıfırlanmaya Kalan Süre: <b>${dailyStatus.resetTimeStr}</b>`,
                type: 'warning',
                icon: '⚡',
                btnText: 'LOBİYE DÖN',
                onConfirm: () => {
                    switchScreen('lobby');
                }
            });
            return;
        }

        const profile = (window.authMgr.currentUser && window.authMgr.currentUser.profile) || {};
        const stats = (window.profileMgr && window.profileMgr.getStats()) || {};
        const matchmakingData = {
            level: profile.level || 1,
            trophies: profile.trophies || 0,
            winStreak: profile.winStreak || 0,
            winRate: stats.winRate || 50,
            totalMatches: stats.totalMatches || 0
        };

        // 1. Bot takımını ELO/MMR ve galibiyet serisi zorluğuna göre üret (Slot 0, 1, 2)
        currentBotTeam = window.botGen.generateUniqueBotTeam(matchmakingData);

        // 2. Oyuncuya 5 rastgele canavar öner
        candidate5Monsters = MonsterFactory.get5DraftRecommendations(matchmakingData.level);

        // 3. Slotları sıfırla
        playerSlots = [null, null, null];

        // 4. AI Simülasyon Kartını Sıfırla
        const idleView = document.getElementById('ai-pred-idle-view');
        const resCard = document.getElementById('ai-pred-result-card');
        if (idleView) idleView.classList.remove('hidden');
        if (resCard) resCard.classList.add('hidden');

        renderDraftScreen();
        switchScreen('draft');
    }

    let draggedTemplateId = null;

    function cleanupTouchGhosts() {
        document.querySelectorAll('.drag-touch-ghost').forEach(el => {
            if (el.parentNode) el.parentNode.removeChild(el);
        });
    }

    function renderDraftScreen() {
        cleanupTouchGhosts();

        // 1. Bot Takımı - Arena Görünümü ile Birebir Aynı
        const botCardsContainer = document.getElementById('bot-team-preview');
        botCardsContainer.innerHTML = '';
        currentBotTeam.forEach(monster => {
            botCardsContainer.appendChild(createFighterCard(monster, true));
        });

        // Başlık güncellemesi
        const botTitleEl = document.querySelector('.lane-header-row.bot-header span:first-child');
        if (botTitleEl) {
            botTitleEl.textContent = isBossRaidMode ? '🐉 TİTAN BOSS DİZİLİMİ' : '🔴 RAKİP BOT DİZİLİMİ';
        }

        // Bot Zorluk Rozeti & Dinamik Bilgilendirme
        const diffBadge = document.getElementById('bot-difficulty-badge');
        if (diffBadge && currentBotTeam.matchmaking) {
            const mm = currentBotTeam.matchmaking;
            diffBadge.className = `lane-sub-text bot-match-diff-badge ${mm.botBadgeClass}`;
            diffBadge.textContent = mm.difficultyLabel;
        }

        // Tahmin Bilet Sayısı Güncellemesi
        const ticketsEl = document.getElementById('pred-rights-count');
        if (ticketsEl) {
            const rights = window.economyMgr.getPredictionRights();
            ticketsEl.textContent = `${rights}`;
        }

        // 2. Oyuncu Slotları (Sürükle-Bırak Drop Hedefleri)
        const slotsContainer = document.getElementById('player-slots-container');
        slotsContainer.innerHTML = '';

        for (let i = 0; i < 3; i++) {
            const slotMonster = playerSlots[i];
            const dropSlot = document.createElement('div');
            dropSlot.className = `draft-drop-slot ${slotMonster ? 'occupied' : 'empty'}`;
            dropSlot.dataset.slotIndex = i;

            // Sürükle - Bırak Olay Dinleyicileri (Drag & Drop)
            dropSlot.ondragover = (e) => {
                e.preventDefault();
                dropSlot.classList.add('drag-over');
            };
            dropSlot.ondragleave = () => {
                dropSlot.classList.remove('drag-over');
            };
            dropSlot.ondrop = (e) => {
                e.preventDefault();
                dropSlot.classList.remove('drag-over');
                const tplId = e.dataTransfer ? e.dataTransfer.getData('text/plain') : draggedTemplateId;
                if (tplId) {
                    placeMonsterIntoSpecificSlot(tplId, i);
                }
            };

            if (slotMonster) {
                // Dolu Slot - Arena Dövüşçü Kartı Görünümünde
                const fighterCard = createFighterCard(slotMonster, false, true, () => {
                    removeMonsterFromSlot(i);
                });

                // Slottan Başka Slota Taşınabilirlik (Masaüstü HTML5 Drag)
                fighterCard.draggable = true;
                fighterCard.ondragstart = (e) => {
                    draggedTemplateId = slotMonster.templateId;
                    if (e.dataTransfer) {
                        e.dataTransfer.setData('text/plain', slotMonster.templateId);
                        e.dataTransfer.effectAllowed = 'move';
                    }
                };
                fighterCard.ondragend = () => {
                    draggedTemplateId = null;
                };

                // Slottan Başka Slota Taşınabilirlik (Mobil / Dokunmatik Touch Drag & Swap)
                let slotTouchGhost = null;
                let slotTouchTarget = null;
                let startSlotX = 0;
                let startSlotY = 0;
                let isSlotDragging = false;

                fighterCard.ontouchstart = (e) => {
                    draggedTemplateId = slotMonster.templateId;
                    const touch = e.touches[0];
                    startSlotX = touch.clientX;
                    startSlotY = touch.clientY;
                    isSlotDragging = false;
                    slotTouchTarget = null;
                };

                fighterCard.ontouchmove = (e) => {
                    const touch = e.touches[0];
                    const dist = Math.hypot(touch.clientX - startSlotX, touch.clientY - startSlotY);

                    // Yalnızca kullanıcı parmağını en az 10px hareket ettirdiyse hayalet oluştur
                    if (!isSlotDragging && dist > 10) {
                        isSlotDragging = true;
                        cleanupTouchGhosts();
                        slotTouchGhost = document.createElement('div');
                        slotTouchGhost.className = 'drag-touch-ghost';
                        slotTouchGhost.innerHTML = `
                            ${slotMonster.image ? `<img src="${slotMonster.image}" style="width: 28px; height: 28px; border-radius: 6px; object-fit: cover;">` : `<span style="font-size: 1.5rem;">${slotMonster.emoji}</span>`}
                            <span style="font-size: 0.62rem; font-weight: 800; color: #fff;">${slotMonster.name.split(' ')[0]}</span>
                        `;
                        document.body.appendChild(slotTouchGhost);
                    }

                    if (isSlotDragging && slotTouchGhost) {
                        slotTouchGhost.style.left = `${touch.clientX}px`;
                        slotTouchGhost.style.top = `${touch.clientY}px`;

                        const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
                        const slotEl = targetEl ? targetEl.closest('.draft-drop-slot') : null;
                        document.querySelectorAll('.draft-drop-slot').forEach(el => el.classList.remove('drag-over'));
                        if (slotEl) {
                            slotEl.classList.add('drag-over');
                            slotTouchTarget = parseInt(slotEl.dataset.slotIndex);
                        } else {
                            slotTouchTarget = null;
                        }
                    }
                };

                const finishSlotTouch = () => {
                    cleanupTouchGhosts();
                    slotTouchGhost = null;
                    document.querySelectorAll('.draft-drop-slot').forEach(el => el.classList.remove('drag-over'));
                    if (isSlotDragging && slotTouchTarget !== null && !isNaN(slotTouchTarget)) {
                        placeMonsterIntoSpecificSlot(slotMonster.templateId, slotTouchTarget);
                    }
                    isSlotDragging = false;
                    draggedTemplateId = null;
                };

                fighterCard.ontouchend = finishSlotTouch;
                fighterCard.ontouchcancel = finishSlotTouch;

                dropSlot.appendChild(fighterCard);
            } else {
                // Boş Drop Alanı
                dropSlot.innerHTML = `
                    <div class="fighter-top-row">
                        <span class="slot-lane-indicator">SLOT ${i + 1}</span>
                    </div>
                    <div class="slot-drop-placeholder">
                        <div class="slot-drop-icon">📥</div>
                        <div class="slot-drop-hint">Dokun / Bırak</div>
                    </div>
                `;
                dropSlot.onclick = () => {
                    // Tıklama ile ilk uygun canavarı buraya koy
                    const firstUnassigned = candidate5Monsters.find(m => 
                        !playerSlots.some(s => s && s.templateId === m.templateId)
                    );
                    if (firstUnassigned) {
                        const sourceCard = document.querySelector(`.draft-card-5[data-template-id="${firstUnassigned.templateId}"]`);
                        placeMonsterIntoSpecificSlot(firstUnassigned.templateId, i, sourceCard);
                    }
                };
            }

            slotsContainer.appendChild(dropSlot);
        }

        // 3. 5'li Canavar Öneri Havuzu (Tek Sırada 5 Sürüklenebilir Kart)
        const poolContainer = document.getElementById('player-pool-selection');
        poolContainer.innerHTML = '';

        candidate5Monsters.forEach((monster) => {
            const isAssigned = playerSlots.some(s => s && s.templateId === monster.templateId);
            const card = document.createElement('div');
            card.className = `draft-card-5 ${isAssigned ? 'assigned' : ''}`;
            card.dataset.templateId = monster.templateId;
            card.draggable = !isAssigned;

            // HTML5 Drag Eventleri
            card.ondragstart = (e) => {
                draggedTemplateId = monster.templateId;
                card.classList.add('is-dragging');
                if (e.dataTransfer) {
                    e.dataTransfer.setData('text/plain', monster.templateId);
                    e.dataTransfer.effectAllowed = 'move';
                }
            };

            card.ondragend = () => {
                card.classList.remove('is-dragging');
                draggedTemplateId = null;
            };

            // Mobil Dokunmatik (Touch) Sürükleme Desteği & Uçan Ghost Efekti
            let touchTargetSlot = null;
            let touchGhost = null;
            let startTouchX = 0;
            let startTouchY = 0;
            let isTouchDragging = false;

            card.ontouchstart = (e) => {
                if (isAssigned) return;
                draggedTemplateId = monster.templateId;
                const touch = e.touches[0];
                startTouchX = touch.clientX;
                startTouchY = touch.clientY;
                isTouchDragging = false;
                touchTargetSlot = null;
            };

            card.ontouchmove = (e) => {
                if (isAssigned) return;
                const touch = e.touches[0];
                const dist = Math.hypot(touch.clientX - startTouchX, touch.clientY - startTouchY);

                // Yalnızca kullanıcı parmağını en az 10px hareket ettirdiyse hayalet oluştur
                if (!isTouchDragging && dist > 10) {
                    isTouchDragging = true;
                    cleanupTouchGhosts();
                    touchGhost = document.createElement('div');
                    touchGhost.className = 'drag-touch-ghost';
                    touchGhost.innerHTML = `
                        ${monster.image ? `<img src="${monster.image}" style="width: 28px; height: 28px; border-radius: 6px; object-fit: cover;">` : `<span style="font-size: 1.5rem;">${monster.emoji}</span>`}
                        <span style="font-size: 0.62rem; font-weight: 800; color: #fff;">${monster.name.split(' ')[0]}</span>
                    `;
                    document.body.appendChild(touchGhost);
                }

                if (isTouchDragging && touchGhost) {
                    touchGhost.style.left = `${touch.clientX}px`;
                    touchGhost.style.top = `${touch.clientY}px`;

                    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
                    const slotEl = targetEl ? targetEl.closest('.draft-drop-slot') : null;
                    
                    document.querySelectorAll('.draft-drop-slot').forEach(el => el.classList.remove('drag-over'));
                    if (slotEl) {
                        slotEl.classList.add('drag-over');
                        touchTargetSlot = parseInt(slotEl.dataset.slotIndex);
                    } else {
                        touchTargetSlot = null;
                    }
                }
            };

            const finishCandidateTouch = () => {
                cleanupTouchGhosts();
                touchGhost = null;
                document.querySelectorAll('.draft-drop-slot').forEach(el => el.classList.remove('drag-over'));
                if (isTouchDragging && touchTargetSlot !== null && !isNaN(touchTargetSlot)) {
                    placeMonsterIntoSpecificSlot(monster.templateId, touchTargetSlot, card);
                }
                isTouchDragging = false;
                draggedTemplateId = null;
            };

            card.ontouchend = finishCandidateTouch;
            card.ontouchcancel = finishCandidateTouch;

            // Tıklama ile Hızlı Yerleştirme
            card.onclick = () => {
                // Eğer dokunmatik sürükleme yapıldıysa tıklama olayını engelle
                if (isTouchDragging) return;
                assignMonsterToNextFreeSlot(monster, card);
            };

            card.innerHTML = `
                <div class="draft-badge-5">${isAssigned ? '✓ SEÇİLDİ' : '+ SEÇ'}</div>
                <div class="draft-card-top">
                    <div class="draft-card-emoji-wrap">
                        ${monster.image ? `<img src="${monster.image}" class="draft-card-img" alt="${monster.name}">` : `<span class="draft-card-emoji">${monster.emoji}</span>`}
                    </div>
                    <div class="card-title-5">${monster.name.split(' ')[0]}</div>
                    <div class="card-role-5">${monster.role}</div>
                </div>
                <div class="card-stats-row-5">
                    <span>❤️${monster.maxHp}</span>
                    <span>⚔️${monster.atk}</span>
                    <span>⚡${monster.spd}</span>
                    <span>💥%${monster.crit}</span>
                </div>
            `;
            poolContainer.appendChild(card);
        });

        validateDraftLineup();
    }

    // Kart Uçma Animasyonu Fonksiyonu
    function animateFlyCardToSlot(sourceEl, targetSlotIndex, onComplete) {
        const slots = document.querySelectorAll('#player-slots-container .draft-drop-slot');
        const targetSlot = slots[targetSlotIndex];
        if (!sourceEl || !targetSlot) {
            onComplete();
            return;
        }

        const startRect = sourceEl.getBoundingClientRect();
        const targetRect = targetSlot.getBoundingClientRect();

        const clone = document.createElement('div');
        clone.className = 'flying-card-clone';
        clone.innerHTML = sourceEl.innerHTML;
        clone.style.position = 'fixed';
        clone.style.zIndex = '999999';
        clone.style.pointerEvents = 'none';
        clone.style.margin = '0';
        clone.style.boxSizing = 'border-box';
        clone.style.left = `${startRect.left}px`;
        clone.style.top = `${startRect.top}px`;
        clone.style.width = `${startRect.width}px`;
        clone.style.height = `${startRect.height}px`;
        clone.style.transition = 'left 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), top 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)';
        document.body.appendChild(clone);

        requestAnimationFrame(() => {
            clone.style.left = `${targetRect.left}px`;
            clone.style.top = `${targetRect.top}px`;
            clone.style.width = `${targetRect.width}px`;
            clone.style.height = `${targetRect.height}px`;
            clone.style.transform = 'scale(1.05)';
        });

        setTimeout(() => {
            if (clone.parentNode) clone.parentNode.removeChild(clone);
            onComplete();
            const updatedSlots = document.querySelectorAll('#player-slots-container .draft-drop-slot');
            if (updatedSlots[targetSlotIndex]) {
                updatedSlots[targetSlotIndex].classList.add('slot-snap-bounce');
            }
        }, 260);
    }

    function placeMonsterIntoSpecificSlot(templateId, targetSlotIndex, sourceEl = null) {
        if (window.soundFX && window.soundFX.playSnap) {
            window.soundFX.playSnap();
        } else {
            window.soundFX.playClick();
        }

        const playerLevel = (window.authMgr.currentUser && window.authMgr.currentUser.profile && window.authMgr.currentUser.profile.level) || 1;
        const oldSlotIdx = playerSlots.findIndex(s => s && s.templateId === templateId);

        const performPlacement = () => {
            const currentOccupant = playerSlots[targetSlotIndex];

            // Taşınacak canavarın mevcut slot veya havuzdaki referansını al (Statları birebir koru)
            const movingMonster = (oldSlotIdx !== -1 && playerSlots[oldSlotIdx])
                ? playerSlots[oldSlotIdx]
                : candidate5Monsters.find(m => m.templateId === templateId);

            if (oldSlotIdx !== -1) {
                // Eğer zaten aynı slottaysa hiçbir şey yapma
                if (oldSlotIdx === targetSlotIndex) {
                    renderDraftScreen();
                    return;
                }
                // Slottan slota sürükleme: İki slotun canavarlarını yer değiştir (SWAP)
                if (currentOccupant) {
                    // Hedef slotta başka canavar vardı: onu eski slota taşı (SWAP) - statları birebir koru
                    playerSlots[oldSlotIdx] = { ...currentOccupant, slotIndex: oldSlotIdx };
                } else {
                    // Hedef slot boştu: eski slotu boşalt
                    playerSlots[oldSlotIdx] = null;
                }
            }

            // Slota yerleştirilecek canavar: Havuzdaki veya eski slottaki canavarın statlarını birebir koru
            const monsterToPlace = movingMonster
                ? { ...movingMonster, slotIndex: targetSlotIndex }
                : MonsterFactory.createMonster(templateId, playerLevel, false, targetSlotIndex);

            playerSlots[targetSlotIndex] = monsterToPlace;
            renderDraftScreen();
        };

        if (sourceEl) {
            animateFlyCardToSlot(sourceEl, targetSlotIndex, performPlacement);
        } else {
            const cardEl = document.querySelector(`.draft-card-5[data-template-id="${templateId}"]`);
            if (cardEl && oldSlotIdx === -1) {
                animateFlyCardToSlot(cardEl, targetSlotIndex, performPlacement);
            } else {
                performPlacement();
            }
        }
    }

    function assignMonsterToNextFreeSlot(monster, cardEl = null) {
        // Zaten bir slotta var mı kontrol et
        const alreadyInSlot = playerSlots.findIndex(s => s && s.templateId === monster.templateId);
        if (alreadyInSlot !== -1) {
            window.soundFX.playClick();
            // Slottan çıkar
            playerSlots[alreadyInSlot] = null;
            renderDraftScreen();
            return;
        }

        // İlk boş slotu bul
        const freeIndex = playerSlots.findIndex(s => s === null);
        if (freeIndex !== -1) {
            placeMonsterIntoSpecificSlot(monster.templateId, freeIndex, cardEl);
        } else {
            window.soundFX.playClick();
            // Tüm slotlar doluysa uyar
            const alertBox = document.getElementById('draft-validation-alert');
            alertBox.textContent = 'Tüm 3 slot dolu! Değiştirmek istediğiniz slotun üzerine sürükleyin veya slottaki ✕ butonuna basın.';
            alertBox.className = 'draft-alert warning animate-shake';
        }
    }

    function removeMonsterFromSlot(slotIdx) {
        if (playerSlots[slotIdx]) {
            window.soundFX.playClick();
            playerSlots[slotIdx] = null;
            renderDraftScreen();
        }
        validateDraftLineup();
    }

    function validateDraftLineup() {
        const startBtn = document.getElementById('btn-start-battle');
        const alertBox = document.getElementById('draft-validation-alert');
        const count = playerSlots.filter(s => s !== null).length;

        document.getElementById('selected-count').textContent = `${count}/3`;

        // Takım Element Sinerjisini Hesapla ve Göster
        const activeMonsters = playerSlots.filter(s => s !== null);
        const synergy = (window.calculateTeamSynergy && activeMonsters.length >= 2) ? window.calculateTeamSynergy(activeMonsters) : null;
        const draftSynergyBanner = document.getElementById('draft-synergy-banner');
        const draftSynergyIcon = document.getElementById('draft-synergy-icon');
        const draftSynergyText = document.getElementById('draft-synergy-text');

        if (draftSynergyBanner) {
            if (synergy) {
                draftSynergyBanner.classList.remove('hidden');
                if (draftSynergyIcon) draftSynergyIcon.textContent = synergy.icon;
                if (draftSynergyText) draftSynergyText.textContent = `${synergy.name}: ${synergy.desc}`;
            } else {
                draftSynergyBanner.classList.add('hidden');
            }
        }

        if (count < 3) {
            if (startBtn) {
                startBtn.disabled = true;
                startBtn.textContent = isBossRaidMode ? '🐉 TİTAN SAVAŞINI BAŞLAT' : '⚔️ SAVAŞI BAŞLAT';
            }
            alertBox.textContent = isBossRaidMode 
                ? `Titan Boss'a karşı 3 koridor slotunu da doldurun (${count}/3 yerleştirildi).`
                : `Lütfen 3 koridor slotunu da doldurun (${count}/3 yerleştirildi).`;
            alertBox.className = 'draft-alert info';
            return;
        }

        // Kural: Oyuncu bot ile AYNI 3 canavarı seçemez! (Boss modunda geçerli değildir)
        const playerIds = playerSlots.map(s => s.templateId);
        const botIds = currentBotTeam.map(s => s.templateId);

        if (!isBossRaidMode && window.botGen.isSameTeam(playerIds, botIds)) {
            if (startBtn) startBtn.disabled = true;
            alertBox.innerHTML = '🚫 <b>KURAL DIŞI!</b> Rakip bot ile birebir aynı dizilimi kuramazsınız. Lütfen en az bir farklı canavar yerleştirin!';
            alertBox.className = 'draft-alert warning animate-shake';
            return;
        }

        if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = isBossRaidMode ? '🐉 TİTAN SAVAŞINI BAŞLAT' : '⚔️ SAVAŞI BAŞLAT';
        }
        alertBox.textContent = isBossRaidMode 
            ? '🐉 Titan Raid kadronuz hazır! Maksimum hasarı vurmak için savaşı başlatın veya AI Simülasyonu çalıştırın.'
            : '✅ Koridor takımı hazır! Savaşa başlayabilir veya AI Simülasyonu çalıştırabilirsiniz.';
        alertBox.className = 'draft-alert success';

        const resCard = document.getElementById('ai-pred-result-card');
        if (resCard && !resCard.classList.contains('hidden')) {
            const tipEl = document.getElementById('ai-tactical-tip-text');
            if (tipEl) {
                tipEl.innerHTML = '🔄 <b>Kadro güncellendi:</b> Yeni diziliminizin zafer ihtimalini hesaplamak için <b>Yeniden Simüle Et</b> butonuna basabilirsiniz.';
            }
        }
    }

    // --- YAPAY ZEKA SAVAŞ TAHMİNİ & SİMÜLASYON MOTORU ---
    function runAiBattleSimulation() {
        window.soundFX.playClick();
        const count = playerSlots.filter(s => s !== null).length;
        if (count < 3) {
            showGameAlert({
                title: 'Slotlar Eksik',
                message: 'Yapay zeka zafer simülasyonunu çalıştırmak için lütfen önce 3 koridor slotuna da canavar yerleştirin!',
                type: 'warning',
                icon: '🐾'
            });
            return;
        }

        const rights = window.economyMgr.getPredictionRights();
        if (rights <= 0) {
            showGameAlert({
                title: 'Tahmin Bileti Yetersiz',
                message: 'AI Zafer Simülasyonu çalıştırmak için 1 Tahmin Biletine ihtiyacınız var. Lobideki Mağazadan bilet temin edebilirsiniz!',
                type: 'warning',
                icon: '🎟️'
            });
            return;
        }

        // 1 Tahmin Biletini Tüket
        window.economyMgr.consumePredictionRight();
        window.soundFX.playSkill();
        updateGlobalHeader();

        const ticketsEl = document.getElementById('pred-rights-count');
        if (ticketsEl) {
            ticketsEl.textContent = `${window.economyMgr.getPredictionRights()}`;
        }

        // 200 Maçlık Hızlı Headless Monte Carlo Simülasyonu
        const sim = BattleEngine.simulateMatchups(playerSlots, currentBotTeam, candidate5Monsters, 200);
        if (!sim) return;
        lastSimResult = sim;

        // Sonuç Kartını Göster
        const idleView = document.getElementById('ai-pred-idle-view');
        const resCard = document.getElementById('ai-pred-result-card');
        if (idleView) idleView.classList.add('hidden');
        if (resCard) resCard.classList.remove('hidden');

        // Zafer İhtimali Sayısı & Rozet Rengi
        const rateNumEl = document.getElementById('ai-win-rate-num');
        const rateBadge = document.getElementById('ai-win-rate-badge');
        if (rateNumEl) rateNumEl.textContent = `%${sim.winRate}`;

        if (rateBadge) {
            if (sim.winRate >= 65) {
                rateBadge.style.borderColor = '#10b981';
                if (rateNumEl) rateNumEl.style.color = '#10b981';
            } else if (sim.winRate >= 45) {
                rateBadge.style.borderColor = '#f59e0b';
                if (rateNumEl) rateNumEl.style.color = '#f59e0b';
            } else {
                rateBadge.style.borderColor = '#ff4757';
                if (rateNumEl) rateNumEl.style.color = '#ff4757';
            }
        }

        // 3 Koridor Çubuğu
        for (let i = 0; i < 3; i++) {
            const bar = document.getElementById(`ai-bar-slot-${i + 1}`);
            const pctText = document.getElementById(`ai-pct-slot-${i + 1}`);
            const r = sim.laneRates[i] || 50;
            if (bar) bar.style.width = `${r}%`;
            if (pctText) pctText.textContent = `%${r}`;
        }

        // Taktiksel AI Tavsiyesi
        const tipEl = document.getElementById('ai-tactical-tip-text');
        if (tipEl) tipEl.innerHTML = sim.tacticalAdvice;

        // Tek Tıkla Öneriyi Uygula Butonu
        const applyBtn = document.getElementById('btn-apply-ai-sim');
        if (applyBtn) {
            applyBtn.onclick = applyAiSimulationSuggestion;
            if (sim.suggestionAction) {
                applyBtn.classList.remove('hidden');
            } else {
                applyBtn.classList.add('hidden');
            }
        }
    }

    function applyAiSimulationSuggestion() {
        if (!lastSimResult || !lastSimResult.suggestionAction) return;
        const act = lastSimResult.suggestionAction;
        const playerLevel = (window.authMgr.currentUser && window.authMgr.currentUser.profile && window.authMgr.currentUser.profile.level) || 1;

        if (act.type === 'swap') {
            const temp = playerSlots[act.targetSlotIdx];
            playerSlots[act.targetSlotIdx] = playerSlots[act.swapWithSlotIdx];
            if (playerSlots[act.targetSlotIdx]) playerSlots[act.targetSlotIdx].slotIndex = act.targetSlotIdx;
            playerSlots[act.swapWithSlotIdx] = temp;
            if (playerSlots[act.swapWithSlotIdx]) playerSlots[act.swapWithSlotIdx].slotIndex = act.swapWithSlotIdx;
        } else if (act.type === 'bench' && act.candidate) {
            const existingIdx = playerSlots.findIndex(s => s && s.templateId === act.candidate.templateId);
            if (existingIdx !== -1) playerSlots[existingIdx] = null;
            const poolMonster = candidate5Monsters.find(m => m.templateId === act.candidate.templateId) || act.candidate;
            playerSlots[act.targetSlotIdx] = { ...poolMonster, slotIndex: act.targetSlotIdx };
        } else if (act.type === 'full' && Array.isArray(act.templateIds)) {
            for (let i = 0; i < 3; i++) {
                if (act.templateIds[i]) {
                    const poolMonster = candidate5Monsters.find(m => m.templateId === act.templateIds[i]);
                    playerSlots[i] = poolMonster 
                        ? { ...poolMonster, slotIndex: i } 
                        : MonsterFactory.createMonster(act.templateIds[i], playerLevel, false, i);
                }
            }
        }

        if (window.soundFX && window.soundFX.playSnap) window.soundFX.playSnap();
        if (window.soundFX && window.soundFX.playSkill) window.soundFX.playSkill();

        const applyBtn = document.getElementById('btn-apply-ai-sim');
        if (applyBtn) applyBtn.classList.add('hidden');

        const tipEl = document.getElementById('ai-tactical-tip-text');
        if (tipEl) tipEl.innerHTML = '⚡ <b>AI Dizilimi Uygulandı!</b> Yeni dizilimin avantajlarını koridorda test etmek için savaşı başlatın.';

        renderDraftScreen();
    }

    function closeAiBattleSimulation() {
        window.soundFX.playClick();
        const idleView = document.getElementById('ai-pred-idle-view');
        const resCard = document.getElementById('ai-pred-result-card');
        if (idleView) idleView.classList.remove('hidden');
        if (resCard) resCard.classList.add('hidden');
    }

    // --- EKRAN SARSINTISI & ZAFER KONFETİSİ ---
    function triggerScreenShake() {
        const container = document.querySelector('.game-container') || document.body;
        container.classList.remove('shake-crit');
        void container.offsetWidth; // reflow tetikle
        container.classList.add('shake-crit');
        setTimeout(() => container.classList.remove('shake-crit'), 350);
    }

    function startVictoryConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.parentElement.offsetWidth || 360;
        canvas.height = canvas.parentElement.offsetHeight || 420;

        const particles = [];
        const colors = ['#ff4757', '#ffa502', '#2ed573', '#38bdf8', '#a55eea', '#ffffff'];
        for (let i = 0; i < 45; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * -50,
                r: Math.random() * 5 + 3,
                d: Math.random() * 40 + 10,
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.random() * 10 - 10,
                tiltAngle: 0,
                tiltAngleIncremental: Math.random() * 0.08 + 0.04
            });
        }
        let confettiAnimationId;
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.tiltAngle += p.tiltAngleIncremental;
                p.y += (Math.cos(p.d) + 2.5 + p.r / 2) * 0.8;
                p.x += Math.sin(p.tiltAngle) * 1.5;
                ctx.beginPath();
                ctx.lineWidth = p.r;
                ctx.strokeStyle = p.color;
                ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
                ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
                ctx.stroke();
            });
            confettiAnimationId = requestAnimationFrame(draw);
        }
        draw();
        setTimeout(() => {
            cancelAnimationFrame(confettiAnimationId);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }, 3500);
    }

    // --- KORİDOR / SLOT BAZLI SAVAŞ ARENASI ---
    function startBattle() {
        window.soundFX.playClick();

        if (isBossRaidMode) {
            // Titan Raid modunda günlük lig hakkı tüketilmez (Sınırsız deneme)
            switchScreen('battle');
            renderBattleArena();

            // Savaş HUD Sinerji Rozetini Güncelle
            const activeMonsters = playerSlots.filter(s => s !== null);
            const synergy = (window.calculateTeamSynergy && activeMonsters.length >= 2) ? window.calculateTeamSynergy(activeMonsters) : null;
            const battleSynergyPill = document.getElementById('battle-synergy-pill');
            if (battleSynergyPill) {
                if (synergy) {
                    battleSynergyPill.classList.remove('hidden');
                    battleSynergyPill.textContent = `${synergy.icon} ${synergy.name}`;
                    if (window.soundFX && window.soundFX.playSynergyActive) {
                        window.soundFX.playSynergyActive();
                    }
                } else {
                    battleSynergyPill.classList.add('hidden');
                }
            }

            const logContainer = document.getElementById('battle-logs');
            logContainer.innerHTML = '<p class="log-line system">🐉 <b>KADİM TİTAN EJDERHA IGNIS SAHNEYE ÇIKTI!</b> Takımınız maksimum hasarı vurmaya hazırlanıyor...</p>';

            if (window.soundFX && window.soundFX.playRoar) window.soundFX.playRoar();

            currentBattle = new BattleEngine(playerSlots, currentBotTeam, null, {
                onLog: (msg, type) => addBattleLog(msg, type),
                onUpdateUI: () => renderBattleArena(),
                onFloatText: (instanceId, text, type) => showFloatingText(instanceId, text, type),
                onAction: (attackerId, act, targetId) => triggerSlotAttackAnimation(attackerId, act, targetId),
                onCritEffect: () => triggerScreenShake(),
                onGameOver: (playerWon, predResult, mvpFighter) => handleBossRaidEnd(playerSlots, mvpFighter)
            });

            const btnQuit = document.getElementById('btn-battle-quit');
            if (btnQuit) {
                btnQuit.textContent = '🏳️ Çık';
                btnQuit.style.background = '';
                btnQuit.style.borderColor = '';
                btnQuit.style.color = '';
            }

            currentBattle.start();
            return;
        }

        const dailyStatus = window.authMgr.getDailyBattleStatus();
        if (!dailyStatus.canPlay) {
            showGameAlert({
                title: 'Günlük Savaş Limiti Doldu',
                message: `Bugün için 3 maçlık savaş hakkınızı doldurdunuz.\nSıfırlanmaya Kalan Süre: <b>${dailyStatus.resetTimeStr}</b>`,
                type: 'warning',
                icon: '⚡'
            });
            return;
        }

        // Günlük 1 savaşı tüket
        window.authMgr.consumeDailyBattle();
        updateGlobalHeader();

        switchScreen('battle');
        renderBattleArena();

        // Savaş HUD Sinerji Rozetini Güncelle
        const activeMonsters = playerSlots.filter(s => s !== null);
        const synergy = (window.calculateTeamSynergy && activeMonsters.length >= 2) ? window.calculateTeamSynergy(activeMonsters) : null;
        const battleSynergyPill = document.getElementById('battle-synergy-pill');
        if (battleSynergyPill) {
            if (synergy) {
                battleSynergyPill.classList.remove('hidden');
                battleSynergyPill.textContent = `${synergy.icon} ${synergy.name}`;
                if (window.soundFX && window.soundFX.playSynergyActive) {
                    window.soundFX.playSynergyActive();
                }
            } else {
                battleSynergyPill.classList.add('hidden');
            }
        }

        const logContainer = document.getElementById('battle-logs');
        logContainer.innerHTML = '';

        // Slot bazlı savaş motorunu başlat
        currentBattle = new BattleEngine(playerSlots, currentBotTeam, null, {
            onLog: (msg, type) => addBattleLog(msg, type),
            onUpdateUI: () => renderBattleArena(),
            onFloatText: (instanceId, text, type) => showFloatingText(instanceId, text, type),
            onAction: (attackerId, act, targetId) => triggerSlotAttackAnimation(attackerId, act, targetId),
            onCritEffect: () => triggerScreenShake(),
            onGameOver: (playerWon, predResult, mvpFighter) => handleBattleEnd(playerWon, predResult, mvpFighter)
        });

        const btnQuit = document.getElementById('btn-battle-quit');
        if (btnQuit) {
            btnQuit.textContent = '🏳️ Çık';
            btnQuit.style.background = '';
            btnQuit.style.borderColor = '';
            btnQuit.style.color = '';
        }

        currentBattle.start();
    }

    function renderBattleArena() {
        const playerLanes = document.getElementById('arena-player-team');
        const botLanes = document.getElementById('arena-bot-team');

        playerLanes.innerHTML = '';
        botLanes.innerHTML = '';

        // Bot Slotları (0, 1, 2)
        currentBotTeam.forEach(m => {
            botLanes.appendChild(createFighterCard(m, true));
        });

        // Oyuncu Slotları (0, 1, 2)
        playerSlots.forEach(m => {
            playerLanes.appendChild(createFighterCard(m, false));
        });
    }

    function createFighterCard(monster, isBot, showRemoveBtn = false, onRemove = null) {
        const div = document.createElement('div');
        div.id = `fighter-${monster.instanceId}`;
        div.className = `fighter-card lane-slot-${monster.slotIndex} ${isBot ? 'bot-fighter' : 'player-fighter'} ${monster.currentHp <= 0 ? 'dead' : ''}`;

        const hpPct = Math.max(0, Math.min(100, Math.round((monster.currentHp / monster.maxHp) * 100)));
        const energyPct = Math.max(0, Math.min(100, monster.energy || 0));

        let badges = '';
        if (monster.shield > 0) badges += `<span class="badge-shield">🛡️ ${monster.shield}</span>`;
        if (monster.burnTurns > 0) badges += `<span class="badge-burn">🔥</span>`;
        if (monster.isStunned) badges += `<span class="badge-stun">💫</span>`;

        const statusBarHtml = badges ? `<div class="fighter-status-bar">${badges}</div>` : '';
        const removeBtnHtml = showRemoveBtn ? `<button type="button" class="slot-drop-remove" title="Slottan Çıkar">✕</button>` : '';
        div.dataset.emoji = monster.emoji || '';

        div.innerHTML = `
            <div class="fighter-top-row">
                <span class="slot-lane-indicator">SLOT ${monster.slotIndex + 1}</span>
                ${removeBtnHtml}
            </div>
            <div class="floating-text-container" id="floater-${monster.instanceId}"></div>
            ${statusBarHtml}
            <div class="fighter-avatar-box">
                ${monster.image ? `<img src="${monster.image}" class="monster-avatar-img" alt="${monster.name}">` : `<span class="fighter-emoji">${monster.emoji}</span>`}
            </div>
            <div class="fighter-name">${monster.name.split(' ')[0]}</div>
            <div class="hp-bar-outer">
                <div class="hp-bar-inner ${hpPct < 30 ? 'critical' : ''}" style="width: ${hpPct}%"></div>
                <span class="hp-label">${monster.currentHp}/${monster.maxHp}</span>
            </div>
            <div class="energy-bar-outer">
                <div class="energy-bar-inner" style="width: ${energyPct}%"></div>
            </div>
            <div class="fighter-mini-stats">
                <span class="stat-pill-atk">⚔️ ${monster.atk}</span>
                <span class="stat-pill-spd">⚡ ${monster.spd}</span>
            </div>
        `;

        if (showRemoveBtn && onRemove) {
            const btn = div.querySelector('.slot-drop-remove');
            if (btn) {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    onRemove();
                };
            }
        }

        return div;
    }

    function showFloatingText(instanceId, text, type) {
        const container = document.getElementById(`floater-${instanceId}`);
        if (!container) return;

        // Hasar rakamını merminin hedefe çarpma anıyla (180ms) senkronize et
        const delay = (type === 'damage' || type === 'crit') ? 180 : 0;
        setTimeout(() => {
            const floatEl = document.createElement('div');
            floatEl.className = `float-text ${type}`;
            floatEl.textContent = text;
            container.appendChild(floatEl);

            setTimeout(() => floatEl.remove(), 1200);
        }, delay);
    }

    // --- MODEL 5: ÇİZGİ ROMAN HİBRİT SALDIRI & UÇAN MERMİ MOTORU ---
    function getProjectileForMonster(emoji, action) {
        if (action === 'skill') return { icon: '⭐', glow: '#a55eea' };

        switch (emoji) {
            case '🐉': // Titan Ejderha Ignis
            case '🦎': // Ateş Ejderciği
                return { icon: '🔥', glow: '#ff4757' };
            case '🐯': // Kaplan
            case '🦁': // Aslan
            case '🐺': // Kurt
            case '🐆': // Pars
                return { icon: '🐾', glow: '#ffa502' };
            case '🦅': // Kartal
            case '🦉': // Baykuş
            case '🦆': // Ördek
                return { icon: '🪶', glow: '#38bdf8' };
            case '🐻': // Ayı
            case '🐘': // Fil
            case '🐗': // Domuz
            case '🦏': // Gergedan
                return { icon: '🪨', glow: '#ea580c' };
            case '🦊': // Tilki
            case '🐵': // Maymun
            case '🐍': // Yılan
                return { icon: '⚡', glow: '#eab308' };
            case '🐼': // Panda
            case '🐢': // Kaplumbağa
                return { icon: '🍃', glow: '#2ed573' };
            default:
                return { icon: '💥', glow: '#ff4757' };
        }
    }

    function spawnCombatProjectile(attackerEl, targetEl, action) {
        if (!attackerEl || !targetEl) return;

        const startRect = attackerEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        const startX = startRect.left + startRect.width / 2;
        const startY = startRect.top + startRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;
        const deltaX = endX - startX;
        const deltaY = endY - startY;

        const emoji = attackerEl.dataset?.emoji || attackerEl.querySelector('.fighter-emoji')?.textContent?.trim() || '';
        const projData = getProjectileForMonster(emoji, action);

        const projectile = document.createElement('div');
        projectile.className = 'combat-projectile';
        projectile.textContent = projData.icon;
        projectile.style.left = `${startX}px`;
        projectile.style.top = `${startY}px`;
        projectile.style.transform = 'translate(-50%, -50%) scale(0.6)';
        projectile.style.filter = `drop-shadow(0 0 10px ${projData.glow})`;
        projectile.style.transition = 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.22s ease';
        projectile.style.opacity = '1';

        document.body.appendChild(projectile);

        // Bir sonraki render frame'inde hedefe uçur
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                projectile.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(1.35)`;
            });
        });

        // 220ms sonra hedefte patlama yarat ve mermiyi temizle
        setTimeout(() => {
            projectile.remove();
            spawnComicImpactBurst(targetEl, projData.glow);
        }, 220);
    }

    function spawnComicImpactBurst(targetEl, glowColor = '#ff4757') {
        if (!targetEl) return;

        const burst = document.createElement('div');
        burst.className = 'comic-impact-burst';
        burst.textContent = '💥';
        burst.style.filter = `drop-shadow(0 0 12px ${glowColor})`;

        targetEl.appendChild(burst);
        setTimeout(() => burst.remove(), 320);
    }

    function triggerSlotAttackAnimation(attackerId, action, targetId) {
        const attackerEl = document.getElementById(`fighter-${attackerId}`);
        const targetEl = document.getElementById(`fighter-${targetId}`);

        if (attackerEl) {
            const isBot = attackerEl.classList.contains('bot-fighter');
            const attackClass = action === 'skill' ? 'anim-skill' : (isBot ? 'anim-attack-down' : 'anim-attack-up');
            attackerEl.classList.add(attackClass, 'anim-attacker-charge');
            setTimeout(() => attackerEl.classList.remove('anim-skill', 'anim-attack-up', 'anim-attack-down', 'anim-attacker-charge'), 450);
        }

        if (attackerEl && targetEl) {
            spawnCombatProjectile(attackerEl, targetEl, action);
        }

        if (targetEl) {
            // Merminin varış anıyla (200ms) sarsılmayı senkronize et
            setTimeout(() => {
                targetEl.classList.add('anim-hit-shake');
                setTimeout(() => targetEl.classList.remove('anim-hit-shake'), 350);
            }, 200);
        }
    }

    function addBattleLog(message, type) {
        const logBox = document.getElementById('battle-logs');
        if (!logBox) return;

        const p = document.createElement('p');
        p.className = `log-line ${type || ''}`;
        p.innerHTML = message;
        logBox.appendChild(p);
        logBox.scrollTop = logBox.scrollHeight;
    }

    // --- SAVAŞ SONUÇ VE TAHMİN ÖDÜLLERİ ---
    function handleBattleEnd(playerWon, predResult, mvpFighter = null) {
        let baseTokenReward = playerWon ? 15 : 4;
        let trophyDelta = playerWon ? (25 + Math.floor(Math.random() * 8)) : -(14 + Math.floor(Math.random() * 5));
        let expDelta = playerWon ? 45 : 12;

        const predBox = document.getElementById('result-prediction-box');

        if (predResult) {
            if (predResult.success) {
                baseTokenReward += predResult.bonusTokens;
                trophyDelta += predResult.bonusTrophies;
                expDelta += predResult.bonusExp;

                predBox.className = 'result-pred-banner success';
                predBox.innerHTML = `🎯 <b>TAHMİN KAZANDI!</b><br>${predResult.title} ✨ +${predResult.bonusTokens} <span class="token-coin-icon"></span> & +${predResult.bonusTrophies} 🏆 Bonus!`;
                predBox.classList.remove('hidden');
                window.soundFX.playCoins();
            } else {
                predBox.className = 'result-pred-banner failure';
                predBox.innerHTML = `🎯 <b>Tahmin Tutmadı:</b> ${predResult.title} (Bonus kazanılamadı)`;
                predBox.classList.remove('hidden');
            }
        } else {
            predBox.classList.add('hidden');
        }

        if (playerWon) {
            window.soundFX.playVictory();
            startVictoryConfetti();
        } else {
            window.soundFX.playDefeat();
        }

        window.profileMgr.recordMatch(playerWon, playerSlots, currentBotTeam, trophyDelta, expDelta, baseTokenReward, predResult);
        updateGlobalHeader();

        const titleEl = document.getElementById('result-title');
        const iconEl = document.getElementById('result-icon');
        const trophiesEl = document.getElementById('result-trophies');
        const tokensEl = document.getElementById('result-tokens');
        const expEl = document.getElementById('result-exp');

        if (playerWon) {
            titleEl.textContent = 'ZAFER! ARENA FETHEDİLDİ!';
            titleEl.className = 'result-title victory';
            iconEl.textContent = '🏆';
            trophiesEl.textContent = `+${trophyDelta} Kupa 🏆`;
            trophiesEl.style.color = '#2ecc71';
        } else {
            titleEl.textContent = 'BOZGUN! KORİDORLAR DÜŞTÜ!';
            titleEl.className = 'result-title defeat';
            iconEl.textContent = '💀';
            trophiesEl.textContent = `${trophyDelta} Kupa 📉`;
            trophiesEl.style.color = '#e74c3c';
        }

        tokensEl.innerHTML = `+${baseTokenReward} <span class="token-coin-icon"></span>`;
        expEl.textContent = `+${expDelta} TP`;

        // MVP Kartı Gösterimi
        const mvpBox = document.getElementById('result-mvp-box');
        if (mvpBox && mvpFighter) {
            mvpBox.classList.remove('hidden');
            const av = document.getElementById('result-mvp-avatar');
            const nm = document.getElementById('result-mvp-name');
            const st = document.getElementById('result-mvp-stats');
            if (av) {
                if (mvpFighter.image) {
                    av.innerHTML = `<img src="${mvpFighter.image}" class="monster-avatar-img" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
                } else {
                    av.textContent = mvpFighter.emoji;
                }
            }
            if (nm) nm.textContent = `${mvpFighter.name}`;
            if (st) st.textContent = `💥 ${mvpFighter.damageDealt || 0} Hasar • ⚔️ ${mvpFighter.kills || 0} Nakavt`;
        } else if (mvpBox) {
            mvpBox.classList.add('hidden');
        }

        const btnQuit = document.getElementById('btn-battle-quit');
        if (btnQuit) {
            btnQuit.textContent = '🏠 Lobi';
            btnQuit.style.background = 'rgba(46, 213, 115, 0.2)';
            btnQuit.style.borderColor = '#2ed573';
            btnQuit.style.color = '#2ed573';
        }

        openModal('result');
    }

    // --- GELİŞMİŞ LİDERLİK TABLOSU ---
    function renderLeaderboardModal() {
        const listContainer = document.getElementById('leaderboard-list');
        listContainer.innerHTML = '';

        // Zaman Dilimi Bilgi Başlığını Güncelle
        const bannerData = window.leaderboardMgr.getTimeframeBannerData();
        const iconEl = document.getElementById('lb-tf-icon');
        const titleEl = document.getElementById('lb-tf-title');
        const timerEl = document.getElementById('lb-tf-timer');
        const descEl = document.getElementById('lb-tf-desc');

        if (iconEl) iconEl.textContent = bannerData.icon;
        if (titleEl) titleEl.textContent = bannerData.title;
        if (timerEl) timerEl.textContent = bannerData.timer;
        if (descEl) descEl.textContent = bannerData.sub;

        const board = window.leaderboardMgr.getFilteredLeaderboard();

        if (board.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 20px;">Aradığınız kriterde yarışmacı bulunamadı.</p>';
            return;
        }

        board.forEach(entry => {
            const row = document.createElement('div');
            row.className = `leaderboard-row ${entry.isPlayer ? 'player-row' : ''}`;
            row.onclick = () => showPlayerInspection(entry);

            let rankBadge = `#${entry.rank}`;
            if (entry.rank === 1) rankBadge = '🥇 #1';
            else if (entry.rank === 2) rankBadge = '🥈 #2';
            else if (entry.rank === 3) rankBadge = '🥉 #3';

            row.innerHTML = `
                <div class="lb-rank">${rankBadge}</div>
                <div class="lb-avatar-circle">${entry.avatar}</div>
                <div class="lb-info">
                    <div class="lb-name">${entry.name} ${entry.isPlayer ? '⭐ (SİZ)' : ''}</div>
                    <div class="lb-tier-tag" style="color: ${entry.tier.color};">${entry.tier.badge} ${entry.tier.name}</div>
                </div>
                <div class="lb-trophies">🏆 ${entry.trophies}</div>
            `;
            listContainer.appendChild(row);
        });

        openModal('leaderboard');
    }

    function showPlayerInspection(entry) {
        document.getElementById('insp-avatar').textContent = entry.avatar;
        document.getElementById('insp-name').textContent = entry.name;
        document.getElementById('insp-title').textContent = entry.title || 'Arena Savaşçısı';
        document.getElementById('insp-tier').textContent = `${entry.tier.badge} ${entry.tier.name}`;
        document.getElementById('insp-tier').style.color = entry.tier.color;
        document.getElementById('insp-trophies').textContent = `🏆 ${entry.trophies}`;
        document.getElementById('insp-winrate').textContent = `%${entry.winRate}`;
        document.getElementById('insp-wins').textContent = entry.wins;
        document.getElementById('insp-losses').textContent = entry.losses;

        openModal('playerDetail');
    }

    // Lider Tablosu Zaman Dilimi Ana Sekmeleri (Haftalık / Aylık / Tüm Zamanlar)
    document.querySelectorAll('.lb-tf-btn').forEach(btn => {
        btn.onclick = () => {
            window.soundFX.playClick();
            document.querySelectorAll('.lb-tf-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            window.leaderboardMgr.currentTimeframe = btn.dataset.timeframe;
            renderLeaderboardModal();
        };
    });

    // Lider Tablosu Lig Sekmeleri & Arama
    document.querySelectorAll('.lb-tab-btn').forEach(btn => {
        btn.onclick = () => {
            window.soundFX.playClick();
            document.querySelectorAll('.lb-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            window.leaderboardMgr.currentFilter = btn.dataset.tier;
            renderLeaderboardModal();
        };
    });

    document.getElementById('lb-search-input').oninput = (e) => {
        window.leaderboardMgr.searchQuery = e.target.value;
        renderLeaderboardModal();
    };

    // --- MAĞAZA VE ÖDEME SİSTEMİ ---
    function renderStoreModal(activeTab = 'tickets') {
        const prof = window.economyMgr.getProfile();
        if (!prof) return;

        updateGlobalHeader();

        const tabTickets = document.getElementById('tab-store-tickets');
        const tabTokens = document.getElementById('tab-store-tokens');
        const panelTickets = document.getElementById('store-tickets-panel');
        const panelTokens = document.getElementById('store-tokens-panel');

        if (activeTab === 'tickets') {
            tabTickets.classList.add('active');
            tabTokens.classList.remove('active');
            panelTickets.classList.remove('hidden');
            panelTokens.classList.add('hidden');
        } else {
            tabTokens.classList.add('active');
            tabTickets.classList.remove('active');
            panelTokens.classList.remove('hidden');
            panelTickets.classList.add('hidden');
        }

        // Sekme 1: Tahmin Hakları Paketleri (Token İle)
        panelTickets.innerHTML = '';
        window.PREDICTION_PACKAGES_TOKEN.forEach(pkg => {
            const card = document.createElement('div');
            card.className = 'store-item-card';
            card.innerHTML = `
                ${pkg.badge ? `<div class="store-pkg-badge">${pkg.badge}</div>` : ''}
                <div class="store-item-left">
                    <div class="store-item-icon">${pkg.icon}</div>
                    <div>
                        <div class="store-item-name">${pkg.name}</div>
                        <div class="store-item-desc">${pkg.desc}</div>
                    </div>
                </div>
                <button class="btn-buy-ticket"><span class="token-coin-icon"></span> ${pkg.costToken} Token</button>
            `;
            card.querySelector('button').onclick = () => {
                window.soundFX.playClick();
                const res = window.economyMgr.buyPredictionRightsWithTokens(pkg.id);
                if (res.success) {
                    window.soundFX.playCoins();
                    updateGlobalHeader();
                    renderStoreModal('tickets');
                    alert(res.message);
                } else {
                    alert(res.message);
                }
            };
            panelTickets.appendChild(card);
        });

        // Sekme 2: Gerçek Para ile Token Satın Alma Paketleri (₺)
        panelTokens.innerHTML = '';
        window.TOKEN_PACKAGES_REAL_MONEY.forEach(pkg => {
            const card = document.createElement('div');
            card.className = 'store-item-card';
            const bonusText = pkg.bonus > 0 ? `<span style="color: var(--accent-cyan); font-weight: bold;">+${pkg.bonus} Bonus</span>` : '';
            card.innerHTML = `
                ${pkg.badge ? `<div class="store-pkg-badge">${pkg.badge}</div>` : ''}
                <div class="store-item-left">
                    <div class="store-item-icon">${pkg.icon}</div>
                    <div>
                        <div class="store-item-name">${pkg.tokens} Token ${bonusText}</div>
                        <div class="store-item-desc">${pkg.name}</div>
                    </div>
                </div>
                <button class="btn-buy-real">${pkg.priceTL}</button>
            `;
            card.querySelector('button').onclick = () => {
                window.soundFX.playClick();
                renderCheckoutModal(pkg);
            };
            panelTokens.appendChild(card);
        });

        openModal('store');
    }

    function renderCheckoutModal(pkg) {
        selectedCheckoutPkg = pkg;
        const totalTok = pkg.tokens + pkg.bonus;
        document.getElementById('checkout-pkg-details').innerHTML = `
            <div style="font-size: 2.2rem; margin-bottom: 4px;">${pkg.icon}</div>
            <div style="font-size: 1.1rem; font-weight: 900;">${pkg.name}</div>
            <div style="font-size: 0.85rem; color: var(--accent-gold); margin: 4px 0; display: flex; align-items: center; justify-content: center; gap: 4px;"><span class="token-coin-icon"></span> <span>${totalTok} Token Hesabınıza Eklenecek</span></div>
            <div style="font-size: 1.2rem; font-weight: 900; color: var(--accent-cyan);">${pkg.priceTL}</div>
        `;
        openModal('checkout');
    }

    // Ödeme Formu Onayı (Simülasyon)
    document.getElementById('checkout-form').onsubmit = (e) => {
        e.preventDefault();
        window.soundFX.playClick();
        if (!selectedCheckoutPkg) return;

        const res = window.economyMgr.simulateRealMoneyPurchase(selectedCheckoutPkg.id, {});
        if (res.success) {
            window.soundFX.playCoins();
            updateGlobalHeader();
            closeModal('checkout');
            renderStoreModal('tokens');
            alert(`🎉 ${res.message}\nYeni Token Bakiyeniz: ${res.newTokens} Token`);
        }
    };

    // Mağaza Sekme Butonları
    document.getElementById('tab-store-tickets').onclick = () => {
        window.soundFX.playClick();
        renderStoreModal('tickets');
    };
    document.getElementById('tab-store-tokens').onclick = () => {
        window.soundFX.playClick();
        renderStoreModal('tokens');
    };

    // Savaş Öncesi Yapay Zeka Simülasyon Butonları
    const simBtn = document.getElementById('btn-run-ai-simulation');
    if (simBtn) {
        simBtn.onclick = runAiBattleSimulation;
    }

    const btnCloseSim = document.getElementById('btn-close-ai-sim');
    if (btnCloseSim) {
        btnCloseSim.onclick = closeAiBattleSimulation;
    }

    const btnRerunSim = document.getElementById('btn-rerun-ai-sim');
    if (btnRerunSim) {
        btnRerunSim.onclick = runAiBattleSimulation;
    }

    // --- EVENT LISTENERS ---
    document.getElementById('btn-quick-play').onclick = prepareNewMatch;
    
    // Mağaza Açma Butonları (Sadece Lobi ve Üst Panelden Erişilebilir)
    const openStoreHandlers = [
        'btn-open-shop',
        'btn-open-shop-lobby',
        'btn-header-tokens',
        'btn-header-tickets',
        'stat-box-token-btn',
        'stat-box-ticket-btn'
    ];
    openStoreHandlers.forEach(btnId => {
        const el = document.getElementById(btnId);
        if (el) {
            el.onclick = () => {
                window.soundFX.playClick();
                renderStoreModal('tickets');
            };
        }
    });

    document.getElementById('btn-open-leaderboard').onclick = () => {
        window.soundFX.playClick();
        renderLeaderboardModal();
    };
    document.getElementById('btn-open-profile').onclick = () => {
        window.soundFX.playClick();
        renderProfileModal();
    };
    const profStrip = document.getElementById('btn-open-profile-strip');
    if (profStrip) {
        profStrip.onclick = () => {
            window.soundFX.playClick();
            renderProfileModal();
        };
    }
    // --- 18+ EFSANEVİ CANAVAR REHBERİ (BESTIARY) MOTORU ---
    let selectedBestiaryCat = 'all';
    let bestiarySearchQuery = '';

    function renderBestiaryModal() {
        const listContainer = document.getElementById('bestiary-monster-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        let monsters = window.MONSTER_TEMPLATES || [];

        // Kategori Filtresi
        if (selectedBestiaryCat !== 'all') {
            monsters = monsters.filter(m => m.category === selectedBestiaryCat);
        }

        // Arama Filtresi
        if (bestiarySearchQuery && bestiarySearchQuery.trim() !== '') {
            const q = bestiarySearchQuery.toLowerCase().trim();
            monsters = monsters.filter(m => 
                m.name.toLowerCase().includes(q) ||
                (m.role && m.role.toLowerCase().includes(q)) ||
                (m.skillName && m.skillName.toLowerCase().includes(q)) ||
                (m.element && m.element.toLowerCase().includes(q)) ||
                (m.skillDesc && m.skillDesc.toLowerCase().includes(q))
            );
        }

        if (monsters.length === 0) {
            listContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-muted); font-size: 0.85rem;">
                    🔍 Aradığınız kriterde canavar bulunamadı.
                </div>
            `;
            openModal('bestiary');
            return;
        }

        monsters.forEach(m => {
            const card = document.createElement('div');
            card.className = 'bestiary-card';
            
            // Element Rozeti
            let elemIcon = '🔥';
            if (m.element === 'Su') elemIcon = '💧';
            else if (m.element === 'Toprak') elemIcon = '🌿';
            else if (m.element === 'Rüzgar') elemIcon = '🌪️';
            else if (m.element === 'Işık') elemIcon = '☀️';
            else if (m.element === 'Karanlık') elemIcon = '🌑';
            else if (m.element === 'Doğa') elemIcon = '🍃';

            card.innerHTML = `
                <div class="bestiary-card-header">
                    <div class="bestiary-avatar-box" style="border-color: ${m.color};">
                        ${m.image ? `<img src="${m.image}" class="bestiary-avatar-img" alt="${m.name}">` : `<span class="bestiary-emoji">${m.emoji}</span>`}
                    </div>
                    <div class="bestiary-header-info">
                        <div class="bestiary-name">${m.name}</div>
                        <div class="bestiary-tags">
                            <span class="bestiary-role-tag">${m.role}</span>
                            <span class="bestiary-elem-tag">${elemIcon} ${m.element}</span>
                        </div>
                    </div>
                </div>

                <!-- Özel Yetenek Bloğu -->
                <div class="bestiary-skill-box">
                    <div class="bestiary-skill-title">
                        <span>⭐ ÖZEL YETENEK:</span>
                        <span class="bestiary-skill-name">${m.skillName}</span>
                    </div>
                    <div class="bestiary-skill-desc">${m.skillDesc}</div>
                </div>

                <!-- Taktiksel Tavsiye -->
                <div class="bestiary-tactic-box">
                    💡 <b>Taktik:</b> ${m.tacticalTip || 'Dengeli koridor eşleşmesinde yüksek verim sağlar.'}
                </div>
            `;
            listContainer.appendChild(card);
        });

        openModal('bestiary');
    }

    // Bestiary Tab & Arama Dinleyicileri
    document.querySelectorAll('.bestiary-tab').forEach(btn => {
        btn.onclick = () => {
            window.soundFX.playClick();
            document.querySelectorAll('.bestiary-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedBestiaryCat = btn.dataset.cat;
            renderBestiaryModal();
        };
    });

    const searchBestiaryInput = document.getElementById('bestiary-search-input');
    if (searchBestiaryInput) {
        searchBestiaryInput.oninput = (e) => {
            bestiarySearchQuery = e.target.value;
            renderBestiaryModal();
        };
    }

    // Perk Butonları (Lobi Banneri)
    const btnOpenBestiary = document.getElementById('btn-open-bestiary');
    if (btnOpenBestiary) {
        btnOpenBestiary.onclick = (e) => {
            e.stopPropagation();
            window.soundFX.playClick();
            renderBestiaryModal();
        };
    }

    // --- KAPSAMLI VE SEKMELİ OYUN REHBERİ MOTORU ---
    function switchGuideTab(tabKey) {
        document.querySelectorAll('.info-tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabKey) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const panels = {
            rules: document.getElementById('info-panel-rules'),
            prediction: document.getElementById('info-panel-prediction'),
            daily: document.getElementById('info-panel-daily'),
            synergy: document.getElementById('info-panel-synergy')
        };

        Object.keys(panels).forEach(k => {
            if (panels[k]) {
                if (k === tabKey) panels[k].classList.remove('hidden');
                else panels[k].classList.add('hidden');
            }
        });
    }

    function openInfoModal(targetTab = 'rules') {
        window.soundFX.playClick();
        switchGuideTab(targetTab);
        openModal('info');
    }

    // Rehber Sekme Tıklama Dinleyicileri
    document.querySelectorAll('.info-tab-btn').forEach(btn => {
        btn.onclick = () => {
            window.soundFX.playClick();
            switchGuideTab(btn.dataset.tab);
        };
    });

    const btnPerkTahmin = document.getElementById('btn-open-perk-tahmin');
    if (btnPerkTahmin) {
        btnPerkTahmin.onclick = (e) => {
            e.stopPropagation();
            openInfoModal('prediction');
        };
    }

    const btnPerkHak = document.getElementById('btn-open-perk-hak');
    if (btnPerkHak) {
        btnPerkHak.onclick = (e) => {
            e.stopPropagation();
            openInfoModal('daily');
        };
    }

    const btnOpenInfo = document.getElementById('btn-open-info');
    if (btnOpenInfo) {
        btnOpenInfo.onclick = () => {
            openInfoModal('rules');
        };
    }

    const draftSynergyBanner = document.getElementById('draft-synergy-banner');
    if (draftSynergyBanner) {
        draftSynergyBanner.onclick = () => {
            openInfoModal('synergy');
        };
    }

    const modeBtnEl = document.getElementById('stat-box-mode-btn');
    if (modeBtnEl) {
        modeBtnEl.onclick = () => {
            openInfoModal('rules');
        };
    }

    document.getElementById('btn-back-lobby').onclick = () => {
        window.soundFX.playClick();
        showConfirmDialog({
            title: 'Hazırlıktan Çıkılsın mı?',
            message: 'Eşleşme ve hazırlık ekranından ayrılıp lobiye dönmek istediğinize emin misiniz?<br><br><small style="color: #2ed573; font-weight: bold;">ℹ️ Henüz savaş başlamadığı için günlük savaş hakkınız eksilmez.</small>',
            icon: '🔙',
            type: 'info',
            confirmText: '🏠 Lobiye Dön',
            cancelText: '⚔️ Dizilime Dön',
            onConfirm: () => {
                switchScreen('lobby');
            }
        });
    };

    const btnBattleQuit = document.getElementById('btn-battle-quit');
    if (btnBattleQuit) {
        btnBattleQuit.onclick = () => {
            window.soundFX.playClick();
            if (currentBattle && currentBattle.isRunning) {
                if (isBossRaidMode) {
                    showConfirmDialog({
                        title: 'Titan Raid\'den Çıkılsın mı?',
                        message: 'Dünya Bossu savaşından ayrılmak istediğinize emin misiniz?<br><br><small style="color: #2ed573; font-weight: bold;">ℹ️ Titan Raid denemesi sınırsızdır; günlük lig hakkınız eksilmez.</small>',
                        icon: '🐉',
                        type: 'info',
                        confirmText: '🏳️ Ayrıl ve Lobiye Dön',
                        cancelText: '⚔️ Savaşa Dön',
                        onConfirm: () => {
                            if (currentBattle) currentBattle.stop();
                            handleBossRaidEnd(playerSlots, null);
                        }
                    });
                    return;
                }
                showConfirmDialog({
                    title: 'Savaştan Çıkılsın mı?',
                    message: '⚠️ Savaş devam ederken ayrılırsanız <b>günlük 1 savaş hakkınız yanacak</b> ve bu maç hükmen <b>mağlubiyet</b> sayılacaktır.<br><br>Yine de çıkmak istediğinize emin misiniz?',
                    icon: '⚠️',
                    type: 'warning',
                    confirmText: '🏳️ Pes Et ve Çık',
                    cancelText: '⚔️ Savaşa Dön',
                    onConfirm: () => {
                        if (currentBattle) {
                            currentBattle.stop();
                        }
                        handleBattleEnd(false, null);
                    }
                });
            } else {
                switchScreen('lobby');
            }
        };
    }

    // Tarayıcı / sekme kapatma durumunda uyarı
    window.addEventListener('beforeunload', (e) => {
        if (currentBattle && currentBattle.isRunning) {
            e.preventDefault();
            e.returnValue = 'Savaş devam ediyor! Çıkarsanız savaş hakkınız yanacaktır.';
            return e.returnValue;
        }
    });

    document.getElementById('btn-start-battle').onclick = startBattle;
    document.getElementById('btn-play-again').onclick = () => {
        closeModal('result');
        prepareNewMatch();
    };
    document.getElementById('btn-return-lobby').onclick = () => {
        closeModal('result');
        switchScreen('lobby');
    };

    // AI Zafer Tahmin & Simülasyon Butonları
    const btnRunAi = document.getElementById('btn-run-ai-simulation');
    if (btnRunAi) btnRunAi.onclick = runAiBattleSimulation;

    const btnRerunAi = document.getElementById('btn-rerun-ai-sim');
    if (btnRerunAi) btnRerunAi.onclick = runAiBattleSimulation;

    const btnCloseAi = document.getElementById('btn-close-ai-sim');
    if (btnCloseAi) btnCloseAi.onclick = closeAiBattleSimulation;

    const btnApplyAi = document.getElementById('btn-apply-ai-sim');
    if (btnApplyAi) btnApplyAi.onclick = applyAiSimulationSuggestion;

    // Günlük Görev Ödülünü Toplama
    const claimQuestBtn = document.getElementById('btn-claim-quest');
    if (claimQuestBtn) {
        claimQuestBtn.onclick = () => {
            const res = window.profileMgr.claimDailyQuest();
            if (res.success) {
                window.soundFX.playCoins();
                updateGlobalHeader();
                alert(`🎉 Tebrikler! +${res.rewardTokens} Token ve +${res.rewardExp} TP hesabınıza eklendi!`);
            } else {
                alert(res.message);
            }
        };
    }

    // --- 7 GÜNLÜK GİRİŞ TAKVİMİ MOTORU ---
    function renderDailyLoginModal() {
        if (!window.profileMgr) return;
        const status = window.profileMgr.getDailyLoginStatus();
        const rewards = window.profileMgr.getDailyLoginRewardsList();
        const grid = document.getElementById('daily-login-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const streakEl = document.getElementById('daily-login-streak-text');
        if (streakEl) streakEl.textContent = `🔥 Giriş Serisi: ${status.streak} Gün`;

        rewards.forEach(r => {
            const card = document.createElement('div');
            let stateClass = 'locked';
            let tagText = '🔒 Kilitli';
            let tagClass = 'locked-tag';

            if (r.claimed) {
                stateClass = 'claimed';
                tagText = '✅ Alındı';
                tagClass = 'claimed-tag';
            } else if (r.isToday) {
                stateClass = 'today';
                tagText = '🎁 Bugün Al';
                tagClass = 'today-tag';
            }

            card.className = `daily-day-card ${stateClass}`;
            card.innerHTML = `
                <div class="daily-day-num">GÜN ${r.day}</div>
                <div class="daily-day-icon">${r.icon}</div>
                <div class="daily-day-reward">${r.label}</div>
                <div class="daily-day-tag ${tagClass}">${tagText}</div>
            `;
            grid.appendChild(card);
        });

        const claimBtn = document.getElementById('btn-claim-daily-login');
        if (claimBtn) {
            if (status.canClaimToday) {
                claimBtn.disabled = false;
                claimBtn.style.opacity = '1';
                claimBtn.textContent = `🎁 Gün ${status.currentDay} Ödülünü Al`;
            } else {
                claimBtn.disabled = true;
                claimBtn.style.opacity = '0.6';
                claimBtn.textContent = `✅ Bugünkü Ödül Alındı`;
            }
        }

        openModal('dailyLogin');
    }

    const btnOpenDailyLogin = document.getElementById('btn-open-daily-login');
    if (btnOpenDailyLogin) {
        btnOpenDailyLogin.onclick = () => {
            window.soundFX.playClick();
            renderDailyLoginModal();
        };
    }

    const btnClaimDailyLogin = document.getElementById('btn-claim-daily-login');
    if (btnClaimDailyLogin) {
        btnClaimDailyLogin.onclick = () => {
            window.soundFX.playClick();
            const res = window.profileMgr.claimDailyLoginReward();
            if (res.success) {
                window.soundFX.playCoins();
                updateGlobalHeader();
                renderDailyLoginModal();
                showGameAlert({
                    title: 'Giriş Ödülü Alındı!',
                    message: `🎉 Tebrikler! ${res.reward.icon} <b>${res.reward.label}</b> hesabınıza eklendi!\nGünlük giriş seriniz: <b>${res.streak} Gün</b>`,
                    type: 'reward',
                    icon: res.reward.icon
                });
            } else {
                alert(res.message);
            }
        };
    }

    // --- KADİM TİTAN WORLD BOSS RAİD MOTORU ---
    function renderBossRaidModal() {
        const user = window.authMgr.currentUser;
        const prof = (user && user.profile) || {};
        const highScore = prof.bossHighScore || 0;
        const highScoreEl = document.getElementById('boss-raid-highscore');
        if (highScoreEl) highScoreEl.textContent = `${highScore} DMG`;
        openModal('bossRaid');
    }

    function startBossRaidBattle() {
        closeModal('bossRaid');
        isBossRaidMode = true;

        const playerLevel = (window.authMgr.currentUser && window.authMgr.currentUser.profile && window.authMgr.currentUser.profile.level) || 1;

        // Boss Ekibi: Ortada Kadim Titan Ejderha Ignis (2500 HP), Yanlarda Minionlar (380 HP)
        const bossFighter = {
            instanceId: 'titan_boss_1',
            templateId: 'titan_ignis',
            name: 'Titan Ejderha Ignis',
            emoji: '🐉',
            image: 'assets/monsters/titan_ignis.jpg',
            role: 'Kadim Titan',
            element: 'Ateş',
            maxHp: 2500,
            currentHp: 2500,
            atk: 85,
            spd: 22,
            crit: 25,
            shield: 120,
            energy: 0,
            isStunned: false,
            burnTurns: 0,
            slotIndex: 1,
            isBot: true,
            isBoss: true,
            damageDealt: 0,
            kills: 0,
            color: '#ff4757',
            skillName: 'Alev Kıyameti',
            skillDesc: 'Tüm koridorlara 120 Hasar verir.'
        };

        const whelp1 = {
            instanceId: 'titan_whelp_0',
            templateId: 'dragon_whelp',
            name: 'Ateş Ejderciği',
            emoji: '🦎',
            role: 'Minion',
            element: 'Ateş',
            maxHp: 380,
            currentHp: 380,
            atk: 45,
            spd: 18,
            crit: 15,
            shield: 0,
            energy: 0,
            isStunned: false,
            burnTurns: 0,
            slotIndex: 0,
            isBot: true,
            damageDealt: 0,
            kills: 0,
            color: '#ffa502',
            skillName: 'Alev Tükürüğü',
            skillDesc: 'Hedefe 60 Ateş Hasarı verir.'
        };

        const whelp2 = {
            instanceId: 'titan_whelp_2',
            templateId: 'dragon_whelp',
            name: 'Lav Ejderciği',
            emoji: '🦎',
            role: 'Minion',
            element: 'Ateş',
            maxHp: 380,
            currentHp: 380,
            atk: 45,
            spd: 18,
            crit: 15,
            shield: 0,
            energy: 0,
            isStunned: false,
            burnTurns: 0,
            slotIndex: 2,
            isBot: true,
            damageDealt: 0,
            kills: 0,
            color: '#ffa502',
            skillName: 'Lav Püskürtme',
            skillDesc: 'Hedefe 60 Ateş Hasarı verir.'
        };

        currentBotTeam = [whelp1, bossFighter, whelp2];
        currentBotTeam.matchmaking = {
            difficultyLabel: '👑 DÜNYA BOSSU (2500 HP & Alev Alanı)',
            botBadgeClass: 'tier-master'
        };

        // Oyuncuya 5 canavardan oluşan stratejik draft havuzu öner
        candidate5Monsters = MonsterFactory.get5DraftRecommendations(playerLevel);

        // Oyuncu slotlarını boşalt - oyuncu kendi 3 canavarını ve koridor dizilimini kendisi belirlesin!
        playerSlots = [null, null, null];

        // AI Simülasyon Kartını Sıfırla
        const idleView = document.getElementById('ai-pred-idle-view');
        const resCard = document.getElementById('ai-pred-result-card');
        if (idleView) idleView.classList.remove('hidden');
        if (resCard) resCard.classList.add('hidden');

        renderDraftScreen();
        switchScreen('draft');
    }

    function handleBossRaidEnd(pSlots, mvpFighter) {
        isBossRaidMode = false;
        let totalDmg = 0;
        pSlots.forEach(p => {
            if (p && p.damageDealt) totalDmg += p.damageDealt;
        });

        let tokenReward = 5;
        if (totalDmg >= 2000) tokenReward = 80;
        else if (totalDmg >= 1000) tokenReward = 35;
        else if (totalDmg >= 500) tokenReward = 15;

        const user = window.authMgr.currentUser;
        if (user && user.profile) {
            user.profile.tokens = (user.profile.tokens || 0) + tokenReward;
            if (!user.profile.bossHighScore || totalDmg > user.profile.bossHighScore) {
                user.profile.bossHighScore = totalDmg;
            }
            window.authMgr.saveUsers();
        }
        updateGlobalHeader();

        const titleEl = document.getElementById('result-title');
        const iconEl = document.getElementById('result-icon');
        const trophiesEl = document.getElementById('result-trophies');
        const tokensEl = document.getElementById('result-tokens');
        const expEl = document.getElementById('result-exp');

        titleEl.textContent = 'TİTAN RAİD TAMAMLANDI!';
        titleEl.className = 'result-title victory';
        iconEl.textContent = '🐉';
        trophiesEl.textContent = `💥 ${totalDmg} Toplam Hasar`;
        trophiesEl.style.color = '#ff4757';
        tokensEl.innerHTML = `+${tokenReward} <span class="token-coin-icon"></span>`;
        expEl.textContent = `+50 TP`;

        const predBox = document.getElementById('result-prediction-box');
        if (predBox) {
            predBox.className = 'result-pred-banner success';
            predBox.innerHTML = `🐉 <b>Titan Boss Raid Raporu:</b> Kadim Ejderha Ignis'e <b>${totalDmg} Hasar</b> verdiniz! Ödül: +${tokenReward} Token!`;
            predBox.classList.remove('hidden');
        }

        const mvpBox = document.getElementById('result-mvp-box');
        if (mvpBox && mvpFighter) {
            mvpBox.classList.remove('hidden');
            const av = document.getElementById('result-mvp-avatar');
            const nm = document.getElementById('result-mvp-name');
            const st = document.getElementById('result-mvp-stats');
            if (av) {
                if (mvpFighter.image) {
                    av.innerHTML = `<img src="${mvpFighter.image}" class="monster-avatar-img" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
                } else {
                    av.textContent = mvpFighter.emoji;
                }
            }
            if (nm) nm.textContent = `${mvpFighter.name}`;
            if (st) st.textContent = `💥 ${mvpFighter.damageDealt || 0} Hasar • ⚔️ ${mvpFighter.kills || 0} Nakavt`;
        } else if (mvpBox) {
            mvpBox.classList.add('hidden');
        }

        const btnQuit = document.getElementById('btn-battle-quit');
        if (btnQuit) {
            btnQuit.textContent = '🏠 Lobi';
            btnQuit.style.background = 'rgba(46, 213, 115, 0.2)';
            btnQuit.style.borderColor = '#2ed573';
            btnQuit.style.color = '#2ed573';
        }

        window.soundFX.playVictory();
        startVictoryConfetti();
        openModal('result');
    }

    const btnOpenBossRaid = document.getElementById('btn-open-boss-raid');
    if (btnOpenBossRaid) {
        btnOpenBossRaid.onclick = () => {
            window.soundFX.playClick();
            renderBossRaidModal();
        };
    }

    const btnStartBossRaid = document.getElementById('btn-start-boss-raid');
    if (btnStartBossRaid) {
        btnStartBossRaid.onclick = () => {
            window.soundFX.playClick();
            startBossRaidBattle();
        };
    }

    // Modal Kapatma Düğmeleri (Her buton yalnızca bulunduğu modalı kapatır, arkadaki pencereleri korur)
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            window.soundFX.playClick();
            const modalOverlay = btn.closest('.modal-overlay');
            if (modalOverlay) {
                modalOverlay.classList.add('hidden');
            } else {
                closeAllModals();
            }
        };
    });

    // Modal Arka Planına (Overlay) Tıklayınca Sadece İlgili Modalı Kapatma
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                // Savaş sonucu veya sistem uyarısı gibi kritik akışlar hariç
                if (overlay.id === 'result-modal' || overlay.id === 'game-alert-modal') return;
                window.soundFX.playClick();
                overlay.classList.add('hidden');
            }
        });
    });

    // Ses Toggle
    const soundToggleBtn = document.getElementById('btn-toggle-sound');
    if (soundToggleBtn) {
        soundToggleBtn.onclick = () => {
            window.soundFX.enabled = !window.soundFX.enabled;
            soundToggleBtn.textContent = window.soundFX.enabled ? '🔊' : '🔇';
        };
    }

    // Tema Değiştirici (Açık / Koyu Tema)
    const themeBtnHeader = document.getElementById('btn-toggle-theme');
    const themeBtnAuth = document.getElementById('btn-toggle-theme-auth');

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('animalsvs_theme', theme);
        const icon = theme === 'dark' ? '🌙' : '☀️';
        if (themeBtnHeader) themeBtnHeader.textContent = icon;
        if (themeBtnAuth) themeBtnAuth.textContent = icon;
    }

    function toggleCurrentTheme() {
        window.soundFX.playClick();
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
    }

    const savedTheme = localStorage.getItem('animalsvs_theme') || 'dark';
    applyTheme(savedTheme);

    if (themeBtnHeader) themeBtnHeader.onclick = toggleCurrentTheme;
    // Metin Seçimini ve Uzun Basma Büyüteç Menüsünü Engelle (Native Oyun Hissiyatı)
    document.addEventListener('selectstart', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });
    document.addEventListener('contextmenu', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });

    // Başlatma
    initAuth();
    updateLiveCountdowns();
    setInterval(updateLiveCountdowns, 1000);

    if (window.authMgr.isLoggedIn()) {
        switchScreen('lobby');
    } else {
        switchScreen('auth');
    }
});
