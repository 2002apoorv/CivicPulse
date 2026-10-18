from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from server.app.database.session import get_db
from server.app.models.complaint import Complaint, ComplaintStatus, PriorityLevel
from server.app.models.cluster import ComplaintCluster, ClusterStatus
from server.app.models.department import Department
from server.app.models.user import User
from server.app.schemas.analytics import (
    DashboardKPIs, TrendPoint, CategoryBreakdown, StatusBreakdown,
    PriorityBreakdown, LocalityHotspot, DepartmentWorkloadItem, CivicInsight
)
from server.app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Dashboard & Analytics"])

@router.get("/summary", response_model=DashboardKPIs)
def get_dashboard_summary_kpis(
    days: int = Query(30, ge=1, le=365),
    category: Optional[str] = None,
    locality: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compute live dashboard KPIs from persistent database records."""
    since_date = datetime.utcnow() - timedelta(days=days)
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    base_query = db.query(Complaint).filter(Complaint.created_at >= since_date)
    if category:
        base_query = base_query.filter(Complaint.category == category)
    if locality:
        base_query = base_query.filter(Complaint.locality.ilike(f"%{locality.strip()}%"))

    total_count = base_query.count()
    today_count = db.query(Complaint).filter(Complaint.created_at >= today_start).count()

    open_statuses = [
        ComplaintStatus.SUBMITTED,
        ComplaintStatus.UNDER_REVIEW,
        ComplaintStatus.ASSIGNED,
        ComplaintStatus.IN_PROGRESS
    ]
    open_count = base_query.filter(Complaint.status.in_(open_statuses)).count()
    resolved_count = base_query.filter(Complaint.status.in_([ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED])).count()

    # Resolution rate
    resolution_rate = round((resolved_count / total_count * 100.0), 1) if total_count > 0 else 0.0

    # Average resolution time in hours
    resolved_complaints = base_query.filter(
        Complaint.status.in_([ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]),
        Complaint.resolved_at.isnot(None)
    ).all()

    avg_resolution_hours = 0.0
    if resolved_complaints:
        total_seconds = sum((c.resolved_at - c.created_at).total_seconds() for c in resolved_complaints)
        avg_resolution_hours = round(total_seconds / (len(resolved_complaints) * 3600.0), 1)

    # High / Critical Priority count
    high_priority_count = base_query.filter(
        Complaint.priority.in_([PriorityLevel.HIGH, PriorityLevel.CRITICAL])
    ).count()

    # Duplicate / clustered report count
    duplicate_count = base_query.filter(Complaint.cluster_id.isnot(None)).count()

    # Active clusters
    active_clusters_count = db.query(ComplaintCluster).filter(
        ComplaintCluster.status.in_([ClusterStatus.CANDIDATE, ClusterStatus.CONFIRMED])
    ).count()

    return DashboardKPIs(
        total_complaints=total_count,
        complaints_today=today_count,
        open_complaints=open_count,
        resolved_complaints=resolved_count,
        resolution_rate_percent=resolution_rate,
        avg_resolution_time_hours=avg_resolution_hours,
        high_priority_count=high_priority_count,
        potential_duplicate_count=duplicate_count,
        active_clusters_count=active_clusters_count
    )

@router.get("/trends", response_model=List[TrendPoint])
def get_complaint_trends(
    days: int = Query(14, ge=7, le=90),
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate daily time-series of submitted versus resolved complaints."""
    start_date = datetime.utcnow().date() - timedelta(days=days - 1)
    
    # Pre-populate map of days
    trend_map = {}
    for i in range(days):
        d = start_date + timedelta(days=i)
        d_str = d.strftime("%b %d")
        trend_map[d.isoformat()] = {"date": d_str, "submitted": 0, "resolved": 0}

    # Query submitted
    query_sub = db.query(Complaint).filter(Complaint.created_at >= datetime.combine(start_date, datetime.min.time()))
    if category:
        query_sub = query_sub.filter(Complaint.category == category)

    for c in query_sub.all():
        c_date = c.created_at.date().isoformat()
        if c_date in trend_map:
            trend_map[c_date]["submitted"] += 1

    # Query resolved
    query_res = db.query(Complaint).filter(
        Complaint.resolved_at >= datetime.combine(start_date, datetime.min.time()),
        Complaint.resolved_at.isnot(None)
    )
    if category:
        query_res = query_res.filter(Complaint.category == category)

    for c in query_res.all():
        if c.resolved_at:
            r_date = c.resolved_at.date().isoformat()
            if r_date in trend_map:
                trend_map[r_date]["resolved"] += 1

    return [TrendPoint(**item) for item in sorted(trend_map.values(), key=lambda x: x["date"])]

@router.get("/categories", response_model=List[CategoryBreakdown])
def get_category_breakdown(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aggregate complaint volume and percentage across all civic categories."""
    since_date = datetime.utcnow() - timedelta(days=days)
    results = db.query(
        Complaint.category,
        func.count(Complaint.id).label("count")
    ).filter(Complaint.created_at >= since_date)\
     .group_by(Complaint.category)\
     .order_by(desc("count")).all()

    total = sum(r[1] for r in results) or 1
    return [
        CategoryBreakdown(
            category=r[0],
            count=r[1],
            percentage=round((r[1] / total) * 100.0, 1)
        )
        for r in results
    ]

@router.get("/status", response_model=List[StatusBreakdown])
def get_status_breakdown(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Breakdown of complaints by lifecycle status."""
    since_date = datetime.utcnow() - timedelta(days=days)
    results = db.query(
        Complaint.status,
        func.count(Complaint.id).label("count")
    ).filter(Complaint.created_at >= since_date)\
     .group_by(Complaint.status)\
     .order_by(desc("count")).all()

    total = sum(r[1] for r in results) or 1
    return [
        StatusBreakdown(
            status=r[0].value if hasattr(r[0], "value") else str(r[0]),
            count=r[1],
            percentage=round((r[1] / total) * 100.0, 1)
        )
        for r in results
    ]

@router.get("/priorities", response_model=List[PriorityBreakdown])
def get_priority_breakdown(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Breakdown of complaints by priority tier."""
    since_date = datetime.utcnow() - timedelta(days=days)
    results = db.query(
        Complaint.priority,
        func.count(Complaint.id).label("count")
    ).filter(Complaint.created_at >= since_date)\
     .group_by(Complaint.priority)\
     .order_by(desc("count")).all()

    total = sum(r[1] for r in results) or 1
    return [
        PriorityBreakdown(
            priority=r[0].value if hasattr(r[0], "value") else str(r[0]),
            count=r[1],
            percentage=round((r[1] / total) * 100.0, 1)
        )
        for r in results
    ]

@router.get("/localities", response_model=List[LocalityHotspot])
def get_locality_hotspots(
    limit: int = Query(8, ge=3, le=20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Identify top reporting localities with high-priority grievance concentrations."""
    results = db.query(
        Complaint.locality,
        func.count(Complaint.id).label("count"),
        func.avg(Complaint.latitude).label("avg_lat"),
        func.avg(Complaint.longitude).label("avg_lon")
    ).filter(Complaint.locality.isnot(None))\
     .group_by(Complaint.locality)\
     .order_by(desc("count"))\
     .limit(limit).all()

    hotspots = []
    for r in results:
        loc_name = r[0]
        high_prio_count = db.query(Complaint).filter(
            Complaint.locality == loc_name,
            Complaint.priority.in_([PriorityLevel.HIGH, PriorityLevel.CRITICAL])
        ).count()

        hotspots.append(
            LocalityHotspot(
                locality=loc_name,
                count=r[1],
                high_priority_count=high_prio_count,
                latitude=round(r[2], 6) if r[2] is not None else None,
                longitude=round(r[3], 6) if r[3] is not None else None
            )
        )

    return hotspots

@router.get("/departments", response_model=List[DepartmentWorkloadItem])
def get_department_workload(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Department-wise complaint workload and average resolution times."""
    depts = db.query(Department).filter(Department.is_active == True).all()
    open_statuses = [
        ComplaintStatus.SUBMITTED,
        ComplaintStatus.UNDER_REVIEW,
        ComplaintStatus.ASSIGNED,
        ComplaintStatus.IN_PROGRESS
    ]

    items = []
    for d in depts:
        open_c = db.query(Complaint).filter(
            Complaint.assigned_department_id == d.id,
            Complaint.status.in_(open_statuses)
        ).count()

        resolved_records = db.query(Complaint).filter(
            Complaint.assigned_department_id == d.id,
            Complaint.status.in_([ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]),
            Complaint.resolved_at.isnot(None)
        ).all()

        avg_hours = 0.0
        if resolved_records:
            total_sec = sum((c.resolved_at - c.created_at).total_seconds() for c in resolved_records)
            avg_hours = round(total_sec / (len(resolved_records) * 3600.0), 1)

        items.append(
            DepartmentWorkloadItem(
                department_id=d.id,
                department_name=d.name,
                open_tickets=open_c,
                resolved_tickets=len(resolved_records),
                avg_resolution_hours=avg_hours
            )
        )

    return items

@router.get("/insights", response_model=List[CivicInsight])
def get_data_grounded_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate transparent, data-grounded civic insights based on live counts.
    Strictly factual; no hallucinated claims or causal extrapolations.
    """
    insights: List[CivicInsight] = []

    # 1. Top Category Surge
    top_cat = db.query(
        Complaint.category,
        func.count(Complaint.id).label("c")
    ).group_by(Complaint.category).order_by(desc("c")).first()

    if top_cat:
        insights.append(
            CivicInsight(
                id="top-category-surge",
                type="surge",
                title=f"High Volume Category: {top_cat[0]}",
                description=f"{top_cat[0]} represents {top_cat[1]} complaints across the municipality.",
                metric_value=f"{top_cat[1]} tickets",
                severity="warning" if top_cat[1] >= 15 else "info",
                suggested_action=f"Review crew allocations with {top_cat[0]} division."
            )
        )

    # 2. Critical Cluster Alert
    top_cluster = db.query(ComplaintCluster).filter(
        ComplaintCluster.status.in_([ClusterStatus.CANDIDATE, ClusterStatus.CONFIRMED])
    ).order_by(desc(ComplaintCluster.complaint_count)).first()

    if top_cluster:
        insights.append(
            CivicInsight(
                id="cluster-concentration",
                type="cluster",
                title=f"Active Recurring Cluster: {top_cluster.title}",
                description=f"{top_cluster.complaint_count} citizen reports grouped by semantic and spatial proximity. Priority score: {top_cluster.priority_score}.",
                metric_value=f"{top_cluster.complaint_count} reports",
                severity="critical" if top_cluster.priority_score >= 70.0 else "warning",
                suggested_action="Review cluster in AI Cluster Center to approve collective remediation."
            )
        )

    # 3. High Priority Unresolved Backlog
    high_prio_open = db.query(Complaint).filter(
        Complaint.priority.in_([PriorityLevel.HIGH, PriorityLevel.CRITICAL]),
        Complaint.status.in_([ComplaintStatus.SUBMITTED, ComplaintStatus.UNDER_REVIEW, ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS])
    ).count()

    if high_prio_open > 0:
        insights.append(
            CivicInsight(
                id="high-priority-backlog",
                type="bottleneck",
                title="Elevated Priority Grievances Pending Resolution",
                description=f"There are currently {high_prio_open} high or critical priority grievances open.",
                metric_value=f"{high_prio_open} open",
                severity="critical" if high_prio_open >= 5 else "warning",
                suggested_action="Expedite dispatch for critical electrical and drainage complaints."
            )
        )

    # 4. Top Locality Hotspot
    top_loc = db.query(
        Complaint.locality,
        func.count(Complaint.id).label("c")
    ).filter(Complaint.locality.isnot(None))\
     .group_by(Complaint.locality).order_by(desc("c")).first()

    if top_loc:
        insights.append(
            CivicInsight(
                id="locality-hotspot",
                type="hotspot",
                title=f"Geographic Hotspot: {top_loc[0]}",
                description=f"{top_loc[0]} has recorded {top_loc[1]} total civic reports.",
                metric_value=f"{top_loc[1]} reports",
                severity="warning" if top_loc[1] >= 10 else "info",
                suggested_action=f"Inspect infrastructure corridors in {top_loc[0]}."
            )
        )

    return insights
