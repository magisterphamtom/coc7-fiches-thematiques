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
  const era = actor.flags?.[LUCK_TRACKER]?.era;
  const key = era === "modern" ? "themeModern" : "theme1933";
  return resolve(game.settings.get(ID, key));
}

function applyTheme(app) {
  const el = app?.element;
  if (!el?.classList?.contains("investigator")) return; // fiche V3 uniquement
  const theme = themeFor(app.document);
  for (const t of THEME_KEYS) el.classList.toggle(`c7ft-${t}`, t === theme);
  el.classList.toggle("c7ft", !!theme);
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
  if (ID in f || LUCK_TRACKER in f || `-=${ID}` in f) refreshOpenSheets(actor);
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
