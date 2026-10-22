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

## Publicação pública

A aplicação web depende da API Express e do SQLite; não é um site estático. A publicação ainda não foi concluída e não há URL pública.

O Blueprint anterior de Render selecionava um serviço pago e disco persistente. Para evitar cobrança acidental, ele foi arquivado localmente como `render-paid.example.yaml`, fora do nome automático `render.yaml`, e não deve ser sincronizado. O plano gratuito do Render não oferece disco persistente: o SQLite local pode ser perdido após suspensão por inatividade, reinicialização ou novo deploy. Uma implantação gratuita com o SQLite local serve apenas para demonstração com dados fictícios, sem garantia de persistência.

Para publicar sem custo recorrente e preservar registros, é necessário adaptar a persistência e as sessões para um banco PostgreSQL gratuito e então conectar o serviço ao Render. Essa migração e a conexão do Render ainda não foram concluídas. Não use dados pessoais ou de saúde reais.
## Funcionalidades desta versão

- Configuração inicial do administrador, login, logout e perfis de acesso (administrador, médico, fisioterapeuta, psicólogo e nutricionista).
- Cadastro, edição, pesquisa e remoção de astronautas.
- Dashboard alimentado por registros gravados; não há medições fictícias pré-carregadas.
- Avaliações e medições seriadas, filtros e gráficos; planos e sessões de reabilitação.
- Acompanhamento psicológico restrito ao perfil psicológico e administrador.
- Registros de sono e alimentação, consultas e alertas configuráveis.
- Exportação CSV, backup e restauração JSON, e trilha de auditoria de operações (sem copiar conteúdo clínico para a trilha).
- Persistência SQLite; no modo web local fica em `%LOCALAPPDATA%\OlhoDeHorus\data\olho-de-horus.sqlite`, e no Render o Blueprint aponta para o disco persistente.
- A interface usa `assets/images/olho-de-horus-logo-transparent.png`; a imagem original está preservada em `assets/images/olho-de-horus-logo-original.png`.

## Segurança e limites

As senhas são armazenadas com scrypt e sessões são mantidas no SQLite. As permissões são aplicadas na API. Em produção, o servidor exige segredos persistentes, token para configuração do primeiro administrador, cookie Secure e configuração explícita de proxy confiável. Isso é uma base de protótipo, não uma avaliação de segurança para dados de saúde: não use informações pessoais ou clínicas reais. Não há validação clínica, sincronização multi-instância, integração com dispositivos, revisão independente de segurança ou política de retenção de dados. Regras e limites de alerta precisam de revisão profissional; os alertas são informativos e não constituem diagnóstico nem recomendação.

No modo web, faça cópia do arquivo SQLite com o servidor parado ou use o backup da aplicação. No modo desktop, o banco reside na pasta de dados de usuário do Electron. A desinstalação pode preservar esses dados; exporte backup antes de remover a pasta manualmente.

## Próximas etapas antes de qualquer uso operacional

1. Instalar Node.js 24.16+ e dependências neste Windows, executar os testes automatizados e corrigir quaisquer falhas.
2. Revisar e executar testes de autorização para todos os perfis, validação de entradas, restauração de backup e comportamento com arquivos corrompidos.
3. Fazer revisão independente de segurança, privacidade, auditoria, controle de sessão, criptografia e recuperação de desastre.
4. Validar com profissionais habilitados todos os campos, cálculos, unidades, regras e fluxos clínicos; manter os alertas como não diagnósticos até validação formal.
5. Planejar importação, interoperabilidade, acessibilidade, telemetria opt-in e operação multiusuário apenas após definir arquitetura e requisitos regulatórios.

## Arquivos principais

- `index.html`, `styles.css`, `src/app.js`: interface e navegação.
- `src/Logo.js` e `assets/images/olho-de-horus-logo-transparent.png`: logo transparente centralizada no componente reutilizável; original preservada em `assets/images/olho-de-horus-logo-original.png`.
- `server/index.cjs`, `server/database.cjs`: API local, autorização, SQLite e migrações.
- `desktop/main.cjs`, `desktop/preload.cjs`: inicialização e janela Electron.
- `tests/app.test.cjs`: testes integrados da API e persistência.
- `render.yaml`: implantação Render com SQLite persistente, segredos gerados e health check.
- `.github/workflows/ci.yml`: testes, build web e pacote Windows antes de deploy.
- `vite.config.js`, `electron-builder.yml`, `package.json`, `package-lock.json`: dependências, build web e pacotes desktop.
