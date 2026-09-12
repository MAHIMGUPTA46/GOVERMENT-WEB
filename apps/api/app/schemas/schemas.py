from datetime import datetime
from typing import Optional, List, Dict, Any, Generic, TypeVar
from pydantic import BaseModel, EmailStr, Field, ConfigDict

T = TypeVar('T')

class PaginationMetadata(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int

class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    pagination: PaginationMetadata
    filters: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)

# -------------------------------------------------------------
# User Schemas
# -------------------------------------------------------------
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role_id: int
    ministry_id: Optional[int] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(min_length=8)

class UserResponse(UserBase):
    id: int
    last_login_at: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    expires_in: int = 86400

# -------------------------------------------------------------
# Project Schemas
# -------------------------------------------------------------
class ProjectBase(BaseModel):
    project_code: str
    project_name: str
    description: Optional[str] = None
    ministry_id: int
    sector_id: int
    implementing_agency_id: int
    state: str
    district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    original_cost_crore: float = Field(ge=0)
    revised_cost_crore: float = Field(ge=0)
    cumulative_expenditure_crore: float = Field(default=0, ge=0)
    original_start_date: Optional[datetime] = None
    original_completion_date: datetime
    current_completion_date: datetime
    project_status: str = "ongoing"
    physical_progress_percentage: float = Field(ge=0, le=100)
    financial_progress_percentage: float = Field(ge=0, le=100)
    risk_score: int = Field(ge=0, le=100)
    risk_level: str = "low"
    data_completeness_score: float = Field(default=100.0, ge=0, le=100)

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    revised_cost_crore: Optional[float] = Field(None, ge=0)
    cumulative_expenditure_crore: Optional[float] = Field(None, ge=0)
    current_completion_date: Optional[datetime] = None
    project_status: Optional[str] = None
    physical_progress_percentage: Optional[float] = Field(None, ge=0, le=100)
    financial_progress_percentage: Optional[float] = Field(None, ge=0, le=100)
    risk_score: Optional[int] = Field(None, ge=0, le=100)
    risk_level: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    source_name: str
    last_synced_at: datetime
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# -------------------------------------------------------------
# Monthly Snapshot Schemas
# -------------------------------------------------------------
class MonthlySnapshotResponse(BaseModel):
    id: int
    project_id: int
    reporting_month: str
    approved_cost_crore: Optional[float]
    revised_cost_crore: Optional[float]
    monthly_expenditure_crore: float
    cumulative_expenditure_crore: float
    planned_physical_progress: float
    actual_physical_progress: float
    planned_financial_progress: float
    actual_financial_progress: float
    project_status: Optional[str]
    monthly_remarks: Optional[str]
    model_config = ConfigDict(from_attributes=True)

# -------------------------------------------------------------
# Milestone Schemas
# -------------------------------------------------------------
class MilestoneResponse(BaseModel):
    id: int
    project_id: int
    milestone_name: str
    planned_date: datetime
    actual_date: Optional[datetime]
    status: str
    delay_days: int
    remarks: Optional[str]
    model_config = ConfigDict(from_attributes=True)

# -------------------------------------------------------------
# Alert & Intervention Schemas
# -------------------------------------------------------------
class AlertResponse(BaseModel):
    id: int
    project_id: int
    alert_type: str
    severity: str
    title: str
    description: str
    status: str
    created_at: datetime
    acknowledged_at: Optional[datetime]
    model_config = ConfigDict(from_attributes=True)

class InterventionResponse(BaseModel):
    id: int
    project_id: int
    alert_id: Optional[int]
    action_type: str
    recommendation: str
    status: str
    due_date: Optional[datetime]
    remarks: Optional[str]
    model_config = ConfigDict(from_attributes=True)

# -------------------------------------------------------------
# Dashboard Summary Schemas
# -------------------------------------------------------------
class DashboardSummaryResponse(BaseModel):
    total_projects: int
    delayed_projects: int
    critical_risk_projects: int
    high_risk_projects: int
    total_original_cost_crore: float
    total_anticipated_cost_crore: float
    net_cost_escalation_crore: float
    net_cost_escalation_percentage: float
    total_cumulative_expenditure_crore: float
    overall_physical_progress: float
    overall_financial_progress: float
    active_alerts: int
    open_interventions: int
