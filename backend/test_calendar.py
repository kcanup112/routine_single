import requests

r = requests.post("http://localhost:8000/auth/login", json={"email":"admin@kec.edu.np","password":"Admin@1234"})
token = r.json()["access_token"]
payload = {"title":"Test","start_date":"2026-04-14","end_date":"2026-04-14","event_type":"holiday","is_all_day":True,"status":"scheduled","description":"","location":""}
r2 = requests.post("http://localhost:8000/api/calendar/", json=payload, headers={"Authorization": "Bearer " + token})
print(r2.status_code)
print(r2.text[:2000])
