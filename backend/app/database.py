from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 開発用にSQLiteを使用(後でPostgreSQLに変更可能)
SQLALCHEMY_DATABASE_URL = "sqlite:///./asana_clone.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# データベース接続を取得する関数
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
