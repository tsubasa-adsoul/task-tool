from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# ユーザー関連
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    avatar: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    is_active: bool
    avatar: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# トークン関連
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# プロジェクト関連
class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    color: Optional[str] = "aqua"

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# タスク関連
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "todo"
    priority: Optional[str] = "medium"
    due_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    project_id: Optional[int] = None

class TaskCreate(TaskBase):
    assignee_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    assignee_id: Optional[int] = None
    project_id: Optional[int] = None

class Task(TaskBase):
    id: int
    assignee_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# コメント
class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class Comment(CommentBase):
    id: int
    task_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ユーザー情報付きコメント
class CommentWithUser(Comment):
    user: User

# 通知
class NotificationBase(BaseModel):
    message: str
    type: str

class Notification(NotificationBase):
    id: int
    user_id: int
    task_id: Optional[int] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
