from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, 
    Index, UniqueConstraint, Numeric
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from ..db.session import Base

# -------------------------------------------------------------
# A. Roles & Permissions
# -------------------------------------------------------------
class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False) # super_admin, ministry_admin, monitoring_officer, analyst, executive_viewer, demo_user
    description = Column(String(255), nullable=True)
    permissions_json = Column(JSONB, default=list, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    users = relationship("User", back_populates="role")

# -------------------------------------------------------------
# B. Users
# -------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="RESTRICT"), index=True, nullable=False)
    ministry_id = Column(Integer, ForeignKey("ministries.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    role = relationship("Role", back_populates="users")
    ministry = relationship("Ministry", back_populates="users")
    notes = relationship("ProjectNote", back_populates="author")
    audit_logs = relationship("AuditLog", back_populates="user")
    reports = relationship("Report", back_populates="creator")

# -------------------------------------------------------------
# C. Ministries
# -------------------------------------------------------------
class Ministry(Base):
    __tablename__ = "ministries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    users = relationship("User", back_populates="ministry")
    projects = relationship("Project", back_populates="ministry")
    agencies = relationship("ImplementingAgency", back_populates="ministry")

# -------------------------------------------------------------
# D. Sectors
# -------------------------------------------------------------
class Sector(Base):
    __tablename__ = "sectors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    projects = relationship("Project", back_populates="sector")

# -------------------------------------------------------------
# E. Implementing Agencies
# -------------------------------------------------------------
class ImplementingAgency(Base):
    __tablename__ = "implementing_agencies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    ministry_id = Column(Integer, ForeignKey("ministries.id", ondelete="CASCADE"), nullable=False)
    agency_code = Column(String(30), unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    ministry = relationship("Ministry", back_populates="agencies")
    projects = relationship("Project", back_populates="agency")

# -------------------------------------------------------------
# F. Projects
# -------------------------------------------------------------
class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    project_code = Column(String(50), unique=True, index=True, nullable=False)
    project_name = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    ministry_id = Column(Integer, ForeignKey("ministries.id", ondelete="RESTRICT"), index=True, nullable=False)
    sector_id = Column(Integer, ForeignKey("sectors.id", ondelete="RESTRICT"), index=True, nullable=False)
    implementing_agency_id = Column(Integer, ForeignKey("implementing_agencies.id", ondelete="RESTRICT"), nullable=False)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Cost in ₹ Crore (Numeric for monetary precision)
    original_cost_crore = Column(Numeric(14, 2), nullable=False)
    revised_cost_crore = Column(Numeric(14, 2), nullable=False)
    cumulative_expenditure_crore = Column(Numeric(14, 2), default=0, nullable=False)

    original_start_date = Column(DateTime, nullable=True)
    original_completion_date = Column(DateTime, nullable=False)
    current_completion_date = Column(DateTime, index=True, nullable=False)

    # Status: proposed, approved, ongoing, delayed, completed, suspended, cancelled, closed
    project_status = Column(String(30), default="ongoing", index=True, nullable=False)
    physical_progress_percentage = Column(Float, default=0.0, nullable=False)
    financial_progress_percentage = Column(Float, default=0.0, nullable=False)

    # Risk analytics
    risk_score = Column(Integer, default=0, index=True, nullable=False) # 0-100
    risk_level = Column(String(20), default="low", index=True, nullable=False) # low, moderate, high, critical
    data_completeness_score = Column(Float, default=100.0, nullable=False)

    source_name = Column(String(100), default="IPMD-OCMS", nullable=False)
    source_record_id = Column(String(100), nullable=True)
    source_updated_at = Column(DateTime, index=True, nullable=True)
    last_synced_at = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    ministry = relationship("Ministry", back_populates="projects")
    sector = relationship("Sector", back_populates="projects")
    agency = relationship("ImplementingAgency", back_populates="projects")
    monthly_snapshots = relationship("ProjectMonthlySnapshot", back_populates="project", cascade="all, delete-orphan")
    milestones = relationship("Milestone", back_populates="project", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="project", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="project", cascade="all, delete-orphan")
    interventions = relationship("Intervention", back_populates="project", cascade="all, delete-orphan")
    notes = relationship("ProjectNote", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_projects_ministry_sector", "ministry_id", "sector_id"),
        Index("ix_projects_risk_status", "risk_level", "project_status"),
    )

# -------------------------------------------------------------
# G. Project Monthly Snapshots (S-Curve Ledger)
# -------------------------------------------------------------
class ProjectMonthlySnapshot(Base):
    __tablename__ = "project_monthly_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    reporting_month = Column(String(7), index=True, nullable=False) # Format: YYYY-MM
    approved_cost_crore = Column(Numeric(14, 2), nullable=True)
    revised_cost_crore = Column(Numeric(14, 2), nullable=True)
    monthly_expenditure_crore = Column(Numeric(14, 2), default=0, nullable=False)
    cumulative_expenditure_crore = Column(Numeric(14, 2), default=0, nullable=False)
    planned_physical_progress = Column(Float, nullable=False)
    actual_physical_progress = Column(Float, nullable=False)
    planned_financial_progress = Column(Float, nullable=False)
    actual_financial_progress = Column(Float, nullable=False)
    planned_completion_date = Column(DateTime, nullable=True)
    current_completion_date = Column(DateTime, nullable=True)
    project_status = Column(String(30), nullable=True)
    monthly_remarks = Column(Text, nullable=True)
    source_updated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="monthly_snapshots")

    __table_args__ = (
        UniqueConstraint("project_id", "reporting_month", name="uq_project_reporting_month"),
        Index("ix_snapshot_project_month", "project_id", "reporting_month"),
    )

# -------------------------------------------------------------
# H. Milestones
# -------------------------------------------------------------
class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    milestone_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    planned_date = Column(DateTime, nullable=False)
    actual_date = Column(DateTime, nullable=True)
    status = Column(String(30), default="pending", index=True, nullable=False) # pending, in_progress, completed, delayed, cancelled
    delay_days = Column(Integer, default=0, nullable=False)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="milestones")

# -------------------------------------------------------------
# I. Risk Assessments
# -------------------------------------------------------------
class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    assessment_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    cost_overrun_probability = Column(Float, nullable=False) # 0.0 - 1.0
    time_overrun_probability = Column(Float, nullable=False) # 0.0 - 1.0
    implementation_risk_probability = Column(Float, nullable=False) # 0.0 - 1.0
    overall_risk_score = Column(Integer, nullable=False) # 0 - 100
    risk_level = Column(String(20), nullable=False)
    confidence_score = Column(Float, default=0.90, nullable=False)
    model_name = Column(String(100), default="PAIMANA-XGBoost-Ensemble", nullable=False)
    model_version = Column(String(50), default="v4.2", nullable=False)
    explanation_json = Column(JSONB, default=dict, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="risk_assessments")
    factors = relationship("RiskFactor", back_populates="assessment", cascade="all, delete-orphan")

# -------------------------------------------------------------
# J. Risk Factors (SHAP values)
# -------------------------------------------------------------
class RiskFactor(Base):
    __tablename__ = "risk_factors"

    id = Column(Integer, primary_key=True, index=True)
    risk_assessment_id = Column(Integer, ForeignKey("risk_assessments.id", ondelete="CASCADE"), index=True, nullable=False)
    factor_name = Column(String(150), nullable=False)
    factor_value = Column(String(100), nullable=True)
    contribution_score = Column(Float, nullable=False)
    direction = Column(String(30), default="increases_risk", nullable=False) # increases_risk, decreases_risk, neutral
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    assessment = relationship("RiskAssessment", back_populates="factors")

# -------------------------------------------------------------
# K. Alerts
# -------------------------------------------------------------
class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20), index=True, nullable=False) # informational, watch, high, critical
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    trigger_value = Column(Float, nullable=True)
    threshold_value = Column(Float, nullable=True)
    status = Column(String(30), default="open", index=True, nullable=False) # open, acknowledged, in_review, resolved, dismissed, reopened
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    acknowledged_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="alerts")
    interventions = relationship("Intervention", back_populates="alert")

    __table_args__ = (
        Index("ix_alerts_status_severity", "status", "severity"),
    )

# -------------------------------------------------------------
# L. Interventions (Cabinet PMG)
# -------------------------------------------------------------
class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    alert_id = Column(Integer, ForeignKey("alerts.id", ondelete="SET NULL"), nullable=True)
    action_type = Column(String(100), nullable=False)
    recommendation = Column(Text, nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(30), default="not_started", index=True, nullable=False) # not_started, under_review, action_initiated, awaiting_update, resolved, closed
    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="interventions")
    alert = relationship("Alert", back_populates="interventions")

# -------------------------------------------------------------
# M. Project Notes
# -------------------------------------------------------------
class ProjectNote(Base):
    __tablename__ = "project_notes"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    note_text = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="notes")
    author = relationship("User", back_populates="notes")

# -------------------------------------------------------------
# N. Documents
# -------------------------------------------------------------
class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False)
    checksum = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="documents")

# -------------------------------------------------------------
# O. Model Versions
# -------------------------------------------------------------
class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    model_type = Column(String(50), nullable=False)
    version = Column(String(50), unique=True, nullable=False)
    feature_list_json = Column(JSONB, default=list, nullable=False)
    metrics_json = Column(JSONB, default=dict, nullable=False)
    model_file_path = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=False, nullable=False)
    trained_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

# -------------------------------------------------------------
# P. Reports
# -------------------------------------------------------------
class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_name = Column(String(255), nullable=False)
    report_type = Column(String(50), nullable=False) # monthly_flash, executive_dossier, sector_deep_dive, cost_escalation
    generated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    filters_json = Column(JSONB, default=dict, nullable=False)
    reporting_month = Column(String(7), nullable=False)
    file_path = Column(String(500), nullable=True)
    status = Column(String(30), default="completed", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    creator = relationship("User", back_populates="reports")

# -------------------------------------------------------------
# Q. Audit Logs (Immutable Security Log)
# -------------------------------------------------------------
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    action = Column(String(100), index=True, nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(100), nullable=True)
    old_values_json = Column(JSONB, nullable=True)
    new_values_json = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    user = relationship("User", back_populates="audit_logs")
