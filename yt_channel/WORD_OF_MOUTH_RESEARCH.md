# Deep Research: Word-of-Mouth Engineering Frameworks

**Sources**:
- Viral Loops: Beginner's Guide to Viral Loops
- Engineering for Marketers: Embedded Distribution
- Point Nine Land (Louis Coppey): Understanding Viral Growth in SaaS
- IndieHackers: How to Engineer Word of Mouth (Darko Gjorgjievski)

---

## **Part 1: The Core Math of Virality**

### **K-Factor (Viral Coefficient)**

Definition: "How many new users one user brings to your product in a defined time period"

Formula: **K = Activation × Exposure/Contamination × Conversion**

**Power of K > 1**:
- K = 1.1 (1 user brings 1.1 new users per cycle)
- After 10 cycles: 2.6× users
- After 100 cycles: 13,780× users
- After 1,000 cycles: 2.46 × 10²¹ users (exponential growth with $0 CAC)

**Threshold**: K > 0.3 = healthy B2B growth. K > 1.0 = exponential scale.

---

## **Part 2: Three Phases of Viral Loops**

### **Phase 1: Activation (Time to First Share)**

**Definition**: "The key action a new user must do to derive utility and expose your product"

**For Nebula**: User completes free audit → Gets results → Shares audit link

**Techniques to improve**:
- Define the "aha moment" (what moment makes user want to share?)
- Accelerate "time to value" (how fast can they see results?)
- Accelerate "time to sharing" (how fast until they want to share?)
- Build templates or pre-made shareable outputs
- Facilitate the sharing (one-click buttons, pre-populated messages)

**Case study: Loom**
- Activation metric: "first Loom video viewed by someone else"
- Seed round: 17% activation
- Series A: 35% activation (2× improvement in viral loop)

**Application to Nebula**: Current activation = 0% (no sharing mechanism). Target = 5-10% of free audits lead to shares.

---

### **Phase 2: Exposure/Contamination (Reach of Each Share)**

**Definition**: "Number of people exposed when an activated user shares"

**Important**: This is **intrinsic to the use case** (built-in, can't fake it).

**Examples**:
- Typeform survey = sent to 100s of recipients/month
- Qwilr documents = sent to 10s-100s of viewers/month
- Loom videos = viewed by 1000s of viewers/month
- Calendly links = seen by 1-5 people per link (lower)
- Figma/Notion docs = 5-20+ collaborators (varies by use case)

**Techniques to improve**:
- Map "communication flows" (how do users naturally share with others?)
- Understand channels (email, Slack, Twitter, LinkedIn, direct link?)
- Optimize for each channel (different share formats for each)
- Add "powered by" branding (subtle attribution on shared output)

**For Nebula**: Communication flows include:
- Email (founders share audit link via email)
- Twitter/LinkedIn (share findings + link as social proof)
- Slack (team members share audit result in #marketing)
- Direct messages (founder tells colleague: "check this out")
- Reddit (founders quote findings in threads)

**Expected exposure per share**: 2-5 people per audit share, 5-15 per newsletter share (newsletter reach 100+ subscribers).

---

### **Phase 3: Conversion (Sharing → Signup)**

**Definition**: "% of people exposed who become users (click link → sign up → try audit)"

**Baseline factors**:
- How relevant is the exposed person? (founder seeing audit = 10-20% conversion; random person = 1-2%)
- How compelling is the shared output? (impressive 4/10 score with specific finding = higher; generic result = lower)
- How easy is signup? (one-click = higher; email required = lower)
- Social proof on shared link (e.g., "847 audits, 721 founders fixed" = higher)

**Techniques to improve**:
- Make shared links look impressive (design, social proof, specific finding)
- Reduce friction on shared page (pre-fill email, no signup required to view)
- Add urgency or curiosity (expiry date, "Your competitor scored higher", "See specific fixes")
- Add incentive (10% off first fix pack if viewed from shared link)

**For Nebula**: Target 5-10% conversion from shared audit link.

---

## **Part 3: Embedded Distribution (Built-in Sharing Mechanics)**

**Core principle**: Distribution designed directly into product → Sharing is natural consequence of usage

### **Why Embedded Distribution Works**

1. **Exposure during real value** → Users see product solving actual problem
2. **Right audience** → Exposed people already face similar problem
3. **Scales with usage** → More users = more sharing = more exposure = exponential loop

### **Examples of Embedded Distribution**

| Product | Sharing Mechanic | How it Works |
|---------|------------------|-------------|
| **Calendly** | Scheduling links | User sends scheduling link → recipient sees Calendly UI → uses product → may adopt |
| **Dropbox** | File sharing | User shares file → recipient sees folder in Dropbox → adopts |
| **Notion** | Collaborative docs | User shares doc → collaborators view in Notion → may adopt |
| **Figma** | Design files | Designer shares file → reviewer opens in Figma → may adopt |
| **Slack** | Invite colleagues | User invites team → team members see value → adopt |
| **Loom** | Video links | User shares video link → recipient watches in Loom player → may adopt |

### **Key Design Principles for Embedded Distribution**

1. **Make the output shareable** → Create a link anyone can view without signup
2. **Show product value on shared link** → Recipient sees "aha moment" immediately
3. **Allow viewing before signup** → Let people try before committing
4. **Add subtle branding** → "Powered by [product]" → drives discovery
5. **Track shares** → Measure which shares lead to signups

---

## **Part 4: Types of Viral Loops**

### **Single-Sided Viral Loop**

**Incentive**: Only referrer gets reward

**Example**: Dropbox gave extra storage only to person sharing → incentivized sender, not receiver

**Pro**: Simple, clear incentive for sender  
**Con**: Receiver has no incentive → lower conversion

### **Two-Sided Viral Loop**

**Incentive**: Both referrer AND receiver get reward

**Example**: Uber "give a ride, get a ride" → both parties benefit  
**Example**: Slack credit for both inviter and invitee

**Pro**: Incentivizes both sides → higher conversion  
**Con**: More complex to track and reward

### **Value-Driven Viral Loop**

**Incentive**: Inherent value in the sharing (not external reward)

**Example**: Calendly (scheduling link is useful, no reward needed)  
**Example**: Figma (shared design is necessary for collaboration)

**Pro**: Natural, sustainable loop  
**Con**: Requires product fit (not all use cases work)

### **Charity-Driven Viral Loop**

**Incentive**: Donation to charity per referral

**Example**: Patreon, Wikipedia, some referral programs

**Pro**: Appeals to altruism  
**Con**: Lower conversion than financial incentive

---

## **Part 5: Applied Framework for Nebula**

### **K-Factor Calculation**

```
K = Activation × Exposure × Conversion

Activation (Phase 1):
  • Current: 0% (no sharing mechanism)
  • Target Sep 2-9: 2-5% (basic share buttons, some sharing)
  • Target Oct: 5-10% (improved share design + social proof)
  • Target Nov: 10-15% (habit of sharing + newsletter integration)

Exposure/Contamination (Phase 2):
  • Free audit shares: 2-5 people per share (close network)
  • Newsletter shares: 5-15 people per forward (broader network)
  • LinkedIn posts w/ audit: 50-200 people (public reach)
  • Twitter posts w/ finding: 100-500 people (public reach)

Conversion (Phase 3):
  • Exposed person sees shared audit: 5-10% become signups
  • Exposed person reads newsletter: 1-3% click to audit
  • Exposed person sees LinkedIn post: 0.5-1% click through
  • Exposed person sees Twitter post: 0.2-0.5% click through

Example: Conservative K-factor
  K = 0.05 (activation) × 3 (exposure) × 0.08 (conversion)
  K = 0.012 per cycle
  
  This means 100 users → 1.2 new users per cycle (not viral yet)

Example: Optimized K-factor (Phase 2)
  K = 0.10 (activation) × 4 (exposure) × 0.10 (conversion)
  K = 0.04 per cycle
  
  This means 100 users → 4 new users per cycle (approaching healthy B2B viral)

Example: Ideal K-factor (Phase 3)
  K = 0.15 (activation) × 5 (exposure) × 0.15 (conversion)
  K = 0.1125 per cycle
  
  This means 100 users → 11.25 new users per cycle (healthy viral)
```

### **Communication Flows for Nebula**

**Direct flows** (one person to another):
- Founder shares audit link via email to peer
- Founder shares result in Slack team channel
- Founder shares before/after to direct message

**Social flows** (broadcast):
- Tweet audit finding (e.g., "Just found 3 conversion leaks")
- LinkedIn post comparing before/after
- Reddit thread reply with audit example
- IndieHackers comment with specific finding

**Embedded flows** (built into product):
- Audit results page has "Share this audit" button
- Newsletter finding has "Share this week's insight" button
- Fix results page has "Share your improvement" button
- Pro dashboard has "Show your progress" button

### **Embedding Distribution into Nebula**

**Tier 1: Shareable Audits** (Sep 2-9)
- `/shared/audit-UUID` links
- Shows score, 3 top findings, "Powered by Nebula"
- View without signup (reduce friction)
- One-click Twitter/LinkedIn share
- **Target**: 50+ shared audits by Oct 1

**Tier 2: Shareable Fix Results** (Sep 9-16)
- `/shared/fix-result-UUID` links
- Shows before score, after score, fix applied
- Includes testimonial section (founder quote)
- "Try the fix pack" CTA
- **Target**: 10+ shared results by Oct 1

**Tier 3: Shareable Newsletter** (Sep 16-30)
- `/shared/newsletter/issue-N` links
- Shows this week's finding, impact, fix
- Clickable "Get this for your site" CTA
- **Target**: 100+ newsletter shares by Oct 31

**Tier 4: Shareable Pro Dashboard** (Oct 1+)
- `/shared/dashboard-UUID` links
- Shows 90-day trend (4/10 → 6/10)
- Lists all fixes applied with dates
- "Powered by Nebula Pro" badge
- **Target**: 5+ Pro customers sharing by Nov

---

## **Part 6: Key Metrics to Track (Immediate)**

### **Viral Loop Health**

For each tier (audits, fix results, newsletters, Pro):

```
Activation Rate = (Users who shared / Total users) × 100%
  Target: 5-15% by Oct 1

Exposure Rate = (People exposed per share) × (Activation rate)
  Target: 0.2-0.5 new people exposed per user per month

Conversion Rate = (Shared link viewers who sign up / Total shared link viewers) × 100%
  Target: 5-10% for relevant audience (founders seeing founder's audit)

K-Factor = Activation × Exposure × Conversion
  Current: ~0.001 (no sharing)
  Target (Oct 1): 0.01-0.02 (approaching healthy)
  Target (Nov 1): 0.05+ (healthy viral)
```

### **Business Metrics**

```
Attributed Signups = Users who came from shared links / shared content
  Target (Sep 30): 2-5 attributed signups
  Target (Oct 31): 8-15 attributed signups
  Target (Nov 30): 20-30 attributed signups

Attribution Sources:
  - Shared audit (URL click from /shared/audit-UUID)
  - Shared result (URL click from /shared/fix-result-UUID)
  - Newsletter forward (click from forwarded email)
  - Social shares (UTM tracking: utm_source=twitter, etc.)
```

---

## **Part 7: Implementation Priorities**

### **Phase 1 (Sep 2-9): Activation Infrastructure**
- ✅ Shareable audit links (`/shared/audit-UUID`)
- ✅ "Share this audit" button on results page
- ✅ Social share buttons (Twitter, LinkedIn, Email)
- ✅ Basic social proof on shared page ("847 audits")

### **Phase 2 (Sep 9-16): Improve Exposure**
- ✅ Shareable fix results (`/shared/fix-result-UUID`)
- ✅ Email 4 adds "Share your improvement" CTA
- ✅ Newsletter adds "Share this finding" button
- ✅ Newsletter adds social sharing buttons
- ✅ Track shares in analytics dashboard

### **Phase 3 (Sep 16-30): Optimize Conversion**
- ✅ Newsletter share links have urgency ("Expires Oct 1")
- ✅ Shared audit pages show competitive comparison ("vs. average")
- ✅ Add incentive to shared links ("10% off first fix pack from this link")
- ✅ Pre-populate email on shared pages (reduce friction)

### **Phase 4 (Oct 1+): Pro Dashboard Sharing**
- ✅ Shareable Pro dashboard (`/shared/dashboard-UUID`)
- ✅ Trend visualization (4/10 → 6/10 chart)
- ✅ "Show your progress" share button
- ✅ Measure attribution from Pro shares

---

## **Critical Insight: Why This Works for Nebula**

**Problem**: Founders face audit paralysis (know landing page is bad, don't know why or how to fix)

**Solution**: Make audit output so useful and specific that founder **wants** to share it

**Why sharing happens**:
1. Founder runs audit → Gets 4/10 score + "H1 doesn't match ad copy" finding (specific, aha moment)
2. Founder thinks: "This is useful, my friend runs ads too, they should know this"
3. Founder clicks "Share this audit" → Gets link, tweets: "Found 3 conversion leaks on my landing page with @NebulaCRO. This one was costing me $500/month"
4. Friend sees tweet → Clicks → Gets 3/10 score → Realizes own problem → Buys $97 fix
5. Friend shares before/after → Attracts 2 more people → Repeat

**Network effect**: Each audit becomes a micronetwork (founder + 2-5 peers who see share) → Those peers run audits → They share → Exponential growth with $0 CAC.

---

**Status**: Research complete. Ready to implement Phase 1 (Sep 2-9) immediately.
