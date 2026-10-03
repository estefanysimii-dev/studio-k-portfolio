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


def connect(host: str, user: str, password: str) -> ftplib.FTP:
    ftp = ftplib.FTP()
    ftp.connect(host=host, port=21, timeout=35)
    ftp.login(user=user, passwd=password)
    ftp.set_pasv(True)
    ftp.cwd(REMOTE_ROOT)
    return ftp


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

    last_error: Exception | None = None
    ftp_errors = ftplib.all_errors + (OSError, socket.timeout)
    for attempt in range(1, 4):
        ftp: ftplib.FTP | None = None
        try:
            print(f"Conectando ao InfinityFree (tentativa {attempt}/3)...")
            ftp = connect(host, user, password)
            count, total = upload_tree(ftp)
            try:
                ftp.quit()
            except Exception:
                ftp.close()
            print(f"Deploy concluído: {count} arquivos, {total} bytes enviados para {REMOTE_ROOT}.")
            return 0
        except ftp_errors as exc:
            last_error = exc
            print(f"Falha na tentativa {attempt}: {exc}", file=sys.stderr)
            try:
                if ftp is not None:
                    ftp.close()
            except Exception:
                pass
            if attempt < 3:
                time.sleep(attempt * 3)

    print(f"Deploy FTP falhou após 3 tentativas: {last_error}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
