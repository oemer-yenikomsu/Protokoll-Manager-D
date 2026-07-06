from werkzeug.security import generate_password_hash


def hash_password(plain: str) -> str:
    return generate_password_hash(plain)
