
# ZegoCloud One-on-One Calling Setup

## 1. Credentials
Go to [ZegoCloud Admin Console](https://console.zegocloud.com/) and create a project.
Get your App ID and Server Secret.

Add to Vercel/Environment:
| Variable | Value |
| :--- | :--- |
| `NEXT_PUBLIC_ZEGO_APP_ID` | Your App ID (Number) |
| `NEXT_PUBLIC_ZEGO_SERVER_SECRET` | Your Server Secret (String) |

*Note: For testing convenience in a prototype, we use `NEXT_PUBLIC_` for the secret. In a strict production app, tokens should be generated on a secure server.*

## 2. RTDB Rules
Update your Firebase Realtime Database rules to allow signaling:

```json
{
  "rules": {
    "calls": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null"
      }
    }
  }
}
```

## 3. How it Works
1. When User A clicks the "Video" icon in Chat, it writes to `calls/UserB` in RTDB.
2. User B has a `CallManager` listening globally. It shows a premium full-screen "Incoming Call" popup.
3. If User B accepts, both are redirected to `/call/[chatId]`.
4. The caller is billed **150 coins/min** for Video or **70 coins/min** for Voice. 
5. The first charge occurs as soon as User B joins the room.
