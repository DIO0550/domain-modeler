#!/usr/bin/env node
// モジュール境界の検査。rules/architecture.md「依存方向のルール」と
// rules/consistency.md「feature 間の参照は禁止する」を機械的に落とす。
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const APP_SRC = join(ROOT, "apps/desktop/src");
const PACKAGES = join(ROOT, "packages");
const SOURCE_EXTENSIONS = [".ts", ".tsx"];

/** 検査対象のソースファイルを再帰的に集める。 */
const collectSourceFiles = (directory) => {
  const entries = readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "node_modules" ? [] : collectSourceFiles(path);
    }
    if (path.endsWith(".d.ts")) {
      return [];
    }
    return SOURCE_EXTENSIONS.some((ext) => path.endsWith(ext)) ? [path] : [];
  });
};

const IMPORT_PATTERNS = [
  /(?:^|\n)\s*(?:import|export)\b[^;]*?\bfrom\s*["']([^"']+)["']/g,
  /(?:^|\n)\s*import\s*["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
];

/** ソース中の import 指定子を行番号付きで取り出す。 */
const collectImports = (source) => {
  const found = [];
  for (const pattern of IMPORT_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      const line = source.slice(0, match.index).split("\n").length;
      found.push({ specifier: match[1], line });
    }
  }
  return found;
};

/** リポジトリ相対パスを層へ分類する。 */
const layerOf = (repoPath) => {
  const appMatch = /^apps\/desktop\/src\/(.*)$/.exec(repoPath);
  if (appMatch !== null) {
    const rest = appMatch[1];
    if (rest.startsWith("features/")) {
      const segments = rest.split("/");
      const featurePath = [];
      let index = 0;
      while (segments[index] === "features" && segments[index + 1] !== undefined) {
        featurePath.push(segments[index + 1]);
        index += 2;
      }
      const inner = segments.slice(index).join("/");
      return {
        kind: inner.startsWith("domains") ? "feature-domains" : "feature",
        feature: featurePath.join("/"),
        featureDepth: featurePath.length,
        isFeatureRoot: inner === "" || inner === "index.ts",
      };
    }
    if (rest.startsWith("appShell")) {
      return { kind: "appShell" };
    }
    if (rest.startsWith("libs")) {
      return { kind: "libs" };
    }
    if (rest.startsWith("utils") || rest.startsWith("types")) {
      return { kind: "shared" };
    }
    return { kind: "entry" };
  }
  const packageMatch = /^packages\/([^/]+)\/src(?:\/(.*))?$/.exec(repoPath);
  if (packageMatch !== null) {
    return { kind: "package", package: packageMatch[1] };
  }
  return { kind: "outside" };
};

/** import 指定子を層へ解決する。外部パッケージはそのまま返す。 */
const resolveTarget = (fromFile, specifier) => {
  if (specifier.startsWith("@/")) {
    return layerOf(relative(ROOT, join(APP_SRC, specifier.slice(2))));
  }
  if (specifier.startsWith(".")) {
    return layerOf(relative(ROOT, resolve(dirname(fromFile), specifier)));
  }
  const workspace = /^@domain-modeler\/([^/]+)(\/.*)?$/.exec(specifier);
  if (workspace !== null) {
    return { kind: "package", package: workspace[1], viaExports: true };
  }
  return { kind: "external", specifier };
};

const isTestFile = (repoPath) =>
  /\.(test|stories)\.tsx?$/.test(repoPath) ||
  repoPath.includes("/__tests__/") ||
  repoPath.includes("test-support");

const RULES = [
  {
    id: "no-domains-to-libs",
    message: "features/<x>/domains は libs を import しない(副作用は operations で受け取る)",
    violates: (from, to) => from.kind === "feature-domains" && to.kind === "libs",
  },
  {
    id: "no-domains-to-react",
    message: "features/<x>/domains は React に依存しない",
    violates: (from, to) =>
      from.kind === "feature-domains" &&
      to.kind === "external" &&
      /^react(-dom)?(\/|$)/.test(to.specifier),
  },
  {
    id: "no-direct-ipc",
    message: "Tauri API の呼び出しは libs/ に閉じる",
    violates: (from, to) =>
      from.kind !== "libs" &&
      to.kind === "external" &&
      to.specifier.startsWith("@tauri-apps/"),
    skipTests: true,
  },
  {
    id: "no-feature-deep-import",
    message: "feature の公開APIは index.ts のみ(他 feature の内部への import は禁止)",
    violates: (from, to) =>
      (to.kind === "feature" || to.kind === "feature-domains") &&
      to.isFeatureRoot !== true &&
      from.feature !== to.feature,
  },
  {
    id: "no-feature-to-appshell",
    message: "features は appShell を import しない(依存は appShell -> features の一方向)",
    violates: (from, to) =>
      (from.kind === "feature" || from.kind === "feature-domains") && to.kind === "appShell",
  },
  {
    id: "no-shared-to-upper",
    message: "utils / types は features / appShell / libs / パッケージを import しない",
    violates: (from, to) =>
      from.kind === "shared" &&
      ["feature", "feature-domains", "appShell", "libs", "package"].includes(to.kind),
  },
  {
    id: "no-libs-to-upper",
    message: "libs は features / appShell / パッケージを import しない",
    violates: (from, to) =>
      from.kind === "libs" &&
      ["feature", "feature-domains", "appShell", "package"].includes(to.kind),
  },
  {
    id: "no-package-to-app",
    message: "パッケージは apps 側を import しない(headless コアを保つ)",
    violates: (from, to) =>
      from.kind === "package" &&
      ["feature", "feature-domains", "appShell", "libs", "shared", "entry"].includes(to.kind),
  },
  {
    id: "no-package-to-ui",
    message: "パッケージは React / Tauri API に依存しない(headless コアを保つ)",
    violates: (from, to) =>
      from.kind === "package" &&
      to.kind === "external" &&
      (/^react(-dom)?(\/|$)/.test(to.specifier) || to.specifier.startsWith("@tauri-apps/")),
  },
  {
    id: "no-package-internals",
    message: "パッケージの公開APIは exports のみ(src 内部への import は禁止)",
    violates: (from, to) =>
      to.kind === "package" &&
      from.kind !== "package" &&
      to.viaExports !== true,
  },
];

const NEST_DEPTH_RULE = {
  id: "feature-nest-depth",
  message: "feature のネストは features/<親>/features/<子> の2段まで",
};
const FEATURE_CYCLE_RULE = {
  id: "no-feature-cycle",
  message: "feature 同士の循環参照は禁止(共有部分を1つ上の階層へ上げるか1つにまとめる)",
};

/** feature フォルダを列挙し、ネストの深さが2段を超えるものを返す。 */
const collectOverNestedFeatures = () => {
  const overNested = [];
  const walk = (directory, depth) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const path = join(directory, entry.name);
      if (entry.name !== "features") {
        walk(path, depth);
        continue;
      }
      for (const feature of readdirSync(path, { withFileTypes: true })) {
        if (!feature.isDirectory()) {
          continue;
        }
        if (depth + 1 > 2) {
          overNested.push(relative(ROOT, join(path, feature.name)));
        }
        walk(join(path, feature.name), depth + 1);
      }
    }
  };
  walk(APP_SRC, 0);
  return overNested;
};

/** feature 間の参照から循環を1つずつ取り出す。 */
const collectFeatureCycles = (edges) => {
  const cycles = [];
  const state = new Map();
  const stack = [];
  const visit = (feature) => {
    state.set(feature, "visiting");
    stack.push(feature);
    for (const next of edges.get(feature) ?? []) {
      if (state.get(next) === "visiting") {
        cycles.push([...stack.slice(stack.indexOf(next)), next]);
        continue;
      }
      if (state.get(next) === undefined) {
        visit(next);
      }
    }
    stack.pop();
    state.set(feature, "visited");
  };
  for (const feature of edges.keys()) {
    if (state.get(feature) === undefined) {
      visit(feature);
    }
  }
  return cycles;
};

const violations = [];
const featureEdges = new Map();
for (const file of [...collectSourceFiles(APP_SRC), ...collectSourceFiles(PACKAGES)]) {
  const repoPath = relative(ROOT, file);
  const from = layerOf(repoPath);
  const source = readFileSync(file, "utf8");
  for (const { specifier, line } of collectImports(source)) {
    const to = resolveTarget(file, specifier);
    if (
      (from.kind === "feature" || from.kind === "feature-domains") &&
      (to.kind === "feature" || to.kind === "feature-domains") &&
      from.feature !== to.feature &&
      !isTestFile(repoPath)
    ) {
      const next = featureEdges.get(from.feature) ?? new Set();
      next.add(to.feature);
      featureEdges.set(from.feature, next);
    }
    for (const rule of RULES) {
      if (rule.skipTests === true && isTestFile(repoPath)) {
        continue;
      }
      if (rule.violates(from, to)) {
        violations.push({ repoPath, line, specifier, rule });
      }
    }
  }
}

for (const feature of collectOverNestedFeatures()) {
  violations.push({
    repoPath: feature,
    line: 1,
    specifier: feature,
    rule: NEST_DEPTH_RULE,
  });
}

for (const cycle of collectFeatureCycles(featureEdges)) {
  violations.push({
    repoPath: `apps/desktop/src/features/${cycle[0]}`,
    line: 1,
    specifier: cycle.join(" -> "),
    rule: FEATURE_CYCLE_RULE,
  });
}

if (violations.length === 0) {
  console.log("module boundaries: ok");
  process.exit(0);
}

const sorted = [...violations].sort((a, b) =>
  a.repoPath === b.repoPath ? a.line - b.line : a.repoPath.localeCompare(b.repoPath),
);
for (const violation of sorted) {
  console.error(
    `${violation.repoPath}:${violation.line}  [${violation.rule.id}] ${violation.specifier}\n    ${violation.rule.message}`,
  );
}
console.error(`\nmodule boundaries: ${sorted.length} violation(s)`);
process.exit(1);
