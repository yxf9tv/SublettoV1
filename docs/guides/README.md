# Room App - Engineering Implementation Guides

This folder contains detailed step-by-step implementation guides for completing the Room app and publishing it to the App Store.

## Guide Overview

| Phase | Guide | Description | Est. Hours |
|-------|-------|-------------|------------|
| 1 | [PHASE1_PUSH_NOTIFICATIONS.md](./PHASE1_PUSH_NOTIFICATIONS.md) | Expo Push setup, Edge Functions, triggers | 26 |
| 2 | [PHASE2_PAYMENTS.md](./PHASE2_PAYMENTS.md) | Stripe integration, checkout, payouts | 44 |
| 3 | [PHASE3_SOCIAL_AUTH.md](./PHASE3_SOCIAL_AUTH.md) | Apple & Google Sign-In | 20 |
| 4 | [PHASE4_REVIEWS.md](./PHASE4_REVIEWS.md) | Reviews system, ratings, notifications | 21 |
| 5 | [PHASE5_APP_STORE_ASSETS.md](./PHASE5_APP_STORE_ASSETS.md) | Icons, screenshots, metadata | 21 |
| 6 | [PHASE6_BUILD_SETUP.md](./PHASE6_BUILD_SETUP.md) | EAS Build, certificates, TestFlight | 21 |
| 7 | [PHASE7_QA_TESTING.md](./PHASE7_QA_TESTING.md) | Comprehensive testing procedures | 25 |
| 8 | [PHASE8_SUBMISSION.md](./PHASE8_SUBMISSION.md) | App Store submission process | 17 |

**Total Estimated Hours:** 195

## How to Use These Guides

### For Individual Engineers

1. **Read the guide** for your assigned phase completely before starting
2. **Check dependencies** - some tasks require earlier phases to be complete
3. **Follow step-by-step** - each guide includes exact code snippets and commands
4. **Use the testing checklist** at the end of each guide to verify your work
5. **Report blockers** early if you encounter issues not covered

### For Team Leads

1. **Assign phases to engineers** based on skill level and availability
2. **Phases 1-4 can run in parallel** with different engineers
3. **Phases 5-8 are sequential** and depend on earlier work
4. **Schedule code reviews** after each phase completion
5. **Use the testing checklists** for acceptance criteria

## Phase Dependencies

```
Phase 1 (Push Notifications)  ─┐
Phase 2 (Payments)           ─┼─→ Phase 5 (Assets) → Phase 6 (Build) → Phase 7 (QA) → Phase 8 (Submit)
Phase 3 (Social Auth)        ─┤
Phase 4 (Reviews)            ─┘
```

## Guide Structure

Each guide contains:

1. **Overview** - Task list with estimated hours and dependencies
2. **Prerequisites** - What you need before starting
3. **Step-by-step instructions** - With exact commands and code snippets
4. **Testing checklist** - To verify your implementation
5. **Troubleshooting** - Common issues and solutions
6. **Resources** - Links to official documentation

## Related Documents

- [../APP_STORE_ROADMAP.xlsx](../APP_STORE_ROADMAP.xlsx) - Master task list with all tasks
- [../APP_STORE_ROADMAP_DETAILED.csv](../APP_STORE_ROADMAP_DETAILED.csv) - CSV version with detailed steps
- [../ENGINEERING_GUIDE.md](../ENGINEERING_GUIDE.md) - Sprint-based implementation guide
- [../QA_CHECKLIST.md](../QA_CHECKLIST.md) - Existing QA testing checklist
- [../ARCHITECTURE.md](../ARCHITECTURE.md) - Technical architecture overview

## Getting Help

If you encounter issues:

1. Check the **Troubleshooting** section of the relevant guide
2. Review the **Resources** links for official documentation
3. Search existing issues in the repo
4. Ask in the team Slack channel
5. Escalate to the tech lead

---

*Last Updated: February 2026*
