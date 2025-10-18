import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# DATABASE_URL を環境変数から取得（Render.com などに対応）
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("環境変数 DATABASE_URL が設定されていません。")

# PostgreSQL 用エンジン（connect_args は不要）
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# データベース接続を取得する関数
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
