# Olho de Hórus

Protótipo local para acompanhar a recuperação pós-missão de astronautas. A aplicação combina uma interface web em português, API Express, banco SQLite e uma versão desktop Windows com Electron. Use somente dados fictícios. Este protótipo não foi validado clinicamente, para uso operacional ou para conformidade regulatória.

## Requisitos

- Windows 10/11 de 64 bits para os pacotes desktop.
- Node.js 24.16 ou mais recente e npm. Use a linha LTS 24 para manter compatibilidade com o módulo SQLite nativo.
- Internet durante a instalação inicial das dependências; a execução do aplicativo empacotado é local.

## Instalar e executar

No PowerShell, na pasta do projeto:

```powershell
npm ci
npm run dev
```

`npm run dev` inicia a API local e abre o aplicativo Electron. Para executar somente no navegador:

```powershell
npm start
```

Depois, abra <http://127.0.0.1:4317>. O atalho `serve.ps1` faz a mesma verificação de pré-requisitos e inicia o servidor web; ele não baixa dependências automaticamente.

Depois de instalar Node.js e executar `npm ci`, também é possível dar duplo clique em `iniciar-site.bat`. Ele verifica Node/npm e dependências, inicia somente o servidor web, espera a API ficar pronta e então abre o navegador. Se a porta 4317 estiver ocupada por outro processo, ele avisa e não encerra esse processo.

Para abrir a versão de desenvolvimento Electron, use `iniciar-aplicativo.bat`. Em instalações sem binário pré-compilado para a versão do Electron, o rebuild de `better-sqlite3` requer Python e as ferramentas C++ do Visual Studio Build Tools. O script `npm run desktop:rebuild` faz esse passo explicitamente.

## Testes e pacotes Windows

```powershell
npm test
npm run dist:win
```

O build Windows prepara um instalador NSIS por usuário e um executável portátil x64 na pasta `release/`. O banco fica no diretório de dados do usuário do aplicativo, separado dos arquivos instalados. O backup e a restauração JSON estão na área Configurações, disponíveis para administradores.

## Publicação gratuita com Render Free e Neon

O aplicativo web depende da API Express e do PostgreSQL; não é um site estático. O Blueprint render.yaml configura somente um serviço web no plano Free, sem disco persistente, e gera APP_SESSION_SECRET e OH_SETUP_TOKEN. A persistência é feita pelo PostgreSQL gerenciado no projeto Neon olho-de-horus; a aplicação executa as migrações de server/migrations ao iniciar.

Ao criar o serviço Blueprint no Render, forneça DATABASE_URL diretamente no formulário seguro de variáveis do serviço com a URL PostgreSQL pooled (com -pooler) copiada no console Neon. Não coloque essa URL em arquivos, commits, issues ou mensagens. Mantenha APP_SESSION_SECRET e OH_SETUP_TOKEN como valores secretos gerados pelo Render. Confira o plano Free antes de confirmar; o Blueprint não provisiona disco nem serviço pago.

Após o primeiro deploy, abra o endereço HTTPS do Render e faça a configuração inicial do administrador usando OH_SETUP_TOKEN, disponível apenas na tela de variáveis do serviço. Guarde o token em um gerenciador de senhas e remova ou rotacione-o depois de criar a primeira conta, se desejar. O banco Neon começa vazio; o aplicativo não importa dados do SQLite local automaticamente.

O plano gratuito pode suspender o serviço web após inatividade, causando demora na primeira abertura. Os dados salvos no Neon permanecem fora do sistema de arquivos temporário do Render, sujeitos aos limites e políticas atuais do plano Neon. Esta é apenas uma publicação de protótipo com dados fictícios; não use informações pessoais ou clínicas reais.

Depois que o repositório privado estiver conectado, alterações em main podem ser publicadas automaticamente após os checks do GitHub.
## Funcionalidades desta versão

- Configuração inicial do administrador, login, logout e perfis de acesso (administrador, médico, fisioterapeuta, psicólogo e nutricionista).
- Cadastro, edição, pesquisa e remoção de astronautas.
- Dashboard alimentado por registros gravados; não há medições fictícias pré-carregadas.
- Avaliações e medições seriadas, filtros e gráficos; planos e sessões de reabilitação.
- Acompanhamento psicológico restrito ao perfil psicológico e administrador.
- Registros de sono e alimentação, consultas e alertas configuráveis.
- Exportação CSV, backup e restauração JSON, e trilha de auditoria de operações (sem copiar conteúdo clínico para a trilha).
- Persistência SQLite local e desktop; no modo web local fica em %LOCALAPPDATA%\OlhoDeHorus\data\olho-de-horus.sqlite. Na publicação web, a API usa PostgreSQL Neon via DATABASE_URL.
- A interface usa `assets/images/olho-de-horus-logo-transparent.png`; a imagem original está preservada em `assets/images/olho-de-horus-logo-original.png`.

## Segurança e limites

As senhas são armazenadas com scrypt; sessões usam SQLite localmente e PostgreSQL na publicação web. As permissões são aplicadas na API. Em produção, o servidor exige segredos persistentes, token para configuração do primeiro administrador, cookie Secure e configuração explícita de proxy confiável. Isso é uma base de protótipo, não uma avaliação de segurança para dados de saúde: não use informações pessoais ou clínicas reais. Não há validação clínica, sincronização multi-instância, integração com dispositivos, revisão independente de segurança ou política de retenção de dados. Regras e limites de alerta precisam de revisão profissional; os alertas são informativos e não constituem diagnóstico nem recomendação.

No modo web local, faça cópia do arquivo SQLite com o servidor parado ou use o backup da aplicação. Na publicação web, exporte o backup JSON da área Configurações e faça cópias do banco Neon conforme os recursos do plano. No modo desktop, o banco reside na pasta de dados de usuário do Electron. A desinstalação pode preservar esses dados; exporte backup antes de remover a pasta manualmente.

## Próximas etapas antes de qualquer uso operacional

1. Instalar Node.js 24.16+ e dependências neste Windows, executar os testes automatizados e corrigir quaisquer falhas.
2. Revisar e executar testes de autorização para todos os perfis, validação de entradas, restauração de backup e comportamento com arquivos corrompidos.
3. Fazer revisão independente de segurança, privacidade, auditoria, controle de sessão, criptografia e recuperação de desastre.
4. Validar com profissionais habilitados todos os campos, cálculos, unidades, regras e fluxos clínicos; manter os alertas como não diagnósticos até validação formal.
5. Planejar importação, interoperabilidade, acessibilidade, telemetria opt-in e operação multiusuário apenas após definir arquitetura e requisitos regulatórios.

## Arquivos principais

- `index.html`, `styles.css`, `src/app.js`: interface e navegação.
- `src/Logo.js` e `assets/images/olho-de-horus-logo-transparent.png`: logo transparente centralizada no componente reutilizável; original preservada em `assets/images/olho-de-horus-logo-original.png`.
- `server/index.cjs`, `server/database.cjs`, `server/database-postgres.cjs`, `server/migrations/001-initial.sql`: API, controle de acesso, SQLite local e adaptador/migração PostgreSQL.
- `desktop/main.cjs`, `desktop/preload.cjs`: inicialização e janela Electron.
- `tests/app.test.cjs`: testes integrados da API e persistência.
- `render.yaml`: Publicação no Render Free com Neon PostgreSQL, segredos gerados e verificação de saúde.
- `.github/workflows/ci.yml`: testes, build web e pacote Windows antes de deploy.
- `vite.config.js`, `electron-builder.yml`, `package.json`, `package-lock.json`: dependências, build web e pacotes desktop.
