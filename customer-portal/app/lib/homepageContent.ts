export const HOMEPAGE_SEO_TITLE = 'Free Landing Page Audit Tool | Nebula Components'

export const HOMEPAGE_DESCRIPTION =
  'Free evidence-backed landing page audit. Check 9 conversion signals - message match, trust, CTA, mobile, speed - and see findings ranked by priority.'

export const PAID_TRAFFIC_DIAGNOSTIC = [
  {
    heading: 'A click is not the finish line.',
    body: 'An ad click proves that the message, audience, and creative created enough interest for someone to investigate. The landing page either preserves that interest or introduces additional friction. If the page changes the promise, hides the next step, loads slowly, or asks for trust before earning it, visitors are more likely to abandon and the ad gets blamed. That is why buying more traffic before checking the page can make the loss larger without revealing the cause.',
  },
  {
    heading: 'The audit follows the visitor’s decision.',
    body: 'Nebula checks the sequence a paid visitor actually experiences: message match, above-fold clarity, visible action, proof, mobile usability, performance, and measurement. Each failed conversion signal is tied to evidence from the page, then ranked by priority. You see what was measured, what the page needed to do, the size of the gap, and which condition to address first. The report does not estimate revenue or promise a conversion lift that has not been measured.',
  },
  {
    heading: 'Use the result as a stop-or-fix decision.',
    body: 'If the page passes, you have evidence to investigate audience, offer, or creative instead. If it fails, you have a bounded repair list before spending another dollar on acquisition. Start with the highest-priority condition, publish the change, and run the same audit again. The comparison will not prove causation by itself, but it will prove which page conditions changed and which remain open. That is a stronger basis for the next campaign decision than another round of assumptions.',
  },
  {
    heading: 'Know what the audit cannot observe.',
    body: 'A page scan cannot see the intent behind every visit, the quality of the audience selected by the ad platform, the economics of the offer, or the conversations happening after a form submission. It can verify page conditions such as whether the headline reinforces the incoming promise, whether the primary action is visible, whether proof appears before commitment, and whether tracking signals exist. Those boundaries matter. A failed page condition is a repair candidate supported by evidence, not an invented explanation for every lost sale. Use campaign, analytics, CRM, and customer-interview data alongside the report when those sources exist. Separate page facts from business hypotheses: the first can be measured directly in the scan, while the second needs traffic and outcome data. If a required data source is absent, label the gap instead of filling it with a benchmark or projection. A useful diagnosis makes uncertainty smaller and visible; it does not hide uncertainty behind a confident score.',
  },
  {
    heading: 'Validate the repair after it ships.',
    body: 'Re-running the audit confirms whether the diagnosed condition changed; it does not manufacture an outcome. Keep the traffic source, offer, and measurement window stable where possible. Record the page version, campaign, spend, sessions, conversions, and any material targeting change. Then compare the repaired page with the previous baseline over enough traffic to support a decision. If conversion improves while the surrounding conditions remain stable, you have stronger evidence that the repair contributed. If it does not, the closed finding still removes one plausible failure mode and narrows the next investigation instead of sending the team back to random redesigns.',
  },
] as const
