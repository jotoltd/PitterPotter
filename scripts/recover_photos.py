#!/usr/bin/env python3
"""Restore bookings.photos arrays wiped to NULL while storage files still exist.

Storage files live at content/booking-photos/booking_<id>_photo_<ts>-<ts>.<ext>.
Only touches bookings where photos IS NULL and matching files exist.
Dry-run by default; pass --apply to write.
"""
import json, os, re, ssl, sys, urllib.request

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

BASE = "https://xjtfjlhykfvkckziyvxk.supabase.co"
ANON = None
for line in open(os.path.join(os.path.dirname(__file__), "..", ".env.local")):
    if line.startswith("VITE_SUPABASE_ANON_KEY="):
        ANON = line.split("=", 1)[1].strip().strip('"').strip("'")
assert ANON, "no anon key"
HEADERS = {"apikey": ANON, "Authorization": f"Bearer {ANON}", "Content-Type": "application/json"}
PUB = f"{BASE}/storage/v1/object/public/content/booking-photos/"
NAME_RE = re.compile(r"^booking_(.+)_photo_(\d+)")


def req(method, url, body=None):
    r = urllib.request.Request(url, method=method, headers=HEADERS,
                               data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(r, context=SSL_CTX) as resp:
            return resp.status, json.loads(resp.read() or b"null")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def list_all_objects():
    objs, offset = [], 0
    while True:
        status, data = req("POST", f"{BASE}/storage/v1/object/list/content",
                           {"prefix": "booking-photos/", "limit": 1000, "offset": offset,
                            "sortBy": {"column": "name", "order": "asc"}})
        if status != 200 or not isinstance(data, list):
            print("list failed:", status, data); sys.exit(1)
        objs += data
        if len(data) < 1000:
            break
        offset += 1000
    return objs


def get_bookings_null_photos():
    out, offset = [], 0
    while True:
        status, data = req("GET", f"{BASE}/rest/v1/bookings?photos=is.null"
                                  f"&select=booking_id,name,date,collection_status"
                                  f"&order=date&offset={offset}&limit=1000")
        if status != 200:
            print("bookings fetch failed:", status, data); sys.exit(1)
        out += data
        if len(data) < 1000:
            break
        offset += 1000
    return out


def main():
    apply = "--apply" in sys.argv
    files_by_booking = {}
    for o in list_all_objects():
        m = NAME_RE.match(o.get("name", ""))
        if m:
            files_by_booking.setdefault(m.group(1), []).append((int(m.group(2)), o["name"]))

    null_bookings = get_bookings_null_photos()
    print(f"{len(files_by_booking)} bookings have files in storage; "
          f"{len(null_bookings)} bookings have photos=NULL")

    restored = skipped = 0
    for b in null_bookings:
        bid = b["booking_id"]
        files = files_by_booking.get(bid)
        if not files:
            skipped += 1
            continue
        urls = [PUB + name for _, name in sorted(files)]
        print(f"{b['date']} {b['name'][:24]:24} {bid}  -> restore {len(urls)} photo(s)")
        if apply:
            status, resp = req("PATCH", f"{BASE}/rest/v1/bookings?booking_id=eq.{bid}",
                               {"photos": urls})
            if status in (200, 204):
                restored += 1
            else:
                print(f"  FAILED {status}: {resp}")
        else:
            restored += 1

    print(f"\n{'RESTORED' if apply else 'WOULD RESTORE'}: {restored} bookings, "
          f"{skipped} have no files (never photographed)")


if __name__ == "__main__":
    main()
