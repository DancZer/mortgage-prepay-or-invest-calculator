/**
 * "?" explanation buttons with one shared tooltip.
 *
 * - Mouse: the tooltip shows while the pointer is over a "?" button.
 * - Touch / click: a click opens it and keeps it open; clicking the button again, anywhere else or
 *   pressing Escape closes it. While scrolling it follows its button and closes once the button is
 *   out of view.
 * - Keyboard: focusing a "?" button (Tab) shows it, leaving it hides it.
 *
 * The tooltip is positioned in the viewport (position: fixed), so scrolling containers such as
 * the table or the input panel never clip it.
 */

const GAP = 8;
const MARGIN = 8;

let tooltip: HTMLDivElement | null = null;
let current: HTMLButtonElement | null = null;
let pinned = false;

/** Creates a "?" button; its explanation and accessible name can be changed later with `setHelp`. */
export function helpButton(): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "help";
  button.textContent = "?";
  button.setAttribute("aria-expanded", "false");
  return button;
}

/** Sets the explanation and the accessible name (e.g. "Explain: Loan amount") of a "?" button. */
export function setHelp(button: HTMLButtonElement, text: string, label: string): void {
  button.dataset.help = text;
  button.setAttribute("aria-label", label);
  if (button === current && tooltip) tooltip.textContent = text;
}

function show(button: HTMLButtonElement, pin: boolean) {
  if (!tooltip) return;
  if (current && current !== button) current.setAttribute("aria-expanded", "false");
  current = button;
  pinned = pin;
  tooltip.textContent = button.dataset.help ?? "";
  tooltip.hidden = false;
  button.setAttribute("aria-expanded", "true");
  button.setAttribute("aria-describedby", tooltip.id);
  position(button);
}

function hide() {
  if (!tooltip || !current) return;
  tooltip.hidden = true;
  current.setAttribute("aria-expanded", "false");
  current.removeAttribute("aria-describedby");
  current = null;
  pinned = false;
}

/** Below the button when there is room, otherwise above; always fully inside the window. */
function position(button: HTMLButtonElement) {
  if (!tooltip) return;
  const b = button.getBoundingClientRect();
  tooltip.style.left = "0px";
  tooltip.style.top = "0px";
  const t = tooltip.getBoundingClientRect();
  const left = Math.min(Math.max(MARGIN, b.left + b.width / 2 - t.width / 2), window.innerWidth - t.width - MARGIN);
  const below = b.bottom + GAP;
  const top = below + t.height + MARGIN <= window.innerHeight ? below : Math.max(MARGIN, b.top - GAP - t.height);
  tooltip.style.left = `${Math.round(left)}px`;
  tooltip.style.top = `${Math.round(top)}px`;
}

/** Closes the tooltip when its button was removed from the page (e.g. the cards were re-rendered). */
export function closeTooltipIfDetached(): void {
  if (current && !current.isConnected) hide();
}

/** Keeps the tooltip next to its button; closes it when the button is no longer visible. */
function follow() {
  if (!current) return;
  const b = current.getBoundingClientRect();
  const visible = current.isConnected && b.bottom > 0 && b.top < window.innerHeight && b.width > 0;
  if (visible) position(current);
  else hide();
}

const helpOf = (target: EventTarget | null) =>
  (target as Element | null)?.closest?.<HTMLButtonElement>("button.help") ?? null;

/** Creates the shared tooltip and listens for "?" buttons anywhere in the page. Call once. */
export function initTooltips(): void {
  tooltip = document.createElement("div");
  tooltip.id = "help-tooltip";
  tooltip.className = "tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;
  document.body.append(tooltip);

  document.addEventListener("mouseover", (e) => {
    const button = helpOf(e.target);
    if (button && !pinned) show(button, false);
  });
  document.addEventListener("mouseout", (e) => {
    const button = helpOf(e.target);
    if (button && button === current && !pinned && helpOf(e.relatedTarget) !== button) hide();
  });
  document.addEventListener("click", (e) => {
    const button = helpOf(e.target);
    if (button) {
      if (button === current && pinned) hide();
      else show(button, true);
    } else if (pinned) {
      hide();
    }
  });
  document.addEventListener("focusin", (e) => {
    const button = helpOf(e.target);
    if (button && !pinned) show(button, false);
  });
  document.addEventListener("focusout", (e) => {
    if (helpOf(e.target) === current && !pinned) hide();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hide();
  });
  // Scrolling (page, input panel or table) or resizing moves the button: follow it.
  window.addEventListener("scroll", follow, true);
  window.addEventListener("resize", follow);
}
