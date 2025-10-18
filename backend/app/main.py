from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, date
from typing import List
from sqlalchemy import or_
from PIL import Image
import socketio
import os
import uuid

from . import models, schemas, crud, auth
from .database import engine, get_db

# データベーステーブルを作成
models.Base.metadata.create_all(bind=engine)

# Socket.IO サーバーを作成
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*'
)

app = FastAPI(title="Asana Clone API")

# CORS設定(フロントエンドからのアクセスを許可)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 画像保存ディレクトリ
UPLOAD_DIR = "uploads/avatars"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# Socket.IOをASGIミドルウェアとして統合
from socketio import ASGIApp
socket_app = ASGIApp(sio, other_asgi_app=app)


# WebSocket イベントハンドラ
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

# リアルタイム通知関数
async def broadcast_task_update(event_type: str, task_data: dict):
    """タスクの変更を全クライアントに通知"""
    await sio.emit('task_update', {
        'type': event_type,
        'data': task_data
    })

async def broadcast_project_update(event_type: str, project_data: dict):
    """プロジェクトの変更を全クライアントに通知"""
    await sio.emit('project_update', {
        'type': event_type,
        'data': project_data
    })

async def broadcast_comment_update(event_type: str, comment_data: dict):
    """コメントの変更を全クライアントに通知"""
    await sio.emit('comment_update', {
        'type': event_type,
        'data': comment_data
    })

# ルートエンドポイント
@app.get("/")
def read_root():
    return {"message": "Asana Clone API"}

# 認証エンドポイント
@app.post("/api/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """新規ユーザー登録"""
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="このメールアドレスは既に登録されています")
    return crud.create_user(db=db, user=user)

@app.post("/api/token", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """ログイン"""
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    """現在のユーザー情報を取得"""
    return current_user

@app.get("/api/users", response_model=List[schemas.User])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """ユーザー一覧を取得"""
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@app.delete("/api/users/reset")
def reset_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """ユーザーデータのみをリセット(プロジェクトとタスクは保持)"""
    db.query(models.User).delete()
    db.commit()
    return {"message": "ユーザーデータをリセットしました。プロジェクトとタスクは保持されています。"}

@app.delete("/api/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """特定のユーザーを削除"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
    
    db.delete(user)
    db.commit()
    return {"message": f"ユーザー {user.name} を削除しました"}

# プロジェクトエンドポイント
@app.get("/api/projects", response_model=List[schemas.Project])
def read_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """プロジェクト一覧を取得(全ユーザーで共有)"""
    projects = db.query(models.Project).offset(skip).limit(limit).all()
    return projects

@app.post("/api/projects", response_model=schemas.Project)
async def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """新規プロジェクトを作成"""
    db_project = crud.create_project(db=db, project=project, user_id=current_user.id)
    
    await broadcast_project_update('project_created', {
        'id': db_project.id,
        'title': db_project.title,
        'description': db_project.description,
        'color': db_project.color,
        'owner_id': db_project.owner_id
    })
    
    return db_project

@app.get("/api/projects/{project_id}", response_model=schemas.Project)
def read_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """プロジェクト詳細を取得"""
    db_project = crud.get_project(db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="プロジェクトが見つかりません")
    return db_project

@app.put("/api/projects/{project_id}", response_model=schemas.Project)
async def update_project(
    project_id: int,
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """プロジェクトを更新"""
    db_project = crud.get_project(db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="プロジェクトが見つかりません")
    
    if db_project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="このプロジェクトを更新する権限がありません")
    
    db_project.title = project.title
    db_project.description = project.description
    db_project.color = project.color
    
    db.commit()
    db.refresh(db_project)
    
    await broadcast_project_update('project_updated', {
        'id': db_project.id,
        'title': db_project.title,
        'description': db_project.description,
        'color': db_project.color,
        'owner_id': db_project.owner_id
    })
    
    return db_project

@app.delete("/api/projects/{project_id}")
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """プロジェクトを削除"""
    db_project = crud.get_project(db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="プロジェクトが見つかりません")
    
    if db_project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="このプロジェクトを削除する権限がありません")
    
    db.query(models.Task).filter(models.Task.project_id == project_id).delete()
    db.delete(db_project)
    db.commit()
    
    await broadcast_project_update('project_deleted', {'id': project_id})
    
    return {"message": "プロジェクトを削除しました"}

@app.get("/api/projects/{project_id}/tasks", response_model=List[schemas.Task])
def read_project_tasks(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """プロジェクトのタスク一覧を取得"""
    tasks = crud.get_project_tasks(db, project_id=project_id)
    return tasks

# タスクエンドポイント
@app.get("/api/tasks/search", response_model=List[schemas.Task])
def search_tasks(
    q: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """タスクを検索"""
    tasks = db.query(models.Task).filter(
        or_(
            models.Task.title.contains(q),
            models.Task.description.contains(q)
        )
    ).all()
    return tasks

@app.get("/api/tasks", response_model=List[schemas.Task])
def read_tasks(
    skip: int = 0,
    limit: int = 100,
    my_tasks: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """タスク一覧を取得"""
    if my_tasks:
        tasks = db.query(models.Task).filter(
            models.Task.assignee_id == current_user.id
        ).offset(skip).limit(limit).all()
    else:
        tasks = crud.get_tasks(db, skip=skip, limit=limit)
    return tasks

@app.post("/api/tasks", response_model=schemas.Task)
async def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """タスクを作成"""
    db_task = crud.create_task(db=db, task=task, user_id=current_user.id)
    
    await broadcast_task_update('task_created', {
        'id': db_task.id,
        'title': db_task.title,
        'description': db_task.description,
        'status': db_task.status,
        'priority': db_task.priority,
        'due_date': db_task.due_date,
        'start_time': db_task.start_time,
        'end_time': db_task.end_time,
        'assignee_id': db_task.assignee_id,
        'project_id': db_task.project_id,
        'created_at': db_task.created_at.isoformat()
    })
    
    return db_task

@app.put("/api/tasks/{task_id}", response_model=schemas.Task)
async def update_task(
    task_id: int,
    task: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """タスクを更新"""
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="タスクが見つかりません")
    
    old_assignee_id = db_task.assignee_id
    updated_task = crud.update_task(db, task_id=task_id, task=task)
    new_assignee_id = updated_task.assignee_id
    
    if new_assignee_id and new_assignee_id != old_assignee_id and new_assignee_id != current_user.id:
        notification = models.Notification(
            user_id=new_assignee_id,
            task_id=task_id,
            type='assigned',
            message=f'{current_user.name}さんがあなたに「{updated_task.title}」を割り当てました'
        )
        db.add(notification)
        db.commit()
    
    await broadcast_task_update('task_updated', {
        'id': updated_task.id,
        'title': updated_task.title,
        'description': updated_task.description,
        'status': updated_task.status,
        'priority': updated_task.priority,
        'due_date': updated_task.due_date,
        'start_time': updated_task.start_time,
        'end_time': updated_task.end_time,
        'assignee_id': updated_task.assignee_id,
        'project_id': updated_task.project_id,
        'created_at': updated_task.created_at.isoformat()
    })
    
    return updated_task

@app.delete("/api/tasks/{task_id}")
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """タスクを削除"""
    db_task = crud.delete_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="タスクが見つかりません")
    
    await broadcast_task_update('task_deleted', {'id': task_id})
    
    return {"message": "タスクを削除しました"}

# コメントAPI
@app.get("/api/tasks/{task_id}/comments", response_model=List[schemas.CommentWithUser])
def get_task_comments(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """タスクのコメント一覧を取得"""
    comments = db.query(models.Comment).filter(
        models.Comment.task_id == task_id
    ).order_by(models.Comment.created_at.desc()).all()
    return comments

@app.post("/api/tasks/{task_id}/comments", response_model=schemas.Comment)
async def create_comment(
    task_id: int,
    comment: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """コメントを作成"""
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="タスクが見つかりません")
    
    db_comment = models.Comment(
        content=comment.content,
        task_id=task_id,
        user_id=current_user.id
    )
    db.add(db_comment)
    
    if task.assignee_id and task.assignee_id != current_user.id:
        notification = models.Notification(
            user_id=task.assignee_id,
            task_id=task_id,
            type='comment',
            message=f'{current_user.name}さんが「{task.title}」にコメントしました: {comment.content[:50]}{"..." if len(comment.content) > 50 else ""}'
        )
        db.add(notification)
    
    db.commit()
    db.refresh(db_comment)
    
    await broadcast_comment_update('comment_created', {
        'id': db_comment.id,
        'content': db_comment.content,
        'task_id': task_id,
        'user_id': current_user.id,
        'user': {
            'id': current_user.id,
            'name': current_user.name,
            'email': current_user.email
        },
        'created_at': db_comment.created_at.isoformat()
    })
    
    return db_comment

@app.delete("/api/tasks/{task_id}/comments/{comment_id}")
async def delete_comment(
    task_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """コメントを削除"""
    comment = db.query(models.Comment).filter(
        models.Comment.id == comment_id,
        models.Comment.task_id == task_id
    ).first()
    
    if comment is None:
        raise HTTPException(status_code=404, detail="コメントが見つかりません")
    
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="このコメントを削除する権限がありません")
    
    db.delete(comment)
    db.commit()
    
    await broadcast_comment_update('comment_deleted', {
        'id': comment_id,
        'task_id': task_id
    })
    
    return {"message": "コメントを削除しました"}

# 通知API
@app.get("/api/notifications", response_model=List[schemas.Notification])
def get_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """通知一覧を取得"""
    query = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    )
    
    if unread_only:
        query = query.filter(models.Notification.is_read == False)
    
    notifications = query.order_by(models.Notification.created_at.desc()).limit(50).all()
    return notifications

@app.get("/api/notifications/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """未読通知の件数を取得"""
    count = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).count()
    return {"count": count}

@app.put("/api/notifications/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """通知を既読にする"""
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    
    if notification is None:
        raise HTTPException(status_code=404, detail="通知が見つかりません")
    
    notification.is_read = True
    db.commit()
    return {"message": "通知を既読にしました"}

@app.put("/api/notifications/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """すべての通知を既読にする"""
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "すべての通知を既読にしました"}

@app.get("/api/notifications/check-due-dates")
def check_due_dates(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """期限が近いタスクの通知を生成(定期実行用)"""
    today = date.today()
    
    for days_before in [3, 1, 0]:
        target_date = today + timedelta(days=days_before)
        target_date_str = target_date.isoformat()
        
        tasks = db.query(models.Task).filter(
            models.Task.due_date == target_date_str,
            models.Task.status != 'done',
            models.Task.assignee_id.isnot(None)
        ).all()
        
        for task in tasks:
            existing_notification = db.query(models.Notification).filter(
                models.Notification.task_id == task.id,
                models.Notification.type == 'due_soon',
                models.Notification.created_at >= today
            ).first()
            
            if not existing_notification:
                if days_before == 0:
                    message = f'「{task.title}」の期限は今日です!'
                elif days_before == 1:
                    message = f'「{task.title}」の期限は明日です'
                else:
                    message = f'「{task.title}」の期限まであと{days_before}日です'
                
                notification = models.Notification(
                    user_id=task.assignee_id,
                    task_id=task.id,
                    type='due_soon',
                    message=message
                )
                db.add(notification)
    
    db.commit()
    return {"message": "期限通知をチェックしました", "checked_dates": [str(today + timedelta(days=d)) for d in [3, 1, 0]]}

# プロフィールAPI
@app.get("/api/profile", response_model=schemas.User)
def get_profile(current_user: models.User = Depends(auth.get_current_user)):
    """現在のユーザーのプロフィールを取得"""
    return current_user

@app.put("/api/profile", response_model=schemas.User)
async def update_profile(
    profile: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """プロフィールを更新"""
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    
    if profile.name:
        user.name = profile.name
    
    if profile.email:
        existing_user = db.query(models.User).filter(
            models.User.email == profile.email,
            models.User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="このメールアドレスは既に使用されています")
        user.email = profile.email
    
    if profile.password:
        user.hashed_password = auth.get_password_hash(profile.password)
    
    db.commit()
    db.refresh(user)
    return user

@app.post("/api/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """プロフィール画像をアップロード"""
    if file.content_type not in ["image/jpeg", "image/png", "image/gif", "image/webp"]:
        raise HTTPException(status_code=400, detail="画像ファイル(JPEG, PNG, GIF, WEBP)のみアップロード可能です")
    
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="ファイルサイズは5MB以下にしてください")
    
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(contents)
    
    try:
        img = Image.open(file_path)
        img = img.convert("RGB")
        img.thumbnail((200, 200), Image.Resampling.LANCZOS)
        img.save(file_path, "JPEG", quality=85)
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="画像の処理に失敗しました")
    
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if user.avatar:
        old_file_path = os.path.join(UPLOAD_DIR, user.avatar)
        if os.path.exists(old_file_path):
            os.remove(old_file_path)
    
    user.avatar = unique_filename
    db.commit()
    db.refresh(user)
    
    return {"avatar": unique_filename, "message": "プロフィール画像をアップロードしました"}

@app.get("/api/avatars/{filename}")
def get_avatar(filename: str):
    """プロフィール画像を取得"""
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="画像が見つかりません")
    return FileResponse(file_path)

@app.delete("/api/profile/avatar")
def delete_avatar(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """プロフィール画像を削除"""
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    
    if not user.avatar:
        raise HTTPException(status_code=404, detail="プロフィール画像が設定されていません")
    
    file_path = os.path.join(UPLOAD_DIR, user.avatar)
    if os.path.exists(file_path):
        os.remove(file_path)
    
    user.avatar = None
    db.commit()
    
    return {"message": "プロフィール画像を削除しました"}
