// Pricing tabs (WAI-ARIA tabs pattern, automatic activation).
// Without JavaScript the tablist stays hidden and every panel is shown.

import { nextTabIndex, tabFromHash } from "./lib.js";

export function initPricingTabs() {
  const tablist = document.querySelector(".pricing__tabs[role='tablist']");
  if (!tablist) return;
  const tabs = [...tablist.querySelectorAll("[role='tab']")];
  const ids = tabs.map((tab) => tab.getAttribute("aria-controls"));
  const panels = ids.map((id) => document.getElementById(id));
  if (panels.some((panel) => !panel)) return;

  function select(index, { focus = false, updateUrl = false } = {}) {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[i].hidden = !active;
    });
    if (focus) tabs[index].focus();
    if (updateUrl) history.replaceState(null, "", `#${ids[index]}`);
  }

  // Activate the tab named in the hash, then bring the pricing section into view
  // (the browser could not scroll to a panel that was hidden at load time).
  function selectFromHash({ scroll }) {
    const id = tabFromHash(window.location.hash, ids);
    if (!id) return false;
    const index = ids.indexOf(id);
    select(index);
    // Fragment navigation focuses the panel itself (it has tabindex=0), which draws
    // a focus ring nobody asked for. Drop that focus; the panel stays reachable by Tab.
    const dropFocus = () => {
      if (document.activeElement === panels[index]) panels[index].blur();
    };
    dropFocus();
    window.addEventListener("load", dropFocus, { once: true });
    if (scroll) tablist.closest("section")?.scrollIntoView({ behavior: scroll });
    return true;
  }

  // Tab semantics only make sense once the tabs are visible, so add them here.
  panels.forEach((panel, i) => {
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tabs[i].id);
    panel.tabIndex = 0;
  });
  tablist.hidden = false;
  // On first load jump straight there, as the browser does for any #anchor.
  if (!selectFromHash({ scroll: "instant" })) select(0);

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(i, { updateUrl: true }));
    tab.addEventListener("keydown", (e) => {
      const next = nextTabIndex(i, e.key, tabs.length);
      if (next === null) return;
      e.preventDefault();
      select(next, { focus: true, updateUrl: true });
    });
  });

  window.addEventListener("hashchange", () => selectFromHash({ scroll: "auto" }));
}
