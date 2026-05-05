import asyncio
from database import AsyncSessionLocal
from sqlalchemy import select
from models.user import User

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User.id, User.name, User.email, User.role))
        for row in result:
            print(f"ID: {row.id} | Name: {row.name} | Role: {row.role}")

asyncio.run(main())
