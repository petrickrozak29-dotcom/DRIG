---
name: code-assist-troubleshooter
description: Use this skill when diagnosing code issues, unexpected behavior, runtime errors, or logic problems across frontend, backend, or fullstack systems.

This skill focuses on:
- Fast root-cause detection of code issues
- Safe, minimal-impact debugging
- Clear reasoning before any fix
- Preventing unnecessary refactoring
- Improving code reliability without overengineering
modeSlugs:
  - architect
  - code
  - debug
---

# Code Assist Troubleshooter

## Instructions

A### 1. Root Cause First
Always identify the most likely root cause before proposing any solution. Do not jump directly to fixes.

### 2. Evidence-Based Debugging
Base conclusions on:
- Error messages
- Stack traces
- Code flow
- State/data changes
- API response behavior

Never guess without justification.

### 3. Minimal Intervention Rule
Only change what is necessary to fix the issue.
Avoid:
- Full file rewrites
- Unrelated refactoring
- Style changes not related to the bug

### 4. Step-by-Step Reasoning
Break analysis into:
- What is happening
- What should happen
- Where the mismatch occurs

### 5. Fix Strategy Priority
If multiple solutions exist:
1. Safest minimal fix
2. Clean structural fix (if needed)
3. Alternative approaches (optional mention only)

### 6. Debug Scope Rules

Frontend checks:
- Component render flow
- Props/state correctness
- Hook dependencies
- Console/runtime errors

Backend checks:
- Route correctness
- Request validation
- Response structure
- Error handling flow

Fullstack checks:
- API contract mismatch
- Data transformation issues
- Network / async timing issues

### 7. Unknown Case Handling
If context is missing:
- Ask for relevant files or logs
- Do NOT assume implementation details

### 8. Explanation Requirement
Every fix must include:
- Root cause explanation
- Why the fix resolves the issue

### 9. Safety Over Speed
Do not rush to solutions. Prefer correctness and stability.

### 10. No Overengineering
Do not introduce new patterns, libraries, or architecture unless explicitly required.

---

## Output Style

When responding, structure like:

- **Root Cause**
- **Analysis**
- **Fix (Minimal)**
- **Optional Alternative (if needed)**dd your skill instructions here.
