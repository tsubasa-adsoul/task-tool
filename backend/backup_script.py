import os
import json
import psycopg2
from datetime import datetime
from pathlib import Path

DATABASE_URL = os.getenv('DATABASE_URL')
BACKUP_DIR = Path('backend/backups')
MAX_BACKUPS = 10

def get_previous_counts():
    backups = sorted(BACKUP_DIR.glob('backup_*.json'), reverse=True)
    if not backups:
        return None
    
    with open(backups[0], 'r', encoding='utf-8') as f:
        data = json.load(f)
        return data.get('counts', {})

def backup_database():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    cur.execute('SELECT COUNT(*) FROM users')
    user_count = cur.fetchone()[0]
    
    cur.execute('SELECT COUNT(*) FROM tasks')
    task_count = cur.fetchone()[0]
    
    previous_counts = get_previous_counts()
    if previous_counts:
        prev_users = previous_counts.get('users', 0)
        prev_tasks = previous_counts.get('tasks', 0)
        
        if user_count < prev_users * 0.5 or task_count < prev_tasks * 0.5:
            print(f"WARNING: Data loss detected!")
            print(f"Previous - Users: {prev_users}, Tasks: {prev_tasks}")
            print(f"Current - Users: {user_count}, Tasks: {task_count}")
            print(f"Backup skipped to preserve previous backups.")
            cur.close()
            conn.close()
            return
    
    backup_data = {
        'timestamp': datetime.now().isoformat(),
        'counts': {
            'users': user_count,
            'tasks': task_count
        },
        'users': [],
        'projects': [],
        'tasks': [],
        'comments': [],
        'notifications': []
    }
    
    tables = ['users', 'projects', 'tasks', 'comments', 'notifications']
    
    for table in tables:
        try:
            cur.execute(f'SELECT * FROM {table}')
            columns = [desc[0] for desc in cur.description]
            backup_data[table] = [dict(zip(columns, row)) for row in cur.fetchall()]
        except Exception as e:
            print(f"Warning: Could not backup {table}: {e}")
            backup_data[table] = []
    
    cur.close()
    conn.close()
    
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    
    filename = BACKUP_DIR / f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(backup_data, f, ensure_ascii=False, indent=2, default=str)
    
    print(f"Backup saved: {filename}")
    print(f"Users: {user_count}, Tasks: {task_count}")
    
    backups = sorted(BACKUP_DIR.glob('backup_*.json'), reverse=True)
    for old_backup in backups[MAX_BACKUPS:]:
        old_backup.unlink()
        print(f"Deleted old backup: {old_backup}")

if __name__ == '__main__':
    backup_database()
