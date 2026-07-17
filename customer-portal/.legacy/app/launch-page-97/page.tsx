'use client'

export default function LaunchPage97() {
  const goToCheckout = () => {
    window.location.href = 'mailto:ops@launchcrate.io?subject=AUDIT: $147 Managed Outreach&body=Hi Mike,%0A%0AI want to buy the $147 Managed Outreach Audit.%0A%0APlease send me the payment link.'
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)'
    }}>
      <style jsx>{`
        .container {
          max-width: 600px;
          background: rgba(26, 31, 58, 0.8);
          border: 1px solid rgba(74, 222, 128, 0.2);
          border-radius: 16px;
          padding: 60px 40px;
          backdrop-filter: blur(10px);
        }
        .badge {
          display: inline-block;
          background: rgba(74, 222, 128, 0.1);
          color: #4ade80;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 20px;
          border: 1px solid rgba(74, 222, 128, 0.3);
        }
        .title {
          font-size: 42px;
          font-weight: 700;
          margin-bottom: 10px;
          background: linear-gradient(135deg, #4ade80, #86efac);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .tagline {
          font-size: 18px;
          color: #aaa;
          margin-bottom: 40px;
        }
        .price-box {
          background: rgba(74, 222, 128, 0.05);
          border: 2px solid rgba(74, 222, 128, 0.3);
          border-radius: 12px;
          padding: 30px;
          margin: 40px 0;
          text-align: center;
        }
        .price {
          font-size: 56px;
          font-weight: 700;
          color: #4ade80;
          margin-bottom: 5px;
        }
        .price-note {
          color: #888;
          font-size: 14px;
        }
        .features {
          list-style: none;
          margin: 40px 0;
        }
        .features li {
          padding: 12px 0;
          display: flex;
          align-items: flex-start;
          border-bottom: 1px solid rgba(74, 222, 128, 0.1);
        }
        .features li::before {
          content: "✓";
          color: #4ade80;
          font-weight: 700;
          margin-right: 15px;
          font-size: 18px;
        }
        .cta {
          display: block;
          width: 100%;
          padding: 18px 30px;
          background: linear-gradient(135deg, #4ade80, #22c55e);
          color: #0a0e27;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 18px;
          cursor: pointer;
          text-decoration: none;
          text-align: center;
          margin-top: 30px;
          transition: all 0.3s;
          box-shadow: 0 10px 30px rgba(74, 222, 128, 0.2);
        }
        .cta:hover {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(74, 222, 128, 0.3);
        }
        .guarantee-box {
          margin-top: 30px;
          padding: 20px;
          background: rgba(74, 222, 128, 0.05);
          border-left: 4px solid #4ade80;
          border-radius: 8px;
        }
        .guarantee-box strong {
          color: #4ade80;
        }
        .guarantee-box p {
          font-size: 14px;
          color: #aaa;
          margin-top: 8px;
        }
        .story {
          margin-top: 50px;
          padding-top: 30px;
          border-top: 1px solid rgba(74, 222, 128, 0.1);
          font-size: 14px;
          color: #888;
          line-height: 1.6;
        }
      `}</style>

      <div className="container">
        <div className="badge">⚡ LIMITED TIME OFFER</div>

        <h1 className="title">Managed Outreach Audit</h1>
        <p className="tagline">Get real replies from your prospect list in 72 hours. Or get your money back.</p>

        <div className="price-box">
          <div className="price">$147</div>
          <div className="price-note">One-time payment • 3-day turnaround • 30-day refund guarantee</div>
        </div>

        <h2 style={{ fontSize: '20px', marginBottom: '20px', marginTop: '30px' }}>What You Get:</h2>
        <ul className="features">
          <li>Prospect list quality audit (ICP fit analysis)</li>
          <li>Email template optimization (subject line + body)</li>
          <li>10 test emails sent on your behalf</li>
          <li>Reply analysis + conversion report</li>
          <li>Recommendations for next 100 emails</li>
          <li>30-day refund if zero replies</li>
        </ul>

        <button className="cta" onClick={goToCheckout}>Buy Now - $147</button>

        <div className="guarantee-box">
          <strong>🛡️ 30-Day Refund Guarantee</strong>
          <p>If we don&apos;t generate at least one reply from your list, you get a full refund. No questions. No hassle.</p>
        </div>

        <div className="story">
          <p><strong>Why I&apos;m doing this:</strong></p>
          <p>I built an AI cold email service and have 72 hours to prove it works. Instead of asking for funding, I&apos;m selling results. If you have a prospect list you want to test but aren&apos;t sure if your message/list quality is good — I&apos;ll do the heavy lifting.</p>
          <p>You either get replies (and learn what works), or you get your money back.</p>
        </div>
      </div>
    </div>
  )
}
