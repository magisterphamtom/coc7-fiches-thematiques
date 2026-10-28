/**
 * CoC7 – Fiches investigateur thématiques
 * Habille la fiche investigateur CoC7 (fiche V3) avec les mêmes thèmes que les cartes de chat
 * et Token Action HUD. Un thème pour les fiches 1933, un autre pour les fiches 2025-2026,
 * et un réglage par fiche pour le MJ. Seul l'affichage change : aucune donnée n'est modifiée.
 * magisterphamtom — MIT
 */

const ID = "coc7-fiches-thematiques";
const LUCK_TRACKER = "coc7-luck-tracker";   // l'époque de chaque investigateur y est réglée
const CHAT_CARDS = "coc7-cartes-chat";      // thème du chat, utilisable comme référence

const THEMES = {
  annees20: "Années 20 (Art Déco noir et or)",
  newyork: "New York années 20",
  montagnes: "Par-delà les Montagnes Hallucinées",
  ny2026: "New York 2026",
  antarctique2026: "Antarctique 2026"
};
const THEME_KEYS = Object.keys(THEMES);

/* ---------- Réglages ---------- */

function eraChoices() {
  return {
    none: "Aucun (fiche d'origine)",
    chat: "Même thème que les cartes de chat",
    ...THEMES
  };
}

Hooks.once("init", () => {
  game.settings.register(ID, "etats", {
    name: "Barre des états préjudiciables",
    hint: "Sur les fiches habillées : les états (à terre, inconscient, blessure grave, mourant, folies) en étiquettes sous le portrait, et ceux en cours affichés en gros sur la photo, dans le style du thème.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => refreshOpenSheets()
  });
  game.settings.register(ID, "theme1933", {
    name: "Thème des fiches 1933 (et sans époque)",
    hint:
      "Investigateurs de l'époque 1933 dans le Suivi de Chance du groupe, ainsi que ceux à qui aucune époque n'a été donnée.",
    scope: "world",
    config: true,
    type: String,
    choices: eraChoices(),
    default: "montagnes",
    onChange: () => refreshOpenSheets()
  });
  game.settings.register(ID, "themeModern", {
    name: "Thème des fiches 2025-2026",
    hint: "Investigateurs de l'époque 2025-2026 dans le Suivi de Chance du groupe.",
    scope: "world",
    config: true,
    type: String,
    choices: eraChoices(),
    default: "antarctique2026",
    onChange: () => refreshOpenSheets()
  });
});

/* ---------- Quel thème pour quelle fiche ? ---------- */

function chatTheme() {
  try {
    const forced = game.settings.get(CHAT_CARDS, "forceTheme");
    const mine = game.settings.get(CHAT_CARDS, "theme");
    const t = forced || mine;
    return THEME_KEYS.includes(t) ? t : null;
  } catch (err) {
    return null; // module des cartes de chat absent ou inactif
  }
}

function resolve(value) {
  if (value === "chat") return chatTheme();
  return THEME_KEYS.includes(value) ? value : null;
}

function themeFor(actor) {
  if (!actor || actor.type !== "character") return null;
  const own = actor.getFlag(ID, "theme"); // undefined = automatique
  if (own) return resolve(own);
  const era = actor.flags?.[LUCK_TRACKER]?.era; // aussi écrit par le Suivi du groupe
  const key = era === "modern" ? "themeModern" : "theme1933";
  return resolve(game.settings.get(ID, key));
}

function applyTheme(app) {
  const el = app?.element;
  if (!el?.classList?.contains("investigator")) return; // fiche V3 uniquement
  const theme = themeFor(app.document);
  for (const t of THEME_KEYS) el.classList.toggle(`c7ft-${t}`, t === theme);
  el.classList.toggle("c7ft", !!theme);
  if (theme && game.settings.get(ID, "etats")) barreEtats(app); else el.querySelectorAll(".c7ft-etats, .c7ft-etats-actifs").forEach((n) => n.remove());
}

/* ---------- États préjudiciables : barre d'étiquettes + rappel sur le portrait ---------- */

const ETATS = [
  { k: "prone", label: "À terre", icon: "game-icon game-icon-falling" },
  { k: "unconscious", label: "Inconscient", icon: "game-icon game-icon-knocked-out-stars" },
  { k: "criticalWounds", label: "Blessure grave", icon: "game-icon game-icon-arm-sling" },
  { k: "dying", label: "Mourant", icon: "game-icon game-icon-heart-beats" },
  { k: "tempoInsane", label: "Folie temporaire", icon: "game-icon game-icon-hanging-spider" },
  { k: "indefInsane", label: "Folie persistante", icon: "game-icon game-icon-tentacles-skull" }
];

/**
 * Ajoute sous le portrait une rangée d'étiquettes (une par état) et, sur le portrait,
 * un rappel en gros des états actifs. Un clic passe par l'icône d'origine de CoC7 :
 * c'est le système qui change l'état, comme avant.
 */
function barreEtats(app) {
  const el = app.element;
  const cadre = el.querySelector("div.investigator .photo-frame");
  const origine = cadre?.querySelector(".conditions");
  if (!cadre || !origine) return;
  el.querySelectorAll(".c7ft-etats, .c7ft-etats-actifs").forEach((n) => n.remove());
  const c = app.document.system.conditions ?? {};
  const actif = (k) => !!c[k]?.value;
  const esc = (t) => foundry.utils.escapeHTML(String(t));
  const clic = (k) => origine.querySelector(`[data-condition="${k}"]`);

  const barre = document.createElement("section");
  barre.className = "c7ft-etats";
  barre.innerHTML = ETATS.map((e) => `<a class="c7ft-etat${actif(e.k) ? " actif" : ""}" data-c7ft-etat="${e.k}" data-tooltip="${actif(e.k) ? "Retirer" : "Ajouter"} : ${esc(e.label)}"><i class="${e.icon}"></i><span>${esc(e.label)}</span></a>`).join("")
    + (actif("dead") ? `<a class="c7ft-etat actif c7ft-mort" data-c7ft-etat="dead" data-tooltip="Retirer : Mort"><i class="game-icon game-icon-tombstone"></i><span>Mort</span></a>`
      : actif("dying") ? `<a class="c7ft-etat c7ft-survie" data-c7ft-survie="1" data-tooltip="Jet de CON pour rester en vie"><i class="game-icon game-icon-d10"></i><span>Jet de survie</span></a>` : "");
  cadre.after(barre);

  const actifs = [...ETATS, { k: "dead", label: "Mort", icon: "game-icon game-icon-tombstone" }].filter((e) => actif(e.k));
  if (actifs.length) {
    const rappel = document.createElement("div");
    rappel.className = "c7ft-etats-actifs";
    rappel.innerHTML = actifs.map((e) => `<a class="c7ft-etat-actif" data-c7ft-etat="${e.k}" data-tooltip="${esc(e.label)} (clic : retirer)"><i class="${e.icon}"></i> ${esc(e.label)}</a>`).join("");
    cadre.append(rappel);
  }

  el.querySelectorAll("[data-c7ft-etat]").forEach((a) => a.addEventListener("click", (ev) => {
    ev.preventDefault(); ev.stopPropagation();
    clic(a.dataset.c7ftEtat)?.click();
  }));
  barre.querySelector("[data-c7ft-survie]")?.addEventListener("click", (ev) => {
    ev.preventDefault(); ev.stopPropagation();
    origine.querySelector(".dying-check")?.click();
  });
}

function refreshOpenSheets(actor) {
  for (const app of foundry.applications.instances.values()) {
    if (!(app instanceof foundry.applications.sheets.ActorSheetV2)) continue;
    if (actor && app.document?.id !== actor.id) continue;
    applyTheme(app);
  }
}

/* ---------- Mise à jour de l'affichage ---------- */

Hooks.on("renderActorSheetV2", (app) => {
  try {
    applyTheme(app);
  } catch (err) {
    console.error(`${ID} | erreur à l'affichage de la fiche`, err);
  }
});

Hooks.on("updateActor", (actor, changes) => {
  const f = changes?.flags;
  if (!f) return;
  if (ID in f || LUCK_TRACKER in f || "coc7-suivi-groupe" in f || `-=${ID}` in f) refreshOpenSheets(actor);
});

// Le thème du chat change (réglage client ou monde) : les fiches réglées sur « comme le chat » suivent.
Hooks.on("clientSettingChanged", (key) => { if (key.startsWith(`${CHAT_CARDS}.`)) refreshOpenSheets(); });
Hooks.on("updateSetting", (setting) => { if (setting.key?.startsWith(`${CHAT_CARDS}.`)) refreshOpenSheets(); });

/* ---------- Choix du thème d'une fiche (MJ) ---------- */

async function chooseTheme(app) {
  const actor = app.document;
  const current = actor.getFlag(ID, "theme") ?? "";
  const options = { "": "Automatique (selon l'époque)", ...eraChoices() };
  const html = Object.entries(options)
    .map(([k, v]) => `<option value="${k}" ${k === current ? "selected" : ""}>${v}</option>`)
    .join("");
  const content = `<div class="form-group"><label>Thème de la fiche</label>
    <div class="form-fields"><select name="theme">${html}</select></div></div>
    <p class="hint">« Automatique » utilise l'époque réglée dans le Suivi de Chance du groupe.</p>`;

  let choice;
  try {
    choice = await foundry.applications.api.DialogV2.prompt({
      window: { title: `Thème de la fiche — ${actor.name}`, icon: "fa-solid fa-palette" },
      content,
      ok: { label: "Appliquer", callback: (event, button) => button.form.elements.theme.value },
      rejectClose: false
    });
  } catch (err) {
    return; // fenêtre fermée
  }
  if (choice === undefined || choice === null) return;

  try {
    if (choice === "") await actor.unsetFlag(ID, "theme");
    else await actor.setFlag(ID, "theme", choice);
  } catch (err) {
    console.error(`${ID} | impossible d'enregistrer le thème`, err);
    ui.notifications.error("Fiches thématiques : impossible d'enregistrer le thème de cette fiche.");
  }
}

Hooks.on("getHeaderControlsActorSheetV2", (app, controls) => {
  if (!game.user.isGM) return;
  if (app.document?.type !== "character") return;
  if (!app.options.classes?.includes("investigator")) return;
  app.options.actions ??= {};
  app.options.actions.c7ftChoose = function () { return chooseTheme(this); };
  controls.push({ icon: "fa-solid fa-palette", label: "Thème de la fiche…", action: "c7ftChoose" });
});

/* ---------- API pour macros ---------- */

Hooks.once("ready", () => {
  const mod = game.modules.get(ID);
  if (mod) mod.api = { themes: { ...THEMES }, themeFor, refresh: () => refreshOpenSheets() };
});
