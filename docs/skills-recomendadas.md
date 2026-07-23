# Skills recomendadas para o MetaDriver

Análise realizada em 23 de julho de 2026.

## Contexto do projeto

O MetaDriver é um SaaS construído com:

- Next.js 14;
- React e TypeScript;
- Neon/PostgreSQL;
- Drizzle ORM;
- autenticação própria com JWT;
- Vercel;
- Framer Motion e Recharts.

As principais lacunas encontradas foram:

- ausência de uma suíte de testes;
- ausência de testes de ponta a ponta;
- documentação inicial insuficiente;
- necessidade de uma revisão de segurança da autenticação;
- necessidade de auditorias contínuas de desempenho e acessibilidade.

## Skills prioritárias

### 1. tdd

Prioridade máxima. Orienta testes baseados em comportamento, definição de
interfaces testáveis e ciclos incrementais de desenvolvimento.

- Fonte: `mattpocock/skills`
- Adoção observada: aproximadamente 501 mil instalações
- Repositório: aproximadamente 183 mil estrelas
- Auditorias: Gen Agent Trust Hub, Socket e Snyk aprovadas
- Página: https://www.skills.sh/mattpocock/skills/tdd

```bash
npx skills add mattpocock/skills@tdd -g -y
```

### 2. vercel-react-best-practices

Regras oficiais da Vercel para desempenho e qualidade em React e Next.js.
Abrange waterfalls, renderização, tamanho do bundle e re-renderizações.

- Fonte: `vercel-labs/agent-skills`
- Adoção observada: aproximadamente 572 mil instalações
- Repositório: aproximadamente 29 mil estrelas
- Página: https://www.skills.sh/vercel-labs/agent-skills/react-best-practices

```bash
npx skills add vercel-labs/agent-skills@vercel-react-best-practices -g -y
```

### 3. webapp-testing

Automação com Playwright para validar fluxos como cadastro, login,
configurações, lançamentos diários e acesso Pro.

- Fonte: `anthropics/skills`
- Adoção observada: aproximadamente 120 mil instalações
- Repositório: aproximadamente 163 mil estrelas
- Auditorias: Gen Agent Trust Hub, Socket e Snyk aprovadas
- Página: https://www.skills.sh/anthropics/skills/webapp-testing

```bash
npx skills add anthropics/skills@webapp-testing -g -y
```

### 4. web-quality-audit

Auditoria baseada no Lighthouse para desempenho, acessibilidade, SEO e boas
práticas.

- Fonte: `addyosmani/web-quality-skills`
- Adoção observada: aproximadamente 17 mil instalações
- Repositório: aproximadamente 2,5 mil estrelas
- Auditorias: Gen Agent Trust Hub, Socket e Snyk aprovadas
- Página: https://www.skills.sh/addyosmani/web-quality-skills/web-quality-audit

```bash
npx skills add addyosmani/web-quality-skills@web-quality-audit -g -y
```

## Skill para uma etapa posterior

### improve-codebase-architecture

Pode ajudar quando o projeto crescer, identificando módulos acoplados,
interfaces frágeis e pontos difíceis de testar. Não é tão urgente quanto a
criação da base de testes.

- Fonte: `mattpocock/skills`
- Adoção observada: aproximadamente 522 mil instalações
- Repositório: aproximadamente 183 mil estrelas
- Auditorias: Gen Agent Trust Hub, Socket e Snyk aprovadas
- Página: https://www.skills.sh/mattpocock/skills/improve-codebase-architecture

```bash
npx skills add mattpocock/skills@improve-codebase-architecture -g -y
```

## Skill já disponível

`impeccable` já está instalada no ambiente. Ela cobre UI/UX, responsividade,
acessibilidade, hierarquia visual e refinamento de interfaces. Por isso, não é
necessário instalar outra skill genérica de frontend neste momento.

## Instalação inicial recomendada

Quando chegar o momento de aplicar as recomendações:

```bash
npx skills add mattpocock/skills@tdd -g -y
npx skills add vercel-labs/agent-skills@vercel-react-best-practices -g -y
npx skills add anthropics/skills@webapp-testing -g -y
npx skills add addyosmani/web-quality-skills@web-quality-audit -g -y
```

## Skills não recomendadas neste momento

As skills específicas para Neon, Drizzle e auditoria de autenticação
encontradas apresentavam pouca adoção ou repositórios abaixo do limiar de
confiança usado na análise. É preferível realizar essas revisões diretamente
ou criar uma skill interna adequada ao MetaDriver.

## Alertas do projeto

1. `src/lib/auth.ts` aceita o segredo padrão `fallback-dev-secret` quando
   `JWT_SECRET` não está configurado. Isso deve ser substituído por uma falha
   explícita de configuração antes de tratar o sistema como pronto para
   produção.
2. O `README.md` atual não documenta instalação, variáveis de ambiente,
   migrações, arquitetura, testes ou deploy.
3. O projeto não possui scripts nem dependências de testes no `package.json`.

