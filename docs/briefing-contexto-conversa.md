# Briefing mestre — contexto da conversa sobre o MetaDriver

Última atualização: 23 de julho de 2026.

Este documento preserva o contexto, as decisões e as hipóteses discutidas
durante a evolução do MetaDriver. Ele deve servir como ponto de partida para
novas implementações, testes e revisões do produto.

## 1. Resumo executivo

O MetaDriver é uma aplicação web para motoristas de aplicativo acompanharem a
jornada, compreenderem quanto estão faturando por hora e verificarem se o
trabalho está produzindo lucro ou despesa.

O problema central é que muitos motoristas trabalham “no escuro”: não
contabilizam corretamente o tempo, os custos e o faturamento e, em alguns
casos, acabam pagando para trabalhar.

O diferencial do produto é usar a **hora bruta real da jornada** como indicador
central. Esse cálculo inclui tanto as corridas quanto o tempo parado aguardando
novas chamadas. Somente pausas declaradas pelo motorista são retiradas do
tempo trabalhado.

O produto ainda não foi divulgado publicamente. Há apenas um usuário real, o
próprio criador, que será o primeiro piloto. A prioridade atual não é cobrança
nem crescimento: é tornar o núcleo completamente funcional, validar os
cálculos em jornadas reais e avaliar o desempenho da infraestrutura.

## 2. Criador e conhecimento de domínio

O criador trabalha como motorista de aplicativo em João Pessoa e desenvolve o
projeto com base em aproximadamente um ano de coleta e aplicação prática das
próprias métricas.

Segundo seu relato, a estratégia baseada em hora bruta produziu um resultado
aproximadamente 30% melhor no último ano.

O conhecimento do produto nasce da rotina real de motorista. Ainda assim,
algumas observações podem ser específicas de João Pessoa ou do modo de trabalho
do criador. Regras sem evidência suficiente para outros motoristas devem ser
identificadas como regionais, experimentais ou pessoais, e não apresentadas
como universais.

## 3. Público, aquisição e metas

### Público inicial

- Motoristas de aplicativo;
- região inicial: João Pessoa, Paraíba;
- uso prioritariamente em dispositivos móveis;
- uso rápido entre corridas e durante a jornada.

### Aquisição prevista

- WhatsApp;
- indicação e boca a boca;
- alcance inicial estimado em aproximadamente 300 contatos.

### Meta futura

- alcançar pelo menos 100 cadastros;
- considerar um pico de até 80 usuários simultâneos;
- maior concentração de uso entre 07:00 e 19:00;
- os usuários devem poder utilizar todas as funções disponíveis no teste.

Essa meta é de validação de capacidade, não uma previsão garantida de tráfego.

### Sequência de validação acordada

1. O criador usa o produto em jornadas reais durante sete dias.
2. Completa pelo menos cinco jornadas usando o MetaDriver como fonte principal.
3. Corrige erros e inconsistências descobertos.
4. Testa com um segundo motorista que não participou do desenvolvimento.
5. Amplia o piloto para aproximadamente 20 motoristas.
6. Somente depois busca os 100 cadastros.

## 4. Estado comercial

Foi discutido o seguinte modelo futuro:

- cadastro concede automaticamente um mês gratuito da versão Pro;
- depois do período gratuito, o Pro custará R$ 10 por mês;
- sem pagamento, a conta retorna à versão Básica/Free;
- a versão básica mantém apenas o painel simples.

Esses mecanismos ainda não são prioridade e não devem bloquear o piloto:

- assinatura;
- cobrança;
- expiração automática do teste;
- diferenciação completa das permissões Free e Pro.

## 5. Posicionamento do produto

O MetaDriver deve funcionar como um copiloto prático de jornada: informa quanto
o tempo está rendendo agora e ajuda o motorista a decidir quando continuar,
pausar ou encerrar.

Personalidade desejada:

- prática;
- confiável;
- direta;
- baseada em experiência real;
- sem promessas exageradas;
- sem tratar estimativas como certezas.

A organização da interface pode se inspirar na clareza do Gigu, mas deve manter
a identidade visual própria do MetaDriver.

## 6. Métrica principal: hora bruta

A hora bruta é o centro da estratégia e deve ter maior destaque no painel.

```text
Hora bruta =
  faturamento bruto acumulado
  / tempo efetivamente trabalhado
```

O tempo efetivamente trabalhado:

- começa ao iniciar a jornada;
- inclui o tempo das corridas;
- inclui espera, embarque, desembarque e tempo parado entre corridas;
- continua avançando mesmo sem novos lançamentos;
- exclui somente pausas iniciadas explicitamente;
- termina ao encerrar a jornada.

O motivo para não depender somente da duração informada pelas plataformas é que
elas geralmente contabilizam apenas o intervalo entre embarque e desembarque,
ignorando espera pelo passageiro, desembarque, trânsito inesperado e outros
tempos reais de trabalho.

Não se deve avaliar uma corrida apenas por distância. Uma corrida curta em via
ruim pode render menos por hora do que uma corrida longa em via livre.

## 7. Estratégia da referência mínima de corrida

### Objetivo pessoal de operação

O objetivo base é manter aproximadamente R$ 30 por hora de trabalho. Para
compensar tempos não contabilizados pelas plataformas, usa-se uma margem de
segurança de R$ 5 por hora.

Antes do primeiro ganho:

```text
Referência normal = R$ 35/h
```

Depois de existir faturamento:

```text
Referência normal = min(hora bruta atual + R$ 5, R$ 35)
```

Exemplos acordados:

| Hora bruta atual | Referência normal |
| --- | --- |
| R$ 20/h | R$ 25/h ou mais |
| R$ 25/h | R$ 30/h ou mais |
| R$ 29/h | R$ 34/h ou mais |
| R$ 30/h | R$ 35/h ou mais |
| R$ 34/h | R$ 35/h ou mais |
| R$ 36/h | R$ 35/h ou mais |
| R$ 40/h | R$ 35/h ou mais |

Se a hora atual estiver abaixo de R$ 30, a referência acompanha a hora atual
mais a margem de R$ 5. Ao alcançar ou superar a faixa desejada, mantém-se a
referência normal em R$ 35/h para otimizar o tempo.

Não se deve interpretar a referência como exigência de uma corrida com uma hora
de duração. Ela é uma taxa equivalente usada para comparar ofertas.

### Adicionais

```text
Referência final =
  referência normal
  + R$ 5 em horário de pico
  + R$ 5 quando estiver chovendo
```

Horários de pico definidos para a primeira versão:

- 07:00–08:30;
- 12:00–13:30;
- 17:00–19:00.

O mesmo padrão será inicialmente mantido em dias úteis, sábados, domingos e
feriados até haver dados suficientes para regras mais específicas.

## 8. Modo Chovendo

- Acionamento manual por botão;
- começa desligado;
- adiciona R$ 5/h à referência;
- estado deve ficar claramente visível;
- desliga automaticamente ao encerrar a jornada;
- não haverá integração meteorológica no piloto.

## 9. Jornada de trabalho

### Iniciar

- Uma nova jornada usa automaticamente a hora atual;
- o horário inicial pode ser corrigido manualmente;
- valores da nova jornada começam zerados;
- modo Chovendo começa desligado;
- referência começa em R$ 35/h;
- só pode existir uma jornada ativa por vez.

### Tempo entre corridas

Todo o tempo parado entre corridas conta como trabalho. O cronômetro só deixa de
contar durante uma pausa explícita ou após o encerramento da jornada.

### Pausar

A pausa cobre almoço, banheiro, descanso e outras interrupções que o motorista
não considera tempo de trabalho.

- Oferecer 15, 30, 45 e 60 minutos;
- permitir duração personalizada;
- mostrar contagem regressiva apenas como estimativa;
- não retomar automaticamente quando o tempo estimado terminar;
- exigir a ação manual **Retomar jornada**;
- excluir do cálculo o tempo realmente pausado, não apenas o estimado.

### Encerrar

O antigo conceito de “Reiniciar” foi substituído por **Encerrar jornada**.

Ao encerrar:

1. pedir confirmação;
2. congelar os cálculos;
3. finalizar eventual pausa;
4. salvar automaticamente;
5. desligar o modo Chovendo;
6. liberar o início de outra jornada.

### Várias jornadas no mesmo dia

- Permitir várias jornadas;
- não limitar arbitrariamente a quantidade;
- não sobrescrever jornadas anteriores;
- intervalos entre jornadas não entram no tempo trabalhado;
- consolidar as jornadas no resumo diário.

```text
Hora bruta diária =
  faturamento bruto de todas as jornadas
  / soma do tempo efetivamente trabalhado
```

## 10. Metas e conceitos financeiros

A meta da jornada é sempre de **faturamento bruto**, tanto no Free quanto no
Pro. Custos e lucro ajudam no diagnóstico, mas não mudam o critério de conclusão
da meta.

### Free

```text
Saldo após combustível =
  faturamento bruto
  - combustível
```

Não chamar esse valor de lucro líquido.

### Pro

```text
Lucro real estimado =
  faturamento bruto
  - combustível
  - outras despesas variáveis
  - parcela dos custos fixos
```

O cálculo deve ser coerente em cabeçalho, cartões, gráficos, histórico e
resumos. A versão Pro deve aprofundar os custos mensais e fornecer cálculos que
ajudem o motorista a melhorar os ganhos.

## 11. Aplicativos e lançamentos

Os ganhos durante a jornada devem ser separados por:

- Uber;
- 99Pop;
- inDrive;
- Extra.

O botão do inDrive deve aparecer abaixo do 99Pop, na direção visual denominada
“B” durante a conversa. Cada opção deve usar um ícone reconhecível, preservando
a identidade visual da aplicação.

## 12. Sugestões de pausa

As sugestões devem ser discretas, persistentes e não bloqueantes:

- sem modal;
- sem alerta repetitivo;
- sem botão “Lembrar depois”;
- com ação **Iniciar pausa**.

Elas aparecem dez minutos antes do horário fraco e permanecem até dez minutos
antes do final, evitando que uma corrida em andamento faça o motorista perder a
informação.

### Segunda a sexta

| Horário fraco | Janela da sugestão |
| --- | --- |
| 10:00–11:00 | 09:50–10:50 |
| 14:00–15:00 | 13:50–14:50 |
| 20:00–21:00 | 19:50–20:50 |

### Sábado e domingo

| Horário fraco | Janela da sugestão |
| --- | --- |
| 09:00–10:00 | 08:50–09:50 |

Ao aceitar a sugestão, a duração inicial deve ser o tempo restante da janela,
mas o motorista pode editá-la. A retomada continua manual.

## 13. Horário morto regional

Em João Pessoa, foi registrada como hipótese operacional a faixa de 00:00 às
05:00 de domingo a quinta-feira. Nesse período, o produto deve alertar que
normalmente não vale a pena trabalhar e incluir uma ação pertinente.

Sexta-feira e sábado não usam essa regra.

Essa é uma observação regional e deve ser validada antes de ser aplicada a
outras cidades.

## 14. Métricas geográficas que ficaram fora do escopo

Foram discutidas observações sobre centro, Zona Sul e deslocamentos ao longo do
dia, incluindo:

- 07:00–08:30: evitar ao máximo o centro e priorizar corridas curtas na Zona
  Sul;
- 08:30–12:00: manter-se preferencialmente na Zona Sul;
- 12:00–19:00: considerar movimento em toda a cidade.

Foi decidido **não implementar essas regras agora**, pois são métricas pessoais
sem validação suficiente em outros motoristas.

## 15. Dados mínimos por jornada

- Data;
- hora inicial e final;
- duração bruta;
- duração total das pausas;
- tempo efetivamente trabalhado;
- faturamento bruto;
- ganhos por Uber, 99Pop, inDrive e Extra;
- quilômetros;
- combustível;
- outras despesas;
- hora bruta;
- saldo após combustível;
- lucro real estimado, quando aplicável;
- meta bruta;
- indicação de meta atingida.

## 16. Interface e experiência

- Mobile-first;
- consultas rápidas durante o trabalho;
- hora bruta compreensível em poucos segundos;
- poucos toques nas ações mais frequentes;
- alvos de toque com pelo menos 44 px;
- bom contraste e foco visível;
- textos legíveis em telas pequenas;
- estados inequívocos para jornada, pausa e chuva;
- manter a identidade visual atual;
- usar a organização do Gigu apenas como referência de clareza.

A campanha “Ajude a criar o app oficial” foi removida completamente, incluindo
modal, assinatura, QR code e código associado que ficou sem uso.

## 17. Infraestrutura e desempenho

O objetivo do teste de desempenho é descobrir se a aplicação suporta:

- 100 usuários cadastrados;
- pico de aproximadamente 80 usuários simultâneos;
- uso concentrado entre 07:00 e 19:00;
- utilização de todas as funções.

O produto já foi descrito como estando em produção no Supabase e conectado por
ORM. Porém, a inspeção do repositório durante a conversa identificou
Next.js 14, React, TypeScript, Drizzle ORM e dependências de Neon/PostgreSQL.

Essa divergência precisa ser verificada antes do teste de carga:

- confirmar qual banco atende a produção atual;
- confirmar se Supabase é o banco, apenas um serviço complementar ou uma
  configuração ainda não refletida no repositório local;
- identificar limites do plano e quantidade de conexões;
- definir cenários realistas de leitura e escrita;
- medir latência, erros, CPU, memória e conexões durante o pico.

O repositório informado é:

```text
https://github.com/Bobpunk/MetaDriver
```

Ele foi tornado público durante a conversa.

## 18. Estado da implementação durante esta conversa

Foram iniciadas mudanças para:

- controle de jornada;
- múltiplas jornadas;
- pausa e retomada;
- modo Chovendo;
- referência dinâmica por hora;
- horários de pico;
- sugestões de pausa;
- alerta de horário morto;
- lançamentos separados por aplicativo;
- inclusão do inDrive;
- uso de ícones;
- remoção completa da campanha de apoio;
- testes das regras centrais.

Como o repositório possui alterações locais ainda não publicadas, esta lista
representa o trabalho realizado na conversa, mas cada item deve ser validado em
teste manual antes de ser tratado como pronto para produção.

## 19. Correção recente do ambiente de desenvolvimento

O erro intermitente:

```text
GET /_next/static/css/app/layout.css?... 404
```

foi causado por duas instâncias de `next dev` executadas simultaneamente no
mesmo projeto. A segunda iniciou automaticamente na porta 3001, e ambas
passaram a escrever na mesma pasta `.next`.

O script foi alterado para:

```json
"dev": "next dev -p 3000"
```

Com a porta explícita, uma segunda execução falha com `EADDRINUSE` em vez de
iniciar outro servidor e corromper os artefatos da primeira instância.

Após a correção:

- página principal respondeu HTTP 200;
- `layout.css` respondeu HTTP 200;
- somente o servidor original permaneceu ativo na porta 3000.

## 20. Skills recomendadas e documentação

As recomendações foram preservadas em
`docs/skills-recomendadas.md`. As prioridades registradas são:

1. `tdd`;
2. `vercel-react-best-practices`;
3. `webapp-testing`;
4. `web-quality-audit`;
5. posteriormente, `improve-codebase-architecture`.

A skill `impeccable` já está disponível e foi considerada adequada para
revisões de interface, responsividade e acessibilidade.

Também foram registrados os seguintes alertas técnicos:

- revisar a autenticação e eliminar segredo JWT padrão em produção;
- documentar instalação, variáveis, migrações, arquitetura, testes e deploy;
- ampliar testes unitários e adicionar testes de ponta a ponta;
- auditar desempenho e acessibilidade.

## 21. Prioridades recomendadas a partir deste briefing

1. Validar manualmente todo o ciclo iniciar–lançar–pausar–retomar–encerrar.
2. Conferir os cálculos com jornadas reais do criador.
3. Garantir persistência correta e várias jornadas no mesmo dia.
4. Confirmar a infraestrutura real de produção: Supabase, Neon ou combinação.
5. Corrigir inconsistências encontradas no piloto de sete dias.
6. Executar teste de carga progressivo, sem começar diretamente com 80 usuários.
7. Testar com um segundo motorista.
8. Só então implementar teste Pro, cobrança e expansão para 100 cadastros.

## 22. Critério atual de sucesso

O núcleo estará validado quando o criador conseguir completar pelo menos cinco
jornadas reais em sete dias, sem depender de cálculos externos, e os valores de
tempo, hora bruta, faturamento, pausas e custos permanecerem coerentes durante
todo o ciclo.

