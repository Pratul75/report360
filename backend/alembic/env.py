import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
try:
    if config.config_file_name is not None:
        fileConfig(config.config_file_name)
except Exception:
    # ignore logging config issues for lightweight alembic.ini
    pass

# set SQLAlchemy URL from environment
database_url = os.getenv('DATABASE_URL')
if database_url:
    # Alembic runs synchronously; convert async driver URL to a sync driver URL if needed
    sync_url = database_url
    if '+asyncmy' in sync_url:
        sync_url = sync_url.replace('+asyncmy', '+pymysql')
    config.set_main_option('sqlalchemy.url', sync_url)

try:
    import backend.models as backend_models  # type: ignore
except Exception:
    # running from backend/ folder, fall back to relative import
    import sys
    sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + '/../'))
    import models as backend_models  # type: ignore

# Also try to import app-level models (app/models) and merge metadata so Alembic
# sees all tables defined in both codepaths.
try:
    import app.models.base as app_models_base  # type: ignore
except Exception:
    app_models_base = None

from sqlalchemy import MetaData

target_metadata = MetaData()

# copy backend models metadata
if hasattr(backend_models, 'Base') and getattr(backend_models, 'Base') is not None:
    for t in backend_models.Base.metadata.tables.values():
        t.tometadata(target_metadata)

# copy app models metadata if available
if app_models_base and hasattr(app_models_base, 'Base') and getattr(app_models_base, 'Base') is not None:
    for t in app_models_base.Base.metadata.tables.values():
        if t.name not in target_metadata.tables:
            t.tometadata(target_metadata)


def run_migrations_offline():
    url = config.get_main_option('sqlalchemy.url')
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix='sqlalchemy.',
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
