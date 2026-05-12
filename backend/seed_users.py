"""Seed initial users into MySQL from environment variables."""

import asyncio
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from passlib.context import CryptContext
from sqlalchemy import select
from database import AsyncSessionLocal
from models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

VALID_ROLES = {"admin", "jefe_ventas", "comercial"}


def _load_seed_users() -> list[dict[str, str]]:
    raw_users = os.environ.get("SEED_USERS_JSON")
    password = os.environ.get("SEED_INITIAL_PASSWORD")
    if not raw_users or not password:
        raise RuntimeError("Configura SEED_USERS_JSON y SEED_INITIAL_PASSWORD para ejecutar el seed")
    if len(password) < 16:
        raise RuntimeError("SEED_INITIAL_PASSWORD debe tener al menos 16 caracteres")

    users = json.loads(raw_users)
    if not isinstance(users, list) or not users:
        raise RuntimeError("SEED_USERS_JSON debe ser una lista no vacia")
    for user in users:
        if user.get("role") not in VALID_ROLES:
            raise RuntimeError("Role invalido en SEED_USERS_JSON")
        if not user.get("name") or not user.get("email"):
            raise RuntimeError("Cada usuario seed necesita name y email")
    return users


async def main():
    users = _load_seed_users()
    password = os.environ["SEED_INITIAL_PASSWORD"]
    async with AsyncSessionLocal() as session:
        for u in users:
            result = await session.execute(
                select(User).where(User.email == u["email"])
            )
            existing = result.scalar_one_or_none()
            if existing:
                print("Usuario existente omitido")
                continue

            user = User(
                name=u["name"],
                email=u["email"],
                role=u["role"],
                hashed_password=pwd_context.hash(PASSWORD),
            )
            session.add(user)
            await session.commit()
            print(f"Usuario seed insertado con role={u['role']}")

    print("\nSeed completado.")


if __name__ == "__main__":
    asyncio.run(main())
