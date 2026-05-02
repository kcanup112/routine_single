"""
Create the push_subscriptions table for Web Push notifications.
Run: python -m scripts.create_push_subscriptions_table
"""
from app.core.database import engine, Base
from app.models.models import PushSubscription


def create_push_subscriptions_table():
    print("Creating push_subscriptions table...")
    PushSubscription.__table__.create(bind=engine, checkfirst=True)
    print("push_subscriptions table created successfully!")


if __name__ == "__main__":
    create_push_subscriptions_table()
