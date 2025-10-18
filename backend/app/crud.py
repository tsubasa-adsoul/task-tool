from sqlalchemy.orm import Session
from . import models, schemas
from .auth import get_password_hash

# ユーザー操作
def get_user(db: Session, user_id: int):
    """ユーザーをIDで取得"""
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    """ユーザーをメールアドレスで取得"""
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    """新規ユーザーを作成"""
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# プロジェクト操作
def get_projects(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """ユーザーのプロジェクト一覧を取得"""
    return db.query(models.Project).filter(
        models.Project.owner_id == user_id
    ).offset(skip).limit(limit).all()

def create_project(db: Session, project: schemas.ProjectCreate, user_id: int):
    """新規プロジェクトを作成"""
    db_project = models.Project(**project.dict(), owner_id=user_id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def get_project(db: Session, project_id: int):
    """プロジェクトをIDで取得"""
    return db.query(models.Project).filter(models.Project.id == project_id).first()

# タスク操作
def get_tasks(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """ユーザーのタスク一覧を取得"""
    return db.query(models.Task).filter(
        models.Task.assignee_id == user_id
    ).offset(skip).limit(limit).all()

def get_project_tasks(db: Session, project_id: int):
    """プロジェクトのタスク一覧を取得"""
    return db.query(models.Task).filter(
        models.Task.project_id == project_id
    ).all()

def create_task(db: Session, task: schemas.TaskCreate, user_id: int):
    """新規タスクを作成"""
    # assignee_idが指定されていない場合のみ、作成者を担当者にする
    task_data = task.dict()
    if task_data.get('assignee_id') is None:
        task_data['assignee_id'] = user_id
    
    db_task = models.Task(**task_data)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def update_task(db: Session, task_id: int, task: schemas.TaskUpdate):
    """タスクを更新"""
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if db_task:
        update_data = task.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_task, key, value)
        db.commit()
        db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int):
    """タスクを削除"""
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if db_task:
        db.delete(db_task)
        db.commit()
    return db_task
