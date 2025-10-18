import os
import json
import psycopg2
from pathlib import Path

DATABASE_URL = os.getenv('DATABASE_URL')
BACKUP_DIR = Path('backend/backups')

def restore_database(backup_file=None):
    if backup_file is None:
        backups = sorted(BACKUP_DIR.glob('backup_*.json'), reverse=True)
        if not backups:
            print("No backup files found!")
            return
        backup_file = backups[0]
    
    print(f"Restoring from: {backup_file}")
    
    with open(backup_file, 'r', encoding='utf-8') as f:
        backup_data = json.load(f)
    
    print(f"Backup timestamp: {backup_data['timestamp']}")
    print(f"Data counts: {backup_data['counts']}")
    
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        cur.execute('DELETE FROM notifications')
        cur.execute('DELETE FROM comments')
        cur.execute('DELETE FROM tasks')
        cur.execute('DELETE FROM projects')
        cur.execute('DELETE FROM users')
        
        for user in backup_data['users']:
            columns = ', '.join(user.keys())
            placeholders = ', '.join(['%s'] * len(user))
            values = [user[k] for k in user.keys()]
            cur.execute(f'INSERT INTO users ({columns}) VALUES ({placeholders})', values)
        
        for project in backup_data['projects']:
            columns = ', '.join(project.keys())
            placeholders = ', '.join(['%s'] * len(project))
            values = [project[k] for k in project.keys()]
            cur.execute(f'INSERT INTO projects ({columns}) VALUES ({placeholders})', values)
        
        for task in backup_data['tasks']:
            columns = ', '.join(task.keys())
            placeholders = ', '.join(['%s'] * len(task))
            values = [task[k] for k in task.keys()]
            cur.execute(f'INSERT INTO tasks ({columns}) VALUES ({placeholders})', values)
        
        for comment in backup_data['comments']:
            columns = ', '.join(comment.keys())
            placeholders = ', '.join(['%s'] * len(comment))
            values = [comment[k] for k in comment.keys()]
            cur.execute(f'INSERT INTO comments ({columns}) VALUES ({placeholders})', values)
        
        for notification in backup_data.get('notifications', []):
            columns = ', '.join(notification.keys())
            placeholders = ', '.join(['%s'] * len(notification))
            values = [notification[k] for k in notification.keys()]
            cur.execute(f'INSERT INTO notifications ({columns}) VALUES ({placeholders})', values)
        
        conn.commit()
        print("Restore completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"Restore failed: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1:
        restore_database(Path(sys.argv[1]))
    else:
        restore_database()
