#!/usr/bin/env node
/**
 * CLI para gestionar docs/backlog.md del proyecto Ómnibus Tracker.
 *
 * Uso:
 *   node scripts/backlog-cli.js <comando> [opciones]
 *   npx omnibus-backlog <comando> [opciones]
 *
 * Comandos:
 *   list [--status=todo|in-progress|done] [--epic=<n>]
 *   show <BL-xxx>
 *   status <BL-xxx> <todo|in-progress|done>
 *   next-id
 *   add --id=BL-xxx --title="..." --priority=P0|P1|P2 --what="..." [--depends=BL-yyy,BL-zzz] [--status=todo]
 */

const fs = require("fs");
const path = require("path");

const BACKLOG_PATH = path.join(__dirname, "..", "docs", "backlog.md");

const STATUS_VALUES = ["todo", "in-progress", "done"];
const PRIORITY_VALUES = ["P0", "P1", "P2"];

function readBacklog() {
  if (!fs.existsSync(BACKLOG_PATH)) {
    throw new Error(`No se encontró ${BACKLOG_PATH}`);
  }
  return fs.readFileSync(BACKLOG_PATH, "utf-8");
}

function writeBacklog(content) {
  fs.writeFileSync(BACKLOG_PATH, content, "utf-8");
}

function parseItems(text) {
  const items = [];
  const lines = text.split(/\r?\n/);
  let current = null;
  let currentEpic = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Épica: ## Épica N: Título
    const epicMatch = line.match(/^## Épica (\d+):\s*(.+)$/);
    if (epicMatch) {
      currentEpic = { number: epicMatch[1], title: epicMatch[2].trim() };
      continue;
    }

    // Ítem: ### BL-xxx · Título · P0
    const itemMatch = line.match(/^### (BL-\d+)\s*·\s*(.+?)\s*·\s*(P\d)$/);
    if (itemMatch) {
      if (current) items.push(current);
      current = {
        id: itemMatch[1],
        title: itemMatch[2].trim(),
        priority: itemMatch[3],
        epic: currentEpic,
        raw: [line],
        fields: {},
      };
      continue;
    }

    if (current) {
      current.raw.push(line);

      const statusMatch = line.match(/^-\s*\*\*Status:\*\*\s*(.+)$/);
      if (statusMatch) current.fields.status = statusMatch[1].trim();

      const dependsMatch = line.match(/^-\s*\*\*Depends on:\*\*\s*(.+)$/);
      if (dependsMatch) current.fields.depends = dependsMatch[1].trim();

      const whatMatch = line.match(/^-\s*\*\*What:\*\*\s*(.+)$/);
      if (whatMatch) current.fields.what = whatMatch[1].trim();
    }
  }

  if (current) items.push(current);
  return items;
}

function parseArgs(argv) {
  const args = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=", 2);
      args[key] = value ?? true;
    } else {
      positional.push(arg);
    }
  }
  return { positional, args };
}

function printItem(item) {
  console.log(`${item.id} · ${item.title} · ${item.priority}`);
  if (item.epic) console.log(`  Épica: ${item.epic.number} · ${item.epic.title}`);
  console.log(`  Status: ${item.fields.status ?? "?"}`);
  if (item.fields.what) console.log(`  What: ${item.fields.what}`);
  if (item.fields.depends) console.log(`  Depends on: ${item.fields.depends}`);
}

function listCommand(items, args) {
  let filtered = items;
  if (args.status) {
    if (!STATUS_VALUES.includes(args.status)) {
      console.error(`Estado inválido: ${args.status}. Usa: ${STATUS_VALUES.join(", ")}`);
      process.exit(1);
    }
    filtered = filtered.filter((i) => i.fields.status === args.status);
  }
  if (args.epic) {
    filtered = filtered.filter((i) => i.epic?.number === args.epic);
  }

  if (filtered.length === 0) {
    console.log("No hay ítems que coincidan.");
    return;
  }

  for (const item of filtered) {
    const epicLabel = item.epic ? `[E${item.epic.number}]` : "[?]";
    console.log(`${item.id} ${epicLabel} [${item.fields.status ?? "?"}] ${item.title} · ${item.priority}`);
  }
}

function showCommand(items, id) {
  const item = items.find((i) => i.id === id);
  if (!item) {
    console.error(`Ítem no encontrado: ${id}`);
    process.exit(1);
  }
  console.log(item.raw.join("\n"));
}

function statusCommand(items, id, newStatus) {
  if (!STATUS_VALUES.includes(newStatus)) {
    console.error(`Estado inválido: ${newStatus}. Usa: ${STATUS_VALUES.join(", ")}`);
    process.exit(1);
  }

  const item = items.find((i) => i.id === id);
  if (!item) {
    console.error(`Ítem no encontrado: ${id}`);
    process.exit(1);
  }

  let content = readBacklog();
  const regex = new RegExp(`(### ${id}\\b[\\s\\S]*?- \\*\\*Status:\\*\\*\\s*)\\w+`, "m");
  if (!regex.test(content)) {
    console.error(`No se pudo encontrar el campo Status para ${id}`);
    process.exit(1);
  }

  content = content.replace(regex, `$1${newStatus}`);
  writeBacklog(content);
  console.log(`${id} → status: ${newStatus}`);
}

function nextIdCommand(items) {
  const max = items.reduce((acc, i) => {
    const num = parseInt(i.id.replace("BL-", ""), 10);
    return Math.max(acc, num);
  }, 0);
  console.log(`BL-${String(max + 1).padStart(3, "0")}`);
}

function addCommand(args) {
  const id = args.id;
  const title = args.title;
  const priority = args.priority;
  const what = args.what;
  const status = args.status ?? "todo";
  const depends = args.depends ?? "—";

  if (!id || !title || !priority || !what) {
    console.error("Faltan campos obligatorios: --id, --title, --priority, --what");
    process.exit(1);
  }
  if (!/^BL-\d{3,}$/.test(id)) {
    console.error("ID inválido. Usa formato BL-xxx (ej: BL-025)");
    process.exit(1);
  }
  if (!PRIORITY_VALUES.includes(priority)) {
    console.error(`Prioridad inválida: ${priority}. Usa: ${PRIORITY_VALUES.join(", ")}`);
    process.exit(1);
  }
  if (!STATUS_VALUES.includes(status)) {
    console.error(`Estado inválido: ${status}. Usa: ${STATUS_VALUES.join(", ")}`);
    process.exit(1);
  }

  const content = readBacklog();
  if (content.includes(`### ${id}`)) {
    console.error(`Ya existe un ítem con ID ${id}`);
    process.exit(1);
  }

  const block = `\n### ${id} · ${title} · ${priority}\n- **What:** ${what}\n- **Acceptance criteria:**\n  - [ ]\n- **Depends on:** ${depends}\n- **Status:** ${status}\n`;

  // Insertar antes de "## Gobernanza" si existe
  const governanceIndex = content.indexOf("## Gobernanza");
  let newContent;
  if (governanceIndex >= 0) {
    newContent = content.slice(0, governanceIndex) + block + content.slice(governanceIndex);
  } else {
    newContent = content + block;
  }

  writeBacklog(newContent);
  console.log(`${id} agregado al backlog.`);
}

function help() {
  console.log(`
Uso: omnibus-backlog <comando> [opciones]

Comandos:
  list [--status=<estado>] [--epic=<n>]     Lista ítems del backlog
  show <BL-xxx>                             Muestra un ítem completo
  status <BL-xxx> <estado>                  Cambia el estado de un ítem
  next-id                                   Muestra el siguiente ID disponible
  add --id=BL-xxx --title="..." --priority=P0|P1|P2 --what="..."
       [--depends=BL-yyy,BL-zzz] [--status=todo]  Agrega un ítem

Estados: todo, in-progress, done
`);
}

function main() {
  const { positional, args } = parseArgs(process.argv.slice(2));
  const command = positional[0];

  if (!command || command === "help" || command === "--help" || command === "-h") {
    help();
    process.exit(0);
  }

  const items = parseItems(readBacklog());

  switch (command) {
    case "list":
      listCommand(items, args);
      break;
    case "show":
      showCommand(items, positional[1]);
      break;
    case "status":
      statusCommand(items, positional[1], positional[2]);
      break;
    case "next-id":
      nextIdCommand(items);
      break;
    case "add":
      addCommand(args);
      break;
    default:
      console.error(`Comando desconocido: ${command}`);
      help();
      process.exit(1);
  }
}

main();
