# Controle Financeiro Pessoal

App simples (site web, mobile-friendly) para registrar gastos, receitas e investimentos, salvando tudo direto numa planilha Google Sheets gratuita. Sem backend, sem servidor pago — a própria planilha vira a "API" através de um Google Apps Script.

Cada pessoa que usar tem a **sua própria planilha**, totalmente separada da de qualquer outra pessoa — os dados nunca se misturam. Todo mundo pode usar o mesmo site já publicado; o que muda é só a planilha que cada um conecta na tela de Configurações.

## Como usar (passo a passo)

Leva uns 5 minutos, só precisa de uma conta Google. Siga na ordem.

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
6. Copie a **URL do app da Web** gerada — algo como `https://script.google.com/macros/s/AKfycb.../exec`. Guarde ela junto com o token do passo 2 — vai precisar dos dois no próximo passo.

> Sempre que você editar o `Code.gs` depois, precisa fazer **Implantar > Gerenciar implantações > editar (ícone de lápis) > Nova versão > Implantar** para as mudanças valerem.

### Passo 3 — Conectar o app à sua planilha

1. Abra o site já publicado: **https://controle-financeiro-eta-nine.vercel.app**
2. Toque no ícone de **engrenagem (⚙)** no topo.
3. Cole a **URL do Apps Script** e o **token** que você definiu no Passo 2.
4. Salvar. Pronto — os formulários de Gasto, Receita, Investimento e Metas agora gravam direto na sua planilha, e o Dashboard lê os dados de lá.

Isso fica salvo só nesse navegador/aparelho — não afeta o que qualquer outra pessoa configurou. No celular, use o menu do navegador → **"Adicionar à tela inicial"** pra abrir como se fosse um app de verdade, sem barra de navegador.

Sem configurar nada, o site funciona em **modo demonstração** com dados de exemplo, só pra dar uma olhada em como fica o dashboard.

## Estrutura do projeto

```
controle-financeiro/
  apps-script/Code.gs   # o mesmo codigo que ja vem colado na planilha-modelo
  webapp/                # o site (index.html, style.css, app.js, manifest.json, icons/)
  README.md
```

## Atualizando o site depois de editar o código

```bash
cd webapp
vercel --prod
```
