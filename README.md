# Controle Financeiro Pessoal

App simples (site web, mobile-friendly) para registrar gastos, receitas e investimentos, salvando tudo direto numa planilha Google Sheets gratuita. Sem backend, sem servidor pago — a própria planilha vira a "API" através de um Google Apps Script.

Cada pessoa que usar tem a **sua própria planilha e o seu próprio site**, totalmente separados dos de qualquer outra pessoa. Nenhum dado é compartilhado entre quem usa este projeto.

## Como usar (passo a passo)

Leva uns 10 minutos, só precisa de uma conta Google. Siga na ordem.

### Passo 1 — Copiar a planilha-modelo

1. Abra o link da planilha-modelo: **[Copiar planilha-modelo](https://docs.google.com/spreadsheets/d/1d6SJBw37hyhvxOlmpsk0ua9jdLEQnyLq304uEYzR-H8/copy)**
2. Clique em **"Fazer uma cópia"**. Isso cria, na sua própria conta Google, uma planilha com as abas certas (Gastos, Receitas, Investimentos, Metas, Saldos) já prontas — e o script (Apps Script) já vem colado junto.
3. Dá pra renomear a planilha como quiser depois.

### Passo 2 — Publicar o Apps Script (na sua cópia)

1. Na sua planilha (a cópia que você acabou de criar): **Extensões > Apps Script**.
2. Vai abrir o editor já com o código colado. Troque a linha `var TOKEN = 'TROQUE-ESTE-TOKEN';` por uma senha sua — qualquer string difícil de adivinhar, ex: `minha-senha-secreta-123`.
3. Salve (ícone de disquete ou `Ctrl+S`).
4. Clique em **Implantar > Nova implantação**:
   - Tipo: clique no ícone de engrenagem e escolha **App da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
5. Clique em **Implantar**. Na primeira vez, o Google vai pedir autorização — é ele avisando que o script vai poder ler/escrever na sua própria planilha. Autorize (é a sua conta acessando o seu próprio dado).
6. Copie a **URL do app da Web** gerada — algo como `https://script.google.com/macros/s/AKfycb.../exec`. Guarde ela junto com o token do passo 2 — vai precisar dos dois no Passo 4.

> Sempre que você editar o `Code.gs` depois, precisa fazer **Implantar > Gerenciar implantações > editar (ícone de lápis) > Nova versão > Implantar** para as mudanças valerem.

### Passo 3 — Publicar o site

Clique no botão abaixo para publicar sua própria cópia do site na Vercel (grátis). Ele já cria uma cópia deste repositório na sua conta do GitHub e publica automaticamente:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frikhelmyxd%2Fcontrole-financeiro&root-directory=webapp&project-name=controle-financeiro&repository-name=controle-financeiro)

1. Faça login com sua conta do GitHub (ou crie uma, é grátis).
2. A Vercel vai pedir pra criar o repositório — pode deixar o nome sugerido e confirmar.
3. Clique em **Deploy**. Em ~1 minuto o site estará no ar, numa URL tipo `https://controle-financeiro-xxxx.vercel.app`.

### Passo 4 — Conectar o app à sua planilha

1. Abra a URL do seu site (gerada no Passo 3) no celular ou computador.
2. Toque no ícone de **engrenagem (⚙)** no topo.
3. Cole a **URL do Apps Script** e o **token** que você definiu no Passo 2.
4. Salvar. Pronto — os formulários de Gasto, Receita, Investimento e Metas agora gravam direto na sua planilha, e o Dashboard lê os dados de lá.

No celular, use o menu do navegador → **"Adicionar à tela inicial"** (ou o app vai sugerir instalar) pra abrir como se fosse um app de verdade, sem barra de navegador.

Sem configurar nada, o site funciona em **modo demonstração** com dados de exemplo, só pra dar uma olhada em como fica o dashboard.

## Estrutura do projeto

```
controle-financeiro/
  apps-script/Code.gs   # o mesmo codigo que ja vem colado na planilha-modelo
  webapp/                # o site (index.html, style.css, app.js, manifest.json, icons/)
  README.md
```

## Atualizando depois de editar o código

Se você mexer no `webapp/` localmente e quiser publicar de novo:
```bash
cd webapp
vercel --prod
```
(a Vercel também redeploya automaticamente sempre que você der push numa alteração pro seu repositório no GitHub, se preferir esse fluxo)
