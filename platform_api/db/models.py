"""Platform API database models.

Tables:
- users: Core user records
- user_identities: OIDC provider identities
- organizations: Tenant root
- memberships: User-organization relationships
- subscriptions: Service subscriptions
- agencies: Agency accounts
- agency_clients: Client accounts under agencies
- audit_events: Append-only audit log
"""

from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from sqlalchemy import (Boolean, CheckConstraint, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint, text, func)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, utcnow


class User(Base):
    """Core user record.

    A user may have multiple identities (different OIDC providers).
    Email is never used as identity key - only subject + issuer.
    """
    __tablename__ = "users"

    __table_args__ = (
        CheckConstraint("status IN ('active', 'suspended', 'disabled')", name="ck_users_status"),
        Index("ix_users_email_unique", "email", unique=True, postgresql_where=text("email IS NOT NULL")),
    )

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    picture: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", server_default="active")
    email_verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    # Relationships
    identities: Mapped[list["UserIdentity"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    memberships: Mapped[list["Membership"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    audits: Mapped[list["Audit"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User {self.id}>"


class UserIdentity(Base):
    """OIDC provider identity for a user.

    Identity is always (issuer, subject), never email.
    """
    __tablename__ = "user_identities"
    __table_args__ = (
        UniqueConstraint("issuer", "subject", name="uq_user_identities_issuer_subject"),
        Index("ix_user_identities_user_id", "user_id"),
    )

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    issuer: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="identities")

    def __repr__(self) -> str:
        return f"<UserIdentity {self.issuer}:{self.subject}>"


class Organization(Base):
    """Tenant root - customer or agency.

    Every tenant-owned resource includes organization_id.
    """
    __tablename__ = "organizations"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    is_agency: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    # Relationships
    memberships: Mapped[list["Membership"]] = relationship(back_populates="organization", cascade="all, delete-orphan")
    subscriptions: Mapped[list["Subscription"]] = relationship(back_populates="organization", cascade="all, delete-orphan")
    audits: Mapped[list["Audit"]] = relationship(back_populates="organization", cascade="all, delete-orphan")
    invoices: Mapped[list["Invoice"]] = relationship(back_populates="organization", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Organization {self.slug}>"


class Membership(Base):
    """User membership in an organization.

    Unique on (user_id, organization_id) to prevent duplicates.
    Role determines permissions via authorization policy.
    """
    __tablename__ = "memberships"
    __table_args__ = (
        UniqueConstraint("user_id", "organization_id", name="uq_memberships_user_organization"),
        CheckConstraint("status IN ('active', 'suspended', 'removed')", name="ck_memberships_status"),
        Index("ix_memberships_organization_id", "organization_id"),
    )

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organization_id: Mapped[UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="member")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", server_default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="memberships")
    organization: Mapped["Organization"] = relationship(back_populates="memberships")

    def __repr__(self) -> str:
        return f"<Membership {self.user_id}@{self.organization_id} ({self.role})>"


class Subscription(Base):
    """Service subscription for an organization.

    Tracks billing status and Stripe integration.
    """
    __tablename__ = "subscriptions"
    __table_args__ = (
        Index("ix_subscriptions_organization_id", "organization_id"),
        Index("ix_subscriptions_stripe_subscription_id", "stripe_subscription_id"),
    )

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id: Mapped[UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, unique=True)
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    plan: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)
    billing_interval: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    current_period_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    current_period_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    livemode: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    welcome_email_enqueued_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    welcome_email_attempts: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    welcome_email_last_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship(back_populates="subscriptions")

    def __repr__(self) -> str:
        return f"<Subscription {self.plan} ({self.status})>"


class AgencyClient(Base):
    """Client account managed by an agency organization.

    client_email is the system-managed audit ownership key for nebula_audit.
    Pattern: {slug}+{org_id_prefix8}@clients.nebulacomponents.com
    Never a real mailbox.
    """

    __tablename__ = "agency_clients"
    __table_args__ = (
        UniqueConstraint("organization_id", "slug", name="uq_agency_clients_org_slug"),
        Index("ix_agency_clients_org", "organization_id"),
    )

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(nullable=False)
    slug: Mapped[str] = mapped_column(nullable=False)
    domain: Mapped[str] = mapped_column(nullable=False)
    client_email: Mapped[str] = mapped_column(nullable=False, unique=True)
    status: Mapped[str] = mapped_column(nullable=False, default="active")
    notes: Mapped[Optional[str]] = mapped_column(nullable=True)
    invited_user_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    invite_token: Mapped[Optional[str]] = mapped_column(nullable=True)
    invite_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )

    def __repr__(self) -> str:
        return f"<AgencyClient {self.name!r} org={self.organization_id}>"


class BrandProfile(Base):
    """Draft or published workspace branding for an agency organization."""

    __tablename__ = "brand_profiles"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    display_name: Mapped[str] = mapped_column(Text, nullable=False)
    logo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logo_dark_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    primary_color: Mapped[str] = mapped_column(Text, nullable=False, default="#c7ff2f")
    support_email: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    footer_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )


class AuditEvent(Base):
    """Append-only audit log for compliance and debugging.

    Never updated or deleted. Used for membership changes,
    authorization events, and billing operations.
    """
    __tablename__ = "audit_events"
    __table_args__ = (
        Index("ix_audit_events_organization_id", "organization_id"),
        Index("ix_audit_events_created_at", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    user_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    event_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON blob
    request_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    def __repr__(self) -> str:
        return f"<AuditEvent {self.event_type} @{self.created_at}>"


class Audit(Base):
    """Audit record for organization websites."""

    __tablename__ = "audits"
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'processing', 'completed', 'failed')", name="check_audit_status"),
        CheckConstraint("score >= 0 AND score <= 100", name="check_audit_score"),
        Index("ix_audits_org_id", "org_id"),
        Index("ix_audits_user_id", "user_id"),
        Index("ix_audits_status", "status"),
    )

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    org_id: Mapped[UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    site_url: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    audit_data: Mapped[dict] = mapped_column(JSONB, default=dict)

    # Relationships
    organization: Mapped["Organization"] = relationship(back_populates="audits")
    user: Mapped["User"] = relationship(back_populates="audits")

    def __repr__(self) -> str:
        return f"<Audit {self.id} ({self.status})>"



class DeployHook(Base):
    """Customer deploy webhook (capability token, stored hashed)."""

    __tablename__ = "deploy_hooks"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    workspace_email: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    token_prefix: Mapped[str] = mapped_column(String(16), nullable=False)
    domains: Mapped[list] = mapped_column(JSONB, default=list)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    use_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )



class Ga4Connection(Base):
    """Google Analytics 4 read-only connection (one per user).

    Tokens are stored encrypted (platform_api.infra.secret_box).
    """

    __tablename__ = "ga4_connections"
    __table_args__ = (
        Index("ix_ga4_connections_user_id", "user_id", unique=True),
    )

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    property_id: Mapped[Optional[str]] = mapped_column(Text)
    property_display_name: Mapped[Optional[str]] = mapped_column(Text)
    access_token: Mapped[Optional[str]] = mapped_column(Text)
    refresh_token: Mapped[Optional[str]] = mapped_column(Text)
    token_expiry: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    connected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
class GscConnection(Base):
    """Google Search Console OAuth connection for a user.

    One connection per user (unique on user_id).
    Stores tokens needed to query the Search Analytics API on their behalf.
    """

    __tablename__ = "gsc_connections"
    __table_args__ = (
        Index("ix_gsc_connections_user_id", "user_id"),
    )

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    # Sensitive tokens stored per connection; encrypted at connection lifecycle boundary
    access_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    refresh_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    token_expiry: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    gsc_site_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    connected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utcnow,
        server_default=text("now()"),
    )

    def __repr__(self) -> str:
        return f"<GscConnection user={self.user_id} site={self.gsc_site_url}>"


class ProjectIntegration(Base):
    """Per-project Google property selections using the user's OAuth grants."""

    __tablename__ = "project_integrations"
    __table_args__ = (
        UniqueConstraint("user_id", "project_domain", name="uq_project_integrations_user_domain"),
        Index("ix_project_integrations_user_id", "user_id"),
    )

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    project_domain: Mapped[str] = mapped_column(String(255), nullable=False)
    gsc_site_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ga4_property_id: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ga4_property_display_name: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)


class Invoice(Base):
    """Invoice record from Stripe."""

    __tablename__ = "invoices"
    __table_args__ = (
        CheckConstraint("status IN ('draft', 'open', 'paid', 'void', 'uncollectible')", name="check_invoice_status"),
        Index("ix_invoices_org_id", "org_id"),
        Index("ix_invoices_status", "status"),
    )

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    org_id: Mapped[UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    stripe_invoice_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    # Relationships
    organization: Mapped["Organization"] = relationship(back_populates="invoices")

    def __repr__(self) -> str:
        return f"<Invoice {self.id} ({self.status})>"
