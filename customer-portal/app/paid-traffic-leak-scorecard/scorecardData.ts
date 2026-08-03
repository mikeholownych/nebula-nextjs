export type ScorecardBand = 'low' | 'inspect' | 'audit'

export interface ScorecardQuestion {
  id: string
  prompt: string
  yesLabel: string
  noLabel: string
  riskExplanation: string
  nextAction: string
}

export interface ScorecardRisk extends ScorecardQuestion {
  questionId: string
}

export interface ScorecardResult {
  riskCount: number
  band: ScorecardBand
  risks: ScorecardRisk[]
}

export const scorecardQuestions: ScorecardQuestion[] = [
  {
    id: 'paid-traffic',
    prompt: 'Is this landing page receiving active paid traffic right now?',
    yesLabel: 'Yes, traffic is active',
    noLabel: 'No or not sure',
    riskExplanation: 'If paid traffic is not active or cannot be confirmed, spend and page performance cannot be evaluated against the same decision context.',
    nextAction: 'Confirm the campaign, landing-page URL, and conversion event before changing the page or increasing budget.',
  },
  {
    id: 'ad-headline-match',
    prompt: 'Does the landing-page headline repeat the promise that made the visitor click the ad?',
    yesLabel: 'Yes, the promise carries through',
    noLabel: 'No or not sure',
    riskExplanation: 'A break between the ad promise and the headline forces the visitor to re-evaluate whether they are in the right place.',
    nextAction: "Put the ad's core promise into the first visible headline and verify the wording on the live page.",
  },
  {
    id: 'above-fold-value',
    prompt: 'Can a new visitor understand the offer and who it is for before scrolling?',
    yesLabel: 'Yes, it is clear above the fold',
    noLabel: 'No or not sure',
    riskExplanation: 'If the offer is delayed or abstract above the fold, paid clicks encounter uncertainty before they reach the action.',
    nextAction: 'State the buyer, problem, and concrete outcome in the first viewport before adding more traffic.',
  },
  {
    id: 'cta-specificity',
    prompt: 'Is there one obvious primary CTA that tells the visitor exactly what happens next?',
    yesLabel: 'Yes, one next step is obvious',
    noLabel: 'No or not sure',
    riskExplanation: 'Competing or vague CTAs create decision friction at the point where the paid visitor should act.',
    nextAction: 'Choose one primary action, name the immediate outcome, and make supporting links visually secondary.',
  },
  {
    id: 'proof',
    prompt: 'Is credible proof visible before the visitor has to make the decision?',
    yesLabel: 'Yes, proof appears before the decision',
    noLabel: 'No or not sure',
    riskExplanation: 'When proof is absent or buried, the visitor must accept the offer without evidence that it works for someone like them.',
    nextAction: 'Place specific testimonials, customer evidence, or verifiable proof beside the offer and CTA.',
  },
  {
    id: 'mobile-path',
    prompt: 'Does the mobile page preserve the same offer, proof, and CTA path without avoidable friction?',
    yesLabel: 'Yes, mobile is usable',
    noLabel: 'No or not sure',
    riskExplanation: 'A desktop-ready page can still lose paid visitors when mobile layout, tap targets, or CTA placement break the path.',
    nextAction: 'Walk the complete conversion path on a real phone and fix the first blocked or ambiguous interaction.',
  },
  {
    id: 'conversion-event',
    prompt: 'Is one conversion event defined and being measured for this page?',
    yesLabel: 'Yes, the event is defined',
    noLabel: 'No or not sure',
    riskExplanation: 'Without a defined event, traffic and page changes cannot be compared against a reliable outcome.',
    nextAction: 'Name the single action that counts, confirm its tracking fires, and use it consistently in campaign decisions.',
  },
]

export function scoreScorecard(answers: Record<string, boolean>): ScorecardResult {
  const risks = scorecardQuestions
    .filter((question) => answers[question.id] === false)
    .map((question) => ({ ...question, questionId: question.id }))
  const riskCount = risks.length
  const band: ScorecardBand = riskCount >= 4 ? 'audit' : riskCount >= 2 ? 'inspect' : 'low'

  return { riskCount, band, risks }
}
