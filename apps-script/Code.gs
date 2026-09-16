/**
 * Controle Financeiro Pessoal — Apps Script "backend" gratuito.
 *
 * Como usar:
 * 1. Abra sua planilha Google Sheets.
 * 2. Extensões > Apps Script.
 * 3. Apague o conteúdo padrão e cole este arquivo inteiro.
 * 4. Troque o valor de TOKEN abaixo por uma senha só sua.
 * 5. Salve, depois Implantar > Nova implantação > tipo "App da Web".
 *    - Executar como: Eu
 *    - Quem pode acessar: Qualquer pessoa
 * 6. Copie a URL do app da web gerada — é essa URL + o TOKEN que vão no app (tela de Config).
 *
 * A planilha precisa ter exatamente estas 4 abas, com o cabeçalho na linha 1:
 *   Gastos:         Data | Categoria | Descrição | Valor | Forma de Pagamento
 *   Receitas:       Data | Fonte | Descrição | Valor
 *   Investimentos:  Data | Tipo | Corretora | Valor Aportado | Valor Atual
 *   Metas:          Categoria | Meta Mensal
 */

var TOKEN = 'TROQUE-ESTE-TOKEN';

var SHEET_NAMES = {
  gasto: 'Gastos',
  receita: 'Receitas',
  investimento: 'Investimentos',
  meta: 'Metas'
};

var ROW_BUILDERS = {
  gasto: function (d) {
    return [d.data, d.categoria, d.descricao, Number(d.valor), d.formaPagamento];
  },
  receita: function (d) {
    return [d.data, d.fonte, d.descricao, Number(d.valor)];
  },
  investimento: function (d) {
    return [d.data, d.tipo, d.corretora, Number(d.valorAportado), Number(d.valorAtual)];
  },
  meta: function (d) {
    return [d.categoria, Number(d.metaMensal)];
  }
};

function doGet(e) {
  try {
    if (!e || e.parameter.token !== TOKEN) {
      return jsonOutput({ ok: false, error: 'token inválido' });
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    return jsonOutput({
      ok: true,
      gastos: sheetToObjects(ss.getSheetByName('Gastos')),
      receitas: sheetToObjects(ss.getSheetByName('Receitas')),
      investimentos: sheetToObjects(ss.getSheetByName('Investimentos')),
      metas: sheetToObjects(ss.getSheetByName('Metas')),
      saldos: sheetToObjects(ss.getSheetByName('Saldos'))
    });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.token !== TOKEN) {
      return jsonOutput({ ok: false, error: 'token inválido' });
    }
    var sheetName = SHEET_NAMES[body.type];
    if (!sheetName) {
      return jsonOutput({ ok: false, error: 'type inválido: ' + body.type });
    }
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      return jsonOutput({ ok: false, error: 'aba não encontrada: ' + sheetName });
    }
    var action = body.action || 'create';
    if (action === 'create') {
      var buildRow = ROW_BUILDERS[body.type];
      if (!buildRow) {
        return jsonOutput({ ok: false, error: 'type inválido: ' + body.type });
      }
      sheet.appendRow(buildRow(body.data));
      return jsonOutput({ ok: true, row: sheet.getLastRow() });
    } else if (action === 'update') {
      var buildRow2 = ROW_BUILDERS[body.type];
      if (!buildRow2) {
        return jsonOutput({ ok: false, error: 'type inválido: ' + body.type });
      }
      var row = Number(body.row);
      if (!row || row < 2) {
        return jsonOutput({ ok: false, error: 'linha inválida' });
      }
      var values = buildRow2(body.data);
      sheet.getRange(row, 1, 1, values.length).setValues([values]);
    } else if (action === 'delete') {
      var rowDel = Number(body.row);
      if (!rowDel || rowDel < 2) {
        return jsonOutput({ ok: false, error: 'linha inválida' });
      }
      sheet.deleteRow(rowDel);
    } else {
      return jsonOutput({ ok: false, error: 'action inválida: ' + action });
    }
    return jsonOutput({ ok: true });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
}

function sheetToObjects(sheet) {
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var rows = values.slice(1);
  return rows
    .filter(function (row) {
      return row.some(function (cell) { return cell !== '' && cell !== null; });
    })
    .map(function (row) {
      var obj = {};
      headers.forEach(function (h, i) {
        var key = String(h).trim();
        var val = row[i];
        if (Object.prototype.toString.call(val) === '[object Date]') {
          val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }
        obj[key] = val;
      });
      return obj;
    });
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
