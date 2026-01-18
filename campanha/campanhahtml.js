// Este arquivo guarda APENAS o HTML (Visual)
const CampaignView = {
    template: `
    <div id="campaignModal" class="hidden fixed inset-0 bg-slate-900/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300 opacity-0">
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-4 max-w-sm w-full shadow-2xl relative transform transition-all scale-95" id="modalContent">
            
            <button onclick="CampaignSystem.close()" class="absolute top-2 right-2 text-slate-400 hover:text-white p-2 z-10">
                <i class="fas fa-times text-lg"></i>
            </button>

            <div class="text-center">
                <div class="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-indigo-500/50">
                    <i class="fas fa-rocket text-indigo-400 text-xl"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-1">Rumo a Versão Pro</h3>

                <div id="step-invite">
                    <p class="text-xs text-slate-300 mb-4 leading-relaxed px-2">
                        Para o Projeto continuar de pé, precisamos da sua colaboração para arcar com os custos e publicar nas lojas.
                    </p>
                    
                    <div class="bg-indigo-900/40 border border-indigo-500/50 rounded-lg p-3 mb-4 animate-pulse-slow">
                        <p class="text-xs text-indigo-200 leading-relaxed">
                            <i class="fas fa-star text-yellow-400 mr-1 text-sm shadow-glow"></i>
                            Colabore com <strong>R$ 15,00</strong> e ganhe a versão <strong class="text-white bg-indigo-600 px-1 rounded text-[10px]">PRO VITALÍCIA</strong> quando lançar!
                        </p>
                    </div>

                    <div class="bg-slate-900/60 rounded-lg p-3 border border-slate-700 mb-4 text-left">
                        <div class="flex justify-between items-end mb-1">
                            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Arrecadado</span>
                            <span class="text-xl font-black text-emerald-400" id="raisedDisplay">R$ 0,00</span>
                        </div>
                        <div class="w-full bg-slate-700 rounded-full h-3 mb-1 overflow-hidden shadow-inner">
                            <div id="progressBarCampaign" class="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-3 rounded-full relative" style="width: 0%"></div>
                        </div>
                    </div>

                    <div class="space-y-2 mb-4 text-left">
                        
                        <div class="flex items-center gap-3 opacity-50 transition-all duration-500 milestone" data-goal="200">
                            <div class="w-8 h-8 rounded bg-slate-800 border border-slate-600 flex items-center justify-center shrink-0 icon-box">
                                <i class="fas fa-server text-[10px] text-slate-400"></i>
                            </div>
                            <div class="flex-1">
                                <div class="flex justify-between text-[10px] font-bold text-slate-300">
                                    <span>Hospedagem & Servidor</span>
                                    <span>R$ 200</span>
                                </div>
                            </div>
                            <i class="fas fa-lock text-slate-600 text-xs status-icon"></i>
                        </div>

                        <div class="flex items-center gap-3 opacity-50 transition-all duration-500 milestone" data-goal="600">
                            <div class="w-8 h-8 rounded bg-slate-800 border border-slate-600 flex items-center justify-center shrink-0 icon-box">
                                <i class="fab fa-node-js text-[12px] text-slate-400"></i>
                            </div>
                            <div class="flex-1">
                                <div class="flex justify-between text-[10px] font-bold text-slate-300">
                                    <span>Refatoração Do site para um modelo profissional</span>
                                    <span>R$ 600</span>
                                </div>
                            </div>
                            <i class="fas fa-lock text-slate-600 text-xs status-icon"></i>
                        </div>

                        <div class="flex items-center gap-3 opacity-50 transition-all duration-500 milestone" data-goal="1000">
                            <div class="w-8 h-8 rounded bg-slate-800 border border-slate-600 flex items-center justify-center shrink-0 icon-box">
                                <i class="fab fa-android text-[12px] text-slate-400"></i>
                            </div>
                            <div class="flex-1">
                                <div class="flex justify-between text-[10px] font-bold text-slate-300">
                                    <span>Versão para Android</span>
                                    <span>R$ 1.000</span>
                                </div>
                            </div>
                            <i class="fas fa-lock text-slate-600 text-xs status-icon"></i>
                        </div>

                        <div class="flex items-center gap-3 opacity-50 transition-all duration-500 milestone" data-goal="1500">
                            <div class="w-8 h-8 rounded bg-slate-800 border border-slate-600 flex items-center justify-center shrink-0 icon-box">
                                <i class="fab fa-apple text-[12px] text-slate-400"></i>
                            </div>
                            <div class="flex-1">
                                <div class="flex justify-between text-[10px] font-bold text-slate-300">
                                    <span>Publ. e licensa para iOS Apple</span>
                                    <span>R$ 1.500</span>
                                </div>
                            </div>
                            <i class="fas fa-lock text-slate-600 text-xs status-icon"></i>
                        </div>
                    </div>

                    <div class="mb-4 text-left border-t border-slate-700 pt-3">
                        <label class="text-[10px] font-bold text-indigo-300 uppercase ml-1">Seu E-mail (Para receber o acesso):</label>
                        <input type="email" id="backerEmail" placeholder="seu@email.com" class="w-full mt-1 bg-slate-900 border border-slate-600 rounded p-3 text-white text-sm focus:border-indigo-500 outline-none placeholder-slate-600">
                    </div>

                    <button onclick="CampaignSystem.goToPayment()" class="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg active:scale-95 transition-all">
                        QUERO APOIAR AGORA <i class="fas fa-arrow-right ml-2"></i>
                    </button>
                </div>

                <div id="step-payment" style="display: none;" class="animate-fade-in pt-2">
                    <p class="text-xs text-white mb-2 font-bold">Escaneie o QR Code no App do Banco:</p>
                    
                    <div class="bg-white p-3 rounded-lg inline-block shadow-lg mb-4">
                        <div id="qrcode-container"></div>
                    </div>

                    <p class="text-[10px] text-slate-400 mb-2">Ou use o Copia e Cola:</p>

                    <button onclick="CampaignSystem.copyPix()" id="btnPixCampaign" class="w-full bg-slate-700 border border-slate-600 text-slate-300 text-xs font-bold py-3 rounded-lg flex items-center justify-center gap-2 mb-3">
                        <i class="far fa-copy"></i> COPIAR CÓDIGO PIX
                    </button>

                    <button onclick="CampaignSystem.backToInvite()" class="text-xs text-slate-500 underline hover:text-white">
                        Voltar
                    </button>
                </div>
            </div>
        </div>
    </div>
    `
};