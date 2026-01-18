
        const els = {
            start: document.getElementById('startTime'),
            goal: document.getElementById('goalAmount'),
            km: document.getElementById('kmInput'),
            fuelPrice: document.getElementById('fuelPrice'),
            consumption: document.getElementById('consumption'),
            uber: document.getElementById('uberInput'),
            ninenine: document.getElementById('ninenineInput'),
            tips: document.getElementById('tipsInput'),
            
            
            grossHeader: document.getElementById('grossHeaderDisplay'), 
            netIncome: document.getElementById('netIncomeDisplay'),
            hourlyRate: document.getElementById('hourlyRateDisplay'), 
            fuelCost: document.getElementById('fuelCostDisplay'),
            kmValue: document.getElementById('kmValueDisplay'), // Novo Display
            elapsed: document.getElementById('elapsedTime'),
            finish: document.getElementById('estimatedFinish'),
            progress: document.getElementById('progressBar'),
            remaining: document.getElementById('remainingAmount')
        };

        window.addEventListener('load', () => {
            if(!localStorage.getItem('drv_start')) els.start.value = "06:00";
            if(!localStorage.getItem('drv_fuel')) els.fuelPrice.value = "5.89"; 
            if(!localStorage.getItem('drv_cons')) els.consumption.value = "10";

            const fields = [
                {k: 'drv_start', el: els.start}, {k: 'drv_goal', el: els.goal},
                {k: 'drv_km', el: els.km}, {k: 'drv_fuel', el: els.fuelPrice},
                {k: 'drv_cons', el: els.consumption}, {k: 'drv_uber', el: els.uber},
                {k: 'drv_99', el: els.ninenine}, {k: 'drv_tips', el: els.tips}
            ];

            fields.forEach(f => {
                const val = localStorage.getItem(f.k);
                if(val) f.el.value = val;
            });

            calculate();
        });

        const allInputs = Object.values(els).filter(el => el.tagName === 'INPUT');
        allInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                if (['uberInput', 'ninenineInput', 'tipsInput'].includes(input.id)) {
                    input.value = input.value.replace(/[^0-9+.,]/g, '');
                }
                saveData();
                calculate();
            });
        });

        function parseMath(str) {
            if(!str) return 0;
            const clean = str.toString().replace(/\s/g, '').replace(',', '.');
            try {
                if(clean.includes('+')) {
                    return clean.split('+').reduce((acc, curr) => acc + (parseFloat(curr)||0), 0);
                }
                return parseFloat(clean) || 0;
            } catch { return 0; }
        }

        function fmtMoney(n) { return n.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}); }

        function saveData() {
            localStorage.setItem('drv_start', els.start.value);
            localStorage.setItem('drv_goal', els.goal.value);
            localStorage.setItem('drv_km', els.km.value);
            localStorage.setItem('drv_fuel', els.fuelPrice.value);
            localStorage.setItem('drv_cons', els.consumption.value);
            localStorage.setItem('drv_uber', els.uber.value);
            localStorage.setItem('drv_99', els.ninenine.value);
            localStorage.setItem('drv_tips', els.tips.value);
        }

        function resetData() {
            if(confirm("Tem certeza que deseja zerar os valores de hoje? (Preço e Consumo serão mantidos)")) {
                els.uber.value = ""; els.ninenine.value = ""; els.tips.value = ""; els.km.value = "";
                saveData();
                calculate();
            }
        }

        function copyPix() {
            const pixKey = "07165497439";
            navigator.clipboard.writeText(pixKey).then(() => {
                const icon = document.getElementById('copyIcon');
                icon.className = 'fas fa-check text-emerald-400';
                setTimeout(() => {
                    icon.className = 'far fa-copy';
                }, 1500);
            }).catch(err => console.error(err));
        }

        function calculate() {
            // 1. Ganhos
            const gross = parseMath(els.uber.value) + parseMath(els.ninenine.value) + parseMath(els.tips.value);
            
            // 2. Custos
            const km = parseMath(els.km.value);
            const fuelPrice = parseFloat(els.fuelPrice.value) || 0;
            const consumption = parseFloat(els.consumption.value) || 1; 
            
            const liters = km / consumption;
            const fuelCost = liters * fuelPrice;
            const netIncome = gross - fuelCost;

            // 3. Tempo
            const now = new Date();
            const [h, m] = els.start.value.split(':').map(Number);
            const startDt = new Date(); startDt.setHours(h, m, 0, 0);
            
            let diffMins = (now - startDt) / 60000;
            if(diffMins < 0) diffMins = 0; 
            const hoursDec = diffMins / 60;
            
            const workedH = Math.floor(diffMins / 60);
            const workedM = Math.floor(diffMins % 60);

            // 4. Updates na UI
            els.grossHeader.textContent = fmtMoney(gross); 
            els.netIncome.textContent = fmtMoney(netIncome); 
            els.fuelCost.textContent = fmtMoney(fuelCost);
            els.elapsed.textContent = `${workedH}h ${workedM.toString().padStart(2,'0')}m`;

            // Hora Bruta
            const hourlyGross = hoursDec > 0 ? (gross / hoursDec) : 0;
            els.hourlyRate.textContent = fmtMoney(hourlyGross); 
            
            // Novo: Valor do KM
            const kmValue = km > 0 ? (gross / km) : 0;
            els.kmValue.textContent = fmtMoney(kmValue);

            // 5. Previsão e Meta
            const goal = parseFloat(els.goal.value) || 0;
            const remaining = goal - gross;

            if(remaining <= 0) {
                els.remaining.textContent = "META BATIDA!";
                els.remaining.classList.replace('text-slate-300', 'text-emerald-400');
                els.progress.style.width = '100%';
                els.progress.classList.replace('bg-blue-500', 'bg-emerald-500');
                els.finish.textContent = "LIVRE";
                els.finish.classList.add('text-emerald-400');
            } else {
                els.remaining.textContent = `Falta ${fmtMoney(remaining)}`;
                els.remaining.classList.replace('text-emerald-400', 'text-slate-300');
                els.progress.classList.replace('bg-emerald-500', 'bg-blue-500');
                els.finish.classList.remove('text-emerald-400');

                const pct = Math.min((gross / goal) * 100, 100);
                els.progress.style.width = `${Math.max(pct, 0)}%`;

                if(hourlyGross > 0) {
                    const hoursNeeded = remaining / hourlyGross;
                    const finishTime = new Date(now.getTime() + hoursNeeded * 3600000);
                    els.finish.textContent = `${finishTime.getHours().toString().padStart(2,'0')}:${finishTime.getMinutes().toString().padStart(2,'0')}`;
                } else {
                    els.finish.textContent = "--:--";
                }
            }

        }
  
        