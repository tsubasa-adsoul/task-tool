import os
import time  # time.sleep()のために必要
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# RenderやSupabase対応
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if not SQLALCHEMY_DATABASE_URL:
    raise RuntimeError("環境変数 DATABASE_URL が設定されていません。")

# SSL必須対応（正しいURLパラメータ構築）
if "sslmode" not in SQLALCHEMY_DATABASE_URL:
    if "?" in SQLALCHEMY_DATABASE_URL:
        SQLALCHEMY_DATABASE_URL += "&sslmode=require"
    else:
        SQLALCHEMY_DATABASE_URL += "?sslmode=require"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    retry_count = 0
    max_retries = 3
    
    while retry_count < max_retries:
        try:
            db = SessionLocal()
            yield db
        except Exception as e:
            retry_count += 1
            if retry_count >= max_retries:
                raise e
            time.sleep(1)  # 1秒待機してリトライ
        finally:
            if 'db' in locals():
                db.close()
