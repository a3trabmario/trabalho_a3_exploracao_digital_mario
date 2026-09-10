from peewee import MySQLDatabase

from app.core.config import settings


database = MySQLDatabase(
    settings.database_name,
    user=settings.database_user,
    password=settings.database_password,
    host=settings.database_host,
    port=settings.database_port,
    charset="utf8mb4",
)