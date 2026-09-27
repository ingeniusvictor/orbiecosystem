import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../..',
);

const entry = 'api/cron/orbi-news-discovery.ts';

const normalize = (value: string): string =>
  value.replaceAll('\\', '/');

const resolveSource = (
  fromFile: string,
  specifier: string,
): string | null => {
  if (!specifier.startsWith('.')) return null;

  const raw = resolve(
    dirname(join(root, fromFile)),
    specifier,
  );

  const candidates: string[] = [];

  if (specifier.endsWith('.js')) {
    candidates.push(
      `${raw.slice(0, -3)}.ts`,
      `${raw.slice(0, -3)}.tsx`,
    );
  } else if (
    specifier.endsWith('.ts') ||
    specifier.endsWith('.tsx')
  ) {
    candidates.push(raw);
  } else if (!extname(specifier)) {
    candidates.push(
      `${raw}.ts`,
      `${raw}.tsx`,
      join(raw, 'index.ts'),
      join(raw, 'index.tsx'),
    );
  }

  const match = candidates.find(candidate =>
    existsSync(candidate)
  );

  return match
    ? normalize(relative(root, match))
    : null;
};

const runtimeImports = (
  file: string,
  source: string,
): readonly string[] => {
  const sf = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  const values: string[] = [];

  const add = (node: ts.Expression | undefined): void => {
    if (
      node &&
      ts.isStringLiteralLike(node) &&
      node.text.startsWith('.')
    ) {
      values.push(node.text);
    }
  };

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause;

      let runtime = false;

      if (!clause) {
        runtime = true;
      } else if (!clause.isTypeOnly) {
        if (clause.name) {
          runtime = true;
        } else if (clause.namedBindings) {
          if (ts.isNamespaceImport(clause.namedBindings)) {
            runtime = true;
          } else {
            runtime = clause.namedBindings.elements.some(
              element => !element.isTypeOnly,
            );
          }
        }
      }

      if (runtime) {
        add(node.moduleSpecifier);
      }
    }

    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier
    ) {
      let runtime = !node.isTypeOnly;

      if (
        runtime &&
        node.exportClause &&
        ts.isNamedExports(node.exportClause)
      ) {
        runtime = node.exportClause.elements.some(
          element => !element.isTypeOnly,
        );
      }

      if (runtime) {
        add(node.moduleSpecifier);
      }
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1
    ) {
      add(node.arguments[0]);
    }

    ts.forEachChild(node, visit);
  };

  visit(sf);

  return [...new Set(values)];
};

test(
  'Vercel discovery runtime uses explicit ESM extensions across its executable dependency graph',
  () => {
    const queue = [entry];
    const visited = new Set<string>();
    const violations: string[] = [];

    while (queue.length > 0) {
      const file = queue.shift();

      if (!file || visited.has(file)) continue;

      visited.add(file);

      const source = readFileSync(
        join(root, file),
        'utf8',
      );

      for (const specifier of runtimeImports(file, source)) {
        const target = resolveSource(file, specifier);

        if (!target) continue;

        if (
          !specifier.endsWith('.js') &&
          !specifier.endsWith('.json') &&
          !specifier.endsWith('.node')
        ) {
          violations.push(
            `${file} -> ${specifier}`,
          );
        }

        if (!visited.has(target)) {
          queue.push(target);
        }
      }
    }

    assert.ok(
      visited.size > 10,
      `unexpectedly small runtime graph: ${visited.size}`,
    );

    assert.deepEqual(violations, []);
  },
);
