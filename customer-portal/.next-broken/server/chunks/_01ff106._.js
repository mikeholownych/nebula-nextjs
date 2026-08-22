module.exports=[29594,e=>e.a(async(t,i)=>{try{var a=e.i(7968),n=e.i(63278),r=e.i(51421),s=t([a]);async function _(e){let t=(0,r.getEventDefinition)(e.eventName),i={...e.properties||{},...e.landingPath?{landing_path:e.landingPath}:{},...e.auditId?{audit_id:e.auditId}:{},...e.auditAttemptId?{audit_attempt_id:e.auditAttemptId}:{},...e.checkoutSessionId?{checkout_session_id:e.checkoutSessionId}:{},...e.transactionId?{transaction_id:e.transactionId}:{},...e.failureReason?{reason_code:e.failureReason}:{},...e.journeyId?{journey_id:e.journeyId}:{}};if(!t)return{success:!1,error:`Unknown canonical event: ${e.eventName}`};let s=(0,r.validateEventPayload)(e.eventName,i);if(!s.valid)return{success:!1,error:s.errors.join("; ")};let _=e.stage||t.stage||"acquisition",d=e.eventVersion||t?.version||1,o=e.occurredAt?new Date(e.occurredAt):new Date,u=e.status||(e.failureReason?"failed":"success"),c=e.buildRevision||process.env.NEBULA_BUILD_REVISION||"production",l=!0===e.isSynthetic||!!e.anonymousUserId?.includes("test")||!!e.sessionId?.includes("test")||!!e.transactionId?.includes("test")||!!e.checkoutSessionId?.includes("test")||!!e.auditAttemptId?.includes("test")||e.properties?.is_synthetic===!0,p=l?"test":e.environment||"production",E=l?"test":e.paymentMode||"live",N=e.journeyId||e.sessionId||e.anonymousUserId||e.auditAttemptId||e.auditId||null,m=e.dedupKey;!m&&("purchase_completed"===e.eventName&&e.transactionId?m=`purchase_${e.transactionId}`:"checkout_started"===e.eventName&&e.checkoutSessionId?m=`checkout_${e.checkoutSessionId}`:"audit_completed"===e.eventName&&e.auditId?m=`audit_${e.auditId}_completed_v${d}`:"audit_started"===e.eventName&&e.auditId&&(m=`audit_${e.auditId}_started`));try{let t=await a.pool.query(`INSERT INTO analytics_event_ledger (
        event_name, event_version, stage, source_system, occurred_at,
        anonymous_user_id, session_id, user_id,
        audit_attempt_id, audit_id, checkout_session_id, transaction_id,
        landing_path, referrer_class, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        device_class, status, failure_reason, dedup_key, build_revision,
        environment, payment_mode, is_synthetic, journey_id, properties
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24,
        $25, $26, $27, $28, $29
      )
      ON CONFLICT (dedup_key) DO NOTHING
      RETURNING id`,[e.eventName,d,_,e.sourceSystem,o,e.anonymousUserId||null,e.sessionId||null,e.userId||null,e.auditAttemptId||null,e.auditId||null,e.checkoutSessionId||null,e.transactionId||null,e.landingPath||null,e.referrerClass||null,e.utmSource||null,e.utmMedium||null,e.utmCampaign||null,e.utmContent||null,e.utmTerm||null,e.deviceClass||null,u,e.failureReason||null,m||null,c,p,E,l,N,JSON.stringify(e.properties||{})]);if(0===t.rowCount)return{success:!0,duplicate:!0};return{success:!0,id:t.rows[0].id}}catch(a){let t=a instanceof Error?a.message:String(a),i=e.properties&&"string"==typeof e.properties.request_id?e.properties.request_id:null;return(0,n.logApiError)("[FunnelLedger] Failed to persist event",{request_id:i,journey_id:N,error:a}),{success:!1,error:t}}}async function d(e,t={}){let i=["status = $1"],n=["success"],s=2;t.includeSynthetic||i.push("is_synthetic = FALSE AND environment = 'production' AND payment_mode = 'live'"),t.startDate&&(i.push(`occurred_at >= $${s++}`),n.push(t.startDate)),t.endDate&&(i.push(`occurred_at <= $${s++}`),n.push(t.endDate)),t.deviceClass&&(i.push(`device_class = $${s++}`),n.push(t.deviceClass)),t.utmSource&&(i.push(`utm_source = $${s++}`),n.push(t.utmSource));let _=`
    SELECT 
      event_name,
      stage,
      COUNT(DISTINCT COALESCE(journey_id, session_id, id::text)) as reaching_journeys,
      COUNT(DISTINCT CASE 
        WHEN event_name IN ('landing_page_view', 'audit_cta_exposed', 'audit_cta_clicked') THEN COALESCE(session_id, anonymous_user_id, id::text)
        WHEN event_name IN ('audit_url_submitted', 'audit_submission_rejected', 'audit_accepted') THEN COALESCE(audit_attempt_id, audit_id, session_id, id::text)
        WHEN event_name IN ('audit_started', 'audit_failed', 'audit_completed', 'audit_result_viewed', 'finding_expanded', 'repair_sprint_exposed', 'repair_sprint_clicked') THEN COALESCE(audit_id, audit_attempt_id, session_id, id::text)
        WHEN event_name IN ('checkout_started', 'checkout_creation_failed') THEN COALESCE(checkout_session_id, audit_id, session_id, id::text)
        WHEN event_name IN ('payment_failed', 'purchase_completed') THEN COALESCE(transaction_id, checkout_session_id, id::text)
        ELSE id::text
      END) as operational_entities,
      COUNT(*) as total_events
    FROM analytics_event_ledger
    WHERE ${i.join(" AND ")}
    GROUP BY event_name, stage;
  `,o=await a.pool.query(_,n),u=new Map;for(let e of o.rows)u.set(e.event_name,{stage:e.stage,reaching_journeys:parseInt(e.reaching_journeys,10),operational_entities:parseInt(e.operational_entities,10),total_events:parseInt(e.total_events,10)});let c=[],l=0,p=0;for(let t=0;t<e.length;t++){let i=e[t],a=(0,r.getEventDefinition)(i),n=u.get(i)||{stage:a?.stage||"unknown",reaching_journeys:0,operational_entities:0,total_events:0},s=function(e){switch(e){case"landing_page_view":case"audit_cta_exposed":case"audit_cta_clicked":return"session";case"audit_url_submitted":case"audit_submission_rejected":case"audit_accepted":return"audit_attempt";case"audit_started":case"audit_failed":case"audit_completed":case"audit_result_viewed":case"audit_result_load_failed":case"finding_expanded":case"repair_sprint_exposed":case"repair_sprint_clicked":return"audit";case"checkout_started":case"checkout_creation_failed":return"checkout_session";case"payment_failed":case"purchase_completed":return"transaction";default:return"event"}}(i),_=n.reaching_journeys;t>0&&_>p&&(_=p);let d=_>0?Math.round(n.operational_entities/_*10)/10:1;if(0===t)l=_,p=_,c.push({stage:n.stage,eventName:i,countingEntity:s,journeysReached:_,operationalEntities:n.operational_entities,entityMultiplicityRatio:d,totalEvents:n.total_events,stepConversionRate:l>0?100:null,funnelConversionRate:l>0?100:null,abandonmentCount:0,abandonmentRate:l>0?0:null,numerator:_,denominator:_});else{let e=p>0?Math.round(_/p*1e3)/10:null,t=l>0?Math.round(_/l*1e3)/10:null,a=Math.max(0,p-_),r=p>0?Math.round(a/p*1e3)/10:null;c.push({stage:n.stage,eventName:i,countingEntity:s,journeysReached:_,operationalEntities:n.operational_entities,entityMultiplicityRatio:d,totalEvents:n.total_events,stepConversionRate:e,funnelConversionRate:t,abandonmentCount:a,abandonmentRate:r,numerator:_,denominator:p}),p=_}}return{funnelName:e.join(" → "),totalInitialJourneys:l,steps:c}}async function o(e={}){let t=[],i=[],n=1;e.includeSynthetic||t.push("is_synthetic = FALSE AND environment = 'production' AND payment_mode = 'live'"),e.startDate&&(t.push(`occurred_at >= $${n++}`),i.push(e.startDate)),e.endDate&&(t.push(`occurred_at <= $${n++}`),i.push(e.endDate));let r=t.length>0?`WHERE ${t.join(" AND ")}`:"",s=`
    WITH journey_events AS (
      SELECT 
        COALESCE(journey_id, session_id, anonymous_user_id, id::text) as journey_id,
        event_name,
        status,
        failure_reason,
        CASE 
          WHEN event_name = 'landing_page_view' THEN 10
          WHEN event_name = 'audit_cta_exposed' THEN 20
          WHEN event_name = 'audit_cta_clicked' THEN 30
          WHEN event_name = 'audit_submission_rejected' THEN 35
          WHEN event_name = 'audit_url_submitted' THEN 40
          WHEN event_name = 'audit_accepted' THEN 50
          WHEN event_name = 'audit_started' THEN 60
          WHEN event_name = 'audit_failed' THEN 65
          WHEN event_name = 'audit_completed' THEN 70
          WHEN event_name = 'audit_result_load_failed' THEN 75
          WHEN event_name = 'audit_result_viewed' THEN 80
          WHEN event_name = 'finding_expanded' THEN 90
          WHEN event_name = 'repair_sprint_exposed' THEN 100
          WHEN event_name = 'repair_sprint_clicked' THEN 110
          WHEN event_name = 'checkout_creation_failed' THEN 115
          WHEN event_name = 'checkout_started' THEN 120
          WHEN event_name = 'payment_failed' THEN 125
          WHEN event_name = 'purchase_completed' THEN 130
          ELSE 1
        END as stage_rank
      FROM analytics_event_ledger
      ${r}
    ),
    furthest_state AS (
      SELECT 
        journey_id,
        MAX(stage_rank) as max_rank
      FROM journey_events
      GROUP BY journey_id
    ),
    detailed_furthest AS (
      SELECT 
        f.journey_id,
        f.max_rank,
        e.failure_reason
      FROM furthest_state f
      JOIN journey_events e ON e.journey_id = f.journey_id AND e.stage_rank = f.max_rank
    ),
    classified_state AS (
      SELECT
        journey_id,
        CASE max_rank
          WHEN 10 THEN 'landing_only'
          WHEN 20 THEN 'audit_cta_exposed_only'
          WHEN 30 THEN 'audit_cta_clicked'
          WHEN 35 THEN 'audit_submission_rejected'
          WHEN 40 THEN 'audit_submitted'
          WHEN 50 THEN 'audit_accepted'
          WHEN 60 THEN 'audit_started_in_flight'
          WHEN 65 THEN 'audit_system_failed'
          WHEN 70 THEN 'audit_completed_unviewed'
          WHEN 75 THEN 'audit_result_load_failed'
          WHEN 80 THEN 'result_viewed'
          WHEN 90 THEN 'finding_engaged'
          WHEN 100 THEN 'repair_sprint_exposed'
          WHEN 110 THEN 'repair_sprint_clicked'
          WHEN 115 THEN 'checkout_creation_failed'
          WHEN 120 THEN 'checkout_abandoned'
          WHEN 125 THEN 'payment_failed'
          WHEN 130 THEN 'purchase_completed'
          ELSE 'unclassified'
        END as state_name,
        CASE max_rank
          WHEN 10 THEN 'USER_EXIT'
          WHEN 20 THEN 'USER_EXIT'
          WHEN 30 THEN 'USER_EXIT'
          WHEN 35 THEN 
            CASE 
              WHEN failure_reason IN ('blocked_target', 'quota_exceeded', 'rate_limited') THEN 'POLICY_REJECTION'
              WHEN failure_reason IN ('invalid_url', 'unsupported_scheme') THEN 'USER_INPUT_REJECTED'
              ELSE 'USER_INPUT_REJECTED'
            END
          WHEN 40 THEN 'IN_FLIGHT'
          WHEN 50 THEN 'IN_FLIGHT'
          WHEN 60 THEN 'IN_FLIGHT'
          WHEN 65 THEN 'SYSTEM_FAILURE'
          WHEN 70 THEN 'USER_EXIT'
          WHEN 75 THEN 'SYSTEM_FAILURE'
          WHEN 80 THEN 'USER_EXIT'
          WHEN 90 THEN 'USER_EXIT'
          WHEN 100 THEN 'USER_EXIT'
          WHEN 110 THEN 'USER_EXIT'
          WHEN 115 THEN 'SYSTEM_FAILURE'
          WHEN 120 THEN 'USER_EXIT'
          WHEN 125 THEN 'SYSTEM_FAILURE'
          WHEN 130 THEN 'TERMINAL_SUCCESS'
          ELSE 'USER_EXIT'
        END as category
      FROM detailed_furthest
    )
    SELECT 
      state_name,
      category,
      COUNT(DISTINCT journey_id) as journey_count,
      ROUND((COUNT(DISTINCT journey_id)::numeric / (SELECT GREATEST(COUNT(DISTINCT journey_id), 1) FROM classified_state) * 100), 2) as percentage
    FROM classified_state
    GROUP BY state_name, category
    ORDER BY MIN(
      CASE state_name
        WHEN 'landing_only' THEN 10
        WHEN 'audit_cta_exposed_only' THEN 20
        WHEN 'audit_cta_clicked' THEN 30
        WHEN 'audit_submission_rejected' THEN 35
        WHEN 'audit_submitted' THEN 40
        WHEN 'audit_accepted' THEN 50
        WHEN 'audit_started_in_flight' THEN 60
        WHEN 'audit_system_failed' THEN 65
        WHEN 'audit_completed_unviewed' THEN 70
        WHEN 'audit_result_load_failed' THEN 75
        WHEN 'result_viewed' THEN 80
        WHEN 'finding_engaged' THEN 90
        WHEN 'repair_sprint_exposed' THEN 100
        WHEN 'repair_sprint_clicked' THEN 110
        WHEN 'checkout_creation_failed' THEN 115
        WHEN 'checkout_abandoned' THEN 120
        WHEN 'payment_failed' THEN 125
        WHEN 'purchase_completed' THEN 130
        ELSE 999
      END
    );
  `,_=await a.pool.query(s,i),d=0,u=0,c=[],l=[];for(let e of _.rows){let t=parseInt(e.journey_count,10),i=parseFloat(e.percentage);d+=t,"unclassified"===e.state_name&&(u+=t);let a={state:e.state_name,category:e.category,journeyCount:t,percentage:i};c.push(a),"TERMINAL_SUCCESS"!==e.category&&"IN_FLIGHT"!==e.category&&l.push(a)}return{totalJourneys:d,classifiedJourneys:d-u,unclassifiedJourneys:u,distribution:c,abandonmentDistribution:l}}async function u(e={}){let t=e.includeSynthetic?"":"AND c.is_synthetic = FALSE AND c.environment = 'production' AND c.payment_mode = 'live'",i=e.includeSynthetic?"":"AND r.is_synthetic = FALSE AND r.environment = 'production' AND r.payment_mode = 'live'",n=e.includeSynthetic?"":"AND p.is_synthetic = FALSE AND p.environment = 'production' AND p.payment_mode = 'live'",r=e.includeSynthetic?"":"AND is_synthetic = FALSE AND environment = 'production' AND payment_mode = 'live'",s=await a.pool.query(`
    SELECT COUNT(DISTINCT c.audit_id) as count
    FROM analytics_event_ledger c
    WHERE c.event_name = 'audit_completed'
      AND c.audit_id IS NOT NULL
      ${t}
      AND NOT EXISTS (
        SELECT 1 FROM analytics_event_ledger s
        WHERE s.event_name = 'audit_started'
          AND s.audit_id = c.audit_id
      )
  `),_=await a.pool.query(`
    SELECT COUNT(DISTINCT r.audit_id) as count
    FROM analytics_event_ledger r
    WHERE r.event_name = 'audit_result_viewed'
      AND r.audit_id IS NOT NULL
      ${i}
      AND NOT EXISTS (
        SELECT 1 FROM analytics_event_ledger c
        WHERE c.event_name = 'audit_completed'
          AND (c.audit_id = r.audit_id OR c.journey_id = r.journey_id)
      )
  `),d=await a.pool.query(`
    SELECT COUNT(*) as count FROM (
      SELECT transaction_id
      FROM analytics_event_ledger
      WHERE event_name = 'purchase_completed'
        AND transaction_id IS NOT NULL
        ${e.includeSynthetic?"":"AND is_synthetic = FALSE AND environment = 'production'"}
      GROUP BY transaction_id
      HAVING COUNT(*) > 1
    ) dup
  `),o=await a.pool.query(`
    SELECT COUNT(DISTINCT p.id) as count
    FROM analytics_event_ledger p
    WHERE p.event_name = 'purchase_completed'
      ${n}
      AND NOT EXISTS (
        SELECT 1 FROM analytics_event_ledger c
        WHERE c.event_name = 'checkout_started'
          AND (
            (c.checkout_session_id IS NOT NULL AND c.checkout_session_id = p.checkout_session_id)
            OR (c.audit_id IS NOT NULL AND c.audit_id = p.audit_id)
            OR (c.journey_id IS NOT NULL AND c.journey_id = p.journey_id)
          )
      )
  `),c=await a.pool.query(`
    SELECT COUNT(*) as count
    FROM analytics_event_ledger
    WHERE event_name NOT IN (
      'landing_page_view', 'audit_cta_exposed', 'audit_cta_clicked',
      'audit_url_submitted', 'audit_submission_rejected', 'audit_accepted',
      'audit_started', 'audit_failed', 'audit_completed',
      'audit_result_viewed', 'audit_result_load_failed', 'finding_expanded',
      'repair_sprint_exposed', 'repair_sprint_clicked', 'checkout_started',
      'checkout_creation_failed', 'payment_failed', 'purchase_completed'
    )
    ${r}
  `),l=await a.pool.query(`
    SELECT 
      COUNT(DISTINCT COALESCE(journey_id, audit_id, audit_attempt_id)) as total_audits,
      COUNT(DISTINCT CASE WHEN utm_source IS NOT NULL OR referrer_class IS NOT NULL THEN COALESCE(journey_id, audit_id, audit_attempt_id) END) as attributed_audits
    FROM analytics_event_ledger
    WHERE event_name IN ('audit_url_submitted', 'audit_accepted', 'audit_started')
      ${r}
  `),p=await a.pool.query(`
    SELECT 
      COUNT(DISTINCT c.checkout_session_id) as total_checkouts,
      COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN c.checkout_session_id END) as linked_checkouts
    FROM analytics_event_ledger c
    LEFT JOIN analytics_event_ledger r 
      ON r.event_name = 'repair_sprint_clicked' 
      AND (r.journey_id = c.journey_id OR r.audit_id = c.audit_id OR (r.session_id IS NOT NULL AND r.session_id = c.session_id))
    WHERE c.event_name = 'checkout_started'
      ${t}
  `),E=await a.pool.query(`
    SELECT 
      COUNT(DISTINCT p.id) as total_purchases,
      COUNT(DISTINCT CASE WHEN c.id IS NOT NULL THEN p.id END) as linked_purchases
    FROM analytics_event_ledger p
    LEFT JOIN analytics_event_ledger c 
      ON c.event_name = 'checkout_started' 
      AND (
        (c.journey_id IS NOT NULL AND c.journey_id = p.journey_id)
        OR (c.checkout_session_id IS NOT NULL AND c.checkout_session_id = p.checkout_session_id)
        OR (c.audit_id IS NOT NULL AND c.audit_id = p.audit_id)
      )
    WHERE p.event_name = 'purchase_completed'
      ${n}
  `),N={auditCompletedWithoutStarted:parseInt(s.rows[0]?.count||"0",10),resultViewedWithoutCompleted:parseInt(_.rows[0]?.count||"0",10),duplicateLiveTransactions:parseInt(d.rows[0]?.count||"0",10),purchaseWithoutCheckout:parseInt(o.rows[0]?.count||"0",10),unknownCanonicalEvents:parseInt(c.rows[0]?.count||"0",10),unclassifiedJourneys:0},m=parseInt(l.rows[0]?.total_audits||"0",10),v=parseInt(l.rows[0]?.attributed_audits||"0",10),y=parseInt(p.rows[0]?.total_checkouts||"0",10),f=parseInt(p.rows[0]?.linked_checkouts||"0",10),T=parseInt(E.rows[0]?.total_purchases||"0",10),g=parseInt(E.rows[0]?.linked_purchases||"0",10),h=N.duplicateLiveTransactions>0||N.purchaseWithoutCheckout>0||N.unknownCanonicalEvents>0,H=N.auditCompletedWithoutStarted>0||N.resultViewedWithoutCompleted>0;return{timestamp:new Date().toISOString(),status:h?"CRITICAL":H?"DEGRADED":"HEALTHY",slos:N,completeness:{totalAudits:m,auditsWithAttributionPct:m>0?Math.round(v/m*1e3)/10:null,totalCheckouts:y,checkoutsWithRepairIntentPct:y>0?Math.round(f/y*1e3)/10:null,totalPurchases:T,purchasesLinkedToCheckoutPct:T>0?Math.round(g/T*1e3)/10:null}}}async function c(){let e=[];for(let t of(await a.pool.query(`
    SELECT p.id, p.transaction_id, p.occurred_at, p.properties
    FROM analytics_event_ledger p
    WHERE p.event_name = 'purchase_completed'
      AND NOT EXISTS (
        SELECT 1 FROM analytics_event_ledger c
        WHERE c.event_name = 'checkout_started'
          AND (
            (c.checkout_session_id IS NOT NULL AND c.checkout_session_id = p.checkout_session_id)
            OR (c.audit_id IS NOT NULL AND c.audit_id = p.audit_id)
            OR (c.journey_id IS NOT NULL AND c.journey_id = p.journey_id)
          )
      )
  `)).rows)e.push({violationType:"ORPHAN_PURCHASE",description:"purchase_completed recorded without preceding checkout_started event",journeyId:t.transaction_id||t.id,occurredAt:t.occurred_at,details:t.properties||{}});for(let t of(await a.pool.query(`
    SELECT r.id, r.audit_id, r.occurred_at, r.properties
    FROM analytics_event_ledger r
    WHERE r.event_name = 'audit_result_viewed'
      AND r.audit_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM analytics_event_ledger c
        WHERE c.event_name = 'audit_completed'
          AND (c.audit_id = r.audit_id OR c.journey_id = r.journey_id)
      )
  `)).rows)e.push({violationType:"ORPHAN_RESULT_VIEW",description:"audit_result_viewed recorded without preceding audit_completed event",journeyId:t.audit_id,occurredAt:t.occurred_at,details:t.properties||{}});for(let t of(await a.pool.query(`
    SELECT transaction_id, count(*) as count
    FROM analytics_event_ledger
    WHERE event_name = 'purchase_completed' AND transaction_id IS NOT NULL AND is_synthetic = FALSE
    GROUP BY transaction_id
    HAVING count(*) > 1
  `)).rows)e.push({violationType:"DUPLICATE_PURCHASE",description:`Duplicate live transaction_id detected: ${t.transaction_id}`,journeyId:t.transaction_id,occurredAt:new Date().toISOString(),details:{count:t.count}});return e}[a]=s.then?(await s)():s,e.s(["queryCanonicalFunnel",0,d,"queryDataQualitySLOs",0,u,"queryFurthestMeaningfulState",0,o,"queryIntegrityViolations",0,c,"recordFunnelEvent",0,_]),i()}catch(e){i(e)}},!1),63278,e=>{"use strict";var t=e.i(2157),i=e.i(50227);e.s(["logApiError",0,function(e,a={}){var n;let r={msg:e,request_id:a.request_id??null,journey_id:a.journey_id??null,revision:function(){if(process.env.NEBULA_BUILD_REVISION)return process.env.NEBULA_BUILD_REVISION;try{let e=(0,i.join)(process.cwd(),"app/lib/build-info.json");if((0,t.existsSync)(e)){let i=JSON.parse((0,t.readFileSync)(e,"utf8"));if(i.revision)return i.revision}}catch{}return"unknown"}()},s=null==(n=a.error)?null:n instanceof Error?{name:n.name,message:n.message}:{name:"Error",message:String(n)};s&&(r.error=s),console.error(JSON.stringify(r))}])},75920,(e,t,i)=>{t.exports=JSON.parse('{"$schema":"https://nebulacomponents.com/schemas/analytics-registry.v1.json","version":"1.0.0","name":"Nebula Canonical Funnel Event Registry","description":"Authoritative machine-readable event registry for end-to-end product funnel observability across Nebula Components.","failure_reasons":["invalid_url","unsupported_scheme","blocked_target","fetch_timeout","crawl_failure","script_error","internal_error","rate_limited","quota_exceeded","checkout_provider_error","audit_not_eligible","audit_not_unlocked","payment_declined","session_expired","not_found","network_error","invalid_payload","unknown"],"prohibited_properties":["email","password","card_number","cvc","exp_month","exp_year","raw_html","evidence_atom_raw","token","secret","api_key"],"events":[{"name":"landing_page_view","version":1,"stage":"acquisition","source_of_truth":"client","description":"User loads and views any landing or acquisition page","funnel_critical":true,"ga4_projectable":true,"ga4_event_name":"page_view","persisted_internally":true,"privacy_classification":"PUBLIC","cardinality":"bounded","deduplication_rule":"session_landing","required_properties":["landing_path"],"allowed_properties":["landing_path","referrer_class","utm_source","utm_medium","utm_campaign","utm_term","utm_content","device_class"]},{"name":"audit_cta_exposed","version":1,"stage":"engagement","source_of_truth":"client","description":"Audit CTA becomes visible in viewport (>=50% visible for >=500ms)","funnel_critical":true,"ga4_projectable":true,"ga4_event_name":"audit_cta_exposed","persisted_internally":true,"privacy_classification":"PUBLIC","cardinality":"bounded","deduplication_rule":"cta_exposed_per_session","required_properties":["cta_id","cta_location"],"allowed_properties":["cta_id","cta_location","page_path","device_class"]},{"name":"audit_cta_clicked","version":1,"stage":"engagement","source_of_truth":"client","description":"User clicks an audit trigger CTA button or link","funnel_critical":true,"ga4_projectable":true,"ga4_event_name":"audit_cta_clicked","persisted_internally":true,"privacy_classification":"PUBLIC","cardinality":"bounded","deduplication_rule":"none","required_properties":["cta_id","cta_location"],"allowed_properties":["cta_id","cta_location","page_path","target_url","device_class"]},{"name":"audit_url_submitted","version":1,"stage":"audit_intake","source_of_truth":"client","description":"User submits a URL for conversion audit analysis","funnel_critical":true,"ga4_projectable":true,"ga4_event_name":"audit_url_submitted","persisted_internally":true,"privacy_classification":"PSEUDONYMOUS","cardinality":"low","deduplication_rule":"audit_attempt_id","required_properties":["audit_attempt_id","page_domain"],"allowed_properties":["audit_attempt_id","page_domain","audit_reason_category","has_spend_bracket","referrer_class","device_class","utm_source","utm_medium","utm_campaign"]},{"name":"audit_submission_rejected","version":1,"stage":"audit_intake","source_of_truth":"server_api","description":"Audit intake API rejects submission due to SSRF, invalid syntax, or quota limits","funnel_critical":false,"ga4_projectable":true,"ga4_event_name":"audit_submission_rejected","persisted_internally":true,"privacy_classification":"PUBLIC","cardinality":"bounded","deduplication_rule":"none","required_properties":["reason_code"],"allowed_properties":["audit_attempt_id","reason_code","status_code"]},{"name":"audit_accepted","version":1,"stage":"audit_intake","source_of_truth":"server_api","description":"Server validates and accepts audit submission for background execution","funnel_critical":true,"ga4_projectable":true,"ga4_event_name":"audit_accepted","persisted_internally":true,"privacy_classification":"PSEUDONYMOUS","cardinality":"low","deduplication_rule":"audit_accepted_per_attempt","required_properties":["audit_attempt_id","page_domain"],"allowed_properties":["audit_attempt_id","audit_id","page_domain","referrer_class"]},{"name":"audit_started","version":1,"stage":"audit_execution","source_of_truth":"server_api","description":"Backend audit pipeline initiates page fetch and signal evaluation","funnel_critical":true,"ga4_projectable":true,"ga4_event_name":"audit_started","persisted_internally":true,"privacy_classification":"PSEUDONYMOUS","cardinality":"low","deduplication_rule":"audit_id","required_properties":["audit_attempt_id","page_domain"],"allowed_properties":["audit_attempt_id","audit_id","page_domain","referrer_class"]},{"name":"audit_failed","version":1,"stage":"audit_execution","source_of_truth":"server_worker","description":"Backend audit execution failed to complete evaluation","funnel_critical":false,"ga4_projectable":true,"ga4_event_name":"audit_failed","persisted_internally":true,"privacy_classification":"PUBLIC","cardinality":"bounded","deduplication_rule":"audit_failed_per_audit","required_properties":["reason_code"],"allowed_properties":["audit_attempt_id","audit_id","reason_code","duration_ms"]},{"name":"audit_completed","version":1,"stage":"audit_execution","source_of_truth":"server_worker","description":"Backend successfully evaluated page and persisted structured findings","funnel_critical":true,"ga4_projectable":true,"ga4_event_name":"audit_completed","persisted_internally":true,"privacy_classification":"PSEUDONYMOUS","cardinality":"bounded","deduplication_rule":"audit_completed_per_audit","required_properties":["audit_id","score_bucket","grade"],"allowed_properties":["audit_attempt_id","audit_id","page_domain","score","score_bucket","grade","findings_count","failed_signals_count","highest_priority_signal","duration_ms","engine_version"]},{"name":"audit_result_viewed","version":1,"stage":"result_view","source_of_truth":"client","description":"User views completed audit result report in browser","funnel_critical":true,"ga4_projectable":true,"ga4_event_name":"audit_result_viewed","persisted_internally":true,"privacy_classification":"PSEUDONYMOUS","cardinality":"bounded","deduplication_rule":"result_view_per_session","required_properties":["audit_id","score_bucket","grade"],"allowed_properties":["audit_attempt_id","audit_id","score_bucket","grade","findings_count","unlocked","device_class"]},{"name":"audit_result_load_failed","version":1,"stage":"result_view","source_of_truth":"client","description":"Client failed to fetch or parse completed audit result","funnel_critical":false,"ga4_projectable":true,"ga4_event_name":"audit_result_load_failed","persisted_internally":true,"privacy_classification":"PUBLIC","cardinality":"bounded","deduplication_rule":"none","required_properties":["reason_code"],"allowed_properties":["audit_id","reason_code","status_code"]},{"name":"finding_expanded","version":1,"stage":"result_engagement","source_of_truth":"client","description":"User expands finding card or fix preview to inspect evidence","funnel_critical":true,"ga4_projectable":true,"ga4_event_name":"finding_expanded","persisted_internally":true,"privacy_classification":"PUBLIC","cardinality":"bounded","deduplication_rule":"none","required_properties":["signal_key","priority_level"],"allowed_properties":["audit_id","signal_key","priority_level","signal_category","device_class"]},{"name":"repair_sprint_exposed","version":1,"stage":"monetization","source_of_truth":"client","description":"Paid One-Leak Repair Sprint offer becomes visible in viewport (>=50% for >=500ms)","funnel_critical":true,"ga4_projectable":true,"ga4_event_name":"repair_sprint_exposed","persisted_internally":true,"privacy_classification":"PUBLIC","cardinality":"bounded","deduplication_rule":"repair_sprint_exposed_per_session","required_properties":["offer_key","placement"],"allowed_properties":["audit_id","offer_key","placement","device_class"]},{"name":"repair_sprint_clicked","version":1,"stage":"monetization","source_of_truth":"client","description":"User clicks the Repair Sprint purchase or unlock CTA","funnel_critical":true,"ga4_projectable":true,"ga4_event_name":"repair_sprint_clicked","persisted_internally":true,"privacy_classification":"PUBLIC","cardinality":"bounded","deduplication_rule":"none","required_properties":["offer_key","placement"],"allowed_properties":["audit_id","offer_key","placement","device_class"]},{"name":"checkout_started","version":1,"stage":"checkout","source_of_truth":"server_api","description":"Server successfully created a checkout session with payment provider","funnel_critical":true,"ga4_projectable":true,"ga4_event_name":"begin_checkout","persisted_internally":true,"privacy_classification":"PSEUDONYMOUS","cardinality":"bounded","deduplication_rule":"checkout_session_id","required_properties":["checkout_session_id","offer_key","price_cents","currency"],"allowed_properties":["audit_id","checkout_session_id","offer_key","price_cents","currency","provider","utm_source","utm_medium","utm_campaign"]},{"name":"checkout_creation_failed","version":1,"stage":"checkout","source_of_truth":"server_api","description":"Failed to create checkout session with provider","funnel_critical":false,"ga4_projectable":true,"ga4_event_name":"checkout_creation_failed","persisted_internally":true,"privacy_classification":"PUBLIC","cardinality":"bounded","deduplication_rule":"none","required_properties":["reason_code"],"allowed_properties":["audit_id","offer_key","reason_code"]},{"name":"payment_failed","version":1,"stage":"purchase","source_of_truth":"payment_webhook","description":"Payment attempt failed or was declined by provider","funnel_critical":false,"ga4_projectable":true,"ga4_event_name":"payment_failed","persisted_internally":true,"privacy_classification":"PUBLIC","cardinality":"bounded","deduplication_rule":"payment_failed_per_session","required_properties":["reason_code"],"allowed_properties":["checkout_session_id","offer_key","reason_code"]},{"name":"purchase_completed","version":1,"stage":"purchase","source_of_truth":"payment_webhook","description":"Payment successfully confirmed and verified by payment provider webhook","funnel_critical":true,"ga4_projectable":true,"ga4_event_name":"purchase","persisted_internally":true,"privacy_classification":"PSEUDONYMOUS","cardinality":"bounded","deduplication_rule":"transaction_id","required_properties":["transaction_id","amount_cents","currency","offer_key"],"allowed_properties":["audit_id","checkout_session_id","transaction_id","offer_key","amount_cents","currency","livemode","provider","utm_source","utm_medium","utm_campaign"]}]}')},51421,e=>{"use strict";let t=e.i(75920).default,i=new Map(t.events.map(e=>[e.name,e])),a=new Set(t.failure_reasons),n=new Set(t.prohibited_properties);function r(e){return i.get(e)}e.s(["getEventDefinition",0,r,"validateEventPayload",0,function(e,t={}){let i=r(e),s=[];if(!i)return s.push(`Unknown canonical event: "${e}"`),{valid:!1,errors:s};for(let i of Object.keys(t)){let t=i.toLowerCase();n.has(t)&&s.push(`Prohibited property "${i}" in event "${e}"`)}for(let a of i.required_properties)(void 0===t[a]||null===t[a]||""===t[a])&&s.push(`Missing required property "${a}" for event "${e}"`);if(t.reason_code){let i=String(t.reason_code);a.has(i)||s.push(`Invalid normalized failure reason "${i}" for event "${e}"`)}return{valid:0===s.length,errors:s}}])}];

//# sourceMappingURL=_01ff106._.js.map