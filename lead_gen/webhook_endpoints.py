"""Lead Gen Webhook Endpoints — Flask routes for RB2B + n8n integration.

Mount these in yt_orchestrator.py:
  from lead_gen.webhook_endpoints import register_webhooks
  register_webhooks(app)  # Flask app
"""
from flask import Blueprint, request, jsonify
import json

bp = Blueprint("lead_gen", __name__)


@bp.route("/webhook/rb2b-event", methods=["POST"])
def handle_rb2b_event():
    """RB2B visitor identification webhook.
    
    Expected payload:
    {
        "company": "Stripe Inc.",
        "visitor_ip": "203.0.113.42",
        "pages_visited": ["audit", "fix-pack"],
        "total_dwell_s": 245,
        "last_visit": "2026-08-09T14:30:00Z"
    }
    """
    try:
        payload = request.get_json()
        from lead_gen.rb2b_handler import handle_rb2b_event
        result = handle_rb2b_event(payload)
        return jsonify(result), 200 if result.get("success") else 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route("/webhook/outbound-reply", methods=["POST"])
def handle_outbound_reply():
    """n8n reply classification webhook.
    
    Expected payload:
    {
        "prospect_id": "stripe_founder1",
        "email": "patrick@stripe.com",
        "reply_text": "Yeah, interested. Can you send details?",
        "reply_timestamp": "2026-08-10T09:15:00Z"
    }
    """
    try:
        payload = request.get_json()
        from lead_gen.n8n_reply_handler import handle_reply_webhook
        result = handle_reply_webhook(payload)
        return jsonify(result), 200 if result.get("success") else 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def register_webhooks(app):
    """Register lead_gen webhooks in a Flask app."""
    app.register_blueprint(bp)
