import json
import re
import requests
from datetime import datetime

# Configuration
TRIGGER_KEYWORDS = [
    "landing page not converting",
    "google ads no conversions",
    "zero conversions ads",
    "roast my landing page",
    "ad spend not converting",
    "money bleeding ads",
    "conversion rate low",
    "ads not working",
    "landing page redesign",
    "fix my funnel"
]

# Trigger scoring system
TRIGGER_SCORES = {
    "ad_bleed": 10,
    "zero_conversions": 9,
    "landing_page_feedback": 8,
    "founder_signal": 7,
    "hiring_scaling": 6,
    "general_conversion_pain": 5
}

# Verticals
VERTICALS = [
    "saas",
    "ecommerce",
    "agency",
    "consulting",
    "education",
    "healthcare",
    "finance",
    "real estate",
    "travel",
    "food"
]

# Source types
SOURCE_TYPES = [
    "reddit_explicit_pain",
    "hn_explicit_pain",
    "linkedin_signal",
    "local_business"
]

class TriggerLeadEngine:
    def __init__(self):
        self.leads = []
        self.triggers = []
        
    def search_triggers(self, source_type="reddit_explicit_pain"):
        """Search for buying triggers in specified source"""
        if source_type == "reddit_explicit_pain":
            return self._search_reddit()
        elif source_type == "hn_explicit_pain":
            return self._search_hn()
        elif source_type == "linkedin_signal":
            return self._search_linkedin()
        elif source_type == "local_business":
            return self._search_local_business()
        else:
            raise ValueError(f"Unknown source type: {source_type}")
    
    def _search_reddit(self):
        """Search Reddit for buying triggers"""
        leads = []
        
        for keyword in TRIGGER_KEYWORDS:
            # Simulate Reddit search (in real implementation, use Reddit API)
            # This is a simplified version for demonstration
            results = self._simulate_reddit_search(keyword)
            
            for result in results:
                lead = self._process_reddit_result(result, keyword)
                if lead:
                    leads.append(lead)
        
        return leads
    
    def _simulate_reddit_search(self, keyword):
        """Simulate Reddit search results"""
        # In real implementation, use Reddit API
        # This is a simplified version for demonstration
        return [
            {
                "title": f"{keyword} - Help needed!",
                "url": f"https://reddit.com/r/entrepreneur/comments/{keyword.replace(' ', '_')}123",
                "author": "founder123",
                "score": 42,
                "num_comments": 15,
                "created_utc": datetime.now().timestamp() - 3600,
                "selftext": f"I'm spending $5000/month on ads but getting zero conversions. Can someone help me fix my landing page? {keyword}"
            }
        ]
    
    def _process_reddit_result(self, result, keyword):
        """Process a Reddit result and extract lead information"""
        # Extract trigger type
        trigger_type = self._determine_trigger_type(result["selftext"])
        
        # Check if this is a high-pain signal (requires active money/traffic language + conversion failure)
        if not self._is_high_pain_signal(result["selftext"]):
            return None
        
        # Determine vertical
        vertical = self._determine_vertical(result["selftext"])
        
        # Create lead object
        lead = {
            "source_type": "reddit_explicit_pain",
            "trigger_type": trigger_type,
            "vertical": vertical,
            "title": result["title"],
            "url": result["url"],
            "author": result["author"],
            "score": result["score"],
            "num_comments": result["num_comments"],
            "created_utc": result["created_utc"],
            "content": result["selftext"],
            "keyword": keyword,
            "score_value": TRIGGER_SCORES.get(trigger_type, 0),
            "timestamp": datetime.now().isoformat()
        }
        
        return lead
    
    def _determine_trigger_type(self, text):
        """Determine the trigger type based on text content"""
        text_lower = text.lower()
        
        if "ad" in text_lower and ("bleed" in text_lower or "spend" in text_lower):
            return "ad_bleed"
        elif "zero" in text_lower and "conversion" in text_lower:
            return "zero_conversions"
        elif "roast" in text_lower and "landing" in text_lower:
            return "landing_page_feedback"
        elif "founder" in text_lower or "building" in text_lower:
            return "founder_signal"
        elif "hire" in text_lower or "scale" in text_lower:
            return "hiring_scaling"
        else:
            return "general_conversion_pain"
    
    def _is_high_pain_signal(self, text):
        """Check if this is a high-pain signal"""
        text_lower = text.lower()
        
        # Check for active money/traffic language + conversion failure
        has_money_traffic = any(word in text_lower for word in ["spend", "money", "ads", "budget", "traffic", "clicks"])
        has_conversion_failure = any(word in text_lower for word in ["zero", "no", "not converting", "fail", "broken", "don't work"])
        
        # Check for explicit landing-page hand-raise with a live URL
        has_hand_raise = any(word in text_lower for word in ["roast", "review", "audit", "help", "fix", "improve"])
        has_url = "http" in text_lower
        
        return (has_money_traffic and has_conversion_failure) or (has_hand_raise and has_url)
    
    def _determine_vertical(self, text):
        """Determine the vertical based on text content"""
        text_lower = text.lower()
        
        for vertical in VERTICALS:
            if vertical in text_lower:
                return vertical
        
        # Default to saas
        return "saas"
    
    def _search_hn(self):
        """Search Hacker News for buying triggers"""
        # Implement HN search logic
        pass
    
    def _search_linkedin(self):
        """Search LinkedIn for buying triggers"""
        # Implement LinkedIn search logic
        pass
    
    def _search_local_business(self):
        """Search for local business signals"""
        # Implement local business search logic
        pass
    
    def score_leads(self, leads):
        """Score leads based on trigger type and other factors"""
        scored_leads = []
        
        for lead in leads:
            # Base score from trigger type
            score = TRIGGER_SCORES.get(lead["trigger_type"], 0)
            
            # Add bonus points for high engagement
            if lead.get("score", 0) > 50:
                score += 2
            if lead.get("num_comments", 0) > 10:
                score += 2
            
            # Add bonus points for recent activity
            if lead["created_utc"] > datetime.now().timestamp() - 86400:  # Within last 24 hours
                score += 3
            
            lead["final_score"] = score
            scored_leads.append(lead)
        
        # Sort by score (descending)
        scored_leads.sort(key=lambda x: x["final_score"], reverse=True)
        
        return scored_leads
    
    def filter_leads(self, leads):
        """Filter leads to exclude low-quality or irrelevant ones"""
        filtered_leads = []
        
        for lead in leads:
            content_lower = lead.get("content", "").lower()
            title_lower = lead.get("title", "").lower()
            
            # Exclude ads experts
            if "expert" in content_lower or "consultant" in content_lower:
                continue
            
            # Exclude AMAs
            if "AMA" in title_lower or "Ask Me Anything" in title_lower:
                continue
            
            # Exclude free analyzer/tool promotions
            if "free analyzer" in content_lower or "free tool" in content_lower:
                continue
            
            # Exclude zero-ad-spend posts
            if "no ads" in content_lower or "free traffic" in content_lower:
                continue
            
            # Exclude generic discussion threads
            if "discussion" in title_lower or "thread" in title_lower:
                continue
            
            filtered_leads.append(lead)
        
        return filtered_leads
    
    def segment_leads(self, leads):
        """Segment leads based on trigger type"""
        segments = {
            "founder_ad_bleed": [],
            "feedback_seeker": [],
            "hiring_scaling": [],
            "general_conversion_pain": []
        }
        
        for lead in leads:
            trigger_type = lead["trigger_type"]
            
            if trigger_type == "ad_bleed":
                segments["founder_ad_bleed"].append(lead)
            elif trigger_type == "landing_page_feedback":
                segments["feedback_seeker"].append(lead)
            elif trigger_type == "hiring_scaling":
                segments["hiring_scaling"].append(lead)
            else:
                segments["general_conversion_pain"].append(lead)
        
        return segments
    
    def generate_outreach(self, lead):
        """Generate outreach message for a lead"""
        # Select appropriate template based on trigger type
        template = self._select_template(lead["trigger_type"])
        
        # Personalize template with lead information
        outreach = template.format(
            name=lead["author"].split(" ")[0] if " " in lead["author"] else lead["author"],
            product="your product" if lead["vertical"] == "saas" else "your service",
            audit_url="https://nebula.com/audit"  # Replace with actual audit URL
        )
        
        return outreach
    
    def _select_template(self, trigger_type):
        """Select appropriate outreach template based on trigger type"""
        templates = {
            "ad_bleed": "Subject: Saw your ads aren't converting → quick fix\n\nHey {name},\n\nNoticed you're spending on ads but not getting conversions. We've helped SaaS founders like you fix this in 48 hours with our $97 audit.\n\nHere's your free audit: {audit_url}\n\nNo calls, no calendars. Just the fix.",
            "zero_conversions": "Subject: Your landing page is leaking money\n\nHey {name},\n\nZero conversions from ads? We've seen this 147 times. Fix it in 48 hours with our $97 audit.\n\nHere's your free audit: {audit_url}",
            "landing_page_feedback": "Subject: Got feedback for your landing page?\n\nHi {name},\n\nSaw you're looking for landing page feedback. We've helped 147+ founders fix their conversions with our $97 audit.\n\nHere's your free audit: {audit_url}",
            "founder_signal": "Subject: Building something awesome? Let's fix your funnel\n\nHi {name},\n\nSaw you're building {product}. Congrats! Most founders bleed money on ads before fixing their landing page.\n\nFree audit to find your leaks: {audit_url}",
            "hiring_scaling": "Subject: Scaling? Don't let your landing page hold you back\n\nHey {name},\n\nAs you scale, your landing page needs to convert better. We've helped SaaS founders like you fix this in 48 hours with our $97 audit.\n\nHere's your free audit: {audit_url}",
            "general_conversion_pain": "Subject: Your landing page is leaking money\n\nHey {name},\n\nNoticed you're having conversion issues. We've helped 147+ founders fix their landing pages with our $97 audit.\n\nHere's your free audit: {audit_url}"        }
        
        return templates.get(trigger_type, templates["general_conversion_pain"])
    
    def run(self, source_type="reddit_explicit_pain"):
        """Run the trigger lead engine"""
        # Search for triggers
        leads = self.search_triggers(source_type)
        
        # Filter leads
        filtered_leads = self.filter_leads(leads)
        
        # Score leads
        scored_leads = self.score_leads(filtered_leads)
        
        # Segment leads
        segments = self.segment_leads(scored_leads)
        
        # Generate outreach for top leads
        outreach_messages = []
        for segment_name, segment_leads in segments.items():
            for lead in segment_leads[:5]:  # Top 5 leads per segment
                outreach = self.generate_outreach(lead)
                outreach_messages.append({
                    "lead": lead,
                    "outreach": outreach,
                    "segment": segment_name
                })
        
        return {
            "total_leads": len(leads),
            "filtered_leads": len(filtered_leads),
            "scored_leads": len(scored_leads),
            "segments": segments,
            "outreach_messages": outreach_messages
        }

# Example usage
if __name__ == "__main__":
    engine = TriggerLeadEngine()
    result = engine.run("reddit_explicit_pain")
    
    print(f"Total leads found: {result['total_leads']}")
    print(f"Filtered leads: {result['filtered_leads']}")
    print(f"Scored leads: {result['scored_leads']}")
    
    for segment_name, segment_leads in result['segments'].items():
        print(f"\n{segment_name}: {len(segment_leads)} leads")
        for lead in segment_leads[:3]:  # Show top 3 per segment
            print(f"  - {lead['title'][:50]}... (Score: {lead['final_score']})")
    
    print(f"\nOutreach messages generated: {len(result['outreach_messages'])}")
    for i, outreach in enumerate(result['outreach_messages'][:3], 1):
        print(f"\n{i}. {outreach['outreach'][:200]}...")