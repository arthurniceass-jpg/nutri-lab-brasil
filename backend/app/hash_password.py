"""Gera o hash bcrypt da senha do dono para colocar em OWNER_PASSWORD_HASH.

    python -m app.hash_password

A senha é digitada sem aparecer na tela e nunca é gravada em arquivo.
"""
import getpass
import sys

from .security import hash_password, password_problem


def main() -> int:
    pw = getpass.getpass("Nova senha do dono: ")
    if getpass.getpass("Repita a senha: ") != pw:
        print("As senhas não conferem.", file=sys.stderr)
        return 1
    problem = password_problem(pw)
    if problem:
        print(problem, file=sys.stderr)
        return 1
    if len(pw) < 12:
        print("Aviso: para a conta do dono, prefira 12 caracteres ou mais.", file=sys.stderr)
    print("\nOWNER_PASSWORD_HASH=" + hash_password(pw))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
