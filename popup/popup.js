const PopupManager = {
    storageKey: 'metadriver_last_seen_timestamp',
    
    // ======================================================
    // ⚙️ CONFIGURAÇÃO DE TEMPO (Preencha o que precisar)
    // ======================================================
    CONFIG_TEMPO: {
        HORAS: 0,      // Quantas horas?
        MINUTOS: 0,     // Quantos minutos?
        SEGUNDOS: 0     // Quantos segundos?
    },
    // ======================================================

    init: function() {
        window.addEventListener('load', () => {
            this.checkAndShow();
        });
    },

    checkAndShow: function() {
        const agora = Date.now(); 
        const ultimoVisto = localStorage.getItem(this.storageKey);
        
        // --- CÁLCULO AUTOMÁTICO (A FÓRMULA FIXA) ---
        const msHoras    = this.CONFIG_TEMPO.HORAS * 60 * 60 * 1000;
        const msMinutos  = this.CONFIG_TEMPO.MINUTOS * 60 * 1000;
        const msSegundos = this.CONFIG_TEMPO.SEGUNDOS * 1000;
        
        const tempoEsperaMs = msHoras + msMinutos + msSegundos;
        // ----------------------------------------------

        
        if (!ultimoVisto || (agora - parseInt(ultimoVisto)) > tempoEsperaMs) {
            
            console.log(`Popup: Tempo de espera (${tempoEsperaMs}ms) acabou. Abrindo...`);

            // Delay visual de 2 segundos para abrir
            setTimeout(() => {
                if (typeof CampaignSystem !== 'undefined') {
                    CampaignSystem.open();
                    localStorage.setItem(this.storageKey, agora);
                }
            }, 2000); 

        } else {
            console.log("Popup: Ainda no período de espera.");
        }
    }
};

PopupManager.init();