import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, copyFile, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { scanTheme, impactOf, themePath } from '../theme-map.mjs';

const tool = fileURLToPath(new URL('../theme-map.mjs', import.meta.url));

async function fixture(t, files) {
  const directory = await mkdtemp(path.join(tmpdir(), 'pakra-theme-map-'));
  const owned = await realpath(directory);
  const parent = await realpath(tmpdir());
  t.after(async () => {
    const resolved = await realpath(directory);
    assert.equal(resolved, owned);
    assert.equal(path.dirname(resolved), parent);
    assert.ok(path.basename(resolved).startsWith('pakra-theme-map-'));
    await rm(resolved, { recursive: true, force: true });
  });
  for (const [file, source] of Object.entries(files)) {
    const destination = path.join(directory, 'theme', file);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, source);
  }
  return { directory, root: path.join(directory, 'theme') };
}

test('shared JavaScript dependencies trace through snippets and JSON templates, with cycles', async t => {
  const { root } = await fixture(t, {
    'assets/shared.js': "import './product.js'; export const value = 1;",
    'assets/product.js': "import { value } from './shared.js';",
    'assets/cart.js': "export { value } from './shared.js';",
    'snippets/product.liquid': "{{ 'product.js' | asset_url | script_tag }}",
    'snippets/cart.liquid': "{{ 'cart.js' | asset_url | script_tag }}",
    'sections/product.liquid': "{% render 'product' %}",
    'sections/cart.liquid': "{% liquid\n render 'cart'\n %}",
    'templates/product.json': '/* Generated template header. */\n{"sections":{"main":{"type":"product"}}}',
    'templates/cart.json': '{"sections":{"main":{"type":"cart"}}}',
    'layout/theme.liquid': '{{ content_for_layout }}'
  });
  const scan = await scanTheme(root);
  const result = impactOf(scan, 'assets/shared.js');
  assert.deepEqual(result.direct, ['assets/cart.js', 'assets/product.js']);
  assert.deepEqual(result.affected.templates, ['templates/cart.json', 'templates/product.json']);
  assert.deepEqual(result.affected.sections, ['sections/cart.liquid', 'sections/product.liquid']);
  assert.ok(!result.transitive.includes(result.target));
  assert.equal(scan.errors.length, 0);
  assert.equal(scan.references.filter(reference => !reference.exists).length, 0);
});

test('layout and section-group references connect real callers without guessing by name', async t => {
  const { root } = await fixture(t, {
    'assets/global.js': '',
    'assets/unrelated.js': '',
    'layout/theme.liquid': "{{ 'global.js' | asset_url | script_tag }}{% sections 'header-group' %}",
    'sections/header-group.json': '{"sections":{"header":{"type":"header"}}}',
    'sections/header.liquid': '<header></header>',
    'templates/index.json': '{"sections":{}}',
    'templates/page.standalone.liquid': '{% layout none %}',
    'templates/page.custom.liquid': "{% layout 'custom' %}",
    'layout/custom.liquid': ''
  });
  const scan = await scanTheme(root);
  assert.deepEqual(impactOf(scan, 'assets/global.js').affected, {
    templates: ['templates/index.json'], sections: [], layout: ['layout/theme.liquid']
  });
  assert.deepEqual(impactOf(scan, 'sections/header.liquid').transitive, ['layout/theme.liquid', 'templates/index.json']);
  assert.deepEqual(impactOf(scan, 'assets/unrelated.js').direct, []);
});

test('dynamic and missing references stay explicit; comments and raw blocks add no false edges', async t => {
  const { root } = await fixture(t, {
    'snippets/entry.liquid': [
      '{% render selected_snippet %}', '{{ selected_asset | asset_url }}',
      "{{ 'prefix' | append: suffix | asset_url }}", "{% include 'missing' %}",
      "{% comment %}{% render 'commented' %}{% endcomment %}",
      "{% raw %}{% render 'raw' %}{% endraw %}"
    ].join('\n'),
    'assets/main.js': "import(variable); import('./' + variable); // import './comment.js'\nconst text = \"import './string.js'\";",
    'templates/broken.json': '{ invalid source with private value }'
  });
  const scan = await scanTheme(root);
  assert.equal(scan.dynamic.length, 5);
  assert.deepEqual(scan.references.map(item => item.to), ['snippets/missing.liquid']);
  assert.equal(scan.references[0].exists, false);
  assert.deepEqual(scan.warnings, [{ file: 'templates/broken.json', kind: 'json-not-parsed' }]);
  assert.equal(scan.errors.length, 0);
  assert.ok(scan.limitations.some(value => value.includes('dynamic')));
  assert.ok(!JSON.stringify(scan).includes('private value'));
});

test('CLI works outside the repository, imports without side effects, and reports existing missing references successfully', async t => {
  const { directory } = await fixture(t, {
    'snippets/main.liquid': "{% render 'missing' %}"
  });
  const script = path.join(directory, 'dev', 'theme-map.mjs');
  await mkdir(path.dirname(script));
  await copyFile(tool, script);
  const run = spawnSync(process.execPath, [script, '--check', '--json'], { cwd: tmpdir(), encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const scan = JSON.parse(run.stdout);
  assert.deepEqual(scan.files, ['snippets/main.liquid']);
  assert.equal(scan.references[0].exists, false);
  const imported = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(pathToFileURL(script).href)})`],
    { cwd: tmpdir(), encoding: 'utf8' });
  assert.equal(imported.status, 0, imported.stderr);
  assert.equal(imported.stdout, '');
  assert.equal(imported.stderr, '');
});

test('impact rejects traversal, absolute paths and unknown files; broken inputs fail the CLI', async t => {
  const { directory, root } = await fixture(t, { 'assets/safe.js': '' });
  const scan = await scanTheme(root);
  for (const value of ['../secret.js', 'assets/../../secret.js', '/etc/passwd', 'C:\\private\\file.js', 'assets\\..\\secret.js', '']) {
    assert.throws(() => themePath(value));
    assert.throws(() => impactOf(scan, value));
  }
  assert.throws(() => impactOf(scan, 'assets/missing.js'));
  assert.equal(themePath('assets\\safe.js'), 'assets/safe.js');
  const script = path.join(directory, 'dev', 'theme-map.mjs');
  await mkdir(path.dirname(script));
  await copyFile(tool, script);
  const run = spawnSync(process.execPath, [script, '--impact', '../secret.js'], { cwd: tmpdir(), encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.equal(run.stdout, '');
  assert.ok(!run.stderr.includes('secret.js'));
});
