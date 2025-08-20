const problems = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    categories: ["Array", "Hash Table"],
    description: "Given an array of integers, return indices of the two numbers such that they add up to a specific target.",
    testCases: [
      { input: "2 7 11 15\n9", expectedOutput: "0 1\n" },
      { input: "3 2 4\n6", expectedOutput: "1 2\n" }
    ],
    hiddenTestCases: [
      { input: "1 5 3 7\n8", expectedOutput: "0 3\n" },
      { input: "4 3 2 1\n5", expectedOutput: "1 2\n" }
    ]
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    categories: ["Stack"],
    description: "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    testCases: [
      { input: "()", expectedOutput: "true\n" },
      { input: "([)]", expectedOutput: "false\n" }
    ],
    hiddenTestCases: [
      { input: "[({})]", expectedOutput: "true\n" },
      { input: "{[(])}", expectedOutput: "false\n" }
    ]
  },
  {
    id: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "Medium",
    categories: ["Array", "Sorting"],
    description: "Given a collection of intervals, merge all overlapping intervals.",
    testCases: [
      { input: "2\n1 3\n2 6", expectedOutput: "1 6\n" },
      { input: "3\n1 4\n5 6\n7 8", expectedOutput: "1 4\n5 6\n7 8\n" }
    ],
    hiddenTestCases: [
      { input: "4\n1 2\n2 3\n3 4\n4 5", expectedOutput: "1 5\n" },
      { input: "2\n10 20\n20 21", expectedOutput: "10 21\n" }
    ]
  },
  {
    id: "longest-unique-substring",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    categories: ["String", "Sliding Window"],
    description: "Given a string, find the length of the longest substring without repeating characters.",
    testCases: [
      { input: "abcabcbb", expectedOutput: "3\n" },
      { input: "bbbbb", expectedOutput: "1\n" }
    ],
    hiddenTestCases: [
      { input: "pwwkew", expectedOutput: "3\n" },
      { input: "abcdefg", expectedOutput: "7\n" }
    ]
  },
  {
    id: "maximum-subarray",
    title: "Maximum Subarray",
    difficulty: "Easy",
    categories: ["Array", "Dynamic Programming"],
    description: "Find the contiguous subarray with the largest sum.",
    testCases: [
      { input: "-2 1 -3 4 -1 2 1 -5 4", expectedOutput: "6\n" },
      { input: "1", expectedOutput: "1\n" }
    ],
    hiddenTestCases: [
      { input: "5 4 -1 7 8", expectedOutput: "23\n" },
      { input: "-1 -2 -3 -4", expectedOutput: "-1\n" }
    ]
  },
  {
    id: "num-islands",
    title: "Number of Islands",
    difficulty: "Medium",
    categories: ["Graph", "DFS"],
    description: "Given a 2D grid map of '1's (land) and '0's (water), count the number of islands.",
    testCases: [
      { input: "3 3\n111\n010\n111", expectedOutput: "1\n" },
      { input: "3 4\n1100\n1100\n0011", expectedOutput: "2\n" }
    ],
    hiddenTestCases: [
      { input: "4 5\n11000\n11000\n00100\n00011", expectedOutput: "3\n" },
      { input: "2 2\n10\n01", expectedOutput: "2\n" }
    ]
  },
  {
    id: "coin-change",
    title: "Coin Change",
    difficulty: "Medium",
    categories: ["Dynamic Programming"],
    description: "You are given coins of different denominations and a total amount. Compute the fewest number of coins to make up that amount.",
    testCases: [
      { input: "3\n1 2 5\n11", expectedOutput: "3\n" },
      { input: "1\n2\n3", expectedOutput: "-1\n" }
    ],
    hiddenTestCases: [
      { input: "2\n2 5\n7", expectedOutput: "2\n" },
      { input: "3\n1 3 4\n6", expectedOutput: "2\n" }
    ]
  },
  {
    id: "binary-tree-level-order",
    title: "Binary Tree Level Order Traversal",
    difficulty: "Medium",
    categories: ["Tree", "BFS"],
    description: "Given a binary tree, return its level order traversal as a list of values for each level.",
    testCases: [
      { input: "3\n9 20 N N 15 7", expectedOutput: "3\n9 20\n15 7\n" },
      { input: "1", expectedOutput: "1\n" }
    ],
    hiddenTestCases: [
      { input: "7\n3 9 8 N N 4 5", expectedOutput: "3\n3\n9 8\n4 5\n" },
      { input: "2\n1 2", expectedOutput: "2\n1 2\n" }
    ]
  },
  {
    id: "kth-largest",
    title: "Kth Largest Element in an Array",
    difficulty: "Medium",
    categories: ["Array", "Sorting", "Heap"],
    description: "Find the kth largest element in an unsorted array.",
    testCases: [
      { input: "3\n3 2 1 5 6 4", expectedOutput: "4\n" },
      { input: "1\n2 1", expectedOutput: "2\n" }
    ],
    hiddenTestCases: [
      { input: "2\n7 10 4 3 20 15", expectedOutput: "15\n" },
      { input: "4\n1 10 7 6 4 9 8", expectedOutput: "7\n" }
    ]
  },
  {
    id: "edit-distance",
    title: "Edit Distance",
    difficulty: "Hard",
    categories: ["String", "Dynamic Programming"],
    description: "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.",
    testCases: [
      { input: "horse\nros", expectedOutput: "3\n" },
      { input: "intention\nexecution", expectedOutput: "5\n" }
    ],
    hiddenTestCases: [
      { input: "abc\nyabd", expectedOutput: "2\n" },
      { input: "abcdef\nazced", expectedOutput: "3\n" }
    ]
  },
  {
    id: "dijkstra",
    title: "Dijkstra's Shortest Path",
    difficulty: "Medium",
    categories: ["Graph", "Dijkstra", "Heap"],
    description: "Given a weighted directed graph and a source vertex, compute the shortest distances from the source to all other vertices.",
    testCases: [
      { input: "5\n0 1 2\n0 2 4\n1 2 1\n1 3 7\n2 4 3\n3 4 1\n0", expectedOutput: "0 2 3 9 6\n" },
      { input: "3\n0 1 1\n1 2 2\n0", expectedOutput: "0 1 3\n" }
    ],
    hiddenTestCases: [
      { input: "4\n0 1 1\n1 2 2\n2 3 3\n0", expectedOutput: "0 1 3 6\n" }
    ]
  },
  {
    id: "longest-palindromic-substring",
    title: "Longest Palindromic Substring",
    difficulty: "Medium",
    categories: ["String", "Dynamic Programming"],
    description: "Given a string s, return the longest palindromic substring in s.",
    testCases: [
      { input: "babad", expectedOutput: "bab\n" },
      { input: "cbbd", expectedOutput: "bb\n" }
    ],
    hiddenTestCases: [
      { input: "racecar", expectedOutput: "racecar\n" },
      { input: "forgeeksskeegfor", expectedOutput: "geeksskeeg\n" }
    ]
  }
];

export default problems;