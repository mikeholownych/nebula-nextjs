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

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, utcnow


class User(Base):
    """Core user record.

    A user may have multiple identities (different OIDC providers).
    Email is never used as identity key - only subject + issuer.
    """
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
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
        Index("ix_memberships_organization_id", "organization_id"),
    )

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organization_id: Mapped[UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="member")
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

    # Relationships
    organization: Mapped["Organization"] = relationship(back_populates="subscriptions")

    def __repr__(self) -> str:
        return f"<Subscription {self.plan} ({self.status})>"


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
    metadata: Mapped[dict] = mapped_column(JSONB, default=dict)

    # Relationships
    organization: Mapped["Organization"] = relationship(back_populates="audits")
    user: Mapped["User"] = relationship(back_populates="audits")

    def __repr__(self) -> str:
        return f"<Audit {self.id} ({self.status})>"


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
