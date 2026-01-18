const CampaignSystem = {
    // === CONFIGURAÇÃO ===
    config: {
        raised: 17.52,       // Quanto já arrecadou
        goalMax: 1500.00,      // Meta Final

        //link do formularoio formspree
        notifyUrl:"https://formspree.io/f/mlgggyzk",
        
        //Pix copia e cola do banco
        pixPayload: "00020126400014br.gov.bcb.pix0118dev.jcfj@gmail.com5204000053039865802BR5920JOSCECLIOFONSCAJNIOR6009Sao Paulo610901227-20062230519daqr1178951418737806304E837", 
        
        pixKey: "dev.jcfj@gmail.com"  // Apenas para exibição visual
    },
   
init: function() {
        if (!document.getElementById('campaignModal')) {
            if(typeof CampaignView !== 'undefined') {
                document.body.insertAdjacentHTML('beforeend', CampaignView.template);
            }
        }
    },

    open: function() {
        this.init(); 

        const modal = document.getElementById('campaignModal');
        const content = document.getElementById('modalContent');
        const stepInvite = document.getElementById('step-invite');
        const stepPayment = document.getElementById('step-payment');

        // Reseta sempre para o início
        if (stepInvite && stepPayment) {
            stepInvite.style.display = 'block';
            stepPayment.style.display = 'none';
        }

        if (modal) {
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                if (content) {
                    content.classList.remove('scale-95');
                    content.classList.add('scale-100');
                }
                this.updateVisuals();
            }, 10);
        }
    },

    close: function() {
        const modal = document.getElementById('campaignModal');
        const content = document.getElementById('modalContent');
        
        if (modal) {
            modal.classList.add('opacity-0');
            if (content) {
                content.classList.remove('scale-100');
                content.classList.add('scale-95');
            }
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }
    },

    updateVisuals: function() {
        const { raised, goalMax } = this.config;
        
        const display = document.getElementById('raisedDisplay');
        if(display) display.innerText = raised.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

        const bar = document.getElementById('progressBarCampaign');
        if (bar) {
            const pct = Math.min((raised / goalMax) * 100, 100);
            bar.style.width = `${pct}%`;
        }

        const milestones = document.querySelectorAll('.milestone');
        milestones.forEach(item => {
            const goal = parseFloat(item.getAttribute('data-goal'));
            const iconBox = item.querySelector('.icon-box');
            const mainIcon = iconBox.querySelector('i');
            const statusIcon = item.querySelector('.status-icon');

            if (raised >= goal) {
                item.classList.remove('opacity-50');
                item.classList.add('opacity-100');
                iconBox.className = "w-8 h-8 rounded bg-emerald-500/20 border border-emerald-500 flex items-center justify-center shrink-0 icon-box transition-colors shadow-[0_0_10px_rgba(16,185,129,0.3)]";
                mainIcon.classList.remove('text-slate-400');
                mainIcon.classList.add('text-emerald-400');
                statusIcon.className = "fas fa-check-circle text-emerald-400 text-sm shadow-glow";
            } else {
                item.classList.add('opacity-50');
                item.classList.remove('opacity-100');
                iconBox.className = "w-8 h-8 rounded bg-slate-800 border border-slate-600 flex items-center justify-center shrink-0 icon-box";
                mainIcon.classList.add('text-slate-400');
                mainIcon.classList.remove('text-emerald-400');
                statusIcon.className = "fas fa-lock text-slate-600 text-xs status-icon";
            }
        });
    },

    // === AQUI ESTÁ A MÁGICA DO E-MAIL ===
    goToPayment: async function() {
        const emailInput = document.getElementById('backerEmail');
        const email = emailInput.value;
        const btn = event.currentTarget; // O botão clicado
        const originalText = btn.innerHTML;

        // 1. Validação
        if(email.length < 5 || !email.includes('@')) {
            alert("Por favor, digite um e-mail válido para garantirmos seu acesso vitalício!");
            emailInput.focus();
            return;
        }

        // 2. Feedback Visual (Carregando...)
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> REGISTRANDO...';

        // 3. Envio Silencioso para o Formspree
        try {
            if (this.config.notifyUrl.includes("formspree")) {
                await fetch(this.config.notifyUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        email: email,
                        data: new Date().toLocaleString(),
                        mensagem: "Novo interessado no Vitalício (MetaDriver)",
                        origem: "App Web"
                    })
                });
            }
        } catch (error) {
            console.log("Erro ao notificar, mas vamos liberar o pix:", error);
        }

        // 4. Libera a tela do Pix (Mesmo se der erro no email, para não perder a doação)
        document.getElementById('step-invite').style.display = 'none';
        document.getElementById('step-payment').style.display = 'block';
        
        // Restaura botão (caso ele volte depois)
        btn.disabled = false;
        btn.innerHTML = originalText;

        // Gera o QR Code
        this.generateQR();
    },

    backToInvite: function() {
        document.getElementById('step-payment').style.display = 'none';
        document.getElementById('step-invite').style.display = 'block';
    },

    generateQR: function() {
        const container = document.getElementById("qrcode-container");
        if (!container) return;
        container.innerHTML = "";
        
        const payload = this.config.pixPayload;

        if (typeof QRCode !== 'undefined') {
            new QRCode(container, {
                text: payload,
                width: 180,
                height: 180,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.M
            });
        }
    },

    copyPix: function() {
        const payload = this.config.pixPayload;
        navigator.clipboard.writeText(payload).then(() => {
            const btn = document.getElementById('btnPixCampaign');
            const originalHTML = btn.innerHTML;

            btn.className = "w-full bg-emerald-500 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 mb-3";
            btn.innerHTML = '<i class="fas fa-check-double"></i> <span>SUCESSO!</span>';

            setTimeout(() => {
                btn.className = "w-full bg-slate-700 border border-slate-600 text-slate-300 text-xs font-bold py-3 rounded-lg flex items-center justify-center gap-2 mb-3";
                btn.innerHTML = originalHTML;
            }, 3000);
        });
    }
};

window.addEventListener('click', (e) => {
    const modal = document.getElementById('campaignModal');
    if (modal && e.target === modal) {
        CampaignSystem.close();
    }
});