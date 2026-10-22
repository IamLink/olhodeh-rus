/** Logo oficial centralizada aqui para facilitar substituições futuras. */
const LOGO_IMAGE = './images/olho-de-horus-logo-transparent.png';

export function renderLogo() {
  return `<img class="logo-image" src="${LOGO_IMAGE}" alt="" /><span class="logo-copy"><strong>OLHO <em>DE</em> HÓRUS</strong><small>Monitoramento e recuperação pós-missão</small></span>`;
}
