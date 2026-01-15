from typing import List
from datetime import date
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.expense_repo import ExpenseRepository
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse, ExpenseStatus

class ExpenseService:
    def __init__(self):
        self.expense_repo = ExpenseRepository()
    
    async def create_expense(self, db: AsyncSession, expense_data: ExpenseCreate) -> ExpenseResponse:
        """Create a new expense"""
        data = expense_data.model_dump()
        data["status"] = "pending"
        
        expense = await self.expense_repo.create(db, data)
        return ExpenseResponse.model_validate(expense)
    
    async def get_expense(self, db: AsyncSession, expense_id: int) -> ExpenseResponse:
        """Get expense by ID"""
        expense = await self.expense_repo.get_by_id(db, expense_id)
        
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found"
            )
        
        return ExpenseResponse.model_validate(expense)
    
    async def get_all_expenses(self, db: AsyncSession) -> List[ExpenseResponse]:
        """Get all expenses"""
        expenses = await self.expense_repo.get_all(db)
        return [ExpenseResponse.model_validate(e) for e in expenses]
    
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
        
        return ExpenseResponse.model_validate(expense)

    async def update_expense(self, db: AsyncSession, expense_id: int, update_data: dict) -> ExpenseResponse:
        """Update an expense"""
        expense = await self.expense_repo.update(db, expense_id, update_data)

        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found"
            )

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
