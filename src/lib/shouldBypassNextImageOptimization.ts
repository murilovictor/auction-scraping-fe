/**
 * Sufixos de hostname cujo fetch feito pelo otimizador `next/image` no servidor costuma
 * falhar (403 / bloqueio de datacenter), enquanto o navegador carrega a mesma URL.
 * Correspondência: host === entrada OU host termina com `.` + entrada (subdomínios).
 *
 * Inclui Caixa, bancos, portais e leiloeiros comuns em imóveis judiciais/extrajudiciais.
 * Para um host novo com o mesmo problema, acrescente o domínio base aqui.
 */
const HOST_SUFFIX_BYPASS: readonly string[] = [
  // Bancos / estatais
  "caixa.gov.br",
  "bb.com.br",
  "bancoob.com.br",
  "banrisul.com.br",
  "bradesco.com.br",
  "itau.com.br",
  "santander.com.br",
  "safra.com.br",
  // Portais e marketplaces de leilão
  "megaleiloes.com.br",
  "superbid.net",
  "sold.com.br",
  "leiloesbr.com.br",
  "leiloesbr.com",
  "leilaoonline.com.br",
  "leiloeiropublico.com.br",
  "leiloesjudiciais.com.br",
  "leiloesgold.com.br",
  "superleiloes.com.br",
  "leiloes.net",
  "leiloeiro.com.br",
  // Leiloeiros / casas
  "zukerman.com.br",
  "portalzuk.com.br",
  "sublimeleiloes.com.br",
  "sublimelev.com.br",
  "franco.com.br",
  "balbinoleiloes.com.br",
  "grupoarremate.com.br",
  "arremateleiloes.com.br",
  "excelleiloes.com.br",
  "leilaovip.com.br",
  "lancevip.com.br",
  "destakleiloes.com.br",
  "mullerleiloes.com.br",
  "isaiasleiloes.com.br",
  "jikal.com.br",
  "leje.com.br",
  "frazao.com.br",
  "grupolance.com.br",
  "balestro.com.br",
  "hdileiloes.com.br",
  "kronbergleiloes.com.br",
  "sodresantoro.com.br",
  "nigri.com.br",
  "alienajud.com.br",
  "mgl.com.br",
];

export function shouldBypassNextImageOptimization(src: string): boolean {
  if (!src || src.startsWith("/")) return false;
  try {
    const host = new URL(src).hostname.toLowerCase();
    return HOST_SUFFIX_BYPASS.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    return false;
  }
}
