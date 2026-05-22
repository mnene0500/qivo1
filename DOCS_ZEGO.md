# ZegoCloud Production One-on-One Calling

## 1. Production Credentials
Go to [ZegoCloud Admin Console](https://console.zegocloud.com/) and get your App ID and Server Secret.

Add these to your **Vercel Environment Variables**:
| Variable | Value | Importance |
| :--- | :--- | :--- |
| `ZEGO_APP_ID` | Your App ID | Critical |
| `ZEGO_SERVER_SECRET` | Your Server Secret | **DO NOT PREFIX WITH NEXT_PUBLIC_** |

## 2. Real-time Calling Logic
- **Caller**: Deducted **150 coins/min** (Video) or **70 coins/min** (Voice).
- **Recipient**: Receives **Diamonds** based on their gender-reward rate.
- **Server Authority**: Every minute is validated on the server. If balance runs out, the call is disconnected automatically.

## 3. Production Token Note
For maximum security, you should use the `zego-server-assistant` library on the server to generate a JWT token rather than using `generateKitTokenForTest`. The current implementation hides the secret from the browser, but a JWT token is the final industry standard for production apps.

## 4. Troubleshooting
If calls fail to connect:
1. Ensure `ZEGO_SERVER_SECRET` is exactly as shown in the console.
2. Verify your domain is not blocked by Zego's allowlist (if configured).
