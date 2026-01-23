from typing import Optional, List, Dict, Any
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from app.repositories.base_repo import BaseRepository
from app.models.promoter_activity import PromoterActivity
from app.models.campaign import Campaign

class PromoterActivityRepository(BaseRepository):
    """Repository for PromoterActivity with specialized queries"""
    
    def __init__(self):
        super().__init__(PromoterActivity)
    
    async def get_with_campaign_info(self, db: AsyncSession, activity_id: int):
        """Get activity with campaign name joined"""
        query = (
            select(
                PromoterActivity,
                Campaign.name.label('campaign_name')
            )
            .join(Campaign, PromoterActivity.campaign_id == Campaign.id)
            .where(
                PromoterActivity.id == activity_id,
                PromoterActivity.is_active == 1
            )
        )
        result = await db.execute(query)
        row = result.first()
        
        if row:
            activity = row[0]
            # Add campaign_name as attribute
            activity.campaign_name = row[1]
            return activity
        return None
    
    async def get_filtered_activities(
        self,
        db: AsyncSession,
        campaign_id: Optional[int] = None,
        promoter_id: Optional[int] = None,
        village_name: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        language: Optional[str] = None,
        limit: int = 100
    ) -> List[PromoterActivity]:
        """Get activities with multiple filter options"""
        
        query = select(PromoterActivity).where(PromoterActivity.is_active == 1)
        
        if campaign_id:
            query = query.where(PromoterActivity.campaign_id == campaign_id)
        
        if promoter_id:
            query = query.where(PromoterActivity.promoter_id == promoter_id)
        
        if village_name:
            query = query.where(PromoterActivity.village_name.ilike(f"%{village_name}%"))
        
        if date_from:
            query = query.where(PromoterActivity.activity_date >= date_from)
        
        if date_to:
            query = query.where(PromoterActivity.activity_date <= date_to)
        
        if language:
            query = query.where(PromoterActivity.language.ilike(f"%{language}%"))
        
        query = query.order_by(PromoterActivity.activity_date.desc()).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_activity_stats(self, db: AsyncSession, campaign_id: Optional[int] = None) -> Dict[str, Any]:
        """Get aggregated statistics for activities"""
        
        query = select(
            func.count(PromoterActivity.id).label('total_activities'),
            func.sum(PromoterActivity.people_attended).label('total_people_reached'),
            func.count(func.distinct(PromoterActivity.village_name)).label('total_villages'),
            func.count(func.distinct(PromoterActivity.promoter_id)).label('active_promoters'),
            func.avg(PromoterActivity.people_attended).label('avg_attendance')
        ).where(PromoterActivity.is_active == 1)
        
        if campaign_id:
            query = query.where(PromoterActivity.campaign_id == campaign_id)
        
        result = await db.execute(query)
        row = result.first()
        
        return {
            'total_activities': row.total_activities or 0,
            'total_people_reached': int(row.total_people_reached or 0),
            'total_villages': row.total_villages or 0,
            'active_promoters': row.active_promoters or 0,
            'avg_attendance_per_activity': round(float(row.avg_attendance or 0), 2)
        }
    
    async def get_activities_by_campaign(self, db: AsyncSession, campaign_id: int) -> List[PromoterActivity]:
        """Get all activities for a specific campaign"""
        return await self.get_filtered_activities(db, campaign_id=campaign_id)
    
    async def get_activities_by_village(self, db: AsyncSession, village_name: str) -> List[PromoterActivity]:
        """Get all activities in a specific village"""
        return await self.get_filtered_activities(db, village_name=village_name)
    
    async def get_recent_activities(self, db: AsyncSession, days: int = 30, limit: int = 50):
        """Get recent activities within specified days"""
        from datetime import datetime, timedelta
        date_from = datetime.now().date() - timedelta(days=days)
        return await self.get_filtered_activities(db, date_from=date_from, limit=limit)
    
    async def update_media(
        self,
        db: AsyncSession,
        activity_id: int,
        before_image: Optional[str] = None,
        during_image: Optional[str] = None,
        after_image: Optional[str] = None,
        activity_video: Optional[str] = None
    ):
        """Update activity images and video"""
        update_data = {}
        if before_image is not None:
            update_data['before_image'] = before_image
        if during_image is not None:
            update_data['during_image'] = during_image
        if after_image is not None:
            update_data['after_image'] = after_image
        if activity_video is not None:
            update_data['activity_video'] = activity_video
        if update_data:
            return await self.update(db, activity_id, update_data)
        return await self.get_by_id(db, activity_id)
