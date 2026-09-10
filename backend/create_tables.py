from app.database import database
from app.models import AIAnalysis, Exam, User


if __name__ == "__main__":
    database.connect(reuse_if_open=True)
    database.create_tables([User, Exam, AIAnalysis])
    database.close()
    print("Tabelas criadas ou ja existentes.")