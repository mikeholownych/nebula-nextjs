# 7 Coding Patterns Stolen from Senior Engineers (Applied to Nebula)

## 1️⃣ Return Early (Guard Clauses)
- **Why:** Keeps the happy path shallow and makes failure cases obvious.
- **How in Nebula:** Refactor functions that nest multiple `if` checks into early `return` or `throw` statements.
- **Example:**
  ```go
  func UpdateProfile(userID string, input ProfileInput) error {
      user, err := repo.GetUser(userID)
      if err != nil {
          return fmt.Errorf("user not found: %w", err)
      }
      if input.Email == "" {
          return errors.New("email is required")
      }
      if !user.CanEditProfile {
          return errors.New("permission denied")
      }
      return repo.SaveProfile(user.ID, input)
  }
  ```
- **Action:** Search the codebase for deep nesting (`if {... if {...`) and replace with guard clauses.

## 2️⃣ Name the Business Meaning, Not the Technical Accident
- **Why:** Clear names survive refactors and make intent explicit.
- **How in Nebula:** Prefer domain‑centric names (`subscription`, `auditRequest`, `lead`) over generic ones (`data`, `result`, `payload`).
- **Example:**
  ```go
  // Bad
  var result = svc.GetData(id)

  // Good
  var audit = svc.GetAuditRequest(auditID)
  ```
- **Action:** Run a lint‑style search for generic identifiers (`data`, `obj`, `item`, `payload`) and replace with domain‑specific names.

## 3️⃣ Put Boundaries Around External Chaos (Adapters)
- **Why:** Shields the core code from breaking external API changes.
- **How in Nebula:** Create an *adapter* layer for every third‑party service (AgentMail, Stripe, Cloudflare, Google Calendar). The rest of the system consumes only our internal structs.
- **Example:**
  ```go
  // Adapter
  func MapAgentMailMessage(resp agentmail.Message) internal.Email {
      return internal.Email{ID: resp.ID, From: resp.From, Subject: resp.Subject, Body: resp.Body}
  }
  ```
- **Action:** Add a new directory `nebula/adapters/` and start moving raw API handling code there.

## 4️⃣ Make Invalid States Hard to Represent
- **Why:** Prevents silent bugs caused by partially‑filled structs.
- **How in Nebula:** Use distinct types for different lifecycle stages (e.g., `DraftLead`, `PersistedLead`, `QualifiedLead`).
- **Example (Go):**
  ```go
  type DraftLead struct { Email string; Source string }
  type PersistedLead struct { ID string; Email string; Source string; CreatedAt time.Time }
  ```
- **Action:** Identify structs with many optional fields and split them into meaningful sub‑types.

## 5️⃣ Separate Decisions From Actions
- **Why:** Enables unit‑testing business rules without side‑effects.
- **How in Nebula:** Extract pure decision functions that return a struct `{ allowed bool; reason string }`.
- **Example:**
  ```go
  func CanSendAudit(user internal.User) (bool, string) {
      if user.Subscription != "premium" { return false, "subscription not premium" }
      if time.Since(user.LastAudit) < 24*time.Hour { return false, "audit rate limit" }
      return true, ""
  }
  ```
- **Action:** Refactor existing command‑handlers to call a decision helper before performing API/network calls.

## 6️⃣ Make Errors Useful to the Next Person
- **Why:** Errors become a communication channel rather than a dead‑end.
- **How in Nebula:** Use structured error types with a code, message, and optional details (but never expose secrets).
- **Example:**
  ```go
  type AppError struct {
      Code    string `json:"code"`
      Message string `json:"message"`
      Details map[string]string `json:"details,omitempty"`
  }

  func (e AppError) Error() string { return fmt.Sprintf("%s: %s", e.Code, e.Message) }
  ```
- **Action:** Create a `nebula/errors` package and replace generic `errors.New` with `AppError` throughout the code.

## 7️⃣ Optimize for the Diff, Not the Demo
- **Why:** Small, focused PRs are easier to review, test, and roll back.
- **How in Nebula:** Split large feature work into incremental PRs (e.g., one PR for a refactor, one for a new endpoint, one for tests). Use conventional commit messages.
- **Action Checklist for Every PR:
  - Does it contain only *one* logical change?
  - Are unrelated refactors moved to a separate PR?
  - Are all new tests co‑located with the code they cover?
  - Is the diff < 200 lines (if not, consider splitting)?
  ```
- **Implementation:** Add a `CONTRIBUTING.md` with this checklist and enforce via CI lint (e.g., a simple script that fails if a PR exceeds 250 lines without `WIP`).

---

## Next Steps for the Nebula Codebase
1. **Create a `guidelines/` directory** and commit this file (`coding_patterns.md`).
2. **Introduce an `adapters/` package** (see pattern 3) and migrate the first external integration (AgentMail) there.
3. **Add `errors/` package** (pattern 6) and replace at least three existing error constructions.
4. **Run a static‑analysis pass** to locate deep nesting and generic names; open tickets for each replacement.
5. **Update `CONTRIBUTING.md`** with the diff checklist from pattern 7.
6. **Schedule a short team sync** (15 min) to walk through these patterns and agree on adoption cadence.

By embedding these practices now, the Nebula project will become more maintainable, easier to debug, and safer to ship under the tight 7‑day revenue challenge.
