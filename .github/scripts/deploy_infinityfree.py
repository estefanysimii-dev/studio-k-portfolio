from __future__ import annotations

import ftplib
import os
import posixpath
import socket
import sys
import time
from pathlib import Path

LOCAL_ROOT = Path("dist-infinityfree")
REMOTE_ROOT = "/htdocs"


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"GitHub Secret ausente: {name}")
    return value


def connection_hosts(configured_host: str) -> list[str]:
    # InfinityFree normally exposes the same FTP service through more than one
    # hostname. GitHub-hosted runners can occasionally fail DNS resolution for
    # one name while another alias (or the service IP) remains reachable.
    candidates = [
        configured_host,
        "ftp.infinityfree.com",
        "ftpupload.net",
        "185.27.134.11",
    ]
    unique: list[str] = []
    for host in candidates:
        host = host.strip()
        if host and host not in unique:
            unique.append(host)
    return unique


def connect(host: str, user: str, password: str) -> ftplib.FTP:
    ftp = ftplib.FTP()
    ftp.connect(host=host, port=21, timeout=35)
    ftp.login(user=user, passwd=password)
    ftp.set_pasv(True)
    ftp.cwd(REMOTE_ROOT)
    return ftp


def connect_with_fallback(configured_host: str, user: str, password: str) -> tuple[ftplib.FTP, str]:
    last_error: Exception | None = None
    transient_errors = (socket.gaierror, socket.timeout, TimeoutError, ConnectionError, OSError, EOFError, ftplib.error_temp)

    for host in connection_hosts(configured_host):
        for attempt in range(1, 4):
            try:
                print(f"Conectando ao FTP InfinityFree via {host} (tentativa {attempt}/3)...")
                return connect(host, user, password), host
            except ftplib.error_perm:
                # Authentication/permission errors are not DNS/network failures;
                # changing endpoint will not fix bad credentials.
                raise
            except transient_errors as exc:
                last_error = exc
                print(f"Falha de conexão via {host}, tentativa {attempt}: {exc}", file=sys.stderr)
                if attempt < 3:
                    time.sleep(attempt * 3)

        print(f"Endpoint {host} indisponível; tentando próximo fallback.", file=sys.stderr)

    if last_error is None:
        raise RuntimeError("Nenhum endpoint FTP disponível.")
    raise last_error


def ensure_dir(ftp: ftplib.FTP, relative_dir: str) -> None:
    if not relative_dir or relative_dir == ".":
        ftp.cwd(REMOTE_ROOT)
        return

    ftp.cwd(REMOTE_ROOT)
    for part in relative_dir.split("/"):
        if not part:
            continue
        try:
            ftp.cwd(part)
        except ftplib.error_perm:
            ftp.mkd(part)
            ftp.cwd(part)


def upload_tree(ftp: ftplib.FTP) -> tuple[int, int]:
    files_uploaded = 0
    bytes_uploaded = 0

    for file_path in sorted(p for p in LOCAL_ROOT.rglob("*") if p.is_file()):
        relative = file_path.relative_to(LOCAL_ROOT).as_posix()
        remote_dir = posixpath.dirname(relative)
        ensure_dir(ftp, remote_dir)

        size = file_path.stat().st_size
        print(f"uploading: {relative} ({size} bytes)")
        try:
            with file_path.open("rb") as handle:
                ftp.storbinary(f"STOR {file_path.name}", handle, blocksize=1024 * 64)
        except ftplib.error_perm as exc:
            if not str(exc).startswith("553"):
                raise

            # InfinityFree can keep older files with ownership/permissions that
            # allow deleting but not overwriting. Replace those atomically by
            # deleting the old file and retrying the upload.
            try:
                ftp.delete(file_path.name)
                print(f"replacing protected remote file: {relative}")
                with file_path.open("rb") as handle:
                    ftp.storbinary(f"STOR {file_path.name}", handle, blocksize=1024 * 64)
            except ftplib.error_perm:
                # If the remote file is identical, keeping it is safe.
                try:
                    remote_size = ftp.size(file_path.name)
                except ftplib.all_errors:
                    remote_size = None

                if remote_size == size:
                    print(f"unchanged protected remote file kept: {relative}")
                    continue

                # .htaccess may be protected by the host. It was already
                # validated during the initial InfinityFree publication.
                if relative == ".htaccess":
                    print("warning: InfinityFree recusou substituir .htaccess; mantendo o arquivo existente em /htdocs.")
                    continue

                raise

        files_uploaded += 1
        bytes_uploaded += size
        print(f"uploaded: {relative} ({size} bytes)")

    ftp.cwd(REMOTE_ROOT)
    return files_uploaded, bytes_uploaded


def main() -> int:
    if not LOCAL_ROOT.is_dir():
        print("dist-infinityfree/ não existe. Execute o build antes do deploy.", file=sys.stderr)
        return 2

    host = require_env("INFINITYFREE_FTP_HOST")
    user = require_env("INFINITYFREE_FTP_USER")
    password = require_env("INFINITYFREE_FTP_PASSWORD")

    ftp: ftplib.FTP | None = None
    try:
        ftp, endpoint = connect_with_fallback(host, user, password)
        print(f"FTP conectado com sucesso via {endpoint}.")
        count, total = upload_tree(ftp)
        try:
            ftp.quit()
        except Exception:
            ftp.close()
        print(f"Deploy concluído: {count} arquivos, {total} bytes enviados para {REMOTE_ROOT}.")
        return 0
    except ftplib.error_perm as exc:
        print(f"Deploy FTP recusado por autenticação/permissão: {exc}", file=sys.stderr)
        return 1
    except (ftplib.all_errors + (OSError, socket.timeout, TimeoutError, ConnectionError)) as exc:
        print(f"Deploy FTP falhou em todos os endpoints configurados: {exc}", file=sys.stderr)
        try:
            if ftp is not None:
                ftp.close()
        except Exception:
            pass
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
