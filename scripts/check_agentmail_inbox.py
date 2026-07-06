import requests


def check_agentmail_inbox():
    url = "https://api.agentmail.to/v0/inbox/check"
    headers = {"Authorization": "Bearer $AGENTMAIL_API_KEY"}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        replies = data.get(replies, [])
        auto_responders = data.get(auto_responders, [])
        sales = data.get(sales, [])
        return {
            reply_count: len(replies),
            repliers: [reply[sender] for reply in replies],
            sales: sales
        }
    else:
        print(response.text)
        return {"error": "Failed to check inbox"}

if __name__ == "__main__":
    result = check_agentmail_inbox()
    print(result)
