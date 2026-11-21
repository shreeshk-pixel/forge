# Forge

A Java course you finish by writing code. Thirty-eight lessons, in order: basics, then real OOP, then data structures and algorithms, including 0/1 knapsack, Floyd-Warshall, and Dijkstra.

Each lesson has hidden tests. The next one stays locked until this one passes. After that you can revisit anything you have already opened. Progress stays in the browser.

Hints cost shards. You start with 3, the cap is 5, and one comes back every four hours. A solution costs 2 shards and only after you have read the hint. A clean pass is 3 stars, a hinted pass is 2, and using the solution leaves you with 1. A later clean solve can raise the star count. It never lowers it.

The checker runs in the browser. It understands the Java used on this path: classes, constructors, `this` and `super`, public and private, static, inheritance, overriding, overloading, abstract classes, interfaces, arrays, `ArrayList`, `HashMap`, `Stack`, `Queue`, `ArrayDeque`, and the usual `String` and `Math` methods. It is not a full JDK. No generics diamond, `switch`, try/catch, or ternary.

## Run locally

```bash
npm install
npm run dev
```

## Deploy

This is a TanStack Start app built with Nitro's Vercel preset.

- Build command: `npm run build`
- Output is written to `.vercel/output`
