from typing import List
from datetime import date
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.repositories.expense_repo import ExpenseRepository
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse, ExpenseStatus, SubmitterDetails
from app.models.user import User

class ExpenseService:
    def __init__(self):
        self.expense_repo = ExpenseRepository()
    
    async def _enrich_expense_with_submitter(self, expense, db: AsyncSession):
        """Enrich expense with submitter details"""
        if expense.submitted_by:
            # Query user separately to avoid lazy loading
            query = select(User).where(User.id == expense.submitted_by)
            result = await db.execute(query)
            user = result.scalar_one_or_none()
            if user:
                expense.submitted_by_user = SubmitterDetails(
                    id=user.id,
                    name=user.name,
                    phone=user.phone,
                    role=user.role
                )
        return expense
    
    async def create_expense(self, db: AsyncSession, expense_data: ExpenseCreate, user_id: int = None) -> ExpenseResponse:
        """Create a new expense
        
        Args:
            db: Database session
            expense_data: Expense data
            user_id: ID of the authenticated user submitting the expense
        """
        data = expense_data.model_dump()
        data["status"] = "pending"
        
        # Associate the expense with the logged-in user
        if user_id:
            data["submitted_by"] = user_id
        
        expense = await self.expense_repo.create(db, data)
        expense = await self._enrich_expense_with_submitter(expense, db)
        return ExpenseResponse.model_validate(expense)
    
    async def get_expense(self, db: AsyncSession, expense_id: int) -> ExpenseResponse:
        """Get expense by ID"""
        expense = await self.expense_repo.get_by_id(db, expense_id)
        
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found"
            )
        
        expense = await self._enrich_expense_with_submitter(expense, db)
        return ExpenseResponse.model_validate(expense)
    
    async def get_all_expenses(self, db: AsyncSession) -> List[ExpenseResponse]:
        """Get all expenses"""
        expenses = await self.expense_repo.get_all(db)
        enriched = []
        for expense in expenses:
            expense = await self._enrich_expense_with_submitter(expense, db)
            enriched.append(ExpenseResponse.model_validate(expense))
        return enriched
    
    async def get_user_expenses(self, db: AsyncSession, user_id: int) -> List[ExpenseResponse]:
        """Get only expenses submitted by the specified user"""
        from app.models.expense import Expense
        
        query = select(Expense).where(
            Expense.submitted_by == user_id,
            Expense.is_active == 1
        )
        result = await db.execute(query)
        expenses = result.scalars().all()
        
        enriched = []
        for expense in expenses:
            expense = await self._enrich_expense_with_submitter(expense, db)
            enriched.append(ExpenseResponse.model_validate(expense))
        return enriched
    
    async def approve_expense(self, db: AsyncSession, expense_id: int) -> ExpenseResponse:
        """Approve an expense"""
        update_data = {
            "status": ExpenseStatus.APPROVED,
            "approved_date": date.today()
        }
        
        expense = await self.expense_repo.update(db, expense_id, update_data)
        
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found"
            )
        
        expense = await self._enrich_expense_with_submitter(expense, db)
        return ExpenseResponse.model_validate(expense)
    
    async def reject_expense(self, db: AsyncSession, expense_id: int) -> ExpenseResponse:
        """Reject an expense"""
        update_data = {"status": ExpenseStatus.REJECTED}
        
        expense = await self.expense_repo.update(db, expense_id, update_data)
        
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found"
            )
        
        expense = await self._enrich_expense_with_submitter(expense, db)
        return ExpenseResponse.model_validate(expense)

    async def update_expense(self, db: AsyncSession, expense_id: int, update_data: dict) -> ExpenseResponse:
        """Update an expense"""
        expense = await self.expense_repo.update(db, expense_id, update_data)

        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found"
            )

        expense = await self._enrich_expense_with_submitter(expense, db)
        return ExpenseResponse.model_validate(expense)
    
    async def delete_expense(self, db: AsyncSession, expense_id: int):
        """Delete expense (soft delete)"""
        expense = await self.expense_repo.get_by_id(db, expense_id)
        
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found"
            )
        
        await self.expense_repo.delete(db, expense_id)
