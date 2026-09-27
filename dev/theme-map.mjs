/** Read-only theme dependency map. Run from any directory; no store access. */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const THEME_ROOT = fileURLToPath(new URL('../theme/', import.meta.url));
const DIRECTORIES = ['assets', 'blocks', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates'];
const SOURCE_EXTENSION = /\.(?:liquid|[cm]?js|json|css|scss|svg|html)$/i;
const LIMITATIONS = [
  'Static references only: dynamic Liquid names and computed JavaScript imports need manual review.',
  'Does not model DOM selectors, events, global variables, fetch URLs, CSS imports, app blocks, or remote assets.',
  'JavaScript syntax is scanned without a full parser; dependencies inside template-literal expressions are not inspected.',
  'Template-to-layout edges use the default theme layout unless an explicit layout or layout none is present.',
  'A caller means possible impact, not proof that the reference executes on every request.'
];
const sorted = values => [...values].sort();
const lineAt = (text, offset) => text.slice(0, offset).split('\n').length;

/** Accept only a theme-relative path, including on non-Windows hosts. */
export function themePath(input) {
  if (typeof input !== 'string' || !input || /[\x00-\x1f]/.test(input)) {
    throw new Error('Provide a non-empty theme-relative file path.');
  }
  const value = input.replaceAll('\\', '/');
  if (path.posix.isAbsolute(value) || /^[a-z]:/i.test(value) || value.split('/').includes('..')) {
    throw new Error('Absolute paths and parent-directory traversal are not allowed.');
  }
  const normalized = path.posix.normalize(value);
  if (!DIRECTORIES.includes(normalized.split('/')[0]) || !normalized.includes('/')) {
    throw new Error('The path must name a file inside a standard theme directory.');
  }
  return normalized;
}

// Tokenizing avoids treating comments and ordinary strings as JavaScript imports.
function jsTokens(source) {
  const tokens = [];
  const pattern = /\/\*[\s\S]*?\*\/|\/\/[^\r\n]*|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`|[A-Za-z_$][\w$]*|[^\s]/g;
  for (const match of source.matchAll(pattern)) {
    const raw = match[0];
    if (raw.startsWith('//') || raw.startsWith('/*')) continue;
    const isString = raw[0] === '"' || raw[0] === "'";
    tokens.push({ value: isString ? raw.slice(1, -1) : raw, string: isString, offset: match.index });
  }
  return tokens;
}

function javascriptReferences(source, add, dynamic) {
  const tokens = jsTokens(source);
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.string || !['import', 'export'].includes(token.value) || tokens[i - 1]?.value === '.') continue;
    const next = tokens[i + 1];
    if (!next || next.value === '.') continue; // import.meta
    let specifier;
    if (token.value === 'import' && next.value === '(') {
      specifier = tokens[i + 2];
      if (!specifier?.string || ![')', ','].includes(tokens[i + 3]?.value)) {
        dynamic('javascript-import', lineAt(source, token.offset));
        continue;
      }
    } else if (token.value === 'import' && next.string) {
      specifier = next;
    } else {
      // Static import/export clauses end at a semicolon or the next declaration.
      for (let j = i + 1; j < tokens.length; j += 1) {
        if ([';', 'import', 'export', 'const', 'let', 'function'].includes(tokens[j].value)) break;
        if (tokens[j].value === 'from' && tokens[j + 1]?.string) {
          specifier = tokens[j + 1];
          break;
        }
      }
    }
    if (!specifier) continue;
    if (specifier.value.startsWith('./') || specifier.value.startsWith('../')) {
      if (specifier.value.includes('\\')) dynamic('escaped-javascript-import', lineAt(source, token.offset));
      else add(specifier.value, 'javascript-import', lineAt(source, token.offset), true);
    }
  }
}

function liquidReferences(source, add, dynamic) {
  const active = source.replace(/{%-?\s*(comment|raw)\b[\s\S]*?{%-?\s*end\1\s*-?%}/g,
    match => match.replace(/[^\n]/g, ' '));
  for (const tag of active.matchAll(/{[%{]-?([\s\S]*?)-?[%}]}/g)) {
    const body = tag[1].trim();
    const commands = body.startsWith('liquid\n') || body.startsWith('liquid\r')
      ? body.slice(6).split(/\r?\n/).map(command => command.trim()) : [body];
    for (const command of commands) {
      const call = command.match(/^(render|include|section|sections)\s+([\s\S]+)/);
      if (call) {
        const literal = call[2].match(/^(['"])([^'"\r\n]+)\1(?:\s|,|$)/);
        if (literal) {
          const folder = ['render', 'include'].includes(call[1]) ? 'snippets' : 'sections';
          add(`${folder}/${literal[2]}.${call[1] === 'sections' ? 'json' : 'liquid'}`, `liquid-${call[1]}`, lineAt(active, tag.index));
        } else dynamic(`liquid-${call[1]}`, lineAt(active, tag.index));
      }
      if (/\|\s*asset_url\b/.test(command)) {
        const expression = command.split(/\|\s*asset_url\b/)[0].replace(/^assign\s+\w+\s*=\s*/, '').trim();
        const literal = expression.match(/^(['"])([^'"\r\n]+)\1$/);
        if (literal) add(`assets/${literal[2]}`, 'liquid-asset', lineAt(active, tag.index));
        else dynamic('liquid-asset', lineAt(active, tag.index));
      }
    }
  }
  return active;
}

function parseThemeJson(source) {
  return JSON.parse(source.replace(/^\uFEFF/, '').replace(/^\s*\/\*[\s\S]*?\*\//, ''));
}

/** Scan local files without executing theme code. All returned paths are theme-relative. */
export async function scanTheme(root = THEME_ROOT) {
  const files = new Set();
  const references = [];
  const dynamic = [];
  const warnings = [];
  const errors = [];
  async function walk(relative, optional = false) {
    let entries;
    try { entries = await readdir(path.join(root, relative), { withFileTypes: true }); }
    catch (error) {
      if (!optional || error.code !== 'ENOENT') errors.push({ file: relative, kind: 'directory-read-failed' });
      return;
    }
    for (const entry of entries) {
      const file = `${relative}/${entry.name}`;
      if (entry.isSymbolicLink()) errors.push({ file, kind: 'symlink-not-scanned' });
      else if (entry.isDirectory()) await walk(file);
      else if (entry.isFile()) files.add(file);
    }
  }
  await Promise.all(DIRECTORIES.map(directory => walk(directory, true)));
  if (!files.size && !errors.length) errors.push({ file: '.', kind: 'no-theme-files-found' });
  for (const file of sorted(files)) {
    if (!SOURCE_EXTENSION.test(file)) continue;
    let source;
    try { source = await readFile(path.join(root, file), 'utf8'); }
    catch { errors.push({ file, kind: 'file-read-failed' }); continue; }
    const add = (target, kind, line, relativeImport = false) => {
      const joined = relativeImport ? path.posix.join(path.posix.dirname(file), target) : target;
      let normalized;
      try { normalized = themePath(joined); }
      catch { warnings.push({ file, kind: 'reference-outside-theme', line }); return; }
      references.push({ from: file, to: normalized, kind, line, exists: files.has(normalized) });
    };
    const addDynamic = (kind, line) => dynamic.push({ file, kind, line });
    let liquid = source;
    if (file.endsWith('.liquid')) liquid = liquidReferences(source, add, addDynamic);
    if (/\.[cm]?js(?:\.liquid)?$/.test(file)) javascriptReferences(source, add, addDynamic);
    if (file.endsWith('.json') && /^(templates|sections)\//.test(file)) {
      try {
        const data = parseThemeJson(source);
        for (const section of Object.values(data.sections ?? {})) {
          if (typeof section?.type === 'string' && !section.type.startsWith('shopify://')) {
            add(`sections/${section.type}.liquid`, 'json-section', 1);
          }
        }
        if (file.startsWith('templates/')) {
          if (data.layout !== false && data.layout !== 'none') add(`layout/${data.layout ?? 'theme'}.liquid`, 'template-layout', 1);
        }
      } catch { warnings.push({ file, kind: 'json-not-parsed' }); }
    }
    if (file.startsWith('templates/') && file.endsWith('.liquid')) {
      const layout = liquid.match(/{%-?\s*layout\s+([^%]+?)\s*-?%}/);
      if (!layout) add('layout/theme.liquid', 'template-layout', 1);
      else if (layout[1].trim() !== 'none') {
        const literal = layout[1].trim().match(/^(['"])([^'"]+)\1$/);
        if (literal) add(`layout/${literal[2]}.liquid`, 'template-layout', lineAt(liquid, layout.index));
        else addDynamic('liquid-layout', lineAt(liquid, layout.index));
      }
    }
  }
  return { files: sorted(files), references, dynamic, warnings, errors, limitations: LIMITATIONS };
}

/** Reverse graph traversal includes shared callers and handles dependency cycles. */
export function impactOf(scan, input) {
  const target = themePath(input);
  if (!scan.files.includes(target)) throw new Error('The requested file is not present in the scanned theme.');
  const reverse = new Map();
  for (const reference of scan.references) {
    if (!reverse.has(reference.to)) reverse.set(reference.to, new Set());
    reverse.get(reference.to).add(reference.from);
  }
  const direct = new Set(reverse.get(target) ?? []);
  direct.delete(target);
  const visited = new Set([target]);
  const pending = [...direct];
  while (pending.length) {
    const caller = pending.pop();
    if (visited.has(caller)) continue;
    visited.add(caller);
    pending.push(...(reverse.get(caller) ?? []));
  }
  visited.delete(target);
  return {
    target, direct: sorted(direct), transitive: sorted([...visited].filter(file => !direct.has(file))),
    affected: Object.fromEntries(['templates', 'sections', 'layout'].map(directory =>
      [directory, sorted([...visited].filter(file => file.startsWith(`${directory}/`)))]))
  };
}

function printList(title, values) {
  console.log(`${title} (${values.length}):`);
  for (const value of values.slice(0, 40)) console.log(`  ${value}`);
  if (!values.length) console.log('  (none detected)');
  if (values.length > 40) console.log(`  ${values.length - 40} more; use --json for the complete list.`);
}

export async function main(args = process.argv.slice(2)) {
  let target;
  let json = false;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--json') json = true;
    else if (args[i] === '--check') continue;
    else if (args[i] === '--impact' && target === undefined && args[i + 1]) target = themePath(args[++i]);
    else if (args[i] === '--help') {
      console.log('Usage: node dev/theme-map.mjs [--check] [--impact assets/file.js] [--json]');
      console.log('Scans theme relative to this script; never writes files or accesses Shopify.');
      return 0;
    } else throw new Error('Invalid arguments. Use --help for accepted options.');
  }
  const scan = await scanTheme();
  const impact = target ? impactOf(scan, target) : undefined;
  const missing = scan.references.filter(reference => !reference.exists);
  if (json) console.log(JSON.stringify({ ...scan, impact }, null, 2));
  else {
    console.log(`Theme files: ${scan.files.length}; static references: ${scan.references.length}; dynamic references: ${scan.dynamic.length}.`);
    if (impact) {
      console.log(`Possible impact of ${impact.target}:`);
      printList('Direct callers', impact.direct);
      printList('Transitive callers', impact.transitive);
      for (const [directory, callers] of Object.entries(impact.affected)) printList(`Affected ${directory}`, callers);
    }
    printList('Missing static references (existing theme findings)', missing.map(item => `${item.from}:${item.line} -> ${item.to} [${item.kind}]`));
    printList('Dynamic references requiring manual tracing', scan.dynamic.map(item => `${item.file}:${item.line} [${item.kind}]`));
    printList('Source warnings', scan.warnings.map(item => `${item.file}${item.line ? `:${item.line}` : ''} [${item.kind}]`));
    printList('Scan errors', scan.errors.map(item => `${item.file} [${item.kind}]`));
    console.log('Limits:');
    for (const limitation of LIMITATIONS) console.log(`  ${limitation}`);
    console.log('Exit status checks scan execution only; missing/dynamic references are not a website validation failure.');
  }
  return scan.errors.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then(code => { process.exitCode = code; }).catch(() => {
    // No raw parser errors or source excerpts: they may contain private values.
    console.error('Unable to scan: invalid input or a local scan failure. Use --help and check the theme checkout.');
    process.exitCode = 1;
  });
}
