#!/usr/bin/env python3
"""Import Google Authenticator (TOTP) secrets into privacyIDEA as assigned tokens.

Input file format (JSON):
    {
        "user1": {"auth_secret": "1RL3LE17LF6CG1JG"},
        "user2": {"auth_secret": "PK6S5WYFE4GKOQ4U"}
    }

Usage:
    python import_google_auth_tokens.py users.json
"""
import argparse
import getpass
import json
import sys

import requests
import urllib3


def prompt(label, default=None, secret=False):
    suffix = f" [{default}]" if default else ""
    if secret:
        val = getpass.getpass(f"{label}{suffix}: ")
    else:
        val = input(f"{label}{suffix}: ").strip()
    return val or default


def authenticate(base_url, user, password, verify):
    r = requests.post(
        f"{base_url}/auth",
        data={"username": user, "password": password},
        verify=verify,
        timeout=15,
    )
    data = r.json()
    if not data.get("result", {}).get("status"):
        msg = data.get("result", {}).get("error", {}).get("message", "auth failed")
        raise SystemExit(f"privacyIDEA auth failed: {msg}")
    return data["result"]["value"]["token"]


def enroll_totp(base_url, jwt, user, realm, secret, verify, serial_prefix):
    serial = f"{serial_prefix}{user}"
    r = requests.post(
        f"{base_url}/token/init",
        headers={"Authorization": jwt},
        data={
            "type": "totp",
            "otpkey": secret,
            "otpkeyformat": "base32",
            "genkey": "0",
            "user": user,
            "realm": realm,
            "serial": serial,
            "timeStep": "30",
            "otplen": "6",
            "hashlib": "sha1",
        },
        verify=verify,
        timeout=15,
    )
    try:
        data = r.json()
    except ValueError:
        raise RuntimeError(f"non-JSON response (HTTP {r.status_code})")
    result = data.get("result", {})
    if not result.get("status") or not result.get("value"):
        msg = result.get("error", {}).get("message") or f"HTTP {r.status_code}"
        raise RuntimeError(msg)
    return serial


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("file", help="JSON file with {username: {auth_secret: ...}}")
    ap.add_argument("--prefix", default="TOTP-", help="Token serial prefix (default: TOTP-)")
    args = ap.parse_args()

    with open(args.file) as f:
        users = json.load(f)
    if not users:
        sys.exit("No users in input file.")

    print(f"Loaded {len(users)} user(s) from {args.file}\n")

    base_url = prompt("privacyIDEA URL", "https://localhost:5443").rstrip("/")
    admin = prompt("Admin username", "admin")
    password = prompt("Admin password", secret=True)
    realm = prompt("Target realm", "defrealm")
    verify = prompt("Verify SSL? (y/n)", "n").lower().startswith("y")
    if not verify:
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    print("\nAuthenticating to privacyIDEA...")
    jwt = authenticate(base_url, admin, password, verify)
    print("OK\n")

    ok, fail = [], []
    for user, info in users.items():
        secret = (info or {}).get("auth_secret")
        if not secret:
            print(f"  SKIP {user}  (no auth_secret)")
            fail.append(user)
            continue
        try:
            serial = enroll_totp(base_url, jwt, user, realm, secret, verify, args.prefix)
            print(f"  OK   {user}  -> {serial}")
            ok.append(user)
        except Exception as e:
            print(f"  ERR  {user}  ({e})")
            fail.append(user)

    print(f"\nDone. {len(ok)} enrolled, {len(fail)} failed.")
    sys.exit(0 if not fail else 1)


if __name__ == "__main__":
    main()
