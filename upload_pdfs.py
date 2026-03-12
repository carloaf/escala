#!/usr/bin/env python3
"""Script para upload em lote de PDFs de Boletim Interno."""
import os
import glob
import requests
import json
import time

API_URL = "http://localhost:3001/api"
EMAIL = "admin@escala.mil.br"
PASSWORD = "admin123"

FOLDERS = [
    "/home/augusto/workspace/searchpdf/uploads/BI 2026/Fevereiro",
    "/home/augusto/workspace/searchpdf/uploads/BI 2026/Marco",
]

def login():
    r = requests.post(f"{API_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
    r.raise_for_status()
    return r.json()["token"]

def upload_pdf(token, filepath):
    filename = os.path.basename(filepath)
    with open(filepath, "rb") as f:
        r = requests.post(
            f"{API_URL}/schedules/upload",
            headers={"Authorization": f"Bearer {token}"},
            files={"pdf": (filename, f, "application/pdf")},
            timeout=60,
        )
    return r.status_code, r.json()

def main():
    print("Fazendo login...")
    token = login()
    print(f"Login OK.\n")

    # Coletar todos os PDFs ordenados por nome (= ordem cronológica)
    all_pdfs = []
    for folder in FOLDERS:
        pdfs = sorted(glob.glob(os.path.join(folder, "*.pdf")))
        all_pdfs.extend(pdfs)

    print(f"Total de PDFs encontrados: {len(all_pdfs)}\n")

    ok = 0
    errors = 0
    for i, filepath in enumerate(all_pdfs, 1):
        name = os.path.basename(filepath)
        print(f"[{i:02d}/{len(all_pdfs)}] Enviando: {name} ... ", end="", flush=True)
        try:
            status, resp = upload_pdf(token, filepath)
            if status == 200:
                count = resp.get("count", "?")
                dates = resp.get("dates", [])
                print(f"OK — {count} registros | datas: {', '.join(dates)}")
                ok += 1
            elif status == 400 and "blockedDates" in resp:
                blocked = resp.get("blockedDates", [])
                print(f"BLOQUEADO (Boletim já existe para: {', '.join(blocked)})")
                errors += 1
            else:
                print(f"ERRO {status}: {resp}")
                errors += 1
        except Exception as e:
            print(f"EXCEÇÃO: {e}")
            errors += 1
        time.sleep(0.5)  # pequena pausa entre uploads

    print(f"\n{'='*60}")
    print(f"Concluído: {ok} OK, {errors} erros/bloqueados de {len(all_pdfs)} arquivos.")

if __name__ == "__main__":
    main()
