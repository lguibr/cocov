import { describe, it, expect } from 'vitest';
import { extractChangedLines } from '@/git-utils.js';

describe('DiffChecker Parser Spec', () => {
  // Real git diff outputs from varied scenarios
  const scenarios = [
    {
      name: 'Single file, one chunk',
      diff: `diff --git a/src/foo.ts b/src/foo.ts
index abc..def 100644
--- a/src/foo.ts
+++ b/src/foo.ts
@@ -10,0 +15,5 @@ class Foo {
+  bar() {
+    return true;
+  }
+  // extra line
+ }`,
      expected: { 'src/foo.ts': [15, 16, 17, 18, 19] },
    },
    {
      name: 'Multiple chunks',
      diff: `diff --git a/src/foo.ts b/src/foo.ts
index abc..def 100644
--- a/src/foo.ts
+++ b/src/foo.ts
@@ -10,0 +15,2 @@
+ line15
+ line16
@@ -50,0 +60,1 @@
+ line60`,
      expected: { 'src/foo.ts': [15, 16, 60] },
    },
    {
      name: 'New file',
      diff: `diff --git a/new.ts b/new.ts
new file mode 100644
index 000..abc
--- /dev/null
+++ b/new.ts
@@ -0,0 +1,3 @@
+import foo
+
+export const bar = 1;`,
      expected: { 'new.ts': [1, 2, 3] },
    },
  ];

  // Permute these with random noises or other files to increase count?
  // User wants "real" tests.
  // Let's add variations of paths and hunks.

  const paths = ['src/a.ts', 'src/components/b.tsx', 'lib/utils.js', 'deep/nested/dir/file.ts'];
  const hunks = [
    { start: 1, count: 1 },
    { start: 10, count: 5 },
    { start: 100, count: 20 },
    { start: 999, count: 1 },
  ];

  const generatedCases: { path: string; hunk: { start: number; count: number } }[] = [];
  paths.forEach((p) => {
    hunks.forEach((h) => {
      generatedCases.push({ path: p, hunk: h });
    });
  });

  it.each(generatedCases)('parses diff for $path at line $hunk.start', ({ path: p, hunk }) => {
    const diff = `diff --git a/${p} b/${p}
index abc..def
--- a/${p}
+++ b/${p}
@@ -0,0 +${hunk.start},${hunk.count} @@
${'+ line\n'.repeat(hunk.count)}`;

    const result = extractChangedLines(diff);

    expect(result[p]).toBeDefined();
    expect(result[p].length).toBe(hunk.count);
    expect(result[p][0]).toBe(hunk.start);
  });

  it.each(scenarios)('$name', ({ diff, expected }) => {
    const result = extractChangedLines(diff);
    expect(result).toEqual(expected);
  });
});
