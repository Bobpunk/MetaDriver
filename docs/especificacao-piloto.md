# Especificação do piloto do MetaDriver

Documento consolidado em 23 de julho de 2026.

## Objetivo

Validar o núcleo do MetaDriver em uso real antes da divulgação pública.

O piloto inicial será conduzido pelo próprio criador do produto durante sete
dias. A meta é completar pelo menos cinco jornadas reais usando o MetaDriver
como fonte principal dos cálculos.

Após esse ciclo:

1. corrigir erros e inconsistências encontrados;
2. realizar um piloto com um motorista que não participou do desenvolvimento;
3. ampliar para 20 motoristas;
4. somente depois buscar a meta de 100 cadastros.

Cobrança, assinatura e acabamento secundário não bloqueiam o primeiro piloto.

## Público inicial

- Motoristas de aplicativo;
- cidade inicial: João Pessoa, Paraíba;
- aquisição futura por WhatsApp e indicação;
- alcance estimado: aproximadamente 300 contatos;
- oferta futura: um mês de acesso Pro gratuito no cadastro.

## Conceitos financeiros

### Versão Free

O indicador não deve ser chamado de lucro líquido.

```text
Saldo após combustível = faturamento bruto - combustível
```

Nome na interface: **Saldo após combustível**.

### Versão Pro

```text
Lucro real estimado =
  faturamento bruto
  - combustível
  - outras despesas variáveis
  - parcela dos custos fixos
```

Nome na interface: **Lucro real estimado**.

O cálculo deve ser idêntico no cabeçalho, indicadores, gráficos, histórico e
resumos. Não pode haver fontes diferentes de custo de combustível dentro da
mesma tela.

### Meta da jornada

A meta será sempre de faturamento bruto, tanto no Free quanto no Pro.

Os custos e o lucro real são diagnósticos e não alteram o critério usado para
encerrar a jornada.

## Hora bruta

A hora bruta é o indicador principal da estratégia.

```text
Hora bruta =
  faturamento bruto acumulado
  / tempo efetivamente trabalhado
```

O tempo efetivamente trabalhado:

- começa ao iniciar a jornada;
- inclui o tempo parado entre corridas;
- exclui somente pausas declaradas;
- termina ao encerrar a jornada.

A média deve continuar mudando com a passagem do tempo, mesmo sem novos
lançamentos.

## Referência mínima para aceitar corridas

### Regra-base

Antes do primeiro ganho da jornada:

```text
Referência normal = R$ 35/h
```

Após existir faturamento:

```text
Referência normal = min(hora bruta atual + R$ 5, R$ 35)
```

Exemplos:

| Hora bruta atual | Referência normal |
| --- | --- |
| R$ 20/h | R$ 25/h ou mais |
| R$ 25/h | R$ 30/h ou mais |
| R$ 29/h | R$ 34/h ou mais |
| R$ 30/h | R$ 35/h ou mais |
| R$ 34/h | R$ 35/h ou mais |
| R$ 36/h | R$ 35/h ou mais |
| R$ 40/h | R$ 35/h ou mais |

### Adicionais

```text
Referência final =
  referência normal
  + R$ 5 durante horário de pico
  + R$ 5 quando o modo Chovendo estiver ativo
```

Exemplo:

```text
Hora bruta atual: R$ 29/h
Referência normal: R$ 34/h
Horário de pico: + R$ 5
Chovendo: + R$ 5
Referência final: R$ 44/h ou mais
```

### Horários de pico

Para a primeira versão, os mesmos horários serão usados todos os dias,
inclusive sábados, domingos e feriados:

- 07:00–08:30;
- 12:00–13:30;
- 17:00–19:00.

Regras especiais de domingo poderão ser avaliadas no futuro, após coleta de
dados suficiente.

## Modo Chovendo

- Controle manual;
- desligado por padrão;
- acrescenta R$ 5 à referência mínima;
- deve ter estado claramente visível;
- deve ser desligado automaticamente ao encerrar a jornada;
- não haverá integração meteorológica no piloto.

## Ciclo da jornada

### Iniciar jornada

Ao iniciar:

- definir automaticamente o horário inicial com a hora atual;
- permitir correção manual do horário;
- zerar os valores da nova jornada;
- desligar o modo Chovendo;
- usar R$ 35/h como referência até existir o primeiro ganho;
- iniciar a contagem do tempo efetivamente trabalhado.

### Pausar jornada

- A ação deve ser explícita;
- oferecer durações comuns: 15, 30, 45 e 60 minutos;
- permitir uma duração personalizada;
- mostrar contagem regressiva como referência;
- não retomar automaticamente;
- encerrar a pausa somente com a ação manual **Retomar jornada**;
- excluir do cálculo o tempo real entre pausar e retomar;
- se a jornada for encerrada durante uma pausa, o tempo pausado continua
  excluído.

### Encerrar jornada

O botão atual **Reiniciar** deve ser substituído por **Encerrar jornada**.

Ao encerrar:

1. solicitar confirmação;
2. congelar os cálculos;
3. encerrar uma pausa ativa, se existir;
4. salvar automaticamente a jornada;
5. desligar o modo Chovendo;
6. deixar o sistema pronto para iniciar uma nova jornada.

Dados mínimos a salvar:

- data;
- horário inicial;
- horário final;
- duração bruta;
- duração das pausas;
- tempo efetivamente trabalhado;
- faturamento bruto;
- ganhos separados por Uber, 99Pop, inDrive e Extra enquanto a jornada estiver
  ativa;
- quilômetros;
- combustível;
- outras despesas;
- hora bruta;
- saldo após combustível;
- lucro real estimado, quando aplicável;
- meta bruta;
- indicação de meta atingida.

## Várias jornadas no mesmo dia

- Permitir mais de uma jornada diária;
- manter somente uma jornada ativa por vez;
- não impor o limite arbitrário de três registros;
- nunca substituir automaticamente registros antigos;
- consolidar as jornadas no resumo do dia.

```text
Hora bruta diária =
  faturamento bruto de todas as jornadas
  / soma do tempo efetivamente trabalhado
```

Os intervalos entre jornadas não entram no cálculo.

## Sugestões de pausa

As sugestões devem ser faixas informativas discretas e persistentes no painel.
Não devem abrir modal, bloquear a interface, emitir alertas repetidos nem
possuir a ação “Lembrar depois”.

### Segunda a sexta

Horários historicamente fracos:

- 10:00–11:00;
- 14:00–15:00;
- 20:00–21:00.

Janelas de exibição:

- 09:50–10:50;
- 13:50–14:50;
- 19:50–20:50.

### Sábado e domingo

Horário historicamente fraco:

- 09:00–10:00.

Janela de exibição:

- 08:50–09:50.

### Ação da sugestão

A faixa pode oferecer somente **Iniciar pausa**.

Ao iniciar uma pausa pela sugestão:

- preencher a duração com o tempo restante da janela de exibição;
- permitir que o motorista edite esse tempo;
- descontar do cálculo somente o tempo realmente pausado;
- manter a retomada manual.

Exemplo: às 10:10, dentro da janela 09:50–10:50, sugerir inicialmente uma
pausa de 40 minutos.

## Horário morto em João Pessoa

Regra regional inicial:

- domingo: 00:00–05:00;
- segunda: 00:00–05:00;
- terça: 00:00–05:00;
- quarta: 00:00–05:00;
- quinta: 00:00–05:00;
- sexta e sábado: sem essa regra.

Comportamento:

- mostrar aviso persistente e discreto a partir de 23:50;
- manter o aviso até 05:00;
- não alterar a referência mínima de R$/hora;
- não impedir o início ou a continuidade da jornada;
- oferecer a ação **Encerrar jornada**;
- exigir confirmação antes de encerrar e salvar.

No futuro, essa regra deve fazer parte de um perfil regional de estratégia, não
ser aplicada universalmente a outras cidades.

## Regra regional adiada

As recomendações de posicionamento entre Centro e Zona Sul de João Pessoa
ficam fora do piloto.

Elas se baseiam na experiência pessoal do criador e ainda não foram validadas
com outros motoristas. Não haverá GPS nem seleção manual de região nesta etapa.

## Resumo e insights Pro

O resumo Pro deve priorizar:

- hora bruta;
- lucro real por hora;
- lucro real estimado;
- composição dos custos;
- diferença entre faturamento bruto e lucro real;
- comparação entre jornadas e dias da semana.

Recomendações não devem ser exibidas enquanto os cálculos usarem definições
inconsistentes de combustível, despesas ou custos fixos.

## Critérios do autoexperimento

Durante sete dias, completar pelo menos cinco jornadas reais.

Em cada jornada:

- usar o MetaDriver como fonte principal dos cálculos;
- não corrigir resultados manualmente fora do aplicativo;
- registrar erros e travamentos;
- registrar recomendações de R$/hora ignoradas e o motivo;
- comparar pausas sugeridas com pausas realizadas;
- comparar hora bruta projetada com o resultado final;
- registrar momentos em que a interface atrapalhou o trabalho;
- revisar o lucro real estimado ao encerrar.

O criador conhece a estratégia e pode compensar inconscientemente falhas da
interface. Por isso, a etapa seguinte deve obrigatoriamente incluir um
motorista externo.

## Teste de carga posterior

O teste de carga não bloqueia o autoexperimento. Antes de ampliar a divulgação,
executar patamares de:

- 10 usuários simultâneos;
- 25 usuários simultâneos;
- 50 usuários simultâneos;
- 80 usuários simultâneos.

Cada etapa deve durar 10 minutos. O pico de 80 usuários deve durar 20 minutos.

Jornada automatizada:

1. entrar;
2. abrir o painel;
3. consultar histórico;
4. criar lançamento;
5. alterar configurações;
6. consultar insights;
7. excluir lançamento.

Critérios:

- 95% das leituras em até 1 segundo;
- 95% das gravações em até 1,5 segundo;
- interface utilizável em até 2,5 segundos;
- menos de 1% de erros;
- nenhuma perda, duplicação ou corrupção de dados;
- recuperação normal após o pico, sem reinicialização manual.

## Pendências antes da implementação

As seguintes decisões ainda precisam ser modeladas tecnicamente:

1. fórmula definitiva de rateio dos custos fixos no lucro real;
2. migração do modelo atual de registros para jornadas e pausas;
3. comportamento de jornadas que atravessam a meia-noite;
4. tratamento de perda de conexão durante pausa ou encerramento;
5. restauração de uma jornada ativa após fechar ou recarregar o aplicativo;
6. separação efetiva de funcionalidades Free e Pro;
7. critérios para corrigir ou excluir uma jornada encerrada;
8. revisão da autenticação e remoção do segredo JWT padrão.
