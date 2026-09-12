import asyncio
import os
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .session import AsyncSessionLocal, engine
from ..models.entities import (
    Role, User, Ministry, Sector, ImplementingAgency, Project, 
    ProjectMonthlySnapshot, Milestone, RiskAssessment, RiskFactor, 
    Alert, Intervention, AuditLog
)
from ..core.security import get_password_hash

async def seed_database():
    async with AsyncSessionLocal() as session:
        print("🌱 Starting PAIMANA AI Database Seeder...")

        # 1. Seed Roles
        roles_data = [
            ("super_admin", "National System Administrator with unrestricted root access", ["*"]),
            ("ministry_admin", "Administrative lead for specific nodal Ministry", ["projects:write", "reports:read", "alerts:acknowledge"]),
            ("monitoring_officer", "IPMD Project Inspection Officer", ["projects:update", "milestones:update", "alerts:write"]),
            ("analyst", "Data Scientist & Quantitative Policy Analyst", ["analytics:read", "models:execute", "reports:generate"]),
            ("executive_viewer", "Cabinet Secretariat & PMG High-Level Read-Only Viewer", ["dashboard:read", "projects:read", "interventions:read"]),
            ("demo_user", "Public Demonstration Sandbox Profile", ["dashboard:read", "projects:read"])
        ]
        
        role_objs = {}
        for name, desc, perms in roles_data:
            role = Role(name=name, description=desc, permissions_json=perms)
            session.add(role)
            await session.flush()
            role_objs[name] = role.id

        # 2. Seed Ministries (12)
        ministries_data = [
            ("MoRTH", "Ministry of Road Transport and Highways"),
            ("MoR", "Ministry of Railways"),
            ("MoPNG", "Ministry of Petroleum and Natural Gas"),
            ("MoP", "Ministry of Power"),
            ("MoC", "Ministry of Coal"),
            ("MoS", "Ministry of Steel"),
            ("MoCA", "Ministry of Civil Aviation"),
            ("MoPSW", "Ministry of Ports, Shipping and Waterways"),
            ("MoHUA", "Ministry of Housing and Urban Affairs"),
            ("MoJS", "Ministry of Jal Shakti"),
            ("MoComm", "Ministry of Communications"),
            ("MoHFW", "Ministry of Health and Family Welfare"),
        ]
        min_ids = []
        for code, name in ministries_data:
            m = Ministry(code=code, name=name, is_active=True)
            session.add(m)
            await session.flush()
            min_ids.append(m.id)

        # 3. Seed Sectors (15)
        sectors_data = [
            ("RAIL", "Railways"),
            ("ROADS", "Roads and Highways"),
            ("PETRO", "Petroleum and Natural Gas"),
            ("POWER", "Power and Renewable Energy"),
            ("COAL", "Coal"),
            ("STEEL", "Steel"),
            ("AVIATION", "Civil Aviation"),
            ("PORTS", "Ports and Inland Waterways"),
            ("URBAN", "Urban Infrastructure and Metro"),
            ("WATER", "Water Resources and Sanitation"),
            ("TELECOM", "Telecommunications"),
            ("HEALTH", "Health and Social Infrastructure"),
            ("MINING", "Mines and Minerals"),
            ("LOGISTICS", "Multi-Modal Logistics Parks"),
            ("ATOMIC", "Atomic Energy"),
        ]
        sec_ids = []
        for code, name in sectors_data:
            s = Sector(code=code, name=name, is_active=True)
            session.add(s)
            await session.flush()
            sec_ids.append(s.id)

        # 4. Seed Implementing Agencies (20)
        agencies_data = [
            ("NHAI", "National Highways Authority of India", min_ids[0]),
            ("RVNL", "Rail Vikas Nigam Limited", min_ids[1]),
            ("DFCCIL", "Dedicated Freight Corridor Corp of India", min_ids[1]),
            ("ONGC", "Oil and Natural Gas Corporation", min_ids[2]),
            ("IOCL", "Indian Oil Corporation Limited", min_ids[2]),
            ("NTPC", "NTPC Limited", min_ids[3]),
            ("PGCIL", "Power Grid Corporation of India", min_ids[3]),
            ("CIL", "Coal India Limited", min_ids[4]),
            ("SAIL", "Steel Authority of India Limited", min_ids[5]),
            ("AAI", "Airports Authority of India", min_ids[6]),
            ("JNPA", "Jawaharlal Nehru Port Authority", min_ids[7]),
            ("DMRC", "Delhi Metro Rail Corporation", min_ids[8]),
            ("MMRDA", "Mumbai Metro Region Dev Authority", min_ids[8]),
            ("NWDA", "National Water Development Agency", min_ids[9]),
            ("BSNL", "Bharat Sanchar Nigam Limited", min_ids[10]),
            ("AIIMS_ENG", "AIIMS Engineering Wing", min_ids[11]),
            ("NMDC", "National Mineral Dev Corp", min_ids[5]),
            ("CONCOR", "Container Corporation of India", min_ids[1]),
            ("NPCIL", "Nuclear Power Corp of India", min_ids[3]),
            ("BRO", "Border Roads Organisation", min_ids[0]),
        ]
        ag_ids = []
        for code, name, m_id in agencies_data:
            a = ImplementingAgency(agency_code=code, name=name, ministry_id=m_id, is_active=True)
            session.add(a)
            await session.flush()
            ag_ids.append(a.id)

        # 5. Seed Users (Demo users with bcrypt hashed passwords)
        demo_pwd = get_password_hash("Demo@Gov2026!")
        users_data = [
            ("Dr. Rajiv Malhotra, IAS", "admin@example.gov.in", role_objs["super_admin"], min_ids[0]),
            ("Vikramaditya Sen", "analyst@example.gov.in", role_objs["analyst"], min_ids[1]),
            ("Priya Sundaram", "officer@example.gov.in", role_objs["monitoring_officer"], min_ids[0]),
            ("Shri N. K. Singh", "viewer@example.gov.in", role_objs["executive_viewer"], min_ids[8]),
        ]
        user_ids = []
        for name, email, r_id, m_id in users_data:
            u = User(full_name=name, email=email, password_hash=demo_pwd, role_id=r_id, ministry_id=m_id, is_active=True)
            session.add(u)
            await session.flush()
            user_ids.append(u.id)

        # 6. Seed Projects (105 projects, >= 150 Crore)
        states = ["Maharashtra", "Gujarat", "Assam", "Odisha", "Jammu & Kashmir", "Tamil Nadu", "Karnataka", "Uttar Pradesh", "Bihar"]
        proj_ids = []

        print("📦 Inserting 105 Infrastructure Projects...")
        for i in range(1, 106):
            orig_cost = Decimal(str(450 + (i * 135) % 17500))
            drift = Decimal(str(1 + ((i * 7) % 45) / 100))
            rev_cost = orig_cost * drift
            progress = float(min(96, max(14, (i * 11) % 92)))
            exp = rev_cost * Decimal(str(progress / 100 * 0.94))
            delay_months = int((i * 5) % 36)
            
            risk_score = min(94, max(18, int((float(drift) - 1) * 100 + (100 - progress) * 0.35 + (i % 20))))
            risk_lvl = "critical" if risk_score >= 75 else "high" if risk_score >= 55 else "moderate" if risk_score >= 35 else "low"

            p = Project(
                project_code=f"P-{1000 + i}",
                project_name=f"National Priority Infrastructure Asset - Package {i}",
                description=f"Mega infrastructure project costing ₹{orig_cost} Cr executed under National Infrastructure Pipeline (NIP).",
                ministry_id=min_ids[i % len(min_ids)],
                sector_id=sec_ids[i % len(sec_ids)],
                implementing_agency_id=ag_ids[i % len(ag_ids)],
                state=states[i % len(states)],
                district="Central Administrative Division",
                latitude=20.59 + (i % 10),
                longitude=78.96 + (i % 12),
                original_cost_crore=orig_cost,
                revised_cost_crore=rev_cost,
                cumulative_expenditure_crore=exp,
                original_start_date=datetime(2022, 4, 1),
                original_completion_date=datetime(2026, 3, 31),
                current_completion_date=datetime(2026, 3, 31) + timedelta(days=delay_months * 30),
                project_status="delayed" if delay_months > 18 else "ongoing",
                physical_progress_percentage=progress,
                financial_progress_percentage=float(exp / rev_cost * 100),
                risk_score=risk_score,
                risk_level=risk_lvl,
                data_completeness_score=100.0,
                source_name="IPMD-OCMS"
            )
            session.add(p)
            await session.flush()
            proj_ids.append(p.id)

            # Monthly snapshots (12 per project)
            for m in range(1, 13):
                m_str = f"2025-{m:02d}"
                plan_phys = min(100.0, float((m / 12) * (progress + delay_months)))
                act_phys = min(progress, float((m / 12) * progress))
                snap = ProjectMonthlySnapshot(
                    project_id=p.id,
                    reporting_month=m_str,
                    approved_cost_crore=orig_cost,
                    revised_cost_crore=rev_cost,
                    monthly_expenditure_crore=Decimal(str(round(float(exp) / 12, 2))),
                    cumulative_expenditure_crore=Decimal(str(round(float(exp) * (m / 12), 2))),
                    planned_physical_progress=plan_phys,
                    actual_physical_progress=act_phys,
                    planned_financial_progress=float(m / 12 * 85),
                    actual_financial_progress=float(m / 12 * float(exp / rev_cost * 100)),
                    project_status=p.project_status,
                    monthly_remarks=f"Verified against field engineer audit."
                )
                session.add(snap)

            # Milestones (3 per project)
            for ms_idx, ms_title in enumerate(["DPR Approval & Land RoW Award", "EPC Works Execution", "Trial Runs & Commercial COD"]):
                ms = Milestone(
                    project_id=p.id,
                    milestone_name=f"{ms_title} (Pkg {i})",
                    planned_date=datetime(2023 + ms_idx, 6, 30),
                    actual_date=datetime(2023 + ms_idx, 8, 15) if ms_idx < 2 else None,
                    status="completed" if ms_idx < 2 else "in_progress",
                    delay_days=45 * ms_idx,
                )
                session.add(ms)

            # Risk Assessment & Factors
            ra = RiskAssessment(
                project_id=p.id,
                assessment_date=datetime(2026, 8, 31),
                cost_overrun_probability=min(0.99, max(0.1, risk_score / 100.0)),
                time_overrun_probability=min(0.99, max(0.15, delay_months / 36.0)),
                implementation_risk_probability=0.45,
                overall_risk_score=risk_score,
                risk_level=risk_lvl,
                confidence_score=0.91,
                model_name="PAIMANA-Ensemble-XGBoost",
                model_version="v4.2",
                explanation_json={"top_features": ["land_row_delay", "monsoon_stoppage", "steel_cement_wpi"]}
            )
            session.add(ra)
            await session.flush()

            session.add(RiskFactor(
                risk_assessment_id=ra.id,
                factor_name="Right-of-Way (RoW) Clearance",
                factor_value=f"{delay_months} Months Delay",
                contribution_score=18.4,
                direction="increases_risk",
                description="Statutory environmental and forest handover pending"
            ))

            # Alert
            if risk_score >= 55:
                alt = Alert(
                    project_id=p.id,
                    alert_type="schedule_delay_prediction",
                    severity="critical" if risk_score >= 75 else "high",
                    title=f"Critical Anomaly Detected: P-{1000 + i}",
                    description=f"Model detected milestone slippage risk score of {risk_score}/100.",
                    status="open",
                    assigned_to=user_ids[2]
                )
                session.add(alt)
                await session.flush()

                # Intervention
                if risk_score >= 75:
                    intv = Intervention(
                        project_id=p.id,
                        alert_id=alt.id,
                        action_type="Cabinet PMG Fast-Track",
                        recommendation=f"Convene tri-partite session with State Chief Secretary.",
                        assigned_to=user_ids[0],
                        status="action_initiated",
                        due_date=datetime(2026, 9, 30)
                    )
                    session.add(intv)

        # Audit Log
        session.add(AuditLog(
            user_id=user_ids[0],
            action="DATABASE_SEED",
            entity_type="database",
            entity_id="paimana_ai",
            details="Seeded complete production database with 105 projects and 1,260 monthly snapshots."
        ))

        await session.commit()
        print("✅ Database seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_database())
