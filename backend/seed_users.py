"""Seed the 4 initial team users into MySQL."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from passlib.context import CryptContext
from sqlalchemy import select
from database import AsyncSessionLocal
from models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

USERS = [
    {"name": "Marcos Mihalea", "email": "marcos@angelaie.com", "role": "admin"},
    {"name": "Joaquín García", "email": "joaquin@angelaie.com", "role": "jefe_ventas"},
    {"name": "Raúl López", "email": "raul@angelaie.com", "role": "comercial"},
    {"name": "Alba Martínez", "email": "alba@angelaie.com", "role": "comercial"},
]

PASSWORD = "DatAsales2025!"


async def main():
    async with AsyncSessionLocal() as session:
        for u in USERS:
            result = await session.execute(
                select(User).where(User.email == u["email"])
            )
            existing = result.scalar_one_or_none()
            if existing:
                print(f"⏭️  {u['email']} ya existe — omitido")
                continue

            user = User(
                name=u["name"],
                email=u["email"],
                role=u["role"],
                hashed_password=pwd_context.hash(PASSWORD),
            )
            session.add(user)
            await session.commit()
            print(f"✅ {u['name']} ({u['role']}) insertado")

    print("\nSeed completado.")


if __name__ == "__main__":
    asyncio.run(main())
