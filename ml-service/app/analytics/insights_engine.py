"""
ML Insights Engine - Provides analytics and decision support
Admin-only service for business insights with AI-powered recommendations
"""
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from pydantic import BaseModel
import numpy as np
from collections import defaultdict
import os
import json
from openai import AsyncOpenAI


class CampaignInsight(BaseModel):
    campaign_id: Optional[int] = None
    campaign_name: Optional[str] = None
    performance_score: float
    budget_utilization: float
    roi_estimate: float
    recommendations: List[str]
    alerts: List[str]
    trend: str  # "improving", "declining", "stable"


class ExpenseAnomaly(BaseModel):
    expense_id: int
    expense_type: str
    amount: float
    expected_range: Dict[str, float]
    anomaly_score: float
    reason: str


class UtilizationInsight(BaseModel):
    entity_type: str  # "vehicle" or "driver"
    entity_id: int
    entity_name: str
    utilization_rate: float
    idle_time_percentage: float
    recommendations: List[str]


class VendorPerformance(BaseModel):
    vendor_id: int
    vendor_name: str
    reliability_score: float
    avg_delivery_time: float
    cost_efficiency: float
    recommendations: List[str]


class InsightsEngine:
    """
    ML-powered insights engine for fleet operations
    Provides analytics, anomaly detection, and AI-powered recommendations
    """
    
    def __init__(self):
        self.initialized = True
        # Initialize OpenAI client (optional - falls back to rules if not configured)
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.use_ai = bool(self.openai_api_key)
        if self.use_ai:
            self.ai_client = AsyncOpenAI(api_key=self.openai_api_key)
            print("✅ AI-powered recommendations enabled (OpenAI)")
        else:
            self.ai_client = None
            print("⚠️ AI recommendations disabled - using rule-based system (set OPENAI_API_KEY to enable)")
    
    # ============================================================
    # CAMPAIGN INSIGHTS
    # ============================================================
    
    async def analyze_campaign_performance(
        self, 
        campaigns_data: List[Dict[str, Any]]
    ) -> List[CampaignInsight]:
        """
        Analyze campaign performance and provide recommendations
        
        Args:
            campaigns_data: List of campaign dictionaries with budget, expenses, etc.
        
        Returns:
            List of campaign insights with scores and recommendations
        """
        insights = []
        
        for campaign in campaigns_data:
            try:
                # Calculate performance metrics
                budget = float(campaign.get('budget', 0))
                total_expenses = float(campaign.get('total_expenses', 0))
                
                # Budget utilization
                budget_utilization = (total_expenses / budget * 100) if budget > 0 else 0
                
                # Performance score (0-100) based on various factors
                performance_score = self._calculate_performance_score(campaign)
                
                # ROI estimate
                roi_estimate = self._estimate_roi(campaign)
                
                # Generate recommendations
                recommendations = await self._generate_campaign_recommendations(
                    campaign, 
                    budget_utilization, 
                    performance_score
                )
                                # Ensure recommendations is always a list
                if not isinstance(recommendations, list):
                    recommendations = []
                                # Generate alerts
                alerts = self._generate_campaign_alerts(campaign, budget_utilization)
                
                # Determine trend
                trend = self._determine_trend(campaign)
                
                insights.append(CampaignInsight(
                    campaign_id=campaign.get('id'),
                    campaign_name=campaign.get('name', 'Unknown'),
                    performance_score=round(performance_score, 2),
                    budget_utilization=round(budget_utilization, 2),
                    roi_estimate=round(roi_estimate, 2),
                    recommendations=recommendations,
                    alerts=alerts,
                    trend=trend
                ))
            except Exception as e:
                print(f"Error analyzing campaign {campaign.get('id')}: {str(e)}")
                continue
        
        return insights
    
    def _calculate_performance_score(self, campaign: Dict[str, Any]) -> float:
        """Calculate overall campaign performance score (0-100)"""
        score = 50.0  # Base score
        
        # Budget management (max 30 points)
        budget = float(campaign.get('budget', 0))
        expenses = float(campaign.get('total_expenses', 0))
        if budget > 0:
            utilization = (expenses / budget) * 100
            if 70 <= utilization <= 95:
                score += 30
            elif 50 <= utilization < 70:
                score += 20
            elif 95 < utilization <= 100:
                score += 15
            else:
                score += 5
        
        # Status bonus (max 20 points)
        status = campaign.get('status', '').lower()
        if status == 'completed':
            score += 20
        elif status == 'active':
            score += 15
        elif status == 'planning':
            score += 10
        
        return min(score, 100.0)
    
    def _estimate_roi(self, campaign: Dict[str, Any]) -> float:
        """Estimate Return on Investment (simplified)"""
        budget = float(campaign.get('budget', 0))
        expenses = float(campaign.get('total_expenses', 0))
        
        if expenses == 0:
            return 0.0
        
        # Simplified ROI calculation
        # In real scenario, this would consider revenue/impact metrics
        efficiency = (budget - expenses) / budget * 100 if budget > 0 else 0
        return efficiency
    
    async def _generate_campaign_recommendations(
        self, 
        campaign: Dict[str, Any], 
        budget_utilization: float,
        performance_score: float
    ) -> List[str]:
        """Generate actionable recommendations using AI or rules"""
        
        # Try AI-powered recommendations first (only if quota available)
        if self.use_ai:
            try:
                ai_recommendations = await self._get_ai_campaign_recommendations(
                    campaign, budget_utilization, performance_score
                )
                if ai_recommendations and len(ai_recommendations) > 0:
                    return ai_recommendations
            except Exception as e:
                error_msg = str(e)
                if "insufficient_quota" not in error_msg and "429" not in error_msg:
                    print(f"AI recommendation failed, falling back to rules: {error_msg}")
        
        # Fallback to rule-based recommendations
        return self._get_rule_based_campaign_recommendations(
            campaign, budget_utilization, performance_score
        )
    
    def _get_rule_based_campaign_recommendations(
        self,
        campaign: Dict[str, Any],
        budget_utilization: float,
        performance_score: float
    ) -> List[str]:
        """Rule-based campaign recommendations (fallback)"""
        recommendations = []
        
        if budget_utilization > 95:
            recommendations.append("⚠️ Budget almost exhausted - consider reallocation or additional funding")
        elif budget_utilization < 50:
            recommendations.append("💡 Low budget utilization - increase campaign activities or reallocate funds")
        
        if performance_score < 60:
            recommendations.append("📊 Performance below expectations - review campaign strategy")
        elif performance_score > 80:
            recommendations.append("🎯 Excellent performance - consider scaling similar campaigns")
        
        status = campaign.get('status', '').lower()
        if status == 'planning':
            recommendations.append("📅 Campaign in planning - ensure timely execution")
        
        if not recommendations:
            recommendations.append("✅ Campaign progressing well - continue monitoring")
        
        return recommendations
    
    async def _get_ai_campaign_recommendations(
        self,
        campaign: Dict[str, Any],
        budget_utilization: float,
        performance_score: float
    ) -> List[str]:
        """Generate AI-powered campaign recommendations using OpenAI"""
        try:
            prompt = f"""You are a fleet operations expert analyzing campaign performance. 
Provide 2-3 actionable recommendations based on this data:

Campaign: {campaign.get('name')}
Budget: ₹{campaign.get('budget', 0):,.0f}
Spent: ₹{campaign.get('total_expenses', 0):,.0f}
Budget Utilization: {budget_utilization:.1f}%
Performance Score: {performance_score:.1f}/100
Status: {campaign.get('status')}

Rules:
- Each recommendation must start with an emoji (⚠️ 💡 🎯 📊 ✅ 💰)
- Keep each recommendation under 100 characters
- Focus on actionable insights
- Be specific and data-driven

Return ONLY a JSON array of recommendation strings, no other text."""

            response = await self.ai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=300
            )
            
            content = response.choices[0].message.content.strip()
            # Parse JSON response
            recommendations = json.loads(content)
            return recommendations if isinstance(recommendations, list) else []
            
        except Exception as e:
            print(f"AI recommendation error: {str(e)}")
            return []
    
    def _generate_campaign_alerts(
        self, 
        campaign: Dict[str, Any], 
        budget_utilization: float
    ) -> List[str]:
        """Generate critical alerts"""
        alerts = []
        
        if budget_utilization > 100:
            alerts.append("🚨 CRITICAL: Budget exceeded! Immediate action required")
        elif budget_utilization > 95:
            alerts.append("⚠️ WARNING: Budget near limit (>95%)")
        
        # Check campaign end date
        end_date_str = campaign.get('end_date')
        if end_date_str:
            try:
                end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
                days_remaining = (end_date - datetime.now()).days
                if days_remaining < 3 and days_remaining > 0:
                    alerts.append(f"⏰ Campaign ending in {days_remaining} days")
                elif days_remaining < 0:
                    alerts.append("⏰ Campaign end date passed")
            except:
                pass
        
        return alerts
    
    def _determine_trend(self, campaign: Dict[str, Any]) -> str:
        """Determine campaign trend (simplified)"""
        budget_util = float(campaign.get('total_expenses', 0)) / float(campaign.get('budget', 1)) * 100
        
        if budget_util > 90:
            return "stable"
        elif budget_util > 60:
            return "improving"
        else:
            return "declining"
    
    # ============================================================
    # EXPENSE ANOMALY DETECTION
    # ============================================================
    
    async def detect_expense_anomalies(
        self, 
        expenses_data: List[Dict[str, Any]]
    ) -> List[ExpenseAnomaly]:
        """
        Detect anomalous expenses using statistical methods
        
        Args:
            expenses_data: List of expense records
        
        Returns:
            List of detected anomalies
        """
        anomalies = []
        
        # Group expenses by type
        expenses_by_type = defaultdict(list)
        for expense in expenses_data:
            expense_type = expense.get('expense_type', 'other')
            amount = float(expense.get('amount', 0))
            if amount > 0:
                expenses_by_type[expense_type].append({
                    'id': expense.get('id'),
                    'amount': amount,
                    'data': expense
                })
        
        # Analyze each type
        for expense_type, type_expenses in expenses_by_type.items():
            if len(type_expenses) < 3:  # Need minimum data points
                continue
            
            amounts = [e['amount'] for e in type_expenses]
            mean = np.mean(amounts)
            std = np.std(amounts)
            
            # Z-score threshold (2.5 standard deviations)
            threshold = 2.5
            
            for expense in type_expenses:
                amount = expense['amount']
                z_score = abs((amount - mean) / std) if std > 0 else 0
                
                if z_score > threshold:
                    reason = "Significantly higher than average" if amount > mean else "Significantly lower than average"
                    
                    anomalies.append(ExpenseAnomaly(
                        expense_id=expense['id'],
                        expense_type=expense_type,
                        amount=amount,
                        expected_range={
                            'min': round(mean - std, 2),
                            'max': round(mean + std, 2),
                            'average': round(mean, 2)
                        },
                        anomaly_score=round(z_score, 2),
                        reason=reason
                    ))
        
        # Sort by anomaly score
        anomalies.sort(key=lambda x: x.anomaly_score, reverse=True)
        
        return anomalies[:20]  # Return top 20 anomalies
    
    # ============================================================
    # UTILIZATION INSIGHTS
    # ============================================================
    
    async def analyze_utilization(
        self,
        entities_data: List[Dict[str, Any]],
        entity_type: str  # "vehicle" or "driver"
    ) -> List[UtilizationInsight]:
        """
        Analyze vehicle or driver utilization rates
        
        Args:
            entities_data: List of entity data with assignment history
            entity_type: Type of entity (vehicle or driver)
        
        Returns:
            List of utilization insights
        """
        insights = []
        
        for entity in entities_data:
            try:
                # Calculate utilization metrics
                total_assignments = int(entity.get('total_assignments', 0))
                active_assignments = int(entity.get('active_assignments', 0))
                
                # Simplified utilization calculation
                # In production, this would analyze actual time-based utilization
                if total_assignments > 0:
                    utilization_rate = (active_assignments / total_assignments) * 100
                else:
                    utilization_rate = 0
                
                idle_time = 100 - utilization_rate
                
                # Generate recommendations
                recommendations = []
                if utilization_rate < 40:
                    recommendations.append(f"⚠️ Low utilization - consider reassigning or optimizing routes")
                elif utilization_rate > 90:
                    recommendations.append(f"🎯 High utilization - ensure adequate rest/maintenance time")
                else:
                    recommendations.append(f"✅ Optimal utilization range")
                
                if idle_time > 60:
                    recommendations.append(f"💡 High idle time - opportunity for cost optimization")
                
                insights.append(UtilizationInsight(
                    entity_type=entity_type,
                    entity_id=entity.get('id', 0),
                    entity_name=entity.get('name', 'Unknown'),
                    utilization_rate=round(utilization_rate, 2),
                    idle_time_percentage=round(idle_time, 2),
                    recommendations=recommendations
                ))
            except Exception as e:
                print(f"Error analyzing {entity_type} utilization: {str(e)}")
                continue
        
        return insights
    
    # ============================================================
    # VENDOR PERFORMANCE
    # ============================================================
    
    async def analyze_vendor_performance(
        self,
        vendors_data: List[Dict[str, Any]]
    ) -> List[VendorPerformance]:
        """
        Analyze vendor performance metrics
        
        Args:
            vendors_data: List of vendor records with booking history
        
        Returns:
            List of vendor performance insights
        """
        performances = []
        
        for vendor in vendors_data:
            try:
                # Calculate performance metrics
                total_bookings = int(vendor.get('total_bookings', 0))
                completed_bookings = int(vendor.get('completed_bookings', 0))
                
                # Reliability score
                reliability = (completed_bookings / total_bookings * 100) if total_bookings > 0 else 0
                
                # Simplified metrics (in production, use actual data)
                avg_delivery_time = float(vendor.get('avg_delivery_time', 0))
                cost_efficiency = float(vendor.get('cost_efficiency', 75.0))
                
                # Generate AI-powered or rule-based recommendations
                if self.use_ai:
                    try:
                        recommendations = await self._get_ai_vendor_recommendations(
                            vendor, reliability, cost_efficiency, avg_delivery_time
                        )
                    except Exception as e:
                        print(f"AI vendor recommendation failed: {str(e)}")
                        recommendations = self._get_rule_based_vendor_recommendations(
                            reliability, cost_efficiency
                        )
                else:
                    recommendations = self._get_rule_based_vendor_recommendations(
                        reliability, cost_efficiency
                    )
                
                performances.append(VendorPerformance(
                    vendor_id=vendor.get('id', 0),
                    vendor_name=vendor.get('name', 'Unknown'),
                    reliability_score=round(reliability, 2),
                    avg_delivery_time=round(avg_delivery_time, 2),
                    cost_efficiency=round(cost_efficiency, 2),
                    recommendations=recommendations
                ))
            except Exception as e:
                print(f"Error analyzing vendor performance: {str(e)}")
                continue
        
        # Sort by reliability score
        performances.sort(key=lambda x: x.reliability_score, reverse=True)
        
        return performances
    
    def _get_rule_based_vendor_recommendations(
        self, 
        reliability: float, 
        cost_efficiency: float
    ) -> List[str]:
        """Rule-based vendor recommendations (fallback)"""
        recommendations = []
        
        if reliability < 70:
            recommendations.append("⚠️ Low reliability - monitor closely")
        elif reliability >= 90:
            recommendations.append("⭐ Highly reliable - preferred vendor")
        elif reliability >= 80:
            recommendations.append("✅ Good reliability - continue monitoring")
        else:
            recommendations.append("📊 Average reliability - room for improvement")
        
        if cost_efficiency < 60:
            recommendations.append("💰 High cost - negotiate better rates")
        elif cost_efficiency >= 85:
            recommendations.append("💡 Cost-efficient - consider increasing allocation")
        elif cost_efficiency >= 70:
            recommendations.append("💵 Reasonable pricing - track market rates")
        
        return recommendations
    
    async def _get_ai_vendor_recommendations(
        self,
        vendor: Dict[str, Any],
        reliability: float,
        cost_efficiency: float,
        avg_delivery_time: float
    ) -> List[str]:
        """Generate AI-powered vendor recommendations"""
        try:
            prompt = f"""You are a fleet operations procurement expert. Analyze this vendor and provide 2-3 recommendations:

Vendor: {vendor.get('name')}
Reliability Score: {reliability:.1f}% (bookings completed successfully)
Cost Efficiency: {cost_efficiency:.1f}%
Average Delivery Time: {avg_delivery_time:.1f} days
Total Bookings: {vendor.get('total_bookings', 0)}

Rules:
- Start each recommendation with an emoji (⚠️ ⭐ ✅ 💰 💡 📊)
- Keep under 100 characters each
- Focus on actionable business decisions
- Consider reliability, cost, and delivery performance

Return ONLY a JSON array of recommendation strings."""

            response = await self.ai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=250
            )
            
            content = response.choices[0].message.content.strip()
            recommendations = json.loads(content)
            return recommendations if isinstance(recommendations, list) else []
            
        except Exception as e:
            print(f"AI vendor recommendation error: {str(e)}")
            return self._get_rule_based_vendor_recommendations(reliability, cost_efficiency)
    
    # ============================================================
    # SUMMARY DASHBOARD
    # ============================================================
    
    async def generate_summary_dashboard(
        self,
        campaigns: List[Dict[str, Any]],
        expenses: List[Dict[str, Any]],
        vehicles: List[Dict[str, Any]],
        drivers: List[Dict[str, Any]],
        vendors: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive dashboard summary
        
        Returns:
            Dictionary with all key insights
        """
        # Analyze all components
        campaign_insights = await self.analyze_campaign_performance(campaigns)
        expense_anomalies = await self.detect_expense_anomalies(expenses)
        vehicle_utilization = await self.analyze_utilization(vehicles, "vehicle")
        driver_utilization = await self.analyze_utilization(drivers, "driver")
        vendor_performance = await self.analyze_vendor_performance(vendors)
        
        # Calculate summary statistics
        total_campaigns = len(campaigns)
        active_campaigns = len([c for c in campaigns if c.get('status') == 'active'])
        avg_campaign_score = np.mean([ci.performance_score for ci in campaign_insights]) if campaign_insights else 0
        
        high_priority_alerts = []
        for ci in campaign_insights:
            high_priority_alerts.extend([a for a in ci.alerts if '🚨' in a or '⚠️' in a])
        
        return {
            "summary": {
                "total_campaigns": total_campaigns,
                "active_campaigns": active_campaigns,
                "avg_performance_score": round(avg_campaign_score, 2),
                "high_priority_alerts": len(high_priority_alerts),
                "anomalous_expenses": len(expense_anomalies)
            },
            "campaign_insights": [ci.model_dump() for ci in campaign_insights[:10]],  # Top 10
            "expense_anomalies": [ea.model_dump() for ea in expense_anomalies[:10]],  # Top 10
            "vehicle_utilization": [vu.model_dump() for vu in vehicle_utilization[:10]],
            "driver_utilization": [du.model_dump() for du in driver_utilization[:10]],
            "vendor_performance": [vp.model_dump() for vp in vendor_performance[:10]],
            "top_recommendations": self._extract_top_recommendations(campaign_insights),
            "critical_alerts": high_priority_alerts[:5]
        }
    
    def _extract_top_recommendations(self, insights: List[CampaignInsight]) -> List[str]:
        """Extract top priority recommendations"""
        all_recommendations = []
        for insight in insights:
            all_recommendations.extend(insight.recommendations)
        
        # Prioritize critical recommendations
        critical = [r for r in all_recommendations if '⚠️' in r or '🚨' in r]
        return critical[:5] if critical else all_recommendations[:5]
