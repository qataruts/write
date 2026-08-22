#!/usr/bin/env python3
"""عيادةُ المحرّك — لوحٌ حيّ يكتب فيه المالك وترى الإدارةُ كلَّ ضربةٍ وحكمَها.
    python3 tools/clinic.py     ⇒  http://127.0.0.1:8733/  (وعلى الشبكة للآيباد)
يكتب كلَّ حدثٍ سطرَ JSON في scratch/clinic.jsonl — تتابعه الإدارةُ لحظيّاً."""
import http.server, json, pathlib, socket, socketserver

ROOT = pathlib.Path(__file__).resolve().parent.parent
LOG = ROOT / "scratch" / "clinic.jsonl"
PORT = 8733

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=str(ROOT), **k)
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")   # لا خبيئةَ في عيادة
        super().end_headers()
    def do_GET(self):
        if self.path in ("/", "/clinic"):
            self.path = "/tools/clinic.html"
        return super().do_GET()
    def do_POST(self):
        if self.path != "/ink":
            self.send_error(404); return
        raw = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        try: payload = json.loads(raw)
        except Exception: payload = {"bad": True}
        with LOG.open("a") as f:
            f.write(json.dumps(payload, ensure_ascii=False) + "\n")
        self.send_response(200); self.send_header("Content-Type", "application/json")
        self.end_headers(); self.wfile.write(b'{"ok":true}')
    def log_message(self, *a): pass

ip = "؟"
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(("8.8.8.8", 80))
    ip = s.getsockname()[0]; s.close()
except Exception: pass
LOG.parent.mkdir(exist_ok=True)
print(f"🩺 العيادةُ مفتوحة:\n   على الماك:    http://127.0.0.1:{PORT}/\n   على الآيباد:  http://{ip}:{PORT}/\nكلُّ ما تكتبه يصل الإدارةَ لحظيّاً.", flush=True)
with socketserver.TCPServer(("", PORT), H) as srv:
    srv.serve_forever()
