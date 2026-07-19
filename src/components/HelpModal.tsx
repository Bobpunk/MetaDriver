"use client";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function HelpModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 z-10"
          aria-label="Fechar"
          type="button"
        >
          <i className="fas fa-times" />
        </button>

        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-blue-500/50">
            <i className="fas fa-question text-blue-400 text-xl" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Como usar o MetaDriver</h3>
          <p className="text-[10px] text-slate-400">Acompanhe seus ganhos em tempo real</p>
        </div>

        <div className="space-y-4 text-left">
          <Section icon="fa-clock" title="1. Horário de início">
            Defina o horário que você começou a rodar. O app calcula automaticamente
            quanto tempo de jornada você já tem.
          </Section>

          <Section icon="fa-bullseye" title="2. Meta do dia">
            Quanto você quer ganhar hoje? Defina um valor realista e acompanhe o progresso
            na barra percentual.
          </Section>

          <Section icon="fa-road" title="3. KM atual">
            Informe os quilômetros rodados até agora. O app calcula o gasto com
            combustível e o valor por KM.
          </Section>

          <Section icon="fa-gas-pump" title="4. Configurar combustível">
            Clique em &quot;Configurar Combustível&quot; para ajustar o preço do litro
            e o consumo do seu carro (km/l). Esse dado é salvo automaticamente.
          </Section>

          <Section icon="fa-wallet" title="5. Lançar ganhos">
            Preencha os campos Uber, 99Pop e Extra com os valores que você já recebeu.
            Você pode usar &quot;+&quot; para somar múltiplas corridas
            (ex: 25+30+18).
          </Section>

          <Section icon="fa-chart-line" title="6. Acompanhe os resultados">
            O painel mostra em tempo real:
            <ul className="list-disc list-inside text-[11px] text-slate-300 mt-1 space-y-0.5">
              <li>Bruto e Líquido (descontado combustível)</li>
              <li>Gasto com gasolina</li>
              <li>Valor ganho por hora</li>
              <li>Valor por KM rodado</li>
              <li>Previsão de término da meta</li>
            </ul>
          </Section>

          <Section icon="fa-share-alt" title="7. Compartilhar">
            Use o botão &quot;Compartilhar Resultado&quot; para gerar uma imagem
            do seu dia e enviar para amigos ou redes sociais.
          </Section>

          <Section icon="fa-trash-alt" title="8. Reiniciar">
            O botão &quot;Reiniciar&quot; limpa os lançamentos do dia (Uber, 99, Extra, KM)
            mantendo o preço do combustível e consumo salvos.
          </Section>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-700 text-center">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-6 rounded-lg transition-all"
            type="button"
          >
            Entendi!
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-1">
        <i className={`fas ${icon} text-blue-400 text-[10px]`} />
        <h4 className="text-xs font-bold text-white">{title}</h4>
      </div>
      <div className="text-[11px] text-slate-300 leading-relaxed">{children}</div>
    </div>
  );
}
