// AniClash: Beast Rumble - Slot-Based Tactical Battle Engine

class BattleEngine {
    constructor(playerTeam, botTeam, predictionType = null, uiCallbacks = {}) {
        this.playerTeam = playerTeam; // Array of 3 monsters with slotIndex 0, 1, 2
        this.botTeam = botTeam;       // Array of 3 monsters with slotIndex 0, 1, 2
        this.predictionType = predictionType; // 'victory', 'flawless', 'quick_knockout' veya null
        this.callbacks = uiCallbacks; // { onLog, onUpdateUI, onFloatText, onAction, onHighlightSlot, onGameOver, onCritEffect }
        this.isRunning = false;
        this.turn = 1;

        // MVP istatistiklerini sıfırla
        [...this.playerTeam, ...this.botTeam].forEach(m => {
            if (m) {
                m.damageDealt = 0;
                m.kills = 0;
            }
        });
    }

    start() {
        this.isRunning = true;
        this.callbacks.onLog('⚔️ Arena Kapıları Açıldı! Koridor ve Slot Savaşları Başladı!', 'system');

        // Element Sinerjilerini Uygula
        this.applyTeamSynergies();

        if (this.predictionType) {
            const predLabels = {
                'victory': '🏆 Zafer Tahmini (1.8x)',
                'flawless': '👑 Kusursuz Zafer (3.5x)',
                'quick_knockout': '⚡ Hızlı Nakavt (2.5x)'
            };
            this.callbacks.onLog(`🎯 <b>Aktif Tahmin:</b> ${predLabels[this.predictionType] || 'Özel Tahmin'}`, 'skill');
        }
        this.processNextTurn();
    }

    static applySynergyBuffs(team, synergy) {
        if (!team || !synergy || !synergy.buff) return;
        team.forEach(m => {
            if (!m) return;
            if (synergy.buff.atkMult) m.atk = Math.round(m.atk * synergy.buff.atkMult);
            if (synergy.buff.startShield) m.shield = (m.shield || 0) + synergy.buff.startShield;
            if (synergy.buff.spdMult) m.spd = Math.round(m.spd * synergy.buff.spdMult);
            if (synergy.buff.critBonus) m.crit = Math.min(80, (m.crit || 0) + synergy.buff.critBonus);
            if (synergy.buff.lifesteal) m.lifesteal = synergy.buff.lifesteal;
            if (synergy.buff.dotDamage) m.dotDamage = synergy.buff.dotDamage;
        });
    }

    applyTeamSynergies() {
        const getSynergy = (typeof GameRules !== 'undefined' && GameRules.calculateTeamSynergy) || 
                           (typeof calculateTeamSynergy === 'function' ? calculateTeamSynergy : null);
        if (!getSynergy) return;

        // 1. Oyuncu Takım Sinerjisi
        const pSynergy = getSynergy(this.playerTeam);
        if (pSynergy) {
            this.callbacks.onLog(`✨ <b>[Takım Sinerjisi]</b> ${pSynergy.icon} <b>${pSynergy.name}</b> Aktif! (${pSynergy.desc})`, 'status');
            if (typeof window !== 'undefined' && window.soundFX && typeof window.soundFX.playSynergyActive === 'function') {
                window.soundFX.playSynergyActive();
            }
            BattleEngine.applySynergyBuffs(this.playerTeam, pSynergy);
        }

        // 2. Bot Takım Sinerjisi
        const bSynergy = getSynergy(this.botTeam);
        if (bSynergy) {
            this.callbacks.onLog(`💀 <b>[Rakip Sinerjisi]</b> ${bSynergy.icon} <b>${bSynergy.name}</b> Aktif! (${bSynergy.desc})`, 'bot-action');
            BattleEngine.applySynergyBuffs(this.botTeam, bSynergy);
        }
    }

    evaluatePrediction(playerWon) {
        if (!this.predictionType) return null;

        const { playerAlive } = this.getAllAliveFighters();
        let isSuccess = false;
        let bonusTokens = 0;
        let bonusTrophies = 0;
        let bonusExp = 0;
        let title = '';

        if (this.predictionType === 'victory') {
            isSuccess = playerWon;
            title = 'Zafer Tahmini';
            if (isSuccess) {
                bonusTokens = 50;
                bonusTrophies = 15;
                bonusExp = 35;
            }
        } else if (this.predictionType === 'flawless') {
            isSuccess = playerWon && playerAlive.length === 3;
            title = 'Kusursuz Zafer (3 Canavar da Yaşadı)';
            if (isSuccess) {
                bonusTokens = 130;
                bonusTrophies = 35;
                bonusExp = 80;
            }
        } else if (this.predictionType === 'quick_knockout') {
            isSuccess = playerWon && this.turn <= 3;
            title = `Hızlı Nakavt (${this.turn}. Turda Bitti)`;
            if (isSuccess) {
                bonusTokens = 90;
                bonusTrophies = 25;
                bonusExp = 60;
            }
        }

        return {
            type: this.predictionType,
            title: title,
            success: isSuccess,
            bonusTokens,
            bonusTrophies,
            bonusExp
        };
    }

    stop() {
        this.isRunning = false;
    }

    getAllAliveFighters() {
        const playerAlive = this.playerTeam.filter(m => m.currentHp > 0);
        const botAlive = this.botTeam.filter(m => m.currentHp > 0);
        return { playerAlive, botAlive, all: [...playerAlive, ...botAlive] };
    }

    isBattleOver() {
        const { playerAlive, botAlive } = this.getAllAliveFighters();
        if (playerAlive.length === 0) return { over: true, playerWon: false };
        if (botAlive.length === 0) return { over: true, playerWon: true };
        return { over: false };
    }

    // Hedef Belirleme Kuralı: Önce tam karşı slot; ölmüşse taktiksel odak veya kalan canlılardan seçim
    findTargetForAttacker(attacker) {
        const opponentTeam = attacker.isBot ? this.playerTeam : this.botTeam;
        const mySlot = attacker.slotIndex;

        // 1. Karşı slotundaki canavara bak
        const directFacingOpponent = opponentTeam.find(m => m.slotIndex === mySlot);

        if (directFacingOpponent && directFacingOpponent.currentHp > 0) {
            return { target: directFacingOpponent, isDirectFacing: true, isTacticalFocus: false };
        }

        // 2. Karşı slot ölmüş veya yoksa
        const livingOpponents = opponentTeam.filter(m => m.currentHp > 0);
        if (livingOpponents.length === 0) return null;

        // Akıllı Taktiksel AI (Tier 2, 3, 4 Botlar veya Oyuncunun Boş Kalan Slotu)
        if (attacker.isBot && attacker.aiTier && attacker.aiTier >= 2) {
            // Canı en düşük olan düşmanı bul (Öncelikli Bitirme / Execute)
            const sortedByHp = [...livingOpponents].sort((a, b) => a.currentHp - b.currentHp);
            const lowestHpTarget = sortedByHp[0];

            // Eğer canı %50'nin altındaysa veya bot Usta/Boss ise en zayıfa odaklan
            if (lowestHpTarget.currentHp / lowestHpTarget.maxHp <= 0.55 || attacker.aiTier >= 3) {
                return { target: lowestHpTarget, isDirectFacing: false, isTacticalFocus: true };
            }
        }

        const randomTarget = livingOpponents[Math.floor(Math.random() * livingOpponents.length)];
        return { target: randomTarget, isDirectFacing: false, isTacticalFocus: false };
    }

    async processNextTurn() {
        if (!this.isRunning) return;

        const check = this.isBattleOver();
        if (check.over) {
            this.isRunning = false;
            const predRes = this.evaluatePrediction(check.playerWon);
            const winningTeam = check.playerWon ? this.playerTeam : this.botTeam;
            let mvpFighter = winningTeam[0];
            winningTeam.forEach(f => {
                if ((f.damageDealt || 0) > (mvpFighter.damageDealt || 0)) {
                    mvpFighter = f;
                }
            });
            this.callbacks.onGameOver(check.playerWon, predRes, mvpFighter);
            return;
        }

        // Hız sırasına göre sırala
        const { all } = this.getAllAliveFighters();
        all.sort((a, b) => b.spd - a.spd + (Math.random() * 2 - 1));

        for (const attacker of all) {
            if (!this.isRunning) return;
            if (attacker.currentHp <= 0) continue;

            // Yanma kontrolü
            if (attacker.burnTurns > 0) {
                const burnDmg = Math.round(attacker.maxHp * 0.08);
                attacker.currentHp = Math.max(0, attacker.currentHp - burnDmg);
                attacker.burnTurns--;
                this.callbacks.onFloatText(attacker.instanceId, `🔥 -${burnDmg}`, 'burn');
                this.callbacks.onLog(`🔥 [Slot ${attacker.slotIndex + 1}] ${attacker.name} yanıyor! (${burnDmg} Hasar)`, 'damage');
                this.callbacks.onUpdateUI();
                await this.sleep(350);
                if (attacker.currentHp <= 0) {
                    this.callbacks.onLog(`💀 [Slot ${attacker.slotIndex + 1}] ${attacker.name} alevlere yenik düştü!`, 'defeat');
                    continue;
                }
            }

            // Sersemleme kontrolü
            if (attacker.isStunned) {
                attacker.isStunned = false;
                this.callbacks.onFloatText(attacker.instanceId, `💫 SERSEM!`, 'stun');
                this.callbacks.onLog(`💫 [Slot ${attacker.slotIndex + 1}] ${attacker.name} sersemlediği için saldıramadı!`, 'status');
                await this.sleep(400);
                continue;
            }

            // Hedef Seçimi (Karşı slot veya rastgele)
            const targetResult = this.findTargetForAttacker(attacker);
            if (!targetResult) break;

            const { target, isDirectFacing, isTacticalFocus } = targetResult;

            // Enerji ve Beceri kontrolü
            attacker.energy = (attacker.energy || 0) + 35;
            const useSkill = attacker.energy >= 100;

            if (useSkill) {
                attacker.energy = 0;
                await this.executeSkill(attacker, target, isDirectFacing, isTacticalFocus);
            } else {
                await this.executeAttack(attacker, target, isDirectFacing, isTacticalFocus);
            }

            this.callbacks.onUpdateUI();
            await this.sleep(700);

            // Ara kontrol
            const midCheck = this.isBattleOver();
            if (midCheck.over) {
                this.isRunning = false;
                const predRes = this.evaluatePrediction(midCheck.playerWon);
                const winningTeam = midCheck.playerWon ? this.playerTeam : this.botTeam;
                let mvpFighter = winningTeam[0];
                winningTeam.forEach(f => {
                    if ((f.damageDealt || 0) > (mvpFighter.damageDealt || 0)) {
                        mvpFighter = f;
                    }
                });
                this.callbacks.onGameOver(midCheck.playerWon, predRes, mvpFighter);
                return;
            }
        }

        this.turn++;
        if (this.isRunning) {
            // Savaş akış hızı 1.25x daha yavaş (400ms * 1.25 = 500ms)
            setTimeout(() => this.processNextTurn(), 500);
        }
    }

    async executeAttack(attacker, target, isDirectFacing, isTacticalFocus = false) {
        this.callbacks.onAction(attacker.instanceId, 'attack', target.instanceId);
        window.soundFX.playAttack();

        const isCrit = Math.random() * 100 < attacker.crit;
        let damage = attacker.atk + Math.floor(Math.random() * 6 - 3);
        if (isCrit) {
            damage = Math.round(damage * 1.6);
            window.soundFX.playCrit();
            if (this.callbacks.onCritEffect) this.callbacks.onCritEffect();
        }

        if (target.shield > 0) {
            if (target.shield >= damage) {
                target.shield -= damage;
                this.callbacks.onFloatText(target.instanceId, `🛡️ -${damage}`, 'shield');
                damage = 0;
            } else {
                damage -= target.shield;
                target.shield = 0;
            }
        }

        if (damage > 0) {
            target.currentHp = Math.max(0, target.currentHp - damage);
            attacker.damageDealt = (attacker.damageDealt || 0) + damage;
            const floatType = isCrit ? 'crit' : 'damage';
            const floatMsg = isCrit ? `💥 KRİTİK! -${damage}` : `-${damage}`;
            this.callbacks.onFloatText(target.instanceId, floatMsg, floatType);

            // Can Çalma (Sinerji)
            if (attacker.lifesteal && damage > 0) {
                const heal = Math.round(damage * attacker.lifesteal);
                attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + heal);
                this.callbacks.onFloatText(target.instanceId, `💚 +${heal}`, 'heal');
            }
        }

        const attackerSide = attacker.isBot ? '🤖 Bot' : '🛡️ Siz';
        const targetSide = target.isBot ? '🤖 Bot' : '🛡️ Siz';
        
        let reasonTag = `🎯 <b>[Karşı Slot ${target.slotIndex + 1}]</b>`;
        if (!isDirectFacing) {
            if (isTacticalFocus) {
                reasonTag = `🧠 <b>[Taktik Odak: Slot ${target.slotIndex + 1}]</b>`;
            } else {
                reasonTag = `🎲 <b>[Açık Koridor: Slot ${target.slotIndex + 1}]</b>`;
            }
        }

        this.callbacks.onLog(
            `${attacker.emoji} ${attackerSide} (Slot ${attacker.slotIndex + 1}) ➡️ ${target.emoji} ${targetSide} ${reasonTag} vurdu! ${isCrit ? '💥 (KRİTİK)' : ''} [${damage} Hasar]`,
            attacker.isBot ? 'bot-action' : 'player-action'
        );

        if (target.currentHp <= 0 && target.hasExtraLife) {
            target.hasExtraLife = false;
            target.currentHp = Math.round(target.maxHp * 0.35);
            this.callbacks.onFloatText(target.instanceId, `✨ 9 CAN!`, 'heal');
            this.callbacks.onLog(`🐱 ${targetSide} [Slot ${target.slotIndex + 1}] 9 Can pasifiyle hayatta kaldı!`, 'skill');
        }

        if (target.currentHp <= 0) {
            attacker.kills = (attacker.kills || 0) + 1;
            this.callbacks.onLog(`💀 <b>${targetSide} [Slot ${target.slotIndex + 1}] ${target.name}</b> elendi! Karşı koridor düştü!`, 'defeat');
        }
    }

    async executeSkill(attacker, target, isDirectFacing, isTacticalFocus = false) {
        this.callbacks.onAction(attacker.instanceId, 'skill', target.instanceId);
        window.soundFX.playSkill();
        if (this.callbacks.onCritEffect) this.callbacks.onCritEffect();

        this.callbacks.onLog(`🌟 <b>[Slot ${attacker.slotIndex + 1}] ${attacker.name}</b> ÖZEL YETENEK KULLANDI: <i>${attacker.skillName}</i>!`, 'skill');
        this.callbacks.onFloatText(attacker.instanceId, `⭐ ${attacker.skillName}`, 'skill');
        await this.sleep(300);

        const oppTeam = attacker.isBot ? this.playerTeam : this.botTeam;
        const livingOpponents = oppTeam.filter(m => m.currentHp > 0);

        let skillAppliedDmg = 0;

        switch (attacker.templateId) {
            case 'duck':
                skillAppliedDmg = Math.round(attacker.atk * 1.5);
                target.currentHp = Math.max(0, target.currentHp - skillAppliedDmg);
                if (Math.random() < 0.6) target.isStunned = true;
                this.callbacks.onFloatText(target.instanceId, `🦆 -${skillAppliedDmg}`, 'crit');
                break;

            case 'pig':
                const shieldVal = Math.round(attacker.maxHp * 0.28);
                attacker.shield += shieldVal;
                skillAppliedDmg = Math.round(attacker.atk * 1.25);
                target.currentHp = Math.max(0, target.currentHp - skillAppliedDmg);
                this.callbacks.onFloatText(attacker.instanceId, `🛡️ +${shieldVal} Zırh`, 'heal');
                this.callbacks.onFloatText(attacker.instanceId, `🐗 -${skillAppliedDmg}`, 'damage');
                break;

            case 'horse':
                const kick1 = Math.round(attacker.atk * 0.9);
                const kick2 = Math.round(attacker.atk * 0.9);
                skillAppliedDmg = kick1 + kick2;
                target.currentHp = Math.max(0, target.currentHp - skillAppliedDmg);
                this.callbacks.onFloatText(target.instanceId, `⚡ -${kick1} -${kick2}`, 'crit');
                break;

            case 'wolf':
                skillAppliedDmg = Math.round(attacker.atk * 1.45);
                target.currentHp = Math.max(0, target.currentHp - skillAppliedDmg);
                const heal = Math.round(skillAppliedDmg * 0.45);
                attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + heal);
                this.callbacks.onFloatText(target.instanceId, `🐺 -${skillAppliedDmg}`, 'damage');
                this.callbacks.onFloatText(attacker.instanceId, `💚 +${heal}`, 'heal');
                break;

            case 'bear':
                if (window.soundFX && typeof window.soundFX.playRoar === 'function') window.soundFX.playRoar();
                livingOpponents.forEach(opp => {
                    const bearDmg = Math.round(attacker.atk * 0.75);
                    opp.currentHp = Math.max(0, opp.currentHp - bearDmg);
                    skillAppliedDmg += bearDmg;
                    this.callbacks.onFloatText(opp.instanceId, `🐻 -${bearDmg}`, 'crit');
                });
                break;

            case 'fox':
                skillAppliedDmg = Math.round(attacker.atk * 1.15);
                target.currentHp = Math.max(0, target.currentHp - skillAppliedDmg);
                target.burnTurns = 2;
                this.callbacks.onFloatText(target.instanceId, `🔥 -${skillAppliedDmg} (Yandı)`, 'burn');
                break;

            case 'tiger':
                skillAppliedDmg = Math.round(attacker.atk * 1.6);
                target.currentHp = Math.max(0, target.currentHp - skillAppliedDmg);
                this.callbacks.onFloatText(target.instanceId, `🐯 -${skillAppliedDmg} (Pençe)`, 'crit');
                break;

            case 'shark':
                const isExecute = target.currentHp <= Math.round(target.maxHp * 0.5);
                const sharkMult = isExecute ? 2.1 : 1.35;
                skillAppliedDmg = Math.round(attacker.atk * sharkMult);
                target.currentHp = Math.max(0, target.currentHp - skillAppliedDmg);
                this.callbacks.onFloatText(target.instanceId, `🦈 -${skillAppliedDmg} ${isExecute ? '💥 İNFAZ!' : ''}`, 'crit');
                break;

            case 'dragon':
                if (window.soundFX && typeof window.soundFX.playDragonBlast === 'function') window.soundFX.playDragonBlast();
                const dDmg = Math.round(attacker.atk * 1.3);
                target.currentHp = Math.max(0, target.currentHp - dDmg);
                skillAppliedDmg += dDmg;
                this.callbacks.onFloatText(target.instanceId, `🔥 -${dDmg}`, 'crit');

                const adjSlot = (target.slotIndex === 1) ? 0 : 1;
                const adjTarget = oppTeam.find(m => m.slotIndex === adjSlot && m.currentHp > 0);
                if (adjTarget) {
                    const splash = Math.round(dDmg * 0.65);
                    adjTarget.currentHp = Math.max(0, adjTarget.currentHp - splash);
                    skillAppliedDmg += splash;
                    this.callbacks.onFloatText(adjTarget.instanceId, `💥 -${splash}`, 'burn');
                }
                break;

            case 'snake':
                skillAppliedDmg = Math.round(attacker.atk * 1.05);
                target.currentHp = Math.max(0, target.currentHp - skillAppliedDmg);
                target.burnTurns = 3;
                this.callbacks.onFloatText(target.instanceId, `🐍 -${skillAppliedDmg} (Zehir)`, 'burn');
                break;

            case 'gorilla':
                skillAppliedDmg = Math.round(attacker.atk * 1.4);
                target.currentHp = Math.max(0, target.currentHp - skillAppliedDmg);
                attacker.atk = Math.round(attacker.atk * 1.15);
                this.callbacks.onFloatText(target.instanceId, `🦍 -${skillAppliedDmg}`, 'crit');
                this.callbacks.onFloatText(attacker.instanceId, `💪 +%15 ATK`, 'heal');
                break;

            case 'rhino':
                const rhinoShield = Math.round(attacker.maxHp * 0.35);
                attacker.shield += rhinoShield;
                skillAppliedDmg = Math.round(attacker.atk * 1.1);
                target.currentHp = Math.max(0, target.currentHp - skillAppliedDmg);
                this.callbacks.onFloatText(attacker.instanceId, `🛡️ +${rhinoShield} Barikat`, 'heal');
                this.callbacks.onFloatText(attacker.instanceId, `🦏 -${skillAppliedDmg}`, 'damage');
                break;

            case 'panda':
                const pandaHeal = Math.round(attacker.maxHp * 0.35);
                attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + pandaHeal);
                skillAppliedDmg = Math.round(attacker.atk * 0.95);
                target.currentHp = Math.max(0, target.currentHp - skillAppliedDmg);
                this.callbacks.onFloatText(attacker.instanceId, `🐼 +${pandaHeal} Zen`, 'heal');
                this.callbacks.onFloatText(target.instanceId, `☯️ -${skillAppliedDmg}`, 'damage');
                break;

            case 'phoenix':
                const phHeal = Math.round(attacker.maxHp * 0.3);
                attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + phHeal);
                skillAppliedDmg = Math.round(attacker.atk * 1.35);
                target.currentHp = Math.max(0, target.currentHp - skillAppliedDmg);
                this.callbacks.onFloatText(attacker.instanceId, `🪶 +${phHeal} Küller`, 'heal');
                this.callbacks.onFloatText(target.instanceId, `🔥 -${skillAppliedDmg}`, 'crit');
                break;

            case 'lion':
                if (window.soundFX && typeof window.soundFX.playRoar === 'function') window.soundFX.playRoar();
                skillAppliedDmg = Math.round(attacker.atk * 1.4);
                target.currentHp = Math.max(0, target.currentHp - skillAppliedDmg);
                target.atk = Math.max(10, Math.round(target.atk * 0.85));
                this.callbacks.onFloatText(target.instanceId, `🦁 -${skillAppliedDmg}`, 'crit');
                break;

            case 'bull':
                const missingHpPct = Math.max(0, (attacker.maxHp - attacker.currentHp) / attacker.maxHp);
                const bullMult = 1.25 + missingHpPct * 0.8;
                skillAppliedDmg = Math.round(attacker.atk * bullMult);
                target.currentHp = Math.max(0, target.currentHp - skillAppliedDmg);
                this.callbacks.onFloatText(target.instanceId, `🐂 -${skillAppliedDmg} (Öfke)`, 'crit');
                break;

            case 'eagle':
                skillAppliedDmg = Math.round(attacker.atk * 1.55);
                target.currentHp = Math.max(0, target.currentHp - skillAppliedDmg);
                this.callbacks.onFloatText(target.instanceId, `🦅 -${skillAppliedDmg} (Dalış)`, 'crit');
                break;

            case 'cat':
                skillAppliedDmg = Math.round(attacker.atk * 1.35);
                target.currentHp = Math.max(0, target.currentHp - skillAppliedDmg);
                this.callbacks.onFloatText(target.instanceId, `🐱 -${skillAppliedDmg} (Tırmık)`, 'crit');
                break;

            default:
                skillAppliedDmg = Math.round(attacker.atk * 1.35);
                target.currentHp = Math.max(0, target.currentHp - skillAppliedDmg);
                this.callbacks.onFloatText(target.instanceId, `💥 -${skillAppliedDmg}`, 'crit');
                break;
        }

        attacker.damageDealt = (attacker.damageDealt || 0) + skillAppliedDmg;

        if (target.currentHp <= 0) {
            attacker.kills = (attacker.kills || 0) + 1;
        }
    }

    sleep(ms) {
        // Savaş hızı 1.25x daha yavaş akması için tüm aksiyon ve efekt bekleme süreleri 1.25 ile çarpılır
        return new Promise(resolve => setTimeout(resolve, Math.round(ms * 1.25)));
    }

    // --- TAKTİKSEL MAÇ VE KORİDOR ANALİZİ (SIMULATION SUITE) ---
    static simulateMatchups(playerTeamOriginal, botTeamOriginal, candidatePool = [], iterations = 100) {
        // Parametre esnekliği: candidatePool ve iterations sırası ters verilse bile güvenle algıla
        if (typeof candidatePool === 'number') {
            const temp = iterations;
            iterations = candidatePool;
            candidatePool = Array.isArray(temp) ? temp : [];
        } else if (!Array.isArray(candidatePool)) {
            candidatePool = [];
        }
        if (typeof iterations !== 'number' || isNaN(iterations) || iterations <= 0) {
            iterations = 100;
        }

        const cloneMonster = (m) => {
            if (!m) return null;
            return {
                ...m,
                maxHp: m.maxHp || 100,
                currentHp: m.maxHp || 100,
                atk: m.atk || 25,
                spd: m.spd || 15,
                crit: m.crit || 15,
                shield: 0,
                hasExtraLife: m.templateId === 'cat',
                isStunned: false,
                energy: 0
            };
        };

        let playerWins = 0;
        let botWins = 0;
        const laneWins = [0, 0, 0];
        const laneMatches = [0, 0, 0];
        const getSynergy = (typeof GameRules !== 'undefined' && GameRules.calculateTeamSynergy) || 
                           (typeof calculateTeamSynergy === 'function' ? calculateTeamSynergy : null);
        const pMainSynergy = getSynergy ? getSynergy(playerTeamOriginal) : null;
        const bMainSynergy = getSynergy ? getSynergy(botTeamOriginal) : null;

        for (let it = 0; it < iterations; it++) {
            const pTeam = playerTeamOriginal.map(m => cloneMonster(m));
            const bTeam = botTeamOriginal.map(m => cloneMonster(m));

            if (pMainSynergy) BattleEngine.applySynergyBuffs(pTeam, pMainSynergy);
            if (bMainSynergy) BattleEngine.applySynergyBuffs(bTeam, bMainSynergy);

            let rounds = 0;
            while (rounds < 15) {
                rounds++;
                const pAlive = pTeam.filter(m => m && m.currentHp > 0);
                const bAlive = bTeam.filter(m => m && m.currentHp > 0);
                if (pAlive.length === 0 || bAlive.length === 0) break;

                const allAlive = [...pAlive, ...bAlive];
                allAlive.sort((a, b) => b.spd - a.spd + (Math.random() * 2 - 1));

                for (const attacker of allAlive) {
                    if (attacker.currentHp <= 0) continue;
                    const opponents = attacker.isBot ? pTeam.filter(m => m && m.currentHp > 0) : bTeam.filter(m => m && m.currentHp > 0);
                    if (opponents.length === 0) break;

                    const directFacing = opponents.find(m => m.slotIndex === attacker.slotIndex);
                    const target = directFacing || opponents[Math.floor(Math.random() * opponents.length)];
                    if (!target) continue;

                    let dmg = attacker.atk + Math.floor(Math.random() * 6 - 3);
                    const isCrit = Math.random() * 100 < attacker.crit;
                    if (isCrit) dmg = Math.round(dmg * 1.6);

                    if (target.shield > 0) {
                        if (target.shield >= dmg) {
                            target.shield -= dmg;
                            dmg = 0;
                        } else {
                            dmg -= target.shield;
                            target.shield = 0;
                        }
                    }

                    if (dmg > 0) {
                        target.currentHp = Math.max(0, target.currentHp - dmg);
                    }

                    if (target.currentHp <= 0 && target.hasExtraLife) {
                        target.hasExtraLife = false;
                        target.currentHp = Math.round(target.maxHp * 0.35);
                    }
                }
            }

            const pFinal = pTeam.filter(m => m && m.currentHp > 0);
            const bFinal = bTeam.filter(m => m && m.currentHp > 0);

            if (pFinal.length > 0 && bFinal.length === 0) {
                playerWins++;
            } else if (bFinal.length > 0 && pFinal.length === 0) {
                botWins++;
            } else {
                if (pFinal.length >= bFinal.length) playerWins++;
                else botWins++;
            }

            for (let i = 0; i < 3; i++) {
                laneMatches[i]++;
                if (pTeam[i] && bTeam[i]) {
                    if (pTeam[i].currentHp > 0 && bTeam[i].currentHp <= 0) {
                        laneWins[i]++;
                    } else if (pTeam[i].currentHp > 0 && bTeam[i].currentHp > 0) {
                        if ((pTeam[i].currentHp / pTeam[i].maxHp) >= (bTeam[i].currentHp / bTeam[i].maxHp)) {
                            laneWins[i]++;
                        }
                    }
                }
            }
        }

        const totalSims = playerWins + botWins || iterations;
        const winRate = Math.max(5, Math.min(95, Math.round((playerWins / totalSims) * 100)));
        const laneRates = laneWins.map((w, idx) => 
            Math.max(10, Math.min(95, Math.round((w / (laneMatches[idx] || 1)) * 100)))
        );

        let lowestLaneIdx = 0;
        let lowestRate = laneRates[0];
        laneRates.forEach((r, idx) => {
            if (r < lowestRate) {
                lowestRate = r;
                lowestLaneIdx = idx;
            }
        });

        // --- YAPAY ZEKA GELİŞMİŞ DİZİLİM OPTİMİZATÖRÜ ---
        const pool = (candidatePool && Array.isArray(candidatePool) && candidatePool.length >= 3)
            ? candidatePool
            : playerTeamOriginal;

        let bestCombo = null;
        let bestScore = winRate;
        let bestComboDetails = null;

        // Havuzdaki 5 canavardan seçilebilecek tüm 3'lü dizilim kombinasyonlarını dene (5P3 = 60 olasılık)
        const simulateTeamWinRate = (testPTeam) => {
            let pWins = 0;
            const evalRounds = 35;
            const comboSynergy = getSynergy ? getSynergy(testPTeam) : null;
            for (let r = 0; r < evalRounds; r++) {
                const pCopy = testPTeam.map(m => cloneMonster(m));
                const bCopy = botTeamOriginal.map(m => cloneMonster(m));
                if (comboSynergy) BattleEngine.applySynergyBuffs(pCopy, comboSynergy);
                if (bMainSynergy) BattleEngine.applySynergyBuffs(bCopy, bMainSynergy);
                let roundCount = 0;
                while (roundCount < 15) {
                    roundCount++;
                    const pAlive = pCopy.filter(m => m && m.currentHp > 0);
                    const bAlive = bCopy.filter(m => m && m.currentHp > 0);
                    if (pAlive.length === 0 || bAlive.length === 0) break;
                    const allAlive = [...pAlive, ...bAlive].sort((a, b) => b.spd - a.spd + (Math.random() * 2 - 1));
                    for (const attacker of allAlive) {
                        if (attacker.currentHp <= 0) continue;
                        const opponents = attacker.isBot ? pCopy.filter(m => m && m.currentHp > 0) : bCopy.filter(m => m && m.currentHp > 0);
                        if (opponents.length === 0) break;
                        const direct = opponents.find(m => m.slotIndex === attacker.slotIndex);
                        const target = direct || opponents[Math.floor(Math.random() * opponents.length)];
                        if (!target) continue;
                        let d = attacker.atk + Math.floor(Math.random() * 6 - 3);
                        if (Math.random() * 100 < attacker.crit) d = Math.round(d * 1.6);
                        if (target.shield > 0) {
                            if (target.shield >= d) { target.shield -= d; d = 0; }
                            else { d -= target.shield; target.shield = 0; }
                        }
                        if (d > 0) target.currentHp = Math.max(0, target.currentHp - d);
                        if (target.currentHp <= 0 && target.hasExtraLife) {
                            target.hasExtraLife = false;
                            target.currentHp = Math.round(target.maxHp * 0.35);
                        }
                    }
                }
                const pFinal = pCopy.filter(m => m && m.currentHp > 0);
                const bFinal = bCopy.filter(m => m && m.currentHp > 0);
                if (pFinal.length > 0 && bFinal.length === 0) pWins++;
                else if (pFinal.length >= bFinal.length && pFinal.length > 0) pWins++;
            }
            return Math.round((pWins / evalRounds) * 100);
        };

        if (pool.length >= 3) {
            for (let i = 0; i < pool.length; i++) {
                for (let j = 0; j < pool.length; j++) {
                    if (i === j) continue;
                    for (let k = 0; k < pool.length; k++) {
                        if (k === i || k === j) continue;
                        const combo = [
                            { ...pool[i], slotIndex: 0, isBot: false },
                            { ...pool[j], slotIndex: 1, isBot: false },
                            { ...pool[k], slotIndex: 2, isBot: false }
                        ];
                        const score = simulateTeamWinRate(combo);
                        if (score > bestScore) {
                            bestScore = score;
                            bestCombo = combo;
                        }
                    }
                }
            }
        }

        let tacticalAdvice = '';
        let suggestionAction = null;

        const pMonster = playerTeamOriginal[lowestLaneIdx];
        const bMonster = botTeamOriginal[lowestLaneIdx];
        const pName = pMonster ? pMonster.name.split(' ')[0] : 'Canavar';
        const bName = bMonster ? bMonster.name.split(' ')[0] : 'Rakip';

        if (bestCombo && bestScore > winRate + 2) {
            const currentIds = playerTeamOriginal.map(m => m ? m.templateId : '');
            const bestIds = bestCombo.map(m => m.templateId);

            // Farkları analiz et
            const diffs = [];
            for (let s = 0; s < 3; s++) {
                if (currentIds[s] !== bestIds[s]) {
                    diffs.push(s);
                }
            }

            const c0Name = bestCombo[0].name.split(' ')[0];
            const c1Name = bestCombo[1].name.split(' ')[0];
            const c2Name = bestCombo[2].name.split(' ')[0];

            if (diffs.length === 2 && currentIds[diffs[0]] === bestIds[diffs[1]] && currentIds[diffs[1]] === bestIds[diffs[0]]) {
                // 2 slot arası basit yer değişimi
                const s1 = diffs[0];
                const s2 = diffs[1];
                const n1 = playerTeamOriginal[s1].name.split(' ')[0];
                const n2 = playerTeamOriginal[s2].name.split(' ')[0];
                tacticalAdvice = `⚠️ <b>Taktiksel Öneri:</b> Koridor ${s1 + 1}'deki <b>${n1}</b> ile Koridor ${s2 + 1}'deki <b>${n2}</b> yerini değiştirirseniz kazanma şansınız <b>%${winRate}</b>'den <b>%${bestScore}</b>'ye çıkar!`;
                suggestionAction = {
                    type: 'swap',
                    targetSlotIdx: s1,
                    swapWithSlotIdx: s2,
                    rate: bestScore
                };
            } else if (diffs.length === 1) {
                // Tek bir canavarı yedekten alma
                const targetSlot = diffs[0];
                const benchMonster = bestCombo[targetSlot];
                const bCandidateName = benchMonster.name.split(' ')[0];
                const bCandidateEmoji = benchMonster.emoji || '🐾';
                tacticalAdvice = `⚠️ <b>Taktiksel Öneri:</b> Koridor ${targetSlot + 1}'e yedek havuzdaki <b>${bCandidateEmoji} ${bCandidateName}</b> koyarsanız kazanma şansınız <b>%${winRate}</b>'den <b>%${bestScore}</b>'ye çıkar!`;
                suggestionAction = {
                    type: 'bench',
                    targetSlotIdx: targetSlot,
                    candidate: benchMonster,
                    rate: bestScore
                };
            } else {
                // Kapsamlı takım optimizasyonu
                tacticalAdvice = `💡 <b>En Yüksek Zafer Dizilimi (%${bestScore}):</b> Koridorları <b>${bestCombo[0].emoji || ''} ${c0Name}</b>, <b>${bestCombo[1].emoji || ''} ${c1Name}</b> ve <b>${bestCombo[2].emoji || ''} ${c2Name}</b> olarak dizerek kazanma şansınızı <b>%${bestScore}</b> seviyesine çıkarabilirsiniz!`;
                suggestionAction = {
                    type: 'full',
                    templateIds: bestIds,
                    rate: bestScore
                };
            }

            // Kazanma ihtimali %50 üstündeyse önerilen dizilimi uygula butonu/aksiyonu devre dışı bırakılır
            if (winRate > 50) {
                suggestionAction = null;
            }
        } else if (winRate >= 70) {
            tacticalAdvice = `🌟 <b>Mükemmel Kadro (%${winRate} Zafer İhtimali):</b> Mevcut diziliminiz rakibe karşı çok güçlü ve avantajlı!`;
        } else if (winRate >= 45) {
            tacticalAdvice = `⚖️ <b>Dengeli Eşleşme (%${winRate}):</b> Bu havuzdan kurulabilecek en dirençli kadroyu kurdunuz. Kritik vuruşlar ve hız sırası zaferi belirleyecek!`;
        } else {
            tacticalAdvice = `🚨 <b>Kritik Dezavantaj (%${winRate} Zafer İhtimali):</b> Rakip bot (Usta Güç Çarpanı) mevcut havuzunuza göre çok üstün! Elinizdeki 5 karttan kurulabilecek en dirençli dizilim bu olsa da maçı kazanmak çok zorlu bir mücadele gerektiriyor.`;
        }

        return {
            winRate,
            laneRates,
            lowestLaneIdx,
            tacticalAdvice,
            suggestionAction,
            simCount: iterations
        };
    }
}

if (typeof window !== 'undefined') {
    window.BattleEngine = BattleEngine;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BattleEngine;
}
