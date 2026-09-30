import { Contest, ContestProblem } from './contestTypes';

export const SEED_CONTESTS: Contest[] = [
  {
    id: 'contest-showdown-1',
    title: 'CodeForge Grand Showdown #1',
    description: 'High-octane competitive programming challenge featuring algorithmic puzzles across array manipulation, graphs, and dynamic programming.',
    type: 'competitive',
    status: 'live',
    startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // started 30 mins ago
    endTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),   // ends in 90 mins
    durationMinutes: 120,
    totalPoints: 300,
    registeredUsersCount: 1420,
    proctoring: {
      requireCamera: true,
      requireMic: false,
      requireScreenShare: true,
      requireFullscreen: true,
      prohibitClipboard: true,
      maxViolationsBeforeLock: 3,
      lockoutDurationSeconds: 15,
      autoTerminateOnMaxViolations: false,
    },
    privacyNotice: {
      dataCollected: ['Webcam video stream (live frame verification)', 'Browser screen capture stream', 'Window focus & visibility changes', 'Clipboard telemetry'],
      purpose: 'Verification of contest integrity and fair competitive standing.',
      retentionPolicy: 'Stream frames processed ephemerally in-session; security violation logs retained for 30 days for proctor audit.',
      whoHasAccess: 'Authorized contest administrators & anti-cheat audit panel only.',
      refusalConsequence: 'Proctored mode will not activate and submission privileges will remain locked.',
    },
    problems: [
      {
        id: 'prob-max-subarray',
        contestId: 'contest-showdown-1',
        title: 'Maximum Contiguous Energy',
        slug: 'max-contiguous-energy',
        difficulty: 'Easy',
        points: 50,
        timeLimitMs: 1500,
        memoryLimitMb: 128,
        description: `You are given an integer array \`energy\` representing power values from different nodes in the CodeForge grid.
Find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.

### Constraints:
* \`1 <= energy.length <= 10^5\`
* \`-10^4 <= energy[i] <= 10^4\``,
        inputFormat: 'First line contains integer N. The next line contains N space-separated integers.',
        outputFormat: 'Print a single integer: the maximum subarray sum.',
        sampleTestCases: [
          {
            input: '9\n-2 1 -3 4 -1 2 1 -5 4',
            expectedOutput: '6',
            explanation: 'The subarray [4,-1,2,1] has the largest sum = 6.'
          },
          {
            input: '1\n1',
            expectedOutput: '1',
            explanation: 'Single element subarray sum is 1.'
          },
          {
            input: '5\n5 4 -1 7 8',
            expectedOutput: '23',
            explanation: 'The entire array [5,4,-1,7,8] has the largest sum = 23.'
          }
        ],
        starterCode: {
          python: `def solve():
    import sys
    input = sys.stdin.read
    data = input().split()
    if not data:
        return
    n = int(data[0])
    arr = [int(x) for x in data[1:n+1]]
    
    # Write your solution here
    max_sum = arr[0]
    curr_sum = 0
    for x in arr:
        curr_sum = max(x, curr_sum + x)
        max_sum = max(max_sum, curr_sum)
    print(max_sum)

if __name__ == '__main__':
    solve()
`,
          cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n;
    if (!(cin >> n)) return 0;
    vector<long long> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    
    long long max_sum = arr[0], curr_sum = 0;
    for (int i = 0; i < n; i++) {
        curr_sum = max(arr[i], curr_sum + arr[i]);
        max_sum = max(max_sum, curr_sum);
    }
    cout << max_sum << "\\n";
    return 0;
}
`,
          javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);
    if (!input || input.length < 2) return;
    const n = parseInt(input[0], 10);
    const arr = input.slice(1, n + 1).map(Number);
    
    let maxSum = arr[0];
    let currSum = 0;
    for (const x of arr) {
        currSum = Math.max(x, currSum + x);
        maxSum = Math.max(maxSum, currSum);
    }
    console.log(maxSum);
}

solve();
`,
          java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        long[] arr = new long[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextLong();
        }
        long maxSum = arr[0];
        long currSum = 0;
        for (int i = 0; i < n; i++) {
            currSum = Math.max(arr[i], currSum + arr[i]);
            maxSum = Math.max(maxSum, currSum);
        }
        System.out.println(maxSum);
    }
}
`
        }
      },
      {
        id: 'prob-two-sum-target',
        contestId: 'contest-showdown-1',
        title: 'Grid Frequency Calibration',
        slug: 'grid-frequency-calibration',
        difficulty: 'Medium',
        points: 100,
        timeLimitMs: 2000,
        memoryLimitMb: 256,
        description: `Given an array of integers \`freqs\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`.

Assume exactly one valid pair exists, and you may not use the same element twice.
Output the smaller 0-based index first, followed by the larger index separated by a space.

### Constraints:
* \`2 <= freqs.length <= 10^5\`
* \`-10^9 <= freqs[i] <= 10^9\`
* \`-10^9 <= target <= 10^9\``,
        inputFormat: 'First line contains integer N and target. Second line contains N space-separated integers.',
        outputFormat: 'Print two space-separated indices: i j (where i < j).',
        sampleTestCases: [
          {
            input: '4 9\n2 7 11 15',
            expectedOutput: '0 1',
            explanation: 'freqs[0] + freqs[1] = 2 + 7 = 9.'
          },
          {
            input: '3 6\n3 2 4',
            expectedOutput: '1 2',
            explanation: 'freqs[1] + freqs[2] = 2 + 4 = 6.'
          }
        ],
        starterCode: {
          python: `def solve():
    import sys
    input = sys.stdin.read
    data = input().split()
    if not data: return
    n, target = int(data[0]), int(data[1])
    arr = [int(x) for x in data[2:n+2]]
    
    seen = {}
    for i, num in enumerate(arr):
        comp = target - num
        if comp in seen:
            print(f"{seen[comp]} {i}")
            return
        seen[num] = i

if __name__ == '__main__':
    solve()
`,
          cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    long long target;
    if (!(cin >> n >> target)) return 0;
    unordered_map<long long, int> seen;
    for (int i = 0; i < n; i++) {
        long long val;
        cin >> val;
        long long comp = target - val;
        if (seen.count(comp)) {
            cout << seen[comp] << " " << i << "\\n";
            return 0;
        }
        seen[val] = i;
    }
    return 0;
}
`,
          javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);
    if (!input || input.length < 3) return;
    const n = parseInt(input[0], 10);
    const target = parseInt(input[1], 10);
    const arr = input.slice(2, n + 2).map(Number);
    
    const seen = new Map();
    for (let i = 0; i < arr.length; i++) {
        const comp = target - arr[i];
        if (seen.has(comp)) {
            console.log(seen.get(comp) + ' ' + i);
            return;
        }
        seen.set(arr[i], i);
    }
}

solve();
`
        }
      },
      {
        id: 'prob-valid-parentheses',
        contestId: 'contest-showdown-1',
        title: 'Quantum Bracket Validator',
        slug: 'quantum-bracket-validator',
        difficulty: 'Hard',
        points: 150,
        timeLimitMs: 2000,
        memoryLimitMb: 256,
        description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### Constraints:
* \`1 <= s.length <= 10^5\`
* \`s\` consists of parentheses only \`'()[]{}'\`.`,
        inputFormat: 'A single string s on the first line.',
        outputFormat: 'Print "true" if the bracket sequence is valid, or "false" otherwise.',
        sampleTestCases: [
          {
            input: '()[]{}',
            expectedOutput: 'true',
            explanation: 'All brackets close in proper sequence.'
          },
          {
            input: '(]',
            expectedOutput: 'false',
            explanation: 'Parenthesis closed with square bracket.'
          },
          {
            input: '([)]',
            expectedOutput: 'false',
            explanation: 'Mismatched order.'
          }
        ],
        starterCode: {
          python: `def isValid(s: str) -> bool:
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return not stack

if __name__ == '__main__':
    import sys
    s = sys.stdin.read().strip()
    print("true" if isValid(s) else "false")
`,
          cpp: `#include <iostream>
#include <string>
#include <stack>
using namespace std;

bool isValid(const string& s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '{' || c == '[') st.push(c);
        else {
            if (st.empty()) return false;
            char top = st.top(); st.pop();
            if (c == ')' && top != '(') return false;
            if (c == '}' && top != '{') return false;
            if (c == ']' && top != '[') return false;
        }
    }
    return st.empty();
}

int main() {
    string s;
    if (cin >> s) {
        cout << (isValid(s) ? "true" : "false") << "\\n";
    }
    return 0;
}
`,
          javascript: `const fs = require('fs');

function isValid(s) {
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    for (const c of s) {
        if (c === '(' || c === '{' || c === '[') {
            stack.push(c);
        } else if (map[c]) {
            if (stack.pop() !== map[c]) return false;
        }
    }
    return stack.length === 0;
}

const input = fs.readFileSync('/dev/stdin', 'utf-8').trim();
console.log(isValid(input) ? "true" : "false");
`
        }
      }
    ]
  },
  {
    id: 'contest-assessment-fullstack',
    title: 'Senior Software Engineer Assessment',
    description: 'Technical evaluation round designed for candidates interviewing for Fullstack & Systems roles. Strict proctoring with video, screen share, and audio verification.',
    type: 'assessment',
    status: 'live',
    startTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 110 * 60 * 1000).toISOString(),
    durationMinutes: 120,
    totalPoints: 200,
    registeredUsersCount: 84,
    proctoring: {
      requireCamera: true,
      requireMic: true,
      requireScreenShare: true,
      requireFullscreen: true,
      prohibitClipboard: true,
      maxViolationsBeforeLock: 3,
      lockoutDurationSeconds: 20,
      autoTerminateOnMaxViolations: false,
    },
    privacyNotice: {
      dataCollected: ['Continuous webcam snapshot stream', 'Continuous microphone audio activity levels', 'Full desktop or window screen capture', 'Copy/paste events and browser window focus changes'],
      purpose: 'Identity verification and assessment integrity for hiring decision-making.',
      retentionPolicy: 'Proctor telemetry held for 60 days following assessment conclusion, accessible only by the recruitment review team.',
      whoHasAccess: 'Hiring committee, assigned interview proctors, and technical lead.',
      refusalConsequence: 'Assessment will not start. Alternative proctored live interview must be requested.',
    },
    problems: [
      {
        id: 'prob-lru-cache-sim',
        contestId: 'contest-assessment-fullstack',
        title: 'LRU Cache Access Sequence',
        slug: 'lru-cache-access-sequence',
        difficulty: 'Medium',
        points: 100,
        timeLimitMs: 2000,
        memoryLimitMb: 256,
        description: `Implement a simulation of a Least Recently Used (LRU) Cache with capacity \`C\`.
You will receive a series of operations:
* \`PUT key value\`
* \`GET key\`

For each \`GET\` operation, output the value if the key exists, or \`-1\` if not found.
When the capacity is exceeded, the least recently used key should be evicted.

### Constraints:
* \`1 <= C <= 1000\`
* Operations count up to \`50,000\``,
        inputFormat: 'First line: capacity C and number of operations Q. Next Q lines: operations.',
        outputFormat: 'For each GET operation, print the resulting integer on a new line.',
        sampleTestCases: [
          {
            input: '2 6\nPUT 1 1\nPUT 2 2\nGET 1\nPUT 3 3\nGET 2\nGET 3',
            expectedOutput: '1\n-1\n3',
            explanation: 'PUT 1 1, PUT 2 2. GET 1 -> 1. PUT 3 3 evicts key 2. GET 2 -> -1. GET 3 -> 3.'
          }
        ],
        starterCode: {
          python: `import sys

def solve():
    from collections import OrderedDict
    lines = sys.stdin.read().splitlines()
    if not lines: return
    first = lines[0].split()
    cap, q = int(first[0]), int(first[1])
    
    cache = OrderedDict()
    out = []
    
    for i in range(1, q + 1):
        if i >= len(lines): break
        parts = lines[i].split()
        if not parts: continue
        cmd = parts[0]
        if cmd == "PUT":
            k, v = int(parts[1]), int(parts[2])
            if k in cache:
                cache.move_to_end(k)
            cache[k] = v
            if len(cache) > cap:
                cache.popitem(last=False)
        elif cmd == "GET":
            k = int(parts[1])
            if k in cache:
                cache.move_to_end(k)
                out.append(str(cache[k]))
            else:
                out.append("-1")
                
    sys.stdout.write("\\n".join(out) + "\\n")

if __name__ == '__main__':
    solve()
`
        }
      },
      {
        id: 'prob-stream-median',
        contestId: 'contest-assessment-fullstack',
        title: 'Running Stream Percentile',
        slug: 'running-stream-percentile',
        difficulty: 'Medium',
        points: 100,
        timeLimitMs: 2500,
        memoryLimitMb: 256,
        description: `Given a continuous sequence of integers, output the median of the elements seen so far after each addition.
If the count of numbers is even, output the median formatted to 1 decimal place. If odd, output the integer median formatted to 1 decimal place.

### Constraints:
* \`1 <= N <= 20,000\`
* \`-10^5 <= val <= 10^5\``,
        inputFormat: 'First line: N. Next N lines: one integer each.',
        outputFormat: 'N lines, each with the running median to 1 decimal place (e.g. 5.0).',
        sampleTestCases: [
          {
            input: '4\n5\n15\n1\n3',
            expectedOutput: '5.0\n10.0\n5.0\n4.0',
            explanation: '[5] -> 5.0. [5, 15] -> 10.0. [1, 5, 15] -> 5.0. [1, 3, 5, 15] -> (3+5)/2 = 4.0.'
          }
        ],
        starterCode: {
          python: `import sys
import heapq

def solve():
    lines = sys.stdin.read().split()
    if not lines: return
    n = int(lines[0])
    vals = [int(x) for x in lines[1:n+1]]
    
    small = [] # max-heap (invert signs)
    large = [] # min-heap
    
    for num in vals:
        heapq.heappush(small, -num)
        
        # Ensure small elements <= large elements
        if small and large and (-small[0] > large[0]):
            val = -heapq.heappop(small)
            heapq.heappush(large, val)
            
        # Balance sizes
        if len(small) > len(large) + 1:
            val = -heapq.heappop(small)
            heapq.heappush(large, val)
        elif len(large) > len(small):
            val = heapq.heappop(large)
            heapq.heappush(small, -val)
            
        if len(small) == len(large):
            med = (-small[0] + large[0]) / 2.0
        else:
            med = float(-small[0])
        print(f"{med:.1f}")

if __name__ == '__main__':
    solve()
`
        }
      }
    ]
  },
  {
    id: 'contest-upcoming-algo',
    title: 'Algorithm Masters Invitational #4',
    description: 'Upcoming high-stakes coding contest featuring graph theory, segment trees, and computational geometry.',
    type: 'competitive',
    status: 'upcoming',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 27 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 180,
    totalPoints: 400,
    registeredUsersCount: 2310,
    proctoring: {
      requireCamera: true,
      requireMic: false,
      requireScreenShare: true,
      requireFullscreen: true,
      prohibitClipboard: true,
      maxViolationsBeforeLock: 3,
      lockoutDurationSeconds: 15,
      autoTerminateOnMaxViolations: false,
    },
    privacyNotice: {
      dataCollected: ['Webcam stream snapshots', 'Screen capture stream', 'Window telemetry'],
      purpose: 'Fair competition verification.',
      retentionPolicy: '30-day retention for winner audit.',
      whoHasAccess: 'Tournament committee.',
      refusalConsequence: 'Disqualification from official leaderboard.',
    },
    problems: []
  }
];

// SERVER-SIDE HIDDEN TEST CASES (Simulated authoritative suite - strictly evaluated server-side)
export const SERVER_HIDDEN_TEST_CASES: Record<string, Array<{ input: string; expectedOutput: string }>> = {
  'prob-max-subarray': [
    { input: '4\n-1 -2 -3 -4', expectedOutput: '-1' },
    { input: '6\n10 -20 30 -5 40 -100', expectedOutput: '65' },
    { input: '8\n0 0 0 0 0 0 0 0', expectedOutput: '0' },
    { input: '5\n100 200 -50 300 -400', expectedOutput: '550' },
    { input: '7\n-2 -3 4 -1 -2 1 5', expectedOutput: '7' }
  ],
  'prob-two-sum-target': [
    { input: '5 100\n10 20 30 70 90', expectedOutput: '2 3' },
    { input: '6 0\n-5 3 -2 5 8 1', expectedOutput: '0 3' },
    { input: '4 8\n4 2 6 4', expectedOutput: '0 3' },
    { input: '2 1000000000\n500000000 500000000', expectedOutput: '0 1' }
  ],
  'prob-valid-parentheses': [
    { input: '((({{{[[[]]]}}})))', expectedOutput: 'true' },
    { input: '((({{{[[[]]]}}}))', expectedOutput: 'false' },
    { input: '()(){}{}[][]', expectedOutput: 'true' },
    { input: '((((((((((', expectedOutput: 'false' },
    { input: '))))))))))', expectedOutput: 'false' }
  ],
  'prob-lru-cache-sim': [
    { input: '1 4\nPUT 10 100\nGET 10\nPUT 20 200\nGET 10', expectedOutput: '100\n-1' },
    { input: '3 5\nPUT 1 10\nPUT 2 20\nPUT 3 30\nGET 1\nGET 2', expectedOutput: '10\n20' }
  ],
  'prob-stream-median': [
    { input: '5\n10\n20\n30\n40\n50', expectedOutput: '10.0\n15.0\n20.0\n25.0\n30.0' },
    { input: '3\n-5\n-1\n-10', expectedOutput: '-5.0\n-3.0\n-5.0' }
  ]
};
