import typer
from sqlmodel import select

from app.database import create_db_and_tables, get_cli_session, drop_all
from app.models import User
from app.utilities.security import encrypt_password

cli = typer.Typer(invoke_without_command=True)


# =========================================================
# SAFE SEED FUNCTION
# =========================================================
def seed_data():
    with get_cli_session() as db:

        existing = db.exec(select(User)).first()
        if existing:
            print("Data already exists. Skipping seed.")
            return

        print("Seeding users...")

        users = [
            User(username="bob", email="bob@mail.com", password=encrypt_password("bobpass"), role="user", theme="light"),
            User(username="rick", email="rick@mail.com", password=encrypt_password("rickpass"), role="user", theme="dark"),
            User(username="sally", email="sally@mail.com", password=encrypt_password("sallypass"), role="user", theme="light"),
            User(username="pam", email="pam@mail.com", password=encrypt_password("pampass"), role="admin", theme="light"),
        ]

        db.add_all(users)
        db.commit()

        print("Users seeded")

        print("Seed complete")


@cli.callback()
def main():
    pass


# =========================================================
# FULL RESET (MANUAL ONLY)
# =========================================================
@cli.command()
def initialize():
    with get_cli_session() as db:

        print("Dropping database...")
        drop_all()

        print("Creating tables...")
        create_db_and_tables()

    seed_data()

    print("Database initialized successfully")


if __name__ == "__main__":
    cli() 