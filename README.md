# Controle Financeiro Pessoal

App simples (site web, mobile-friendly) para registrar gastos, receitas e investimentos, salvando tudo direto numa planilha Google Sheets gratuita. Sem backend, sem servidor pago — a própria planilha vira a "API" através de um Google Apps Script.

## Já está tudo pronto ✅

A planilha, o script e o site já estão no ar. A URL e o token do Apps Script (que dão acesso de leitura/escrita à planilha) **não ficam neste repositório** por segurança — estão guardados só localmente (fora do git). Configure o app com esses dados em **cada aparelho** (celular, tablet, PC) que for usar:

1. Abra o site (URL hospedada na Vercel).
2. Toque no ⚙️ no topo e cole a URL do Apps Script e o token.
3. Salvar. No celular, dá pra usar o menu do navegador > **"Adicionar à tela inicial"** pra abrir como se fosse um app de verdade.

Depois de configurado, fica salvo nesse navegador/aparelho — não precisa repetir.

O passo a passo abaixo é só referência, caso você precise recriar isso do zero um dia (ex: outra conta Google).

## 1. Criar a planilha

1. Crie uma planilha nova em [sheets.google.com](https://sheets.google.com).
2. Crie 4 abas com **esses nomes exatos** e o cabeçalho na linha 1:

   **Gastos**
   | Data | Categoria | Descrição | Valor | Forma de Pagamento |
   |---|---|---|---|---|

   **Receitas**
   | Data | Fonte | Descrição | Valor |
   |---|---|---|---|

   **Investimentos**
   | Data | Tipo | Corretora | Valor Aportado | Valor Atual |
   |---|---|---|---|---|

   **Metas**
   | Categoria | Meta Mensal |
   |---|---|

3. Na aba **Metas**, preencha suas categorias e o orçamento mensal de cada uma, ex:
   ```
   Moradia        1300
   Alimentação    600
   Transporte     300
   Lazer          200
   Saúde          200
   ```
   Essa lista também vira o menu de categorias no formulário de gastos do app.

## 2. Publicar o Apps Script

1. Na planilha: **Extensões > Apps Script**.
2. Apague o conteúdo do editor e cole o arquivo [`apps-script/Code.gs`](apps-script/Code.gs) deste projeto.
3. Troque a linha `var TOKEN = 'TROQUE-ESTE-TOKEN';` por uma senha sua (qualquer string difícil de adivinhar).
4. Salve (ícone de disquete).
5. **Implantar > Nova implantação**:
   - Tipo: **App da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
6. Autorize as permissões pedidas (é o próprio Google avisando que o script vai ler/escrever na sua planilha).
7. Copie a **URL do app da Web** gerada — algo como `https://script.google.com/macros/s/AKfycb.../exec`.

> Sempre que você editar o `Code.gs`, precisa fazer **Implantar > Gerenciar implantações > editar (lápis) > Nova versão** para as mudanças valerem na URL publicada.

## 3. Usar o app

1. Abra a URL hospedada (https://controle-financeiro-eta-nine.vercel.app) no celular ou computador — ou `webapp/index.html` local, se preferir.
2. Toque no ⚙️ no topo, cole a URL do app da Web e o token que você definiu no passo 2.3.
3. Pronto — os formulários de Gasto, Receita e Investimento agora gravam direto na sua planilha, e o Dashboard lê os dados de lá.

Sem configurar nada, o app funciona em **modo demonstração** com dados de exemplo, só pra você ver como fica o dashboard.

### Hospedagem

Já está hospedado de graça na Vercel (conta `riky-dev`). Pra atualizar depois de editar o site:
```bash
cd webapp
vercel --prod
```

## Estrutura

```
controle-financeiro/
  apps-script/Code.gs   # cole no editor de Apps Script da planilha
  webapp/                # site (index.html, style.css, app.js)
  README.md
```
