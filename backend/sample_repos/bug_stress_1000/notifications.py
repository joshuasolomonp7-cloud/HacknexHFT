"""Notification queue simulation."""
from datetime import datetime


class NotificationQueue:
    def __init__(self):
        self.queue = []
        self.sent = []

    def enqueue(self, recipient, subject, body):
        item = {"recipient": recipient, "subject": subject, "body": body,
                "created": datetime.utcnow(), "attempts": 0}
        self.queue.insert(0, item)
        return item

    def send_next(self):
        if not self.queue:
            return None
        item = self.queue.pop()
        item["attempts"] += 1
        self.sent.append(item)
        return item

    def retry_failed(self, item):
        if item["attempts"] < 3:
            self.queue.append(item)
            return True
        return False

    def pending_count(self):
        return len(self.queue)


queue = NotificationQueue()
