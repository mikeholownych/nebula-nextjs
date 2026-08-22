module.exports=[87599,a=>{"use strict";let b=[{id:"message_match",label:"Message Match",description:"Does the page promise match the expectation created by the ad or referring source?",keys:["headline","message_match"]},{id:"trust",label:"Trust Signals",description:"Does the page support its claims before asking for commitment?",keys:["social_proof","trust"]},{id:"mobile_cta",label:"Mobile CTA",description:"Is the primary action visible and usable on a small viewport?",keys:["mobile","mobile_cta"]},{id:"load_time",label:"Load Time",description:"Does the page become useful quickly enough to keep paid visitors from bouncing?",keys:["load_speed","load_time"]},{id:"cta_clarity",label:"CTA Clarity",description:"Is the next step obvious and proportionate to visitor intent?",keys:["cta","cta_clarity"]},{id:"above_fold",label:"Above-Fold Clarity",description:"Can a visitor understand the offer and next action in the first viewport?",keys:["above_fold"]},{id:"ad_signals",label:"Ad Signals",description:"Can paid clicks be connected to outcomes without guessing?",keys:["ad_signals"]},{id:"seo_foundations",label:"SEO Foundations",description:"Can search systems retrieve and interpret the page foundations?",keys:["seo_foundations"]},{id:"ai_readiness",label:"AI Readiness",description:"Can answer engines identify, verify, and cite the page accurately?",keys:["ai_readiness","local_gbp"]}];function c(a){return a.impact>=8?"critical":a.impact>=5?"warning":"advisory"}function d(a){return[...a].sort((a,b)=>b.impact-a.impact||a.effort-b.effort||a.label.localeCompare(b.label))}a.s(["REPORT_NAVIGATION",0,[{id:"overview",label:"Overview"},{id:"fix-first",label:"Fix first"},{id:"signals",label:"Signals"},{id:"evidence",label:"Evidence"},{id:"remediation",label:"Remediation"}],"SIGNAL_GROUPS",0,b,"buildPriorityQueue",0,d,"findingSeverity",0,c,"groupFindingsBySignal",0,function(a){let e=new Set,f=b.map(b=>{let f=a.filter(a=>b.keys.includes(a.key));f.forEach(a=>e.add(a.key));let g=f.map(c),h=g.includes("critical")?"critical":g.includes("warning")?"warning":g.includes("advisory")?"advisory":"clear";return{...b,findings:d(f),status:h}}),g=a.filter(a=>!e.has(a.key));if(g.length){let a=f.find(a=>"ai_readiness"===a.id);if(a){a.findings=d([...a.findings,...g]);let b=a.findings.map(c);a.status=b.includes("critical")?"critical":b.includes("warning")?"warning":"advisory"}}return f},"summarizeFindings",0,function(a){return a.reduce((a,b)=>(a[c(b)]+=1,a.total+=1,a),{critical:0,warning:0,advisory:0,total:0})}])},17267,a=>{"use strict";var b=a.i(87924),c=a.i(72131),d=a.i(45769);a.s(["default",0,function({results:a,auditId:e,pageUrl:f,isOpen:g,onClose:h,className:i=""}){let[j,k]=(0,c.useState)(!1),[l,m]=(0,c.useState)(!1),[n,o]=(0,c.useState)("api_direct"),p=()=>{h?h():k(!1)},q=a?.audit_id||e||"audit_latest",r=a?.url||f||"https://example.com",s=a?.findings||[],t=(()=>{if("api_direct"===n)return`# ⚡ Direct Agent API Integration (Autonomous Agents)
# Use your registered Workspace API Key to let agents fetch live, machine-readable fix directives.

# 1. Set your API Key in your environment or agent config:
export NEBULA_API_KEY="nbk_your_api_key_here"

# 2. Fetch structured JSON directives directly in agent tool calls:
curl -s -H "Authorization: Bearer $NEBULA_API_KEY" \\
  "https://nebulacomponents.com/api/v1/fixes/${q}"

# 3. Or fetch as clean Markdown for immediate agent reasoning context:
curl -s -H "Authorization: Bearer $NEBULA_API_KEY" -H "Accept: text/markdown" \\
  "https://nebulacomponents.com/api/v1/fixes/${q}"

# 4. Autonomous Agent CLI Command (Claude Code / Antigravity / Hermes):
claude "Read conversion leak instructions from https://nebulacomponents.com/api/v1/fixes/${q} using Authorization: Bearer $NEBULA_API_KEY and apply all required CSS and component markup changes."`;let a=s.length>0?s.map((a,b)=>{let c=a.evidence?.selector&&"N/A"!==a.evidence.selector?`\`${a.evidence.selector}\``:"Hero section / Main CTA",d=a.evidence?.measured?`
   - **Measured Evidence:** ${a.evidence.measured} (Required: ${a.evidence.required||"Standard"})`:"";return`${b+1}. **[${a.label}]** (Priority: ${a.impact}/10 | Effort: ${a.effort}/10)
   - **Target DOM Selector:** ${c}
   - **Issue:** ${a.issue}${d}
   - **Fix Requirement:** ${a.fix}`}).join("\n\n"):`1. **[Primary CTA Contrast Below Standard]** (Priority: 9/10 | Effort: 2/10)
   - **Target DOM Selector:** \`.hero-cta-button, a[href*='/audit']\`
   - **Issue:** Primary CTA lacks sufficient 4.5:1 contrast against dark background.
   - **Fix Requirement:** Use brand neon accent #c7ff2f with dark text #09090b.`;return"cursor"===n?`/* 
 * CONVERSION LEAK REMEDIATION TASK (Cursor / AI Agent)
 * Target URL: ${r}
 * Audit ID: ${q}
 */

You are an expert Frontend CRO Engineer. Please refactor our landing page components to fix the following conversion leaks:

${a}

Implementation instructions:
1. Locate the component corresponding to each target selector.
2. Apply the required copy, layout, or viewport adjustments.
3. Ensure all changes maintain mobile responsiveness (375px viewport) and keep primary CTAs visible above the fold.
4. Keep all existing analytics tags intact.`:"claude"===n?`# Landing Page Conversion Fix Task for Claude Code

Target URL: ${r}
Audit ID: ${q}

Please review the codebase and implement fixes for the following conversion leaks:

${a}

Instructions:
1. Review matching template files in the repository.
2. Update markup and CSS according to the exact fix requirements.
3. Run test suites to ensure no layout or mobile viewport regressions.`:`Please fix the following landing page conversion issues on ${r}:

${a}

Instructions: Implement the exact fixes specified above and verify that the page renders properly on mobile viewports.`})(),u=async()=>{try{await navigator.clipboard.writeText(t),m(!0),setTimeout(()=>m(!1),2500),d.default.capture("ai_fix_prompt_copied",{agentType:n,url:r,auditId:q})}catch{}};return(0,b.jsxs)(b.Fragment,{children:[void 0===g&&(0,b.jsxs)("button",{onClick:()=>k(!0),className:`inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3.5 py-2 text-xs font-bold text-accent hover:bg-accent hover:text-bg transition-colors ${i}`,children:[(0,b.jsx)("span",{children:"⚡"}),(0,b.jsx)("span",{children:"AI Agent Fix API / Prompt"})]}),(void 0!==g?g:j)&&(0,b.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm",children:(0,b.jsxs)("div",{className:"relative w-full max-w-2xl rounded-2xl border border-border bg-bg-panel p-6 shadow-2xl",children:[(0,b.jsxs)("div",{className:"flex items-center justify-between border-b border-border pb-4 mb-4",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("p",{className:"text-xs font-semibold uppercase tracking-wider text-accent",children:"Developer & Agent API Protocol"}),(0,b.jsx)("h3",{className:"text-lg font-bold text-fg",children:"AI Agent Fix Directives & API Key"})]}),(0,b.jsx)("button",{onClick:p,className:"rounded-lg p-1.5 text-fg-muted hover:bg-bg hover:text-fg transition-colors text-sm",children:"✕"})]}),(0,b.jsx)("p",{className:"text-xs text-fg-muted mb-4",children:"Provide AI agents (Claude Code, Cursor, Antigravity, Aider) with direct, machine-readable instructions to fix your landing page conversion leaks using your workspace API key."}),(0,b.jsx)("div",{className:"flex flex-wrap items-center gap-2 mb-3",children:[{id:"api_direct",label:"⚡ Agent API (API Key)"},{id:"cursor",label:"Cursor Rules"},{id:"claude",label:"Claude Code"},{id:"generic",label:"Prompt Copy"}].map(a=>(0,b.jsx)("button",{onClick:()=>o(a.id),className:`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${n===a.id?"bg-accent text-bg":"border border-border bg-bg text-fg-muted hover:text-fg"}`,children:a.label},a.id))}),(0,b.jsx)("pre",{className:"max-h-80 overflow-y-auto rounded-xl border border-border bg-bg p-4 font-mono text-xs leading-relaxed text-fg-muted whitespace-pre-wrap",children:t}),(0,b.jsxs)("div",{className:"mt-4 flex items-center justify-between gap-3",children:[(0,b.jsx)("a",{href:"/workspace?tab=settings",className:"text-xs text-accent hover:underline font-medium",children:"Manage API Keys in Settings →"}),(0,b.jsxs)("div",{className:"flex items-center gap-2",children:[(0,b.jsx)("button",{onClick:p,className:"rounded-lg border border-border px-4 py-2 text-xs font-semibold text-fg-muted hover:text-fg transition-colors",children:"Close"}),(0,b.jsx)("button",{onClick:u,className:"inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-xs font-bold text-bg hover:opacity-85 transition-opacity",children:l?"✓ Copied Instructions":"⎘ Copy Command / Prompt"})]})]})]})})]})}])},6584,a=>{"use strict";var b=a.i(87924),c=a.i(72131);a.s(["default",0,function({initialType:a="FAQPage",pageTitle:d="My Landing Page",pageUrl:e="https://example.com",className:f=""}){let[g,h]=(0,c.useState)(a),[i,j]=(0,c.useState)(!1),k=[{q:"What is this service?",a:"We provide evidence-based conversion optimization for landing pages."},{q:"How long does it take?",a:"Results are delivered within 48 hours."}],l=JSON.stringify((()=>{switch(g){case"FAQPage":return{"@context":"https://schema.org","@type":"FAQPage",mainEntity:k.map(a=>({"@type":"Question",name:a.q,acceptedAnswer:{"@type":"Answer",text:a.a}}))};case"SoftwareApplication":return{"@context":"https://schema.org","@type":"SoftwareApplication",name:d,url:e,applicationCategory:"BusinessApplication",applicationSubCategory:"Conversion Rate Optimization & Landing Page Audit",operatingSystem:"Web",offers:{"@type":"Offer",price:"0",priceCurrency:"USD"}};case"Organization":return{"@context":"https://schema.org","@type":"Organization",name:d,url:e,logo:`${e}/logo.png`,sameAs:[`https://twitter.com/${d.toLowerCase().replace(/\s+/g,"")}`]};case"HowTo":return{"@context":"https://schema.org","@type":"HowTo",name:`How to optimize your landing page with ${d}`,step:[{"@type":"HowToStep",position:1,name:"Audit the page",text:"Scan the public HTML against observable conversion signals."},{"@type":"HowToStep",position:2,name:"Fix the highest-priority leak",text:"Implement the targeted copy or code replacement."}]};case"Product":return{"@context":"https://schema.org","@type":"Product",name:d,description:`High-converting solution for ${d}`,offers:{"@type":"Offer",price:"0",priceCurrency:"USD",availability:"https://schema.org/InStock"}}}})(),null,2),m=`<script type="application/ld+json">
${l}
</script>`,n=async()=>{try{await navigator.clipboard.writeText(m),j(!0),setTimeout(()=>j(!1),2e3)}catch{}};return(0,b.jsxs)("div",{className:`rounded-2xl border border-border bg-bg-panel p-6 sm:p-8 ${f}`,children:[(0,b.jsxs)("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("p",{className:"text-xs font-semibold uppercase tracking-wider text-accent mb-1",children:"Schema.org JSON-LD Generator"}),(0,b.jsx)("h3",{className:"text-xl font-bold text-fg",children:"Instant AEO & GEO Structured Data"})]}),(0,b.jsx)("div",{className:"flex items-center gap-2",children:["FAQPage","SoftwareApplication","Organization","HowTo"].map(a=>(0,b.jsx)("button",{onClick:()=>h(a),className:`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${g===a?"bg-accent text-bg font-bold":"border border-border bg-bg text-fg-muted hover:text-fg"}`,children:a},a))})]}),(0,b.jsxs)("div",{className:"relative",children:[(0,b.jsx)("div",{className:"absolute top-3 right-3 z-10",children:(0,b.jsx)("button",{onClick:n,className:"rounded-md border border-border bg-bg-elevated px-3 py-1.5 text-xs font-semibold text-fg hover:border-accent hover:text-accent transition-colors",children:i?"✓ Copied <script>":"⎘ Copy Script Tag"})}),(0,b.jsx)("pre",{className:"max-h-72 overflow-auto rounded-xl border border-border bg-bg p-4 font-mono text-xs text-fg-muted leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]",children:m})]}),(0,b.jsxs)("p",{className:"mt-4 text-xs text-fg-muted",children:["Paste this script tag directly into your HTML ",(0,b.jsx)("code",{className:"text-accent",children:"<head>"})," to help ChatGPT, Perplexity, and Google AI Overviews cite your content with structured answers."]})]})}])},55128,a=>{"use strict";var b=a.i(87924),c=a.i(72131);a.i(83399),a.s(["default",0,function({beaconId:a,eventName:d,properties:e={},children:f,className:g="",as:h="div"}){let i=(0,c.useRef)(null);return(0,c.useRef)(null),(0,c.useRef)(!1),(0,c.useEffect)(()=>{i.current},[a,d,e]),(0,b.jsx)(h,{ref:a=>{i.current=a},"data-visibility-beacon":a,className:g,children:f})}])},34904,a=>{"use strict";var b=a.i(87924);let c={default:"bg-bg-panel",elevated:"bg-bg-panel",bordered:"bg-bg-panel border border-border"},d={none:"p-0",sm:"p-4",md:"p-6",lg:"p-8"};a.s(["Card",0,function({children:a,className:e="",variant:f="default",padding:g="md",style:h,id:i}){return(0,b.jsx)("div",{id:i,className:`
        rounded-md
        ${c[f]}
        ${d[g]}
        ${e}
      `.trim(),style:h,children:a})}])},62822,a=>{"use strict";var b=a.i(87924),c=a.i(72131);let d={primary:"bg-accent text-bg font-semibold hover:opacity-85 hover:bg-accent",secondary:"bg-bg-panel text-fg border border-border hover:border-accent",outline:"border border-accent text-accent hover:bg-accent-dim",ghost:"text-fg-muted hover:text-fg"},e={sm:"px-4 py-2 text-sm rounded",md:"px-5 py-2.5 text-sm rounded",lg:"px-7 py-3.5 text-base rounded"};(0,c.forwardRef)(({className:a="",variant:c="primary",size:f="md",isLoading:g,children:h,disabled:i,...j},k)=>(0,b.jsxs)("button",{ref:k,className:`
          inline-flex items-center justify-center gap-2
          transition-[color,background-color,border-color,transform] duration-[160ms] ease-out
          active:scale-[0.97]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg
          ${d[c]}
          ${e[f]}
          ${i||g?"opacity-50 cursor-not-allowed":""}
          ${a}
        `.trim(),disabled:i||g,...j,children:[g&&(0,b.jsxs)("svg",{className:"animate-spin h-4 w-4",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",children:[(0,b.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),(0,b.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"})]}),h]})).displayName="Button",(0,c.forwardRef)(({className:a="",label:d,error:e,helper:f,id:g,...h},i)=>{let j=(0,c.useId)(),k=g??j,l=`${k}-error`,m=`${k}-helper`;return(0,b.jsxs)("div",{className:"w-full",children:[d&&(0,b.jsx)("label",{htmlFor:k,className:"block text-sm font-medium text-fg-muted mb-2",children:d}),(0,b.jsx)("input",{ref:i,id:k,className:`
            w-full px-4 py-3
            bg-bg-panel border rounded
            text-fg placeholder:text-fg-dim
            outline-none transition-all duration-200
            focus:border-accent focus:ring-2 focus:ring-accent/20
            ${e?"border-danger":"border-border"}
            ${a}
          `.trim(),"aria-invalid":e?"true":"false","aria-describedby":e?l:f?m:void 0,"aria-errormessage":e?l:void 0,...h}),e&&(0,b.jsx)("p",{id:l,className:"mt-2 text-sm text-danger",role:"alert",children:e}),f&&!e&&(0,b.jsx)("p",{id:m,className:"mt-2 text-sm text-fg-dim",children:f})]})}).displayName="Input",a.i(34904),a.s([],62822)}];

//# sourceMappingURL=_0r55nbd._.js.map