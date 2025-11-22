import requests

url = "http://127.0.0.1:5000/api/orders/ORD00001/apply-discount"

payload = {
    "discountID": 1,
    "orderNo": 1
}

response = requests.post(url, json=payload)

print("Status:", response.status_code)
print("Response:", response.json())
