# Phase 3 Dataset Engineering Report: Hindi $\rightarrow$ Santali (Ol Chiki)

## Dataset Summary
- **Raw Candidate Pairs**: 2,012
- **Valid Canonical Pairs**: 2,007
- **Rejected Malformed Pairs**: 5
- **Ol Chiki Script Compliance**: 100% (Unicode block `U+1C50`–`U+1C7F`)
- **Deduplication**: 0 duplicate pairs
- **Split Random Seed**: 42

## Partition Splits
| Split | Pair Count | Percentage | Script Validity |
| :--- | :--- | :--- | :--- |
| **Train** | 1,605 | 79.97% | 100% Ol Chiki |
| **Validation** | 200 | 9.97% | 100% Ol Chiki |
| **Test** | 202 | 10.06% | 100% Ol Chiki |
| **Locked Eval Benchmark** | 100 | - | 100% Ol Chiki |

## Alignment & Length Statistics
- Mean Hindi Sentence Length: 31.63 chars
- Mean Santali Sentence Length: 30.95 chars
- Mean Length Ratio (Santali / Hindi): 0.99
