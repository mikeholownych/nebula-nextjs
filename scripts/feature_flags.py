"""
Feature flag management for Nebula Components.

Features:
- Enables gradual rollouts
- A/B testing support
- Kill switches for emergency rollbacks
- User segment targeting
"""
import os
import json
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional
import hashlib


@dataclass
class FeatureFlag:
    """Represents a feature flag."""
    name: str
    enabled: bool = False
    description: str = ""
    rollout_percentage: int = 0  # 0-100
    segments: list = field(default_factory=list)  # User segment targeting
    created_at: str = ""
    updated_at: str = ""
    
    def is_enabled_for_user(self, user_id: str) -> bool:
        """Check if flag is enabled for specific user based on rollout percentage."""
        if not self.enabled:
            return False
        
        if self.rollout_percentage >= 100:
            return True
        
        # Deterministic hash-based rollout
        hash_val = int(hashlib.md5(f"{user_id}:{self.name}".encode()).hexdigest(), 16)
        return (hash_val % 100) < self.rollout_percentage


class FeatureFlagStore:
    """Manages feature flags with disk persistence."""
    
    def __init__(self, storage_path: Path = None):
        self.storage_path = storage_path or Path('/tmp/feature_flags.json')
        self.flags: dict[str, FeatureFlag] = {}
        self._load()
    
    def _load(self):
        """Load flags from disk."""
        if self.storage_path.exists():
            try:
                with open(self.storage_path) as f:
                    data = json.load(f)
                    for name, flag_data in data.items():
                        flag = FeatureFlag(**flag_data)
                        self.flags[name] = flag
            except (json.JSONDecodeError, TypeError):
                self.flags = {}
    
    def _save(self):
        """Save flags to disk."""
        data = {
            name: {
                'name': flag.name,
                'enabled': flag.enabled,
                'description': flag.description,
                'rollout_percentage': flag.rollout_percentage,
                'segments': flag.segments,
                'created_at': flag.created_at,
                'updated_at': flag.updated_at,
            }
            for name, flag in self.flags.items()
        }
        with open(self.storage_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def register(self, name: str, enabled: bool = False, description: str = "") -> FeatureFlag:
        """Register a new feature flag."""
        if name in self.flags:
            raise ValueError(f"Flag '{name}' already exists")
        
        from datetime import datetime
        flag = FeatureFlag(
            name=name,
            enabled=enabled,
            description=description,
            created_at=datetime.now().isoformat(),
        )
        self.flags[name] = flag
        self._save()
        return flag
    
    def get(self, name: str) -> Optional[FeatureFlag]:
        """Get a feature flag by name."""
        return self.flags.get(name)
    
    def set_enabled(self, name: str, enabled: bool, rollout_percentage: int = 0) -> bool:
        """Enable/disable a flag with optional rollout percentage."""
        if name not in self.flags:
            return False
        
        from datetime import datetime
        self.flags[name].enabled = enabled
        self.flags[name].rollout_percentage = rollout_percentage
        self.flags[name].updated_at = datetime.now().isoformat()
        self._save()
        return True
    
    def is_enabled(self, name: str, user_id: str = "global") -> bool:
        """Check if a flag is enabled (globally or for specific user)."""
        flag = self.get(name)
        if not flag:
            return False
        return flag.is_enabled_for_user(user_id)


# Global feature flag store
_flag_store: Optional[FeatureFlagStore] = None


def get_flag_store() -> FeatureFlagStore:
    """Get or create global feature flag store."""
    global _flag_store
    if _flag_store is None:
        storage = Path('/home/mike/nebula/.feature_flags.json')
        _flag_store = FeatureFlagStore(storage)
    return _flag_store


def is_feature_enabled(name: str, user_id: str = "global") -> bool:
    """Check if a feature is enabled."""
    store = get_flag_store()
    return store.is_enabled(name, user_id)


def enable_feature(name: str, rollout_percentage: int = 100) -> bool:
    """Enable a feature with optional rollout percentage."""
    store = get_flag_store()
    return store.set_enabled(name, True, rollout_percentage)


def disable_feature(name: str) -> bool:
    """Disable a feature."""
    store = get_flag_store()
    return store.set_enabled(name, False, 0)


def register_feature(name: str, description: str = "") -> FeatureFlag:
    """Register a new feature flag."""
    store = get_flag_store()
    return store.register(name, description=description)


# Pre-registered features
FEATURES = {
    'ci_cd_pipeline': 'GitHub Actions CI/CD pipeline',
    'feature_flags': 'Feature flag management UI',
    'canary_deployments': 'Canary deployment support',
    'nps_surveys': 'NPS/CSAT survey integration',
    'knowledge_base': 'Customer knowledge base',
    'analytics_v2': 'Enhanced analytics dashboard',
}

# Initialize defaults
def initialize_features():
    """Initialize default feature flags."""
    store = get_flag_store()
    for name in FEATURES:
        if name not in store.flags:
            store.register(name, enabled=True, description=FEATURES[name])
    return store


if __name__ == '__main__':
    # Initialize and test
    store = initialize_features()
    print("Feature flags:")
    for name, flag in store.flags.items():
        print(f"  {name}: enabled={flag.enabled}, rollout={flag.rollout_percentage}%")
    
    # Test feature check
    print(f"\nci_cd_pipeline enabled: {is_feature_enabled('ci_cd_pipeline')}")
    print(f"feature_flags enabled: {is_feature_enabled('feature_flags')}")
