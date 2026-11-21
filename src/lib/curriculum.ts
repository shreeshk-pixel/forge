import { grade, type Check, type GradeResult } from "./java/engine.ts";

export type ModuleId = "Basics" | "OOP" | "DSA";

export type Lesson = {
  id: string;
  module: ModuleId;
  title: string;
  blurb: string;
  concept: string[];
  task: string;
  starter: string;
  solution: string;
  hint: string;
  checks: Check[];
  mustContain?: string[];
  singleLoop?: boolean;
};

export const modules: { id: ModuleId; summary: string }[] = [
  {
    id: "Basics",
    summary: "Types, decisions, loops, methods, arrays, and strings. The grammar everything else sits on.",
  },
  {
    id: "OOP",
    summary: "Classes that own their data, then inheritance, interfaces, and the equals contract.",
  },
  {
    id: "DSA",
    summary: "Lists, hash maps, trees, search, and the classic knapsack, Floyd-Warshall, and Dijkstra problems.",
  },
];

const INF = "1000000000";

export const lessons: Lesson[] = [
  {
    id: "variables",
    module: "Basics",
    title: "Variables and types",
    blurb: "Name a value, then use the name.",
    concept: [
      "A variable is a typed name for a value. `int` holds whole numbers, `String` holds text, `boolean` holds true or false.",
      "Declare it, assign it, then use it. The name is for you; the type is for the compiler. In this course, declare the variable before you return it.",
    ],
    task: "Return the bill for `qty` items at `price` each. Store the product in a variable named `total` before returning it.",
    starter: `class Solution {
  public static int bill(int price, int qty) {
    return 0;
  }
}
`,
    solution: `class Solution {
  public static int bill(int price, int qty) {
    int total = price * qty;
    return total;
  }
}
`,
    hint: "Declare `int total` and set it to `price * qty`. Return that variable, not the expression inline.",
    mustContain: ["total"],
    checks: [
      { label: "2 × 5", code: `if (Solution.bill(2, 5) != 10) throw new RuntimeException("expected 10");` },
      { label: "0 items", code: `if (Solution.bill(40, 0) != 0) throw new RuntimeException("expected 0");` },
      { label: "larger", code: `if (Solution.bill(19, 3) != 57) throw new RuntimeException("expected 57");` },
    ],
  },
  {
    id: "operators",
    module: "Basics",
    title: "Operators",
    blurb: "Arithmetic, including division that drops the fraction.",
    concept: [
      "`+ - *` behave as you expect. For two `int`s, `/` is integer division: `7 / 2` is `3`, not `3.5`. `%` is the remainder: `7 % 2` is `1`.",
      "That pair shows up constantly: converting a count into groups, pulling digits off a number, and cycling through a fixed range.",
    ],
    task: "Write `groups` (how many full boxes) and `leftover` (apples that do not fill a box).",
    starter: `class Solution {
  public static int groups(int apples, int box) {
    return 0;
  }
  public static int leftover(int apples, int box) {
    return 0;
  }
}
`,
    solution: `class Solution {
  public static int groups(int apples, int box) {
    return apples / box;
  }
  public static int leftover(int apples, int box) {
    return apples % box;
  }
}
`,
    hint: "Full boxes are `apples / box`. What does not fit is `apples % box`.",
    checks: [
      { label: "boxes", code: `if (Solution.groups(10, 3) != 3) throw new RuntimeException("groups");` },
      { label: "remainder", code: `if (Solution.leftover(10, 3) != 1) throw new RuntimeException("leftover");` },
      { label: "exact", code: `if (Solution.groups(8, 4) != 2 || Solution.leftover(8, 4) != 0) throw new RuntimeException("exact");` },
    ],
  },
  {
    id: "conditionals",
    module: "Basics",
    title: "Conditionals",
    blurb: "Choose a path with if / else.",
    concept: [
      "`if` runs a block only when its condition is true. `else` covers the rest. You can chain them: `if / else if / else`.",
      "Conditions must be booleans. `==` compares numbers; for text, call `.equals`. `%` plus `==` is how you test divisibility.",
    ],
    task: "Return `FizzBuzz` when `n` is divisible by 3 and 5, `Fizz` for 3 only, `Buzz` for 5 only, otherwise the number as text.",
    starter: `class Solution {
  public static String fizz(int n) {
    return "";
  }
}
`,
    solution: `class Solution {
  public static String fizz(int n) {
    if (n % 3 == 0 && n % 5 == 0) return "FizzBuzz";
    if (n % 3 == 0) return "Fizz";
    if (n % 5 == 0) return "Buzz";
    return "" + n;
  }
}
`,
    hint: "Check the combined case first. If you test 3 before 15, 15 becomes Fizz and never reaches FizzBuzz. `\"\" + n` turns the number into text.",
    checks: [
      { label: "15", code: `if (!Solution.fizz(15).equals("FizzBuzz")) throw new RuntimeException("15");` },
      { label: "9", code: `if (!Solution.fizz(9).equals("Fizz")) throw new RuntimeException("9");` },
      { label: "10", code: `if (!Solution.fizz(10).equals("Buzz")) throw new RuntimeException("10");` },
      { label: "7", code: `if (!Solution.fizz(7).equals("7")) throw new RuntimeException("7");` },
    ],
  },
  {
    id: "for-loops",
    module: "Basics",
    title: "For loops",
    blurb: "Repeat a counted number of times.",
    concept: [
      "`for (int i = 0; i < n; i++)` has three parts: start, keep-going test, and step. The body runs once per value of `i`.",
      "`i++` is `i = i + 1`. The loop variable lives only inside the loop.",
    ],
    task: "Return the sum of the whole numbers from 1 through `n` inclusive. `n` is at least 1.",
    starter: `class Solution {
  public static int sumTo(int n) {
    return 0;
  }
}
`,
    solution: `class Solution {
  public static int sumTo(int n) {
    int s = 0;
    for (int i = 1; i <= n; i++) s = s + i;
    return s;
  }
}
`,
    hint: "Start `i` at 1 and keep going while `i <= n`. Add `i` into a variable on each pass.",
    checks: [
      { label: "1", code: `if (Solution.sumTo(1) != 1) throw new RuntimeException("1");` },
      { label: "5", code: `if (Solution.sumTo(5) != 15) throw new RuntimeException("5");` },
      { label: "10", code: `if (Solution.sumTo(10) != 55) throw new RuntimeException("10");` },
    ],
  },
  {
    id: "while-loops",
    module: "Basics",
    title: "While loops",
    blurb: "Repeat until a condition breaks.",
    concept: [
      "Use `while` when you do not know the count up front. The test is checked before every pass, including the first.",
      "A classic use is peeling digits: `% 10` takes the last digit, `/ 10` drops it. Stop when the number becomes 0.",
    ],
    task: "Reverse the digits of a non-negative `n`. `1200` becomes `21` because leading zeros in the result are just zeros.",
    starter: `class Solution {
  public static int reverse(int n) {
    return 0;
  }
}
`,
    solution: `class Solution {
  public static int reverse(int n) {
    int r = 0;
    while (n > 0) {
      r = r * 10 + n % 10;
      n = n / 10;
    }
    return r;
  }
}
`,
    hint: "Keep a result `r`. Each pass, do `r = r * 10 + n % 10` and then `n = n / 10` until `n` is 0.",
    checks: [
      { label: "123", code: `if (Solution.reverse(123) != 321) throw new RuntimeException("123");` },
      { label: "1200", code: `if (Solution.reverse(1200) != 21) throw new RuntimeException("1200");` },
      { label: "0", code: `if (Solution.reverse(0) != 0) throw new RuntimeException("0");` },
    ],
  },
  {
    id: "methods",
    module: "Basics",
    title: "Methods",
    blurb: "Name a computation so you can call it.",
    concept: [
      "A method is a block with a name, parameters, and a return type. `void` means it returns nothing. Call it with arguments; inside, those names are the parameters.",
      "Small methods are how you keep a program readable. Later, classes are mostly a pile of methods gathered around data.",
    ],
    task: "Write `clamp` so the result is never below `lo` and never above `hi`. Assume `lo <= hi`.",
    starter: `class Solution {
  public static int clamp(int x, int lo, int hi) {
    return x;
  }
}
`,
    solution: `class Solution {
  public static int clamp(int x, int lo, int hi) {
    if (x < lo) return lo;
    if (x > hi) return hi;
    return x;
  }
}
`,
    hint: "Three cases: too small, too big, or already inside. `Math.max` and `Math.min` are also available if you want them.",
    checks: [
      { label: "inside", code: `if (Solution.clamp(5, 0, 10) != 5) throw new RuntimeException("inside");` },
      { label: "low", code: `if (Solution.clamp(-3, 0, 10) != 0) throw new RuntimeException("low");` },
      { label: "high", code: `if (Solution.clamp(40, 0, 10) != 10) throw new RuntimeException("high");` },
    ],
  },
  {
    id: "arrays",
    module: "Basics",
    title: "Arrays",
    blurb: "A fixed row of values, indexed from 0.",
    concept: [
      "`int[] a` is an array. `a.length` is how many slots it has. `a[0]` is the first slot. The last index is `a.length - 1`.",
      "Going off either end stops the program. Loops over arrays almost always look like `for (int i = 0; i < a.length; i++)`.",
    ],
    task: "Return the largest value in a non-empty `int` array.",
    starter: `class Solution {
  public static int maxOf(int[] a) {
    return 0;
  }
}
`,
    solution: `class Solution {
  public static int maxOf(int[] a) {
    int m = a[0];
    for (int i = 1; i < a.length; i++) {
      if (a[i] > m) m = a[i];
    }
    return m;
  }
}
`,
    hint: "Start from `a[0]`, not from 0. A negative array would make 0 look like the max.",
    checks: [
      { label: "mixed", code: `int[] a = new int[]{3, 9, 2}; if (Solution.maxOf(a) != 9) throw new RuntimeException("mixed");` },
      { label: "negatives", code: `int[] a = new int[]{-5, -1, -8}; if (Solution.maxOf(a) != -1) throw new RuntimeException("neg");` },
      { label: "one", code: `int[] a = new int[]{4}; if (Solution.maxOf(a) != 4) throw new RuntimeException("one");` },
    ],
  },
  {
    id: "strings",
    module: "Basics",
    title: "Strings",
    blurb: "Text is not compared with ==.",
    concept: [
      "A `String` is immutable text. `length()` is a method (unlike array `.length`). `charAt(i)` reads one character. `substring`, `indexOf`, and `equals` do the rest of the daily work.",
      "`==` asks whether two strings are the same object in memory. Two values with the same letters can still fail `==`. Use `.equals` when you mean the letters.",
    ],
    task: "Return true when `s` reads the same forwards and backwards. Compare characters, do not use `==` on the whole string.",
    starter: `class Solution {
  public static boolean palindrome(String s) {
    return false;
  }
}
`,
    solution: `class Solution {
  public static boolean palindrome(String s) {
    int i = 0;
    int j = s.length() - 1;
    while (i < j) {
      if (s.charAt(i) != s.charAt(j)) return false;
      i = i + 1;
      j = j - 1;
    }
    return true;
  }
}
`,
    hint: "Put one index at the start and one at the end. Walk inward. Characters compare with `!=` because `charAt` gives you a char, not a String object.",
    checks: [
      { label: "kayak", code: `String w = "ka" + "yak"; if (!Solution.palindrome(w)) throw new RuntimeException("kayak");` },
      { label: "no", code: `if (Solution.palindrome("word")) throw new RuntimeException("word");` },
      { label: "single", code: `if (!Solution.palindrome("z")) throw new RuntimeException("z");` },
    ],
  },
  {
    id: "classes",
    module: "OOP",
    title: "Classes and objects",
    blurb: "A class is a template. An object is one instance.",
    concept: [
      "A class bundles fields (data) and methods (behavior). `new Counter()` makes an object. Each object has its own fields.",
      "Inside a method, bare field names refer to the current object. `this` is that object, when you need to be explicit.",
    ],
    task: "A `Counter` starts at 0. `add` increases it. `get` returns the current value.",
    starter: `class Counter {
  int n;
  public void add(int d) {
  }
  public int get() {
    return 0;
  }
}
`,
    solution: `class Counter {
  int n;
  public void add(int d) {
    n = n + d;
  }
  public int get() {
    return n;
  }
}
`,
    hint: "You do not need a constructor yet. Unset `int` fields start at 0. Update `n` inside `add`.",
    checks: [
      { label: "grows", code: `Counter c = new Counter(); c.add(2); c.add(5); if (c.get() != 7) throw new RuntimeException("got " + c.get());` },
      { label: "separate", code: `Counter a = new Counter(); Counter b = new Counter(); a.add(1); if (b.get() != 0 || a.get() != 1) throw new RuntimeException("shared");` },
    ],
  },
  {
    id: "constructors",
    module: "OOP",
    title: "Constructors",
    blurb: "Set an object up in the same breath you create it.",
    concept: [
      "A constructor has the class name and no return type. It runs on `new`. Use `this.field` when a parameter has the same name as a field.",
      "If you write any constructor, Java no longer provides the empty one. That is useful: you can refuse to exist without the data you need.",
    ],
    task: "A `Point` is constructed with `x` and `y`. `manhattan` returns `|x| + |y|` from the origin. `Math.abs` is available.",
    starter: `class Point {
  int x;
  int y;
  public int manhattan() {
    return 0;
  }
}
`,
    solution: `class Point {
  int x;
  int y;
  public Point(int x, int y) {
    this.x = x;
    this.y = y;
  }
  public int manhattan() {
    return Math.abs(x) + Math.abs(y);
  }
}
`,
    hint: "Add `public Point(int x, int y)` and assign `this.x = x`. The distance is `Math.abs(x) + Math.abs(y)`.",
    checks: [
      { label: "3,4", code: `Point p = new Point(3, 4); if (p.manhattan() != 7) throw new RuntimeException("7");` },
      { label: "negative", code: `Point p = new Point(-2, 5); if (p.manhattan() != 7) throw new RuntimeException("neg");` },
    ],
  },
  {
    id: "encapsulation",
    module: "OOP",
    title: "Encapsulation",
    blurb: "The object guards its own data.",
    concept: [
      "`private` fields can be touched only by methods of the same class. Callers go through methods, so the object can reject nonsense (a negative deposit, a balance below zero).",
      "Getters and setters are the boring version of this. The useful version is methods that describe actions: `deposit`, not `setBalance`.",
    ],
    task: "Build a `Wallet`. Balance starts at the constructor amount. `deposit` adds a positive amount. `spend` subtracts only when the wallet can afford it and returns whether it did. `getBalance` is the only way out.",
    starter: `class Wallet {
  public Wallet(int start) {
  }
  public void deposit(int amount) {
  }
  public boolean spend(int amount) {
    return false;
  }
  public int getBalance() {
    return 0;
  }
}
`,
    solution: `class Wallet {
  private int balance;
  public Wallet(int start) {
    this.balance = start;
  }
  public void deposit(int amount) {
    if (amount > 0) balance = balance + amount;
  }
  public boolean spend(int amount) {
    if (amount <= 0 || amount > balance) return false;
    balance = balance - amount;
    return true;
  }
  public int getBalance() {
    return balance;
  }
}
`,
    hint: "Keep `balance` private. `spend` should check `amount > balance` before changing anything, and return false when it refuses.",
    mustContain: ["private"],
    checks: [
      { label: "deposit", code: `Wallet w = new Wallet(10); w.deposit(5); if (w.getBalance() != 15) throw new RuntimeException("dep");` },
      { label: "refuse", code: `Wallet w = new Wallet(10); if (w.spend(12) || w.getBalance() != 10) throw new RuntimeException("refuse");` },
      { label: "spend", code: `Wallet w = new Wallet(10); if (!w.spend(4) || w.getBalance() != 6) throw new RuntimeException("spend");` },
      { label: "ignore bad deposit", code: `Wallet w = new Wallet(10); w.deposit(-3); if (w.getBalance() != 10) throw new RuntimeException("neg");` },
    ],
  },
  {
    id: "static-members",
    module: "OOP",
    title: "Static members",
    blurb: "One copy for the class, not one per object.",
    concept: [
      "`static` fields and methods belong to the class. You call them as `Ticket.getSold()` even when no ticket exists, and they cannot see instance fields unless you hand them an object.",
      "Use static for counters, factories, and pure functions. Use instance methods when the answer depends on one object's data.",
    ],
    task: "Every `new Ticket()` increases a static sold-count. `getSold` returns that count.",
    starter: `class Ticket {
  public Ticket() {
  }
  public static int getSold() {
    return 0;
  }
}
`,
    solution: `class Ticket {
  private static int sold;
  public Ticket() {
    sold = sold + 1;
  }
  public static int getSold() {
    return sold;
  }
}
`,
    hint: "Declare `static int sold` on the class. The constructor increments it. `getSold` just returns it. Each test starts from zero again.",
    mustContain: ["static"],
    checks: [
      { label: "three", code: `new Ticket(); new Ticket(); new Ticket(); if (Ticket.getSold() != 3) throw new RuntimeException("" + Ticket.getSold());` },
      { label: "none", code: `if (Ticket.getSold() != 0) throw new RuntimeException("fresh");` },
    ],
  },
  {
    id: "inheritance",
    module: "OOP",
    title: "Inheritance",
    blurb: "A subclass is the parent, plus more.",
    concept: [
      "`class Manager extends Employee` means a manager is an employee. The subclass inherits fields and methods. `super(salary)` calls the parent constructor and must be the first line.",
      "Private parent fields stay private. If the subclass needs them, the parent exposes a method. Prefer that over making everything public.",
    ],
    task: "`Employee.pay` is the salary. `Manager.pay` is salary plus bonus. Build both. Manager must call `super`.",
    starter: `class Employee {
  public Employee(int salary) {
  }
  public int pay() { return 0; }
}
class Manager extends Employee {
  public Manager(int salary, int bonus) {
  }
  public int pay() { return 0; }
}
`,
    solution: `class Employee {
  private int salary;
  public Employee(int salary) { this.salary = salary; }
  public int getSalary() { return salary; }
  public int pay() { return salary; }
}
class Manager extends Employee {
  private int bonus;
  public Manager(int salary, int bonus) {
    super(salary);
    this.bonus = bonus;
  }
  public int pay() { return getSalary() + bonus; }
}
`,
    hint: "Store salary privately on Employee and add `getSalary`. Manager's constructor starts with `super(salary)`, then stores the bonus. Override `pay`.",
    mustContain: ["super"],
    checks: [
      { label: "employee", code: `Employee e = new Employee(100); if (e.pay() != 100) throw new RuntimeException("emp");` },
      { label: "manager", code: `Manager m = new Manager(100, 25); if (m.pay() != 125) throw new RuntimeException("mgr");` },
      { label: "as employee", code: `Employee e = new Manager(100, 25); if (e.pay() != 125) throw new RuntimeException("poly");` },
    ],
  },
  {
    id: "overriding",
    module: "OOP",
    title: "Overriding",
    blurb: "The object's real class decides which method runs.",
    concept: [
      "Overriding replaces a parent method with the same name and parameters. A variable typed as the parent can still hold a child. The call uses the child method. That is dynamic dispatch.",
      "This is different from overloading, which is several methods that share a name but take different parameters. Overload is chosen at compile time. Override is chosen at run time.",
    ],
    task: "`describe` on Animal returns `animal`. Dog returns `dog`, Cat returns `cat`. A method `label` takes an `Animal` and returns whatever `describe` says for the real object.",
    starter: `class Animal {
  public String describe() { return "animal"; }
}
class Dog extends Animal {
}
class Cat extends Animal {
}
class Solution {
  public static String label(Animal a) {
    return "";
  }
}
`,
    solution: `class Animal {
  public String describe() { return "animal"; }
}
class Dog extends Animal {
  public String describe() { return "dog"; }
}
class Cat extends Animal {
  public String describe() { return "cat"; }
}
class Solution {
  public static String label(Animal a) {
    return a.describe();
  }
}
`,
    hint: "Override `describe` in Dog and Cat. `label` should not ask what the object is. Just call `a.describe()` and let dispatch do it.",
    checks: [
      { label: "dog", code: `if (!Solution.label(new Dog()).equals("dog")) throw new RuntimeException("dog");` },
      { label: "cat", code: `if (!Solution.label(new Cat()).equals("cat")) throw new RuntimeException("cat");` },
      { label: "animal", code: `if (!Solution.label(new Animal()).equals("animal")) throw new RuntimeException("animal");` },
    ],
  },
  {
    id: "overloading",
    module: "OOP",
    title: "Overloading",
    blurb: "Same name, different parameter lists.",
    concept: [
      "You can declare `add` more than once if the parameter lists differ. The call site picks the best match. Return type alone is not enough to overload.",
      "Do not use overloading to sneak in unrelated behavior. `add` should still mean add.",
    ],
    task: "In `Calc`, overload `add` for two ints, three ints, and two strings (concatenation).",
    starter: `class Calc {
  public static int add(int a, int b) {
    return 0;
  }
}
`,
    solution: `class Calc {
  public static int add(int a, int b) { return a + b; }
  public static int add(int a, int b, int c) { return a + b + c; }
  public static String add(String a, String b) { return a + b; }
}
`,
    hint: "Write three methods, all named `add`. The string version returns `a + b`, which concatenates when either side is text.",
    checks: [
      { label: "two", code: `if (Calc.add(2, 3) != 5) throw new RuntimeException("two");` },
      { label: "three", code: `if (Calc.add(2, 3, 4) != 9) throw new RuntimeException("three");` },
      { label: "text", code: `String s = Calc.add("ja", "va"); if (!s.equals("java")) throw new RuntimeException("text");` },
    ],
  },
  {
    id: "abstract-classes",
    module: "OOP",
    title: "Abstract classes",
    blurb: "A parent that is unfinished on purpose.",
    concept: [
      "An `abstract` class cannot be constructed. An `abstract` method has no body; a concrete subclass has to write it.",
      "The parent can still contain real methods that call the abstract one. The child fills in the missing piece, and the parent's code starts working.",
    ],
    task: "`Greeter.speak` returns `says ` plus `word()`. `word` is abstract. `Dog` says `woof`. You cannot leave `Greeter` constructable.",
    starter: `class Greeter {
  public String speak() { return "says "; }
}
class Dog extends Greeter {
}
`,
    solution: `abstract class Greeter {
  abstract String word();
  public String speak() { return "says " + word(); }
}
class Dog extends Greeter {
  public String word() { return "woof"; }
}
`,
    hint: "Mark `Greeter` abstract and declare `abstract String word();` with a semicolon, not a body. Dog implements `word`. `speak` can call `word()` and dispatch will hit Dog.",
    mustContain: ["abstract"],
    checks: [
      { label: "dog", code: `Greeter g = new Dog(); if (!g.speak().equals("says woof")) throw new RuntimeException(g.speak());` },
    ],
  },
  {
    id: "interfaces",
    module: "OOP",
    title: "Interfaces",
    blurb: "A promise of behavior, with no data of its own.",
    concept: [
      "An `interface` lists methods a class agrees to implement. A class `implements` it. Unlike a superclass, you can implement more than one.",
      "Use an interface when you care about what something can do, not what family it was born into. `Shape` does not need to be the parent of every drawable thing's data.",
    ],
    task: "`Shape` has `area()`. `Rect` and `Circle` implement it. Circle can use integer area `r * r * 3` so we stay in ints.",
    starter: `class Rect {
  public Rect(int w, int h) {}
  public int area() { return 0; }
}
class Circle {
  public Circle(int r) {}
  public int area() { return 0; }
}
`,
    solution: `interface Shape {
  int area();
}
class Rect implements Shape {
  int w; int h;
  public Rect(int w, int h) { this.w = w; this.h = h; }
  public int area() { return w * h; }
}
class Circle implements Shape {
  int r;
  public Circle(int r) { this.r = r; }
  public int area() { return r * r * 3; }
}
`,
    hint: "Declare `interface Shape { int area(); }` and add `implements Shape` to both classes. Store the sizes in fields.",
    mustContain: ["interface", "implements"],
    checks: [
      { label: "rect", code: `Shape s = new Rect(3, 4); if (s.area() != 12) throw new RuntimeException("rect");` },
      { label: "circle", code: `Shape s = new Circle(2); if (s.area() != 12) throw new RuntimeException("circle");` },
    ],
  },
  {
    id: "composition",
    module: "OOP",
    title: "Composition",
    blurb: "Has-a is usually healthier than is-a.",
    concept: [
      "Inheritance says 'is a kind of'. Composition says 'has a'. A car is not an engine. A car has an engine. The car method calls through.",
      "When you are unsure, compose. Inheritance locks a child to a parent's design. A field can be swapped.",
    ],
    task: "`Engine.start` returns `on`. `Car` owns an `Engine` created in the constructor. `Car.start` returns whatever the engine returns.",
    starter: `class Engine {
  public String start() { return ""; }
}
class Car {
  public String start() { return ""; }
}
`,
    solution: `class Engine {
  public String start() { return "on"; }
}
class Car {
  Engine engine;
  public Car() { engine = new Engine(); }
  public String start() { return engine.start(); }
}
`,
    hint: "Give Car a field of type Engine. Construct it in `Car()`. `start` is a one-line forward to `engine.start()`.",
    checks: [
      { label: "starts", code: `Car c = new Car(); if (!c.start().equals("on")) throw new RuntimeException(c.start());` },
    ],
  },
  {
    id: "equals-hashcode",
    module: "OOP",
    title: "equals and hashCode",
    blurb: "Value equality is a contract, not a vibe.",
    concept: [
      "`==` on objects asks if they are the same instance. `equals` is yours to define. The usual shape: null check, `instanceof`, cast, then compare the fields that matter.",
      "If you override `equals`, override `hashCode`. Equal objects must return the same hash. A simple version is `x * 31 + y`. Hash maps depend on this.",
    ],
    task: "Two `Point`s are equal when both coordinates match. Implement `equals(Object)` and `hashCode()`.",
    starter: `class Point {
  int x; int y;
  public Point(int x, int y) { this.x = x; this.y = y; }
}
`,
    solution: `class Point {
  int x; int y;
  public Point(int x, int y) { this.x = x; this.y = y; }
  public boolean equals(Object other) {
    if (other == null) return false;
    if (!(other instanceof Point)) return false;
    Point p = (Point) other;
    return this.x == p.x && this.y == p.y;
  }
  public int hashCode() { return x * 31 + y; }
}
`,
    hint: "Signature is `equals(Object other)`, not `equals(Point p)`. After `instanceof`, cast: `Point p = (Point) other`. `hashCode` can be `x * 31 + y`.",
    mustContain: ["equals", "hashCode", "instanceof"],
    checks: [
      { label: "equal", code: `Point a = new Point(1, 2); Point b = new Point(1, 2); if (!a.equals(b)) throw new RuntimeException("eq");` },
      { label: "differ", code: `Point a = new Point(1, 2); Point b = new Point(2, 2); if (a.equals(b)) throw new RuntimeException("ne");` },
      { label: "null", code: `Point a = new Point(1, 2); if (a.equals(null)) throw new RuntimeException("null");` },
      { label: "hash", code: `Point a = new Point(1, 2); Point b = new Point(1, 2); if (a.hashCode() != b.hashCode()) throw new RuntimeException("hash");` },
    ],
  },
  {
    id: "final-keyword",
    module: "OOP",
    title: "final",
    blurb: "A value that is not allowed to move.",
    concept: [
      "`final` on a field means it is assigned once, normally in the constructor, and never again. That makes the object's core data obvious to a reader.",
      "`final` on a class forbids `extends`. `final` on a method forbids override. Reach for the field form first. Immovable data prevents a whole family of bugs.",
    ],
    task: "`Circle` stores radius in a `final` field set by the constructor. `area` returns `r * r * 3`.",
    starter: `class Circle {
  int r;
  public Circle(int r) { this.r = r; }
  public int area() { return 0; }
}
`,
    solution: `class Circle {
  final int r;
  public Circle(int r) { this.r = r; }
  public int area() { return r * r * 3; }
}
`,
    hint: "Put `final` on the field. You can still assign it inside the constructor. After that, leave it alone.",
    mustContain: ["final"],
    checks: [
      { label: "r2", code: `Circle c = new Circle(2); if (c.area() != 12) throw new RuntimeException("area");` },
      { label: "r5", code: `Circle c = new Circle(5); if (c.area() != 75) throw new RuntimeException("r5");` },
    ],
  },
  {
    id: "complexity",
    module: "DSA",
    title: "Big O",
    blurb: "How the work grows, not how long one run took.",
    concept: [
      "Big O describes how the step count grows with the input size. One pass over an array is O(n). A loop inside a loop over the same array is O(n²). Constants and lower terms are dropped.",
      "Summing an array does not need a nested loop. If your machine is fast, the slow algorithm still looks fine on ten elements and falls over on a million. Write the linear one.",
    ],
    task: "Sum an `int` array with a single loop.",
    starter: `class Solution {
  public static int sum(int[] a) {
    return 0;
  }
}
`,
    solution: `class Solution {
  public static int sum(int[] a) {
    int s = 0;
    for (int i = 0; i < a.length; i++) s = s + a[i];
    return s;
  }
}
`,
    hint: "One index, one accumulator. Nested loops are rejected here even if the number happens to be right.",
    singleLoop: true,
    checks: [
      { label: "basic", code: `int[] a = new int[]{1, 2, 3, 4}; if (Solution.sum(a) != 10) throw new RuntimeException("sum");` },
      { label: "empty", code: `int[] a = new int[]{}; if (Solution.sum(a) != 0) throw new RuntimeException("empty");` },
      { label: "neg", code: `int[] a = new int[]{5, -2, -1}; if (Solution.sum(a) != 2) throw new RuntimeException("neg");` },
    ],
  },
  {
    id: "arraylist",
    module: "DSA",
    title: "ArrayList",
    blurb: "A list that grows.",
    concept: [
      "`ArrayList` is a resizable list. `add`, `get`, `set`, `size`, and `remove(index)` cover most uses. Unlike an array, you do not declare the length up front.",
      "This course's `ArrayList` is the simple teaching version: `new ArrayList()`, no generic type arguments. `get` returns the value you stored.",
    ],
    task: "Build a new list containing only the positive numbers from the array, in the same order.",
    starter: `class Solution {
  public static ArrayList positives(int[] a) {
    return new ArrayList();
  }
}
`,
    solution: `class Solution {
  public static ArrayList positives(int[] a) {
    ArrayList xs = new ArrayList();
    for (int i = 0; i < a.length; i++) {
      if (a[i] > 0) xs.add(a[i]);
    }
    return xs;
  }
}
`,
    hint: "Create an empty list, walk the array, and `add` when the value is greater than 0. Do not add zeros.",
    checks: [
      {
        label: "filter",
        code: `int[] a = new int[]{0, 2, -1, 4}; ArrayList xs = Solution.positives(a); if (xs.size() != 2 || xs.get(0) != 2 || xs.get(1) != 4) throw new RuntimeException("filter");`,
      },
      { label: "none", code: `int[] a = new int[]{-3, 0}; if (Solution.positives(a).size() != 0) throw new RuntimeException("none");` },
    ],
  },
  {
    id: "linked-lists",
    module: "DSA",
    title: "Linked lists",
    blurb: "Nodes that point at the next node.",
    concept: [
      "A linked list is a chain of nodes. Each node holds a value and a reference to the next node, or null at the end. There is no index; you walk from the head.",
      "Reversal uses three references: previous, current, and the saved next. Point current back at previous, then step forward. Lose `next` before you overwrite it and the rest of the list is gone.",
    ],
    task: "Reverse a singly linked list and return the new head.",
    starter: `class Node {
  int val;
  Node next;
  public Node(int v) { val = v; next = null; }
}
class Solution {
  public static Node reverse(Node head) {
    return head;
  }
}
`,
    solution: `class Node {
  int val;
  Node next;
  public Node(int v) { val = v; next = null; }
}
class Solution {
  public static Node reverse(Node head) {
    Node prev = null;
    Node cur = head;
    while (cur != null) {
      Node nxt = cur.next;
      cur.next = prev;
      prev = cur;
      cur = nxt;
    }
    return prev;
  }
}
`,
    hint: "Save `cur.next` in a local before you overwrite it. Then point `cur.next` at `prev`, and slide all three forward.",
    checks: [
      {
        label: "three",
        code: `Node a = new Node(1); Node b = new Node(2); Node c = new Node(3); a.next = b; b.next = c; Node h = Solution.reverse(a); if (h.val != 3 || h.next.val != 2 || h.next.next.val != 1 || h.next.next.next != null) throw new RuntimeException("rev");`,
      },
      { label: "empty", code: `if (Solution.reverse(null) != null) throw new RuntimeException("null");` },
    ],
  },
  {
    id: "stacks",
    module: "DSA",
    title: "Stacks",
    blurb: "Last in, first out.",
    concept: [
      "A stack pushes and pops at the same end. The most recent push is the next pop. Call stacks, undo histories, and parenthesis matching are all this shape.",
      "An array plus an integer `top` is enough. `top` starts at -1. Push writes at `top + 1`. Pop reads there and moves `top` back.",
    ],
    task: "Implement `MyStack` with `push`, `pop`, `peek`, and `isEmpty`. Capacity 64 is enough for the tests.",
    starter: `class MyStack {
  public MyStack() {}
  public void push(int x) {}
  public int pop() { return 0; }
  public int peek() { return 0; }
  public boolean isEmpty() { return true; }
}
`,
    solution: `class MyStack {
  int[] data;
  int top;
  public MyStack() { data = new int[64]; top = -1; }
  public void push(int x) { top = top + 1; data[top] = x; }
  public int pop() { int v = data[top]; top = top - 1; return v; }
  public int peek() { return data[top]; }
  public boolean isEmpty() { return top < 0; }
}
`,
    hint: "Keep `top` at the index of the last pushed value, or -1 when empty. Peek does not move `top`. Pop does.",
    checks: [
      {
        label: "lifo",
        code: `MyStack s = new MyStack(); if (!s.isEmpty()) throw new RuntimeException("start"); s.push(1); s.push(2); if (s.peek() != 2) throw new RuntimeException("peek"); if (s.pop() != 2 || s.pop() != 1 || !s.isEmpty()) throw new RuntimeException("pop");`,
      },
    ],
  },
  {
    id: "queues",
    module: "DSA",
    title: "Queues",
    blurb: "First in, first out.",
    concept: [
      "A queue adds at the back and removes from the front. Scheduling, breadth-first search, and printers all use this.",
      "A linked list with `head` and `tail` does it cleanly. `offer` appends at the tail. `poll` removes the head. When the last node leaves, both ends become null.",
    ],
    task: "Implement `MyQueue` with `offer`, `poll`, and `isEmpty`.",
    starter: `class QNode {
  int val;
  QNode next;
  public QNode(int v) { val = v; next = null; }
}
class MyQueue {
  public void offer(int x) {}
  public int poll() { return 0; }
  public boolean isEmpty() { return true; }
}
`,
    solution: `class QNode {
  int val;
  QNode next;
  public QNode(int v) { val = v; next = null; }
}
class MyQueue {
  QNode head;
  QNode tail;
  public void offer(int x) {
    QNode n = new QNode(x);
    if (tail == null) { head = n; tail = n; }
    else { tail.next = n; tail = n; }
  }
  public int poll() {
    int v = head.val;
    head = head.next;
    if (head == null) tail = null;
    return v;
  }
  public boolean isEmpty() { return head == null; }
}
`,
    hint: "If the queue is empty, the new node is both head and tail. On poll, if head becomes null, clear tail too or the next offer will attach to a dead node.",
    checks: [
      {
        label: "fifo",
        code: `MyQueue q = new MyQueue(); q.offer(1); q.offer(2); q.offer(3); if (q.poll() != 1 || q.poll() != 2 || q.isEmpty()) throw new RuntimeException("order"); if (q.poll() != 3 || !q.isEmpty()) throw new RuntimeException("end");`,
      },
    ],
  },
  {
    id: "deques",
    module: "DSA",
    title: "Deques",
    blurb: "A double-ended queue.",
    concept: [
      "A deque adds and removes at both ends. Sliding windows and palindrome checks like having both a stack and a queue in one structure.",
      "A doubly linked list stores `prev` and `next`. Update both directions, and update `head` and `tail` when an end becomes empty.",
    ],
    task: "Implement `MyDeque` with `addFirst`, `addLast`, `removeFirst`, `removeLast`, and `isEmpty`.",
    starter: `class DNode {
  int val;
  DNode prev;
  DNode next;
  public DNode(int v) { val = v; prev = null; next = null; }
}
class MyDeque {
  public void addFirst(int x) {}
  public void addLast(int x) {}
  public int removeFirst() { return 0; }
  public int removeLast() { return 0; }
  public boolean isEmpty() { return true; }
}
`,
    solution: `class DNode {
  int val;
  DNode prev;
  DNode next;
  public DNode(int v) { val = v; prev = null; next = null; }
}
class MyDeque {
  DNode head;
  DNode tail;
  public boolean isEmpty() { return head == null; }
  public void addLast(int x) {
    DNode n = new DNode(x);
    if (tail == null) { head = n; tail = n; }
    else { tail.next = n; n.prev = tail; tail = n; }
  }
  public void addFirst(int x) {
    DNode n = new DNode(x);
    if (head == null) { head = n; tail = n; }
    else { n.next = head; head.prev = n; head = n; }
  }
  public int removeFirst() {
    int v = head.val;
    head = head.next;
    if (head == null) tail = null;
    else head.prev = null;
    return v;
  }
  public int removeLast() {
    int v = tail.val;
    tail = tail.prev;
    if (tail == null) head = null;
    else tail.next = null;
    return v;
  }
}
`,
    hint: "Empty deque: the new node is head and tail. When removing the last remaining node, set both head and tail to null. Always clear the dangling `prev` or `next` on the new end.",
    checks: [
      {
        label: "ends",
        code: `MyDeque d = new MyDeque(); d.addLast(1); d.addFirst(2); d.addLast(3); if (d.removeFirst() != 2) throw new RuntimeException("front"); if (d.removeLast() != 3) throw new RuntimeException("back"); if (d.removeFirst() != 1 || !d.isEmpty()) throw new RuntimeException("mid");`,
      },
    ],
  },
  {
    id: "hashmap",
    module: "DSA",
    title: "HashMap",
    blurb: "Key to value, usually in constant time.",
    concept: [
      "A hash map stores values under keys. `put`, `get`, and `containsKey` are the core. Keys are hashed into a bucket. Two different keys can land in the same bucket; that is a collision, handled by a short chain inside the bucket.",
      "`bucket` below is the idea in one line: `Math.abs(key) % n`. The two-sum method is the pattern you will actually reuse: store a value you have seen, then ask the map if its partner is already there.",
    ],
    task: "Implement `bucket(key, n)` and `twoSum`, which returns the earlier index of a pair that adds to `target`, or -1. The array has at most one such pair.",
    starter: `class Solution {
  public static int bucket(int key, int n) {
    return 0;
  }
  public static int twoSum(int[] a, int target) {
    return -1;
  }
}
`,
    solution: `class Solution {
  public static int bucket(int key, int n) {
    int k = key;
    if (k < 0) k = -k;
    return k % n;
  }
  public static int twoSum(int[] a, int target) {
    HashMap map = new HashMap();
    for (int i = 0; i < a.length; i++) {
      int need = target - a[i];
      if (map.containsKey(need)) return map.get(need);
      map.put(a[i], i);
    }
    return -1;
  }
}
`,
    hint: "For two-sum, the map stores value → index. Before you put the current number, ask if `target - a[i]` is already a key. `bucket` is `absolute value % n`. `Math.abs` exists.",
    checks: [
      { label: "bucket", code: `if (Solution.bucket(17, 5) != 2 || Solution.bucket(-8, 5) != 3) throw new RuntimeException("bucket");` },
      { label: "pair", code: `int[] a = new int[]{2, 7, 11, 15}; if (Solution.twoSum(a, 9) != 0) throw new RuntimeException("pair " + Solution.twoSum(a, 9));` },
      { label: "none", code: `int[] a = new int[]{1, 2, 3}; if (Solution.twoSum(a, 100) != -1) throw new RuntimeException("none");` },
    ],
  },
  {
    id: "recursion",
    module: "DSA",
    title: "Recursion",
    blurb: "A method that calls itself, with a way to stop.",
    concept: [
      "Every recursive method needs a base case that does not call itself, and a step that moves toward that case. Forgetting the base case is an infinite loop that dies as a stack overflow.",
      "Climbing stairs: from step n you came from n-1 (a single step) or n-2 (a double step). The number of ways adds. ways(1) = 1, ways(2) = 2.",
    ],
    task: "Return how many ways to climb `n` stairs taking 1 or 2 steps at a time. `n` will be small (at most 20).",
    starter: `class Solution {
  public static int ways(int n) {
    return 0;
  }
}
`,
    solution: `class Solution {
  public static int ways(int n) {
    if (n <= 1) return 1;
    if (n == 2) return 2;
    return ways(n - 1) + ways(n - 2);
  }
}
`,
    hint: "Base cases: 1 way to climb 0 or 1 stair (do nothing / one single), 2 ways for two stairs (1+1 or 2). Otherwise add the two smaller answers. This is the Fibonacci pattern.",
    checks: [
      { label: "1", code: `if (Solution.ways(1) != 1) throw new RuntimeException("1");` },
      { label: "3", code: `if (Solution.ways(3) != 3) throw new RuntimeException("3");` },
      { label: "5", code: `if (Solution.ways(5) != 8) throw new RuntimeException("5 = " + Solution.ways(5));` },
    ],
  },
  {
    id: "backtracking",
    module: "DSA",
    title: "Backtracking",
    blurb: "Try a choice, recurse, then take it back.",
    concept: [
      "Backtracking explores a decision tree. At each index you either take the number or skip it, then recurse. When you return, the next branch tries the other choice. You do not need to undo a parameter if you pass the new value instead of mutating a shared one.",
      "Subset-sum count is the clean version: each element is in the subset or out. When you pass the end of the array, you have one complete decision. Count it if the remaining target is 0.",
    ],
    task: "Count subsets of `nums` (positive ints) that add up to `target`. The empty subset sums to 0.",
    starter: `class Solution {
  public static int countSubsets(int[] nums, int target) {
    return 0;
  }
}
`,
    solution: `class Solution {
  public static int countSubsets(int[] nums, int target) {
    return rec(nums, target, 0);
  }
  private static int rec(int[] nums, int remain, int i) {
    if (i == nums.length) {
      if (remain == 0) return 1;
      return 0;
    }
    return rec(nums, remain - nums[i], i + 1) + rec(nums, remain, i + 1);
  }
}
`,
    hint: "Write a helper `rec(nums, remain, i)`. If `i` is past the end, return 1 when remain is 0. Otherwise add the take-branch and the skip-branch.",
    checks: [
      { label: "two subsets", code: `int[] a = new int[]{1, 2, 3}; if (Solution.countSubsets(a, 3) != 2) throw new RuntimeException("" + Solution.countSubsets(a, 3));` },
      { label: "empty target", code: `int[] a = new int[]{1, 2}; if (Solution.countSubsets(a, 0) != 1) throw new RuntimeException("zero");` },
      { label: "none", code: `int[] a = new int[]{2, 4}; if (Solution.countSubsets(a, 1) != 0) throw new RuntimeException("none");` },
    ],
  },
  {
    id: "binary-trees",
    module: "DSA",
    title: "Binary trees",
    blurb: "Each node has a left and a right.",
    concept: [
      "A binary tree node holds a value plus two child references, either of which may be null. Height is the number of nodes on the longest path down. An empty tree has height 0.",
      "The recursive definition is the whole algorithm: height(null) = 0, otherwise 1 plus the taller child.",
    ],
    task: "Return the height of a binary tree. A single node has height 1.",
    starter: `class TreeNode {
  int val;
  TreeNode left;
  TreeNode right;
  public TreeNode(int v) { val = v; left = null; right = null; }
}
class Solution {
  public static int height(TreeNode root) {
    return 0;
  }
}
`,
    solution: `class TreeNode {
  int val;
  TreeNode left;
  TreeNode right;
  public TreeNode(int v) { val = v; left = null; right = null; }
}
class Solution {
  public static int height(TreeNode root) {
    if (root == null) return 0;
    int l = height(root.left);
    int r = height(root.right);
    if (l > r) return 1 + l;
    return 1 + r;
  }
}
`,
    hint: "Null returns 0. Otherwise return 1 plus the bigger of the two recursive heights. `Math.max` works.",
    checks: [
      { label: "empty", code: `if (Solution.height(null) != 0) throw new RuntimeException("empty");` },
      {
        label: "skewed",
        code: `TreeNode a = new TreeNode(1); a.left = new TreeNode(2); a.left.right = new TreeNode(3); if (Solution.height(a) != 3) throw new RuntimeException("h");`,
      },
    ],
  },
  {
    id: "traversals",
    module: "DSA",
    title: "Tree traversals",
    blurb: "Visit every node in a defined order.",
    concept: [
      "Inorder is left, node, right. Preorder is node, left, right. Postorder is left, right, node. On a binary search tree, inorder yields sorted values.",
      "The walk is the same recursion with the `add` call in a different place. Use an `ArrayList` as the accumulator so the caller can read it back.",
    ],
    task: "Return the inorder values of the tree as an ArrayList.",
    starter: `class TreeNode {
  int val;
  TreeNode left;
  TreeNode right;
  public TreeNode(int v) { val = v; left = null; right = null; }
}
class Solution {
  public static ArrayList inorder(TreeNode root) {
    return new ArrayList();
  }
}
`,
    solution: `class TreeNode {
  int val;
  TreeNode left;
  TreeNode right;
  public TreeNode(int v) { val = v; left = null; right = null; }
}
class Solution {
  public static ArrayList inorder(TreeNode root) {
    ArrayList xs = new ArrayList();
    walk(root, xs);
    return xs;
  }
  private static void walk(TreeNode n, ArrayList xs) {
    if (n == null) return;
    walk(n.left, xs);
    xs.add(n.val);
    walk(n.right, xs);
  }
}
`,
    hint: "Helper takes the node and the list. Recurse left, then `xs.add(n.val)`, then recurse right. Stop on null.",
    checks: [
      {
        label: "sorted",
        code: `TreeNode r = new TreeNode(2); r.left = new TreeNode(1); r.right = new TreeNode(3); ArrayList xs = Solution.inorder(r); if (xs.size() != 3 || xs.get(0) != 1 || xs.get(1) != 2 || xs.get(2) != 3) throw new RuntimeException("order");`,
      },
    ],
  },
  {
    id: "bst",
    module: "DSA",
    title: "Binary search trees",
    blurb: "Left is smaller, right is larger.",
    concept: [
      "In a BST every node is greater than everything in its left subtree and smaller than everything in its right. Search throws away half the tree at each step, which is why it is O(height).",
      "Insert walks the same way and attaches a new leaf where the missing child is. Duplicate values can be ignored.",
    ],
    task: "Implement `insert` (return the root) and `search`.",
    starter: `class TreeNode {
  int val;
  TreeNode left;
  TreeNode right;
  public TreeNode(int v) { val = v; left = null; right = null; }
}
class Solution {
  public static TreeNode insert(TreeNode root, int v) { return root; }
  public static boolean search(TreeNode root, int v) { return false; }
}
`,
    solution: `class TreeNode {
  int val;
  TreeNode left;
  TreeNode right;
  public TreeNode(int v) { val = v; left = null; right = null; }
}
class Solution {
  public static TreeNode insert(TreeNode root, int v) {
    if (root == null) return new TreeNode(v);
    if (v < root.val) root.left = insert(root.left, v);
    else if (v > root.val) root.right = insert(root.right, v);
    return root;
  }
  public static boolean search(TreeNode root, int v) {
    if (root == null) return false;
    if (root.val == v) return true;
    if (v < root.val) return search(root.left, v);
    return search(root.right, v);
  }
}
`,
    hint: "Both methods follow the same fork: smaller goes left, larger goes right. Insert returns a new node when it hits null, and the caller stores that return into `.left` or `.right`.",
    checks: [
      {
        label: "find",
        code: `TreeNode r = null; r = Solution.insert(r, 5); r = Solution.insert(r, 2); r = Solution.insert(r, 8); if (!Solution.search(r, 2) || !Solution.search(r, 8) || Solution.search(r, 7)) throw new RuntimeException("search"); if (r.val != 5 || r.left.val != 2 || r.right.val != 8) throw new RuntimeException("shape");`,
      },
    ],
  },
  {
    id: "binary-search",
    module: "DSA",
    title: "Binary search",
    blurb: "Halve a sorted array until you hit the value.",
    concept: [
      "On a sorted array, compare the middle element and discard the half that cannot contain the target. That is O(log n) comparisons.",
      "Keep `lo` and `hi` as inclusive bounds. The middle is `lo + (hi - lo) / 2`, which avoids a messy overflow on big indexes. If you miss, return -1.",
    ],
    task: "Return the index of `target` in a sorted array, or -1.",
    starter: `class Solution {
  public static int search(int[] a, int target) {
    return -1;
  }
}
`,
    solution: `class Solution {
  public static int search(int[] a, int target) {
    int lo = 0;
    int hi = a.length - 1;
    while (lo <= hi) {
      int mid = lo + (hi - lo) / 2;
      if (a[mid] == target) return mid;
      if (a[mid] < target) lo = mid + 1;
      else hi = mid - 1;
    }
    return -1;
  }
}
`,
    hint: "Loop while `lo <= hi`. If `a[mid]` is too small, move `lo` to `mid + 1`. If it is too big, move `hi` to `mid - 1`.",
    checks: [
      { label: "hit", code: `int[] a = new int[]{1, 3, 4, 8, 9}; if (Solution.search(a, 8) != 3) throw new RuntimeException("hit");` },
      { label: "miss", code: `int[] a = new int[]{1, 3, 4, 8}; if (Solution.search(a, 5) != -1) throw new RuntimeException("miss");` },
      { label: "ends", code: `int[] a = new int[]{2, 4, 6}; if (Solution.search(a, 2) != 0 || Solution.search(a, 6) != 2) throw new RuntimeException("ends");` },
    ],
  },
  {
    id: "insertion-sort",
    module: "DSA",
    title: "Insertion sort",
    blurb: "Grow a sorted prefix one element at a time.",
    concept: [
      "Insertion sort takes the next value and walks it backward through the sorted prefix until it finds its place. Small arrays and nearly-sorted arrays are its home turf. Average and worst case are O(n²).",
      "It is in place: you only rearrange the array you were given. The tests read that same array afterward.",
    ],
    task: "Sort `a` in ascending order with insertion sort. Do not allocate a second array.",
    starter: `class Solution {
  public static void insertion(int[] a) {
  }
}
`,
    solution: `class Solution {
  public static void insertion(int[] a) {
    for (int i = 1; i < a.length; i++) {
      int key = a[i];
      int j = i - 1;
      while (j >= 0 && a[j] > key) {
        a[j + 1] = a[j];
        j = j - 1;
      }
      a[j + 1] = key;
    }
  }
}
`,
    hint: "Outer loop starts at index 1. Pull `key = a[i]` out, shift larger prefix elements one slot right, then drop `key` into the hole.",
    checks: [
      {
        label: "order",
        code: `int[] a = new int[]{3, 1, 2, 2}; Solution.insertion(a); if (a[0] != 1 || a[1] != 2 || a[2] != 2 || a[3] != 3) throw new RuntimeException("order");`,
      },
      { label: "sorted", code: `int[] a = new int[]{1, 2, 3}; Solution.insertion(a); if (a[2] != 3) throw new RuntimeException("already");` },
    ],
  },
  {
    id: "two-pointers",
    module: "DSA",
    title: "Two pointers",
    blurb: "Two indexes moving toward an answer.",
    concept: [
      "On a sorted array, a pair that sums to a target can be found with indexes at both ends. If the sum is too small, move the left pointer right. If it is too big, move the right pointer left. Each move throws away a whole row of impossible pairs.",
      "That is O(n) after the array is sorted, instead of checking every pair.",
    ],
    task: "`a` is sorted ascending. Return true if two different indexes add to `target`.",
    starter: `class Solution {
  public static boolean hasPair(int[] a, int target) {
    return false;
  }
}
`,
    solution: `class Solution {
  public static boolean hasPair(int[] a, int target) {
    int i = 0;
    int j = a.length - 1;
    while (i < j) {
      int s = a[i] + a[j];
      if (s == target) return true;
      if (s < target) i = i + 1;
      else j = j - 1;
    }
    return false;
  }
}
`,
    hint: "Start at both ends. The pointers must stay `i < j` so you never add a number to itself.",
    checks: [
      { label: "yes", code: `int[] a = new int[]{1, 2, 4, 6}; if (!Solution.hasPair(a, 8)) throw new RuntimeException("yes");` },
      { label: "no", code: `int[] a = new int[]{1, 2, 3}; if (Solution.hasPair(a, 10)) throw new RuntimeException("no");` },
      { label: "same value twice", code: `int[] a = new int[]{2, 2, 3}; if (!Solution.hasPair(a, 4)) throw new RuntimeException("dup");` },
    ],
  },
  {
    id: "knapsack",
    module: "DSA",
    title: "0/1 knapsack",
    blurb: "Take it or leave it, under a weight limit.",
    concept: [
      "Each item may be taken once. You have a capacity. `dp[i][c]` is the best value using the first i items with capacity c. For each item, the best is the max of skipping it and taking it (when it fits).",
      "The take transition is `val[i-1] + dp[i-1][c - wt[i-1]]`. Fill the table in order and the answer is `dp[n][cap]`. This is O(n · cap) time and space.",
    ],
    task: "Return the maximum value that fits in `cap`. `wt[i]` and `val[i]` describe item i. Each item is taken at most once.",
    starter: `class Solution {
  public static int knapsack(int cap, int[] wt, int[] val) {
    return 0;
  }
}
`,
    solution: `class Solution {
  public static int knapsack(int cap, int[] wt, int[] val) {
    int n = wt.length;
    int[][] dp = new int[n + 1][cap + 1];
    for (int i = 1; i <= n; i++) {
      for (int c = 0; c <= cap; c++) {
        dp[i][c] = dp[i - 1][c];
        if (wt[i - 1] <= c) {
          int take = val[i - 1] + dp[i - 1][c - wt[i - 1]];
          if (take > dp[i][c]) dp[i][c] = take;
        }
      }
    }
    return dp[n][cap];
  }
}
`,
    hint: "Rows are items considered, columns are capacity. Skipping copies the cell above. Taking is allowed only when `wt[i-1] <= c`, and it looks one row up, `wt[i-1]` columns left.",
    checks: [
      {
        label: "classic",
        code: `int[] wt = new int[]{1, 3, 4}; int[] val = new int[]{15, 20, 30}; if (Solution.knapsack(4, wt, val) != 35) throw new RuntimeException("" + Solution.knapsack(4, wt, val));`,
      },
      {
        label: "nothing fits",
        code: `int[] wt = new int[]{5}; int[] val = new int[]{10}; if (Solution.knapsack(3, wt, val) != 0) throw new RuntimeException("none");`,
      },
    ],
  },
  {
    id: "floyd-warshall",
    module: "DSA",
    title: "Floyd-Warshall",
    blurb: "Shortest paths between every pair.",
    concept: [
      "Floyd-Warshall solves all-pairs shortest paths on a weighted graph with no negative cycles. `d[i][j]` starts as the direct edge, or a large INF when there is no edge. Diagonal is 0.",
      "The idea: for every possible midpoint k, try going i → k → j. If that is shorter, keep it. Three nested loops, O(n³), and afterward every pair is answered.",
    ],
    task: `Given an n×n matrix where missing edges are ${INF}, return a new matrix of shortest distances. Do not destroy the caller's matrix.`,
    starter: `class Solution {
  public static int[][] floyd(int[][] g) {
    return g;
  }
}
`,
    solution: `class Solution {
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
}
`,
    hint: "Copy the matrix first. The k loop is the outer one: it means 'paths that are allowed to use vertices 0..k as intermediate stops'. Update d[i][j] when d[i][k] + d[k][j] is smaller.",
    checks: [
      {
        label: "detour",
        code: `int INF = ${INF}; int[][] g = new int[][]{{0, 3, INF},{INF, 0, 1},{INF, INF, 0}}; int[][] d = Solution.floyd(g); if (d[0][2] != 4) throw new RuntimeException("" + d[0][2]); if (g[0][2] != INF) throw new RuntimeException("mutated");`,
      },
      {
        label: "direct stays",
        code: `int INF = ${INF}; int[][] g = new int[][]{{0, 1},{INF, 0}}; int[][] d = Solution.floyd(g); if (d[0][1] != 1 || d[1][0] != INF) throw new RuntimeException("direct");`,
      },
    ],
  },
  {
    id: "dijkstra",
    module: "DSA",
    title: "Dijkstra",
    blurb: "Shortest paths from one source, when weights are non-negative.",
    concept: [
      "Dijkstra grows a set of finished vertices. Each round, pick the unfinished vertex with the smallest distance, mark it finished, and relax its outgoing edges. With a simple scan that pick is O(n), so the whole algorithm is O(n²). A heap makes it faster; the idea is the same.",
      "It is wrong on negative edges. Floyd-Warshall tolerates negatives (not negative cycles). Dijkstra does not. Use it when every weight is ≥ 0, which is most maps and networks.",
    ],
    task: `Return the distance array from \`src\`. \`g[u][v]\` is the weight, or ${INF} if there is no edge. Unreachable vertices stay at ${INF}.`,
    starter: `class Solution {
  public static int[] dijkstra(int[][] g, int src) {
    return new int[]{};
  }
}
`,
    solution: `class Solution {
  public static int[] dijkstra(int[][] g, int src) {
    int n = g.length;
    int INF = ${INF};
    int[] dist = new int[n];
    boolean[] used = new boolean[n];
    for (int i = 0; i < n; i++) dist[i] = INF;
    dist[src] = 0;
    for (int k = 0; k < n; k++) {
      int u = -1;
      for (int i = 0; i < n; i++) {
        if (!used[i] && (u == -1 || dist[i] < dist[u])) u = i;
      }
      if (u == -1 || dist[u] >= INF) break;
      used[u] = true;
      for (int v = 0; v < n; v++) {
        if (g[u][v] >= INF) continue;
        int nd = dist[u] + g[u][v];
        if (nd < dist[v]) dist[v] = nd;
      }
    }
    return dist;
  }
}
`,
    hint: "dist[src] = 0 and everything else starts at INF. Each round, scan for the unused vertex with the smallest dist, freeze it, then try every edge out of it. Skip edges whose weight is INF.",
    checks: [
      {
        label: "line",
        code: `int INF = ${INF}; int[][] g = new int[][]{{0, 1, INF},{INF, 0, 1},{INF, INF, 0}}; int[] d = Solution.dijkstra(g, 0); if (d[0] != 0 || d[1] != 1 || d[2] != 2) throw new RuntimeException(d[0] + "," + d[1] + "," + d[2]);`,
      },
      {
        label: "shorter detour",
        code: `int INF = ${INF}; int[][] g = new int[][]{{0, 5, INF},{INF, 0, 1},{2, INF, 0}}; int[] d = Solution.dijkstra(g, 0); if (d[2] != 6) throw new RuntimeException("" + d[2]);`,
      },
    ],
  },
];

export function lessonById(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}

export function lessonIndex(id: string): number {
  return lessons.findIndex((l) => l.id === id);
}

export function isUnlocked(id: string, done: Record<string, number>): boolean {
  const i = lessonIndex(id);
  if (i <= 0) return true;
  const prev = lessons[i - 1];
  return prev ? done[prev.id] != null : false;
}

export function assess(source: string, lesson: Lesson): GradeResult {
  if (lesson.mustContain) {
    for (const token of lesson.mustContain) {
      if (!source.includes(token)) {
        return {
          compileError: `This lesson needs \`${token}\` in your code. The tests are not the whole point.`,
          results: [],
        };
      }
    }
  }
  if (lesson.singleLoop) {
    const n = source.match(/\b(for|while)\b/g)?.length ?? 0;
    if (n > 1) {
      return {
        compileError: "Use a single loop. A nested loop can still print the right number and still be the slow algorithm this lesson is about.",
        results: [],
      };
    }
  }
  return grade(source, lesson.checks);
}
