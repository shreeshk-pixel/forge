import { grade, runMain } from "./engine.ts";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  }
}

function check(title: string, source: string, checks: { label: string; code: string }[], expectPass: boolean) {
  const g = grade(source, checks);
  const ok = !g.compileError && g.results.every((r) => r.ok);
  if (ok !== expectPass) {
    console.error("CASE", title);
    console.error(JSON.stringify(g, null, 2));
    process.exitCode = 1;
  } else {
    console.log("ok", title);
  }
  assert(ok === expectPass, title);
}

check(
  "add",
  `class Solution {
    public static int add(int a, int b) { return a + b; }
  }`,
  [{ label: "2+3", code: `if (Solution.add(2, 3) != 5) throw new RuntimeException("bad");` }],
  true,
);

check(
  "string equals not ==",
  `class Solution {
    public static boolean isHello(String s) { return s.equals("hello"); }
  }`,
  [{ label: "concat", code: `String a = "he" + "llo"; if (!Solution.isHello(a)) throw new RuntimeException("equals failed");` }],
  true,
);

check(
  "== fails on concat",
  `class Solution {
    public static boolean isHello(String s) { return s == "hello"; }
  }`,
  [{ label: "concat", code: `String a = "he" + "llo"; if (!Solution.isHello(a)) throw new RuntimeException("ref");` }],
  false,
);

check(
  "class",
  `class Counter {
    private int n;
    public Counter(int n) { this.n = n; }
    public void add(int d) { n = n + d; }
    public int get() { return n; }
  }`,
  [
    {
      label: "mutate",
      code: `Counter c = new Counter(2); c.add(3); if (c.get() != 5) throw new RuntimeException("got " + c.get());`,
    },
  ],
  true,
);

check(
  "inherit",
  `class Animal {
    public String sound() { return "?"; }
  }
  class Dog extends Animal {
    public String sound() { return "woof"; }
  }`,
  [{ label: "override", code: `Animal a = new Dog(); if (!a.sound().equals("woof")) throw new RuntimeException(a.sound());` }],
  true,
);

check(
  "list",
  `class Solution {
    public static int sum(ArrayList xs) {
      int s = 0;
      for (int i = 0; i < xs.size(); i++) s = s + xs.get(i);
      return s;
    }
  }`,
  [
    {
      label: "sum",
      code: `ArrayList xs = new ArrayList(); xs.add(1); xs.add(2); xs.add(4); if (Solution.sum(xs) != 7) throw new RuntimeException("no");`,
    },
  ],
  true,
);

check(
  "recursion",
  `class Solution {
    public static int fact(int n) {
      if (n <= 1) return 1;
      return n * fact(n - 1);
    }
  }`,
  [{ label: "fact5", code: `if (Solution.fact(5) != 120) throw new RuntimeException("" + Solution.fact(5));` }],
  true,
);

check(
  "linked",
  `class Node {
    int val;
    Node next;
    public Node(int v) { val = v; next = null; }
  }
  class Solution {
    public static int sum(Node head) {
      int s = 0;
      while (head != null) { s = s + head.val; head = head.next; }
      return s;
    }
  }`,
  [
    {
      label: "sum",
      code: `Node a = new Node(1); Node b = new Node(2); a.next = b; if (Solution.sum(a) != 3) throw new RuntimeException("bad");`,
    },
  ],
  true,
);

check(
  "interface",
  `interface Shape { int area(); }
   class Rect implements Shape {
     int w; int h;
     public Rect(int w, int h) { this.w = w; this.h = h; }
     public int area() { return w * h; }
   }`,
  [{ label: "area", code: `Shape s = new Rect(3, 4); if (s.area() != 12) throw new RuntimeException("no");` }],
  true,
);

check(
  "map",
  `class Solution {
    public static int two(int[] a, int t) {
      HashMap map = new HashMap();
      for (int i = 0; i < a.length; i++) {
        int need = t - a[i];
        if (map.containsKey(need)) return map.get(need);
        map.put(a[i], i);
      }
      return -1;
    }
  }`,
  [
    {
      label: "idx",
      code: `int[] a = new int[]{2, 7, 11}; if (Solution.two(a, 9) != 0) throw new RuntimeException("" + Solution.two(a, 9));`,
    },
  ],
  true,
);

check(
  "sort",
  `class Solution {
    public static void insertion(int[] a) {
      for (int i = 1; i < a.length; i++) {
        int key = a[i];
        int j = i - 1;
        while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j = j - 1; }
        a[j + 1] = key;
      }
    }
  }`,
  [
    {
      label: "sorted",
      code: `int[] a = new int[]{3, 1, 2}; Solution.insertion(a); if (a[0] != 1 || a[1] != 2 || a[2] != 3) throw new RuntimeException("order");`,
    },
  ],
  true,
);

check(
  "floyd",
  `class Solution {
    public static int[][] floyd(int[][] g) {
      int n = g.length;
      int[][] d = new int[n][n];
      for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) d[i][j] = g[i][j];
      }
      for (int k = 0; k < n; k++) {
        for (int i = 0; i < n; i++) {
          for (int j = 0; j < n; j++) {
            if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
          }
        }
      }
      return d;
    }
  }`,
  [
    {
      label: "path",
      code: `int INF = 1000000000; int[][] g = new int[][]{{0, 3, INF},{INF, 0, 1},{INF, INF, 0}}; int[][] d = Solution.floyd(g); if (d[0][2] != 4) throw new RuntimeException("" + d[0][2]);`,
    },
  ],
  true,
);

const main = runMain(`class Solution {
  public static void main(String[] args) { System.out.println(2 + 3); }
}`);
assert(main.error === null && main.output.trim() === "5", "main got " + JSON.stringify(main));
console.log("ok main");

if (process.exitCode) console.error("selftest failed");
else console.log("all good");
