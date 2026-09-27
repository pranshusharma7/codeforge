export interface Language {
  id: string
  judge0Id: number
  label: string
  monacoId: string
  ext: string
  color: string
  version: string
  defaultCode: string
  template?: string
}

export const LANGUAGES: Language[] = [
  {
    id: 'python', judge0Id: 71, label: 'Python 3', monacoId: 'python', ext: 'py', color: '#3572a5', version: '3.11',
    defaultCode: `# Python 3.11
from typing import Generator

def fibonacci(n: int) -> Generator[int, None, None]:
    """Yield the first n Fibonacci numbers."""
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

def is_prime(n: int) -> bool:
    if n < 2:
        return False
    return all(n % i != 0 for i in range(2, int(n**0.5) + 1))

# Run
fibs = list(fibonacci(12))
print(f"Fibonacci (12 terms): {fibs}")
print(f"Sum: {sum(fibs)}")

primes = [n for n in range(2, 50) if is_prime(n)]
print(f"Primes < 50: {primes}")
`},
  {
    id: 'cpp', judge0Id: 54, label: 'C++ 17', monacoId: 'cpp', ext: 'cpp', color: '#f34b7d', version: 'GCC 11.2',
    defaultCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    vector<int> arr = {64, 34, 25, 12, 22, 11, 90};
    cout << "Before: ";
    for (int x : arr) cout << x << " ";
    cout << endl;

    sort(arr.begin(), arr.end());
    cout << "After:  ";
    for (int x : arr) cout << x << " ";
    cout << endl;

    return 0;
}
`},
  {
    id: 'c', judge0Id: 50, label: 'C (GCC)', monacoId: 'c', ext: 'c', color: '#555555', version: 'GCC 11.2',
    defaultCode: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++)
        for (int j = 0; j < n - i - 1; j++)
            if (arr[j] > arr[j + 1]) {
                int tmp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = tmp;
            }
}

int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(arr) / sizeof(arr[0]);
    bubbleSort(arr, n);
    printf("Sorted: ");
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\\n");
    return 0;
}
`},
  {
    id: 'javascript', judge0Id: 63, label: 'JavaScript', monacoId: 'javascript', ext: 'js', color: '#f1e05a', version: 'Node 18',
    defaultCode: `// Node.js 18
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const left  = arr.filter(x => x < pivot);
  const mid   = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);
  return [...quickSort(left), ...mid, ...quickSort(right)];
}

const nums = [7, 10, 4, 3, 20, 15, 1];
console.log('Original:', nums);
console.log('Sorted:  ', quickSort(nums));
`},
  {
    id: 'typescript', judge0Id: 74, label: 'TypeScript', monacoId: 'typescript', ext: 'ts', color: '#3178c6', version: '5.0',
    defaultCode: `// TypeScript 5
type Result<T, E = Error> =
  | { ok: true;  value: T }
  | { ok: false; error: E }

function safe<T>(fn: () => T): Result<T> {
  try { return { ok: true, value: fn() } }
  catch (e) { return { ok: false, error: e as Error } }
}

const r1 = safe(() => JSON.parse('{"x":1}'))
const r2 = safe(() => JSON.parse('invalid json'))
console.log('r1:', r1)
console.log('r2:', r2)
`},
  {
    id: 'java', judge0Id: 62, label: 'Java 17', monacoId: 'java', ext: 'java', color: '#b07219', version: 'OpenJDK 17',
    defaultCode: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> nums = IntStream.rangeClosed(1, 20)
            .boxed().collect(Collectors.toList());

        int sumSquaresOfEvens = nums.stream()
            .filter(n -> n % 2 == 0)
            .mapToInt(n -> n * n)
            .sum();

        System.out.println("Numbers: " + nums);
        System.out.println("Sum of squares of evens: " + sumSquaresOfEvens);
    }
}
`},
  {
    id: 'go', judge0Id: 60, label: 'Go 1.21', monacoId: 'go', ext: 'go', color: '#00acd7', version: '1.21',
    defaultCode: `package main

import "fmt"

func fibonacci(n int) []int {
	result := make([]int, n)
	a, b := 0, 1
	for i := 0; i < n; i++ {
		result[i] = a
		a, b = b, a+b
	}
	return result
}

func main() {
	fibs := fibonacci(15)
	fmt.Println("Fibonacci sequence:", fibs)
}
`},
  {
    id: 'rust', judge0Id: 73, label: 'Rust 1.70', monacoId: 'rust', ext: 'rs', color: '#dea584', version: '1.70',
    defaultCode: `fn fibonacci(n: u32) -> Vec<u64> {
    let mut v = vec![0u64, 1];
    for i in 2..n as usize {
        let next = v[i - 1] + v[i - 2];
        v.push(next);
    }
    v.truncate(n as usize);
    v
}

fn main() {
    let fibs = fibonacci(15);
    println!("Fibonacci: {:?}", fibs);
    println!("Sum: {}", fibs.iter().sum::<u64>());
}
`},
  {
    id: 'csharp', judge0Id: 51, label: 'C# 10', monacoId: 'csharp', ext: 'cs', color: '#178600', version: 'Mono 6.12',
    defaultCode: `using System;
using System.Collections.Generic;
using System.Linq;

class Program {
    static void Main() {
        var nums = Enumerable.Range(1, 20).ToList();
        var evens = nums.Where(n => n % 2 == 0).ToList();
        var sumSq = evens.Sum(n => n * n);
        Console.WriteLine($"Evens: [{string.Join(", ", evens)}]");
        Console.WriteLine($"Sum of squares: {sumSq}");
    }
}
`},
  {
    id: 'kotlin', judge0Id: 78, label: 'Kotlin 1.9', monacoId: 'kotlin', ext: 'kt', color: '#a97bff', version: '1.9',
    defaultCode: `fun fibonacci(n: Int): List<Long> {
    val result = mutableListOf(0L, 1L)
    repeat(n - 2) { result.add(result.last() + result[result.size - 2]) }
    return result.take(n)
}

fun main() {
    val fibs = fibonacci(15)
    println("Fibonacci: \$fibs")
    println("Sum: \${fibs.sum()}")
}
`},
  {
    id: 'swift', judge0Id: 83, label: 'Swift 5.9', monacoId: 'swift', ext: 'swift', color: '#f05138', version: '5.9',
    defaultCode: `// Swift 5.9
func fibonacci(_ n: Int) -> [Int] {
    guard n > 0 else { return [] }
    var seq = [0, 1]
    for i in 2..<n { seq.append(seq[i-1] + seq[i-2]) }
    return Array(seq.prefix(n))
}

let fibs = fibonacci(15)
print("Fibonacci: \\(fibs)")
print("Sum: \\(fibs.reduce(0, +))")
`},
  {
    id: 'ruby', judge0Id: 72, label: 'Ruby 3.2', monacoId: 'ruby', ext: 'rb', color: '#701516', version: '3.2',
    defaultCode: `# Ruby 3.2
def fibonacci(n)
  return [] if n <= 0
  seq = [0, 1]
  (n - 2).times { seq << seq[-1] + seq[-2] }
  seq.first(n)
end

fibs = fibonacci(15)
puts "Fibonacci: #{fibs}"
puts "Sum: #{fibs.sum}"
`},
  {
    id: 'php', judge0Id: 68, label: 'PHP 8.2', monacoId: 'php', ext: 'php', color: '#4f5d95', version: '8.2',
    defaultCode: `<?php
declare(strict_types=1);

function fibonacci(int $n): array {
    $seq = [0, 1];
    for ($i = 2; $i < $n; $i++) {
        $seq[] = $seq[$i-1] + $seq[$i-2];
    }
    return array_slice($seq, 0, $n);
}

$fibs = fibonacci(15);
echo "Fibonacci: [" . implode(", ", $fibs) . "]\\n";
echo "Sum: " . array_sum($fibs) . "\\n";
`},
  {
    id: 'r', judge0Id: 80, label: 'R 4.2', monacoId: 'r', ext: 'r', color: '#198ce7', version: '4.2',
    defaultCode: `# R 4.2
fibonacci <- function(n) {
  fib <- numeric(n)
  fib[1] <- 0; fib[2] <- 1
  for (i in 3:n) fib[i] <- fib[i-1] + fib[i-2]
  return(fib)
}

fibs <- fibonacci(15)
cat("Fibonacci:", fibs, "\\n")
cat("Sum:", sum(fibs), "\\n")
cat("Mean:", mean(fibs), "\\n")
`},
  {
    id: 'scala', judge0Id: 81, label: 'Scala 3', monacoId: 'scala', ext: 'scala', color: '#c22d40', version: '3.2',
    defaultCode: `// Scala 3
object Main extends App {
  def fibonacci(n: Int): List[Long] =
    LazyList.iterate((0L, 1L)) { case (a, b) => (b, a + b) }
      .map(_._1).take(n).toList

  val fibs = fibonacci(15)
  println(s"Fibonacci: \$fibs")
  println(s"Sum: \${fibs.sum}")
}
`},
  {
    id: 'perl', judge0Id: 85, label: 'Perl 5', monacoId: 'perl', ext: 'pl', color: '#0298c3', version: '5.36',
    defaultCode: `#!/usr/bin/perl
use strict;
use warnings;

sub fibonacci {
    my ($n) = @_;
    my @seq = (0, 1);
    push @seq, $seq[-1] + $seq[-2] while @seq < $n;
    return @seq[0..$n-1];
}

my @fibs = fibonacci(15);
print "Fibonacci: @fibs\\n";
my $sum = 0; $sum += $_ for @fibs;
print "Sum: $sum\\n";
`},
  {
    id: 'lua', judge0Id: 64, label: 'Lua 5.4', monacoId: 'lua', ext: 'lua', color: '#000080', version: '5.4',
    defaultCode: `-- Lua 5.4
function fibonacci(n)
  local seq = {0, 1}
  for i = 3, n do
    seq[i] = seq[i-1] + seq[i-2]
  end
  return seq
end

local fibs = fibonacci(15)
io.write("Fibonacci: ")
for i, v in ipairs(fibs) do
  io.write(v .. (i < #fibs and ", " or ""))
end
print()
local sum = 0
for _, v in ipairs(fibs) do sum = sum + v end
print("Sum: " .. sum)
`},
  {
    id: 'haskell', judge0Id: 61, label: 'Haskell 9', monacoId: 'haskell', ext: 'hs', color: '#5e5086', version: 'GHC 9.4',
    defaultCode: `-- Haskell 9
fibs :: [Integer]
fibs = 0 : 1 : zipWith (+) fibs (tail fibs)

main :: IO ()
main = do
  let first15 = take 15 fibs
  putStrLn $ "Fibonacci: " ++ show first15
  putStrLn $ "Sum: " ++ show (sum first15)
`},
  {
    id: 'elixir', judge0Id: 57, label: 'Elixir 1.15', monacoId: 'elixir', ext: 'ex', color: '#6e4a7e', version: '1.15',
    defaultCode: `# Elixir 1.15
defmodule Fibonacci do
  def sequence(n) do
    Stream.unfold({0, 1}, fn {a, b} -> {a, {b, a + b}} end)
    |> Enum.take(n)
  end
end

fibs = Fibonacci.sequence(15)
IO.puts("Fibonacci: #{inspect(fibs)}")
IO.puts("Sum: #{Enum.sum(fibs)}")
`},
  {
    id: 'clojure', judge0Id: 86, label: 'Clojure 1.11', monacoId: 'clojure', ext: 'clj', color: '#db5855', version: '1.11',
    defaultCode: `; Clojure 1.11
(def fibs
  (lazy-seq (cons 0 (cons 1 (map + fibs (rest fibs))))))

(let [first-15 (take 15 fibs)]
  (println "Fibonacci:" first-15)
  (println "Sum:" (reduce + first-15)))
`},
  {
    id: 'fsharp', judge0Id: 87, label: 'F# 6', monacoId: 'fsharp', ext: 'fs', color: '#b845fc', version: '6.0',
    defaultCode: `// F# 6
let fibonacci n =
    Seq.unfold (fun (a, b) -> Some(a, (b, a + b))) (0L, 1L)
    |> Seq.take n
    |> Seq.toList

let fibs = fibonacci 15
printfn "Fibonacci: %A" fibs
printfn "Sum: %d" (List.sum fibs)
`},
  {
    id: 'erlang', judge0Id: 58, label: 'Erlang 25', monacoId: 'erlang', ext: 'erl', color: '#b83998', version: 'OTP 25',
    defaultCode: `% Erlang 25
-module(main).
-export([start/0]).

fibonacci(0, Acc) -> lists:reverse(Acc);
fibonacci(N, [A, B | _] = Acc) -> fibonacci(N-1, [A+B | Acc]);
fibonacci(N, Acc) -> fibonacci(N-1, Acc).

start() ->
    Fibs = fibonacci(13, [1, 0]),
    io:format("Fibonacci: ~p~n", [Fibs]),
    io:format("Sum: ~p~n", [lists:sum(Fibs)]).
`},
  {
    id: 'bash', judge0Id: 46, label: 'Bash', monacoId: 'shell', ext: 'sh', color: '#89e051', version: '5.1',
    defaultCode: `#!/bin/bash
# Bash script

fibonacci() {
    local n=$1
    local a=0 b=1
    echo -n "Fibonacci: "
    for ((i=0; i<n; i++)); do
        echo -n "$a "
        ((a=a+b, b=a-b))
    done
    echo
}

fibonacci 15
echo "Current date: $(date '+%Y-%m-%d')"
echo "Hostname: $(hostname)"
`},
  {
    id: 'powershell', judge0Id: 84, label: 'PowerShell', monacoId: 'powershell', ext: 'ps1', color: '#012456', version: '7.2',
    defaultCode: `# PowerShell 7.2
function Get-Fibonacci {
    param([int]$n)
    $seq = @(0, 1)
    for ($i = 2; $i -lt $n; $i++) {
        $seq += $seq[$i-1] + $seq[$i-2]
    }
    return $seq[0..($n-1)]
}

$fibs = Get-Fibonacci -n 15
Write-Host "Fibonacci: $fibs"
Write-Host "Sum: $($fibs | Measure-Object -Sum | Select-Object -ExpandProperty Sum)"
`},
  {
    id: 'sql', judge0Id: 82, label: 'SQL', monacoId: 'sql', ext: 'sql', color: '#e38c00', version: 'SQLite 3',
    defaultCode: `-- SQLite 3
CREATE TABLE employees (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT,
    salary REAL
);

INSERT INTO employees VALUES
    (1, 'Alice', 'Engineering', 95000),
    (2, 'Bob', 'Marketing', 72000),
    (3, 'Carol', 'Engineering', 105000),
    (4, 'David', 'HR', 68000),
    (5, 'Eve', 'Engineering', 115000);

-- Department salary stats
SELECT
    department,
    COUNT(*) as headcount,
    ROUND(AVG(salary), 2) as avg_salary,
    MAX(salary) as max_salary
FROM employees
GROUP BY department
ORDER BY avg_salary DESC;
`},
  {
    id: 'html', judge0Id: 0, label: 'HTML', monacoId: 'html', ext: 'html', color: '#e34c26', version: 'HTML5',
    defaultCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Page</title>
  <style>
    body { font-family: sans-serif; background: #0d1117; color: #e6edf3; padding: 40px; }
    h1 { color: #58a6ff; }
    .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 20px; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Hello, World! 🌍</h1>
  <div class="card">
    <p>This is a simple HTML page rendered in CodeForge.</p>
    <p>Current time: <strong id="time"></strong></p>
  </div>
  <script>
    document.getElementById('time').textContent = new Date().toLocaleTimeString();
  </script>
</body>
</html>
`},
  {
    id: 'css', judge0Id: 0, label: 'CSS', monacoId: 'css', ext: 'css', color: '#563d7c', version: 'CSS3',
    defaultCode: `/* Modern CSS3 Example */
:root {
  --primary: #58a6ff;
  --bg: #0d1117;
  --card: #161b22;
  --border: #30363d;
  --text: #e6edf3;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  display: grid;
  place-items: center;
}

.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}

.card h1 {
  color: var(--primary);
  margin-bottom: 12px;
  font-size: 1.5rem;
}
`},
  {
    id: 'dart', judge0Id: 90, label: 'Dart 3', monacoId: 'dart', ext: 'dart', color: '#00b4ab', version: '3.0',
    defaultCode: `// Dart 3
List<int> fibonacci(int n) {
  final seq = [0, 1];
  for (var i = 2; i < n; i++) {
    seq.add(seq[i - 1] + seq[i - 2]);
  }
  return seq.take(n).toList();
}

void main() {
  final fibs = fibonacci(15);
  print('Fibonacci: $fibs');
  print('Sum: \${fibs.reduce((a, b) => a + b)}');
}
`},
  {
    id: 'julia', judge0Id: 91, label: 'Julia 1.9', monacoId: 'julia', ext: 'jl', color: '#a270ba', version: '1.9',
    defaultCode: `# Julia 1.9
function fibonacci(n::Int)
    seq = zeros(Int64, n)
    seq[1] = 0
    seq[2] = 1
    for i in 3:n
        seq[i] = seq[i-1] + seq[i-2]
    end
    return seq
end

fibs = fibonacci(15)
println("Fibonacci: ", fibs)
println("Sum: ", sum(fibs))
println("Max: ", maximum(fibs))
`},
  {
    id: 'fortran', judge0Id: 59, label: 'Fortran 95', monacoId: 'fortran', ext: 'f95', color: '#4d41b1', version: 'GFortran',
    defaultCode: `program fibonacci
  implicit none
  integer :: i, n, a, b, temp
  n = 15
  a = 0
  b = 1
  write(*,'(A)', advance='no') 'Fibonacci: '
  do i = 1, n
    write(*,'(I0,A)', advance='no') a, ' '
    temp = a + b
    a = b
    b = temp
  end do
  print *
end program fibonacci
`},
  {
    id: 'pascal', judge0Id: 67, label: 'Pascal', monacoId: 'pascal', ext: 'pas', color: '#e3f171', version: 'FPC 3.2',
    defaultCode: `program Fibonacci;
var
  a, b, temp, i, n: Integer;
begin
  n := 15;
  a := 0; b := 1;
  Write('Fibonacci: ');
  for i := 1 to n do begin
    Write(a, ' ');
    temp := a + b;
    a := b;
    b := temp;
  end;
  WriteLn;
end.
`},
  {
    id: 'prolog', judge0Id: 69, label: 'Prolog', monacoId: 'prolog', ext: 'pl', color: '#74283c', version: 'SWI-Prolog',
    defaultCode: `% Prolog
fibonacci(0, 0) :- !.
fibonacci(1, 1) :- !.
fibonacci(N, F) :-
    N > 1,
    N1 is N - 1,
    N2 is N - 2,
    fibonacci(N1, F1),
    fibonacci(N2, F2),
    F is F1 + F2.

:- between(0, 10, N), fibonacci(N, F),
   format("fib(~w) = ~w~n", [N, F]), fail ; true.
`},
  {
    id: 'cobol', judge0Id: 77, label: 'COBOL', monacoId: 'cobol', ext: 'cob', color: '#435a66', version: 'GnuCOBOL 3',
    defaultCode: `       IDENTIFICATION DIVISION.
       PROGRAM-ID. FIBONACCI.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 A PIC 9(10) VALUE 0.
       01 B PIC 9(10) VALUE 1.
       01 TEMP PIC 9(10).
       01 COUNTER PIC 99 VALUE 1.

       PROCEDURE DIVISION.
           DISPLAY "Fibonacci sequence:"
           PERFORM UNTIL COUNTER > 15
               DISPLAY A
               MOVE A TO TEMP
               COMPUTE A = B
               COMPUTE B = TEMP + B
               ADD 1 TO COUNTER
           END-PERFORM
           STOP RUN.
`},
  {
    id: 'assembly', judge0Id: 45, label: 'Assembly (x86)', monacoId: 'assembly', ext: 'asm', color: '#6e4c13', version: 'NASM',
    defaultCode: `; NASM x86-64 Assembly
global _start

section .data
    msg db "Hello from Assembly!", 10
    len equ $ - msg

section .text
_start:
    mov eax, 1          ; sys_write
    mov edi, 1          ; stdout
    lea rsi, [rel msg]
    mov edx, len
    syscall

    mov eax, 60         ; sys_exit
    xor edi, edi
    syscall
`},
  {
    id: 'octave', judge0Id: 66, label: 'Octave (MATLAB)', monacoId: 'matlab', ext: 'm', color: '#e44b23', version: 'GNU Octave 7',
    defaultCode: `% GNU Octave (MATLAB compatible)
function seq = fibonacci(n)
  seq = zeros(1, n);
  seq(1) = 0; seq(2) = 1;
  for i = 3:n
    seq(i) = seq(i-1) + seq(i-2);
  end
end

fibs = fibonacci(15);
disp('Fibonacci sequence:');
disp(fibs);
fprintf('Sum: %d\\n', sum(fibs));
fprintf('Mean: %.2f\\n', mean(fibs));
`},
  {
    id: 'vbnet', judge0Id: 84, label: 'VB.NET', monacoId: 'vb', ext: 'vb', color: '#945db7', version: '.NET 6',
    defaultCode: `' VB.NET
Module Program
    Function Fibonacci(n As Integer) As List(Of Long)
        Dim seq As New List(Of Long) From {0, 1}
        For i As Integer = 2 To n - 1
            seq.Add(seq(i - 1) + seq(i - 2))
        Next
        Return seq
    End Function

    Sub Main()
        Dim fibs = Fibonacci(15)
        Console.WriteLine($"Fibonacci: [{String.Join(", ", fibs)}]")
        Console.WriteLine($"Sum: {fibs.Sum()}")
    End Sub
End Module
`},
  {
    id: 'groovy', judge0Id: 88, label: 'Groovy', monacoId: 'groovy', ext: 'groovy', color: '#4298b8', version: '4.0',
    defaultCode: `// Groovy 4
def fibonacci(n) {
    def seq = [0, 1]
    (2..<n).each { i -> seq << seq[i-1] + seq[i-2] }
    seq.take(n)
}

def fibs = fibonacci(15)
println "Fibonacci: \${fibs}"
println "Sum: \${fibs.sum()}"
println "Avg: \${fibs.sum() / fibs.size()}"
`},
  {
    id: 'nim', judge0Id: 87, label: 'Nim 1.6', monacoId: 'nim', ext: 'nim', color: '#ffc200', version: '1.6',
    defaultCode: `# Nim 1.6
proc fibonacci(n: int): seq[int] =
  var seq = @[0, 1]
  for i in 2 ..< n:
    seq.add(seq[i-1] + seq[i-2])
  return seq[0 ..< n]

let fibs = fibonacci(15)
echo "Fibonacci: ", fibs
echo "Sum: ", fibs.foldl(a + b)
`},
  {
    id: 'crystal', judge0Id: 89, label: 'Crystal 1.8', monacoId: 'crystal', ext: 'cr', color: '#000100', version: '1.8',
    defaultCode: `# Crystal 1.8
def fibonacci(n : Int32) : Array(Int64)
  seq = [0_i64, 1_i64]
  (n - 2).times { seq << seq[-1] + seq[-2] }
  seq.first(n)
end

fibs = fibonacci(15)
puts "Fibonacci: #{fibs}"
puts "Sum: #{fibs.sum}"
`},
  {
    id: 'zig', judge0Id: 93, label: 'Zig 0.11', monacoId: 'zig', ext: 'zig', color: '#ec915c', version: '0.11',
    defaultCode: `// Zig 0.11
const std = @import("std");

pub fn main() !void {
    const stdout = std.io.getStdOut().writer();

    var a: u64 = 0;
    var b: u64 = 1;

    try stdout.print("Fibonacci: ", .{});
    var i: u32 = 0;
    while (i < 15) : (i += 1) {
        try stdout.print("{}", .{a});
        if (i < 14) try stdout.print(", ", .{});
        const temp = a + b;
        a = b;
        b = temp;
    }
    try stdout.print("\\n", .{});
}
`},
  {
    id: 'tcl', judge0Id: 92, label: 'Tcl 8.6', monacoId: 'tcl', ext: 'tcl', color: '#e4cc98', version: '8.6',
    defaultCode: `#!/usr/bin/tclsh
# Tcl 8.6
proc fibonacci {n} {
    set seq [list 0 1]
    for {set i 2} {$i < $n} {incr i} {
        set prev [lindex $seq end-1]
        set curr [lindex $seq end]
        lappend seq [expr {$prev + $curr}]
    }
    return [lrange $seq 0 [expr {$n - 1}]]
}

set fibs [fibonacci 15]
puts "Fibonacci: $fibs"
set sum 0
foreach n $fibs { incr sum $n }
puts "Sum: $sum"
`},
  {
    id: 'lisp', judge0Id: 55, label: 'Common Lisp', monacoId: 'lisp', ext: 'lisp', color: '#3fb68b', version: 'SBCL 2.2',
    defaultCode: `; Common Lisp (SBCL)
(defun fibonacci (n)
  (let ((seq (list 0 1)))
    (loop for i from 2 below n do
      (setf seq (append seq (list (+ (car (last seq 2))
                                      (car (last seq)))))))
    (subseq seq 0 n)))

(let ((fibs (fibonacci 15)))
  (format t "Fibonacci: ~a~%" fibs)
  (format t "Sum: ~a~%" (reduce #'+ fibs)))
`},
  {
    id: 'scheme', judge0Id: 79, label: 'Scheme', monacoId: 'scheme', ext: 'scm', color: '#1e4aec', version: 'MIT Scheme',
    defaultCode: `; Scheme (MIT Scheme)
(define (fibonacci n)
  (let loop ((i 0) (a 0) (b 1) (acc '()))
    (if (= i n)
        (reverse acc)
        (loop (+ i 1) b (+ a b) (cons a acc)))))

(let ((fibs (fibonacci 15)))
  (display "Fibonacci: ") (display fibs) (newline)
  (display "Sum: ") (display (apply + fibs)) (newline))
`},
  {
    id: 'json', judge0Id: 0, label: 'JSON', monacoId: 'json', ext: 'json', color: '#cbcb41', version: 'JSON',
    defaultCode: ``,
  },
  {
    id: 'markdown', judge0Id: 0, label: 'Markdown', monacoId: 'markdown', ext: 'md', color: '#083fa1', version: 'GFM',
    defaultCode: ``,
  },
  {
    id: 'yaml', judge0Id: 0, label: 'YAML', monacoId: 'yaml', ext: 'yaml', color: '#cb171e', version: '1.2',
    defaultCode: ``,
  },
  {
    id: 'xml', judge0Id: 0, label: 'XML', monacoId: 'xml', ext: 'xml', color: '#0060ac', version: '1.0',
    defaultCode: ``,
  },
  {
    id: 'toml', judge0Id: 0, label: 'TOML', monacoId: 'ini', ext: 'toml', color: '#9c4221', version: '1.0',
    defaultCode: ``,
  },
  {
    id: 'plaintext', judge0Id: 0, label: 'Plain Text', monacoId: 'plaintext', ext: 'txt', color: '#888888', version: 'Text',
    defaultCode: ``,
  },
  {
    id: 'dockerfile', judge0Id: 0, label: 'Dockerfile', monacoId: 'dockerfile', ext: 'dockerfile', color: '#384d54', version: 'Docker',
    defaultCode: ``,
  },
  {
    id: 'graphql', judge0Id: 0, label: 'GraphQL', monacoId: 'graphql', ext: 'graphql', color: '#e10098', version: 'GraphQL',
    defaultCode: ``,
  },
]

export const LANG_MAP = Object.fromEntries(LANGUAGES.map(l => [l.id, l]))

export function getLangById(id: string): Language {
  return LANG_MAP[id] ?? LANGUAGES[0]
}
