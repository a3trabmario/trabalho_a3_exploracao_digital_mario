from datetime import datetime

from peewee import AutoField, CharField, DateField, DateTimeField, ForeignKeyField, Model, TextField

from app.database import database


class BaseModel(Model):
    class Meta:
        database = database


class User(BaseModel):
    id = AutoField()
    name = CharField()
    email = CharField(unique=True)
    password_hash = CharField()
    created_at = DateTimeField(default=datetime.utcnow)


class Exam(BaseModel):
    id = AutoField()
    user = ForeignKeyField(User, backref="exams", on_delete="CASCADE")
    title = CharField()
    exam_date = DateField(null=True)
    original_text = TextField()
    status = CharField(default="pending")
    created_at = DateTimeField(default=datetime.utcnow)


class AIAnalysis(BaseModel):
    id = AutoField()
    exam = ForeignKeyField(Exam, backref="analysis", unique=True, on_delete="CASCADE")
    summary = TextField()
    results_json = TextField()
    limitations = TextField()
    model_name = CharField()
    created_at = DateTimeField(default=datetime.utcnow)