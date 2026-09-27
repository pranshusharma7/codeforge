import type { Language } from '../types'

export const LANGUAGES: Language[] = [
  {
    id: 'cpp', label: 'C++', monacoId: 'cpp', judge0Id: 54, ext: 'cpp', icon: 'C+', color: '#89b4fa',
    starter: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    cin >> n;

    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];

    sort(a.begin(), a.end());

    cout << "Sorted: ";
    for (int x : a) cout << x << " ";
    cout << "\\n";

    return 0;
}`,
  },
  {
    id: 'python', label: 'Python', monacoId: 'python', judge0Id: 71, ext: 'py', icon: 'PY', color: '#f9e2af',
    starter: `import sys
from collections import defaultdict, deque

def solve():
    n = int(input())
    a = list(map(int, input().split()))

    # Two-pointer approach
    a.sort()
    left, right = 0, n - 1
    pairs = []

    while left < right:
        s = a[left] + a[right]
        pairs.append((a[left], a[right], s))
        left += 1
        right -= 1

    for pair in pairs:
        print(f"{pair[0]} + {pair[1]} = {pair[2]}")

solve()`,
  },
  {
    id: 'java', label: 'Java', monacoId: 'java', judge0Id: 62, ext: 'java', icon: 'JV', color: '#fab387',
    starter: `import java.util.*;
import java.io.*;

public class Main {
    static BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    static StringTokenizer st;

    static int nextInt() throws IOException {
        while (st == null || !st.hasMoreTokens())
            st = new StringTokenizer(br.readLine());
        return Integer.parseInt(st.nextToken());
    }

    public static void main(String[] args) throws IOException {
        int n = nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = nextInt();

        Arrays.sort(a);

        StringBuilder sb = new StringBuilder("Sorted: ");
        for (int x : a) sb.append(x).append(" ");
        System.out.println(sb);
    }
}`,
  },
  {
    id: 'javascript', label: 'JavaScript', monacoId: 'javascript', judge0Id: 63, ext: 'js', icon: 'JS', color: '#f9e2af',
    starter: `const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin });
const lines = [];

rl.on('line', line => lines.push(line.trim()));
rl.on('close', () => {
    const n = parseInt(lines[0]);
    const a = lines[1].split(' ').map(Number);

    // Merge sort implementation
    function mergeSort(arr) {
        if (arr.length <= 1) return arr;
        const mid = Math.floor(arr.length / 2);
        const left = mergeSort(arr.slice(0, mid));
        const right = mergeSort(arr.slice(mid));
        return merge(left, right);
    }

    function merge(l, r) {
        const res = [];
        let i = 0, j = 0;
        while (i < l.length && j < r.length) {
            res.push(l[i] <= r[j] ? l[i++] : r[j++]);
        }
        return [...res, ...l.slice(i), ...r.slice(j)];
    }

    console.log('Sorted:', mergeSort(a).join(' '));
});`,
  },
  {
    id: 'typescript', label: 'TypeScript', monacoId: 'typescript', judge0Id: 74, ext: 'ts', icon: 'TS', color: '#89b4fa',
    starter: `interface Graph {
    vertices: number;
    adj: Map<number, number[]>;
}

function bfs(graph: Graph, start: number): number[] {
    const visited = new Set<number>();
    const queue: number[] = [start];
    const order: number[] = [];
    visited.add(start);

    while (queue.length > 0) {
        const node = queue.shift()!;
        order.push(node);

        const neighbors = graph.adj.get(node) ?? [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        }
    }
    return order;
}

const g: Graph = {
    vertices: 6,
    adj: new Map([
        [0, [1, 2]],
        [1, [0, 3, 4]],
        [2, [0, 5]],
        [3, [1]],
        [4, [1]],
        [5, [2]],
    ])
};

console.log('BFS traversal:', bfs(g, 0).join(' -> '));`,
  },
  {
    id: 'go', label: 'Go', monacoId: 'go', judge0Id: 60, ext: 'go', icon: 'GO', color: '#89dceb',
    starter: `package main

import (
    "bufio"
    "fmt"
    "os"
    "sort"
)

func main() {
    reader := bufio.NewReader(os.Stdin)

    var n int
    fmt.Fscan(reader, &n)

    a := make([]int, n)
    for i := range a {
        fmt.Fscan(reader, &a[i])
    }

    sort.Ints(a)

    fmt.Print("Sorted: ")
    for i, x := range a {
        if i > 0 { fmt.Print(" ") }
        fmt.Print(x)
    }
    fmt.Println()
}`,
  },
  {
    id: 'rust', label: 'Rust', monacoId: 'rust', judge0Id: 73, ext: 'rs', icon: 'RS', color: '#fab387',
    starter: `use std::io::{self, BufRead, Write, BufWriter};

fn main() {
    let stdin = io::stdin();
    let stdout = io::stdout();
    let mut out = BufWriter::new(stdout.lock());

    let mut lines = stdin.lock().lines();

    let n: usize = lines.next().unwrap().unwrap().trim().parse().unwrap();
    let a: Vec<i64> = lines.next().unwrap().unwrap()
        .trim().split_whitespace()
        .map(|x| x.parse().unwrap())
        .collect();

    let mut sorted = a.clone();
    sorted.sort();

    write!(out, "Sorted:").unwrap();
    for x in &sorted {
        write!(out, " {}", x).unwrap();
    }
    writeln!(out).unwrap();
}`,
  },
  {
    id: 'csharp', label: 'C#', monacoId: 'csharp', judge0Id: 51, ext: 'cs', icon: 'C#', color: '#cba6f7',
    starter: `using System;
using System.Linq;

class Program {
    static void Main() {
        int n = int.Parse(Console.ReadLine()!);
        int[] a = Console.ReadLine()!.Split(' ').Select(int.Parse).ToArray();

        Array.Sort(a);

        Console.WriteLine("Sorted: " + string.Join(" ", a));

        // LINQ statistics
        Console.WriteLine($"Min: {a.Min()}, Max: {a.Max()}, Sum: {a.Sum()}, Avg: {a.Average():F2}");
    }
}`,
  },
  {
    id: 'kotlin', label: 'Kotlin', monacoId: 'kotlin', judge0Id: 78, ext: 'kt', icon: 'KT', color: '#a6e3a1',
    starter: [
      'import java.util.Scanner',
      '',
      'fun main() {',
      '    val sc = Scanner(System.`in`)',
      '    val n = sc.nextInt()',
      '    val a = IntArray(n) { sc.nextInt() }',
      '',
      '    a.sort()',
      '',
      '    println("Sorted: ${a.joinToString(\" \")}")',
      '    println("Stats: min=${a.min()}, max=${a.max()}, sum=${a.sum()}")',
      '}',
    ].join('\n'),
  },
  {
    id: 'php', label: 'PHP', monacoId: 'php', judge0Id: 68, ext: 'php', icon: 'PHP', color: '#cba6f7',
    starter: `<?php
$n = (int)trim(fgets(STDIN));
$a = array_map('intval', explode(' ', trim(fgets(STDIN))));

sort($a);

echo "Sorted: " . implode(' ', $a) . "\n";
echo "Min: " . min($a) . ", Max: " . max($a) . ", Sum: " . array_sum($a) . "\n";`,
  },
  {
    id: 'swift', label: 'Swift', monacoId: 'swift', judge0Id: 83, ext: 'swift', icon: 'SW', color: '#fab387',
    starter: `import Foundation

let n = Int(readLine()!)!
var a = readLine()!.split(separator: " ").map { Int($0)! }

a.sort()

print("Sorted:", a.map(String.init).joined(separator: " "))
print("Min: \(a.first!), Max: \(a.last!), Sum: \(a.reduce(0, +))")`,
  },
  {
    id: 'ruby', label: 'Ruby', monacoId: 'ruby', judge0Id: 72, ext: 'rb', icon: 'RB', color: '#f38ba8',
    starter: `n = gets.to_i
a = gets.split.map(&:to_i)

a.sort!

puts "Sorted: #{a.join(' ')}"
puts "Min: #{a.min}, Max: #{a.max}, Sum: #{a.sum}, Avg: #{a.sum.to_f / n}"`,
  },
  {
    id: 'bash', label: 'Bash', monacoId: 'shell', judge0Id: 46, ext: 'sh', icon: 'SH', color: '#a6e3a1',
    starter: `#!/bin/bash
read -r n
read -ra a

mapfile -t sorted < <(printf '%s\\n' "\${a[@]}" | sort -n)

echo "Sorted: \${sorted[*]}"
echo "Count: $n"`,
  },
  {
    id: 'sql', label: 'SQL', monacoId: 'sql', judge0Id: 82, ext: 'sql', icon: 'SQL', color: '#89dceb',
    starter: `-- Create and populate a demo table
CREATE TABLE employees (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    salary REAL NOT NULL,
    hire_date DATE
);

INSERT INTO employees VALUES
    (1, 'Alice Chen',   'Engineering', 95000, '2021-03-15'),
    (2, 'Bob Smith',    'Design',      78000, '2020-07-01'),
    (3, 'Carol White',  'Engineering', 102000,'2019-11-20'),
    (4, 'Dave Brown',   'Marketing',   65000, '2022-01-10'),
    (5, 'Eve Johnson',  'Engineering', 88000, '2021-08-05');

-- Aggregated report
SELECT
    department,
    COUNT(*) AS headcount,
    ROUND(AVG(salary), 2) AS avg_salary,
    MAX(salary) AS top_salary
FROM employees
GROUP BY department
ORDER BY avg_salary DESC;`,
  },
]

export const getLang = (id: string) => LANGUAGES.find(l => l.id === id) ?? LANGUAGES[0]
