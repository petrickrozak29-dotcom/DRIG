---
name: skill-orchestrator
description: description: Use this skill to coordinate and select the appropriate skills based on the user's request and context.

This skill ensures the correct workflow between frontend, backend, AI, and debugging tasks.
modeSlugs:
  - architect
  - ask
---

# Skill Orchestrator

## Instructions

AWhen this skill is active:

1. Always analyze the user's request first.

2. Determine which skill(s) should handle the task:
   - UI → frontend-ui-builder
   - API / backend → backend-api-engineer
   - AI features → ai-feature-builder
   - Errors / bugs → code-debug-helper
   - Feature planning → web-planner-assistant

3. If the task requires multiple steps:
   - Break it into stages
   - Assign each stage to the correct skill

4. Maintain logical workflow:
   - Planning → UI → Backend → Debug → AI (if needed)

5. Avoid using multiple skills at the same time unless necessary.

6. If context is unclear:
   - Ask for clarification before proceeding

7. Always ensure responses are:
   - Structured
   - Clear
   - Step-by-step when needed

8. Do not generate code immediately if planning is required first.dd your skill instructions here.
