---
title: '写一个简单的 Telegram 机器人'
categories: 网站与服务端
tags: [Telegram]
date: 2020-04-23 16:02:50
---

应 [DN42 Telegram 群](https://t.me/Dn42Chat)群友的要求，我打算给我的 [Bird Looking Glass](/article/modify-website/go-bird-looking-glass.lantian) 加上 Telegram Bot 的支持，方便群友现场查询 Whois、测试网络通断、检查~~漏油~~路由泄漏源头等。这个 Bot 要能识别以斜线 `/` 开头的命令，然后对命令消息进行回复。

我的 Looking Glass 使用 Go 语言写成，因此我一开始先查找了 Go 语言的 Telegram Bot API。但流行的 API 库无一例外都遵循了同样的请求结构：

- Telegram 服务器发送一个回调到自己的服务器；
- 自己的程序处理请求，期间可能根据本地配置的 Token 向 Telegram 服务器多次主动请求；
- 自己的程序最终主动请求 Telegram 服务器，发送回复信息。

这套方案功能强大，但有点复杂，而多余的功能我根本用不上。我更希望使用 [Telegram 官方提供的另一种方式](https://core.telegram.org/bots/faq#how-can-i-make-requests-in-response-to-updates)，直接回复回调 HTTP 请求的方式：

- Telegram 服务器发送一个回调到自己的服务器；
- 自己的程序处理请求后，直接以 HTTP Response 方式回复回调请求，执行操作。

虽然这种方法限制我对一个请求只能做出一个回复，但因为我的 Bot 也只需要回复一次，对我来说已经够用。同时这种方法也具有以下的优点：

1. 写起程序来极其简单，根本不需要第三方库。
2. 服务端无需知道 Token，减少了配置量。同时也可以创建多个机器人，仅以回调地址区分。
3. 消除了额外 HTTP 请求的 CPU 周期、网络流量及延迟的消耗。

解析回调请求
----------

Telegram 的回调请求以 JSON 发送，附在 HTTP POST 请求的 Body 上。Telegram 官方文档中给出了一个例子：

```json
{
  "update_id":10000,
  "message":{
    "date":1441645532,
    "chat":{
      "last_name":"Test Lastname",
      "id":1111111,
      "first_name":"Test",
      "username":"Test"
    },
    "message_id":1365,
    "from":{
      "last_name":"Test Lastname",
      "id":1111111,
      "first_name":"Test",
      "username":"Test"
    },
    "text":"/start"
  }
}
```

作为一个只关心命令本身的机器人，在这些请求中，我们只需要提取这些内容：

- `message/message_id`：消息的编号，回复时需要设置这个编号以“回复/引用”原始消息。
- `message/chat/id`：聊天窗口的编号。
- `message/text`：用户发送的命令。

Go 语言解析 JSON 没有 Python 那么方便。不像 Python 直接解析然后当作一个 `dict` 访问，Go 语言中我们需要自己建好基本的数据结构来接收需要的信息。因此建立如下数据结构：

```go
type tgChat struct {
  ID int64 `json:"id"`
}

type tgMessage struct {
  MessageID int64  `json:"message_id"`
  Chat      tgChat `json:"chat"`
  Text      string `json:"text"`
}

type tgWebhookRequest struct {
  Message tgMessage `json:"message"`
}
```

然后用这样一个函数来处理 `net/http` 服务器收到的请求：

```go
func webHandlerTelegramBot(w http.ResponseWriter, r *http.Request) {
  // Parse only needed fields of incoming JSON body
  var err error
  var request tgWebhookRequest
  err = json.NewDecoder(r.Body).Decode(&request)
  if err != nil {
    println(err.Error())
    return
  }

  ...
}
```

提取指令目标
----------

当 Telegram 用户调用 Bot 时，根据用户输入的不同，可能包含额外的参数，或者机器人的 Telegram ID。以调用 `/traceroute` 命令为例，可能是如下任意一种：

| 用户输入的命令（`message/text`）            | 命令本身      | 命令的参数      |
| ---------------------------------------- | ------------ | ------------- |
| `/traceroute`                            | `traceroute` | 无            |
| `/traceroute lantian.pub`                | `traceroute` | `lantian.pub` |
| `/traceroute@lantian_lg_bot`             | `traceroute` | 无            |
| `/traceroute@lantian_lg_bot lantian.pub` | `traceroute` | `lantian.pub` |

因此需要考虑各种情况进行解析：

```go
// 使用这个函数判断某条消息是不是要执行某个命令
func telegramIsCommand(message string, command string) bool {
  b := false
  b = b || strings.HasPrefix(message, "/"+command+"@")
  b = b || strings.HasPrefix(message, "/"+command+" ")
  b = b || message == "/"+command
  return b
}

// 使用这段代码提取参数
target := ""
if strings.Contains(request.Message.Text, " ") {
  target = strings.Join(strings.Split(request.Message.Text, " ")[1:], " ")
}
```

构建回复消息
----------

返回给 Telegram 回调的响应信息同样是一个 JSON，含有如下内容：

- `method`：响应的类型，在我的用例中固定为 `sendMessage`，即发送消息。
- `chat_id`：聊天窗口编号，与回调请求相同。
- `text`：回复的具体内容，根据需要由程序设置。
- `reply_to_message_id`：回复哪条信息，设置为回调请求中的 `message_id`。
- `parse_mode`：设置为 `Markdown` 可以让 Telegram 以 Markdown 格式解析文本，也可以去掉。

在 Go 中的结构体如下：

```go
type tgWebhookResponse struct {
  Method           string `json:"method"`
  ChatID           int64  `json:"chat_id"`
  Text             string `json:"text"`
  ReplyToMessageID int64  `json:"reply_to_message_id"`
  ParseMode        string `json:"parse_mode"`
}
```

然后将 JSON 序列化并作为 HTTP 响应输出即可。注意要设置 `Content-Type: application/json`，否则 Telegram 服务器将不会解析这段 JSON，也就不会执行任何操作。

```go
commandResult = "Hello World"
if len(commandResult) > 0 {
  // Create a JSON response
  w.Header().Add("Content-Type", "application/json")
  response := &tgWebhookResponse{
    Method:           "sendMessage",
    ChatID:           request.Message.Chat.ID,
    Text:             commandResult,
    ReplyToMessageID: request.Message.MessageID,
    ParseMode:        "Markdown",
  }
  data, err := json.Marshal(response)
  if err != nil {
    println(err.Error())
    return
  }
  // println(string(data))
  w.Write(data)
}
```

完整示例
-------

以上代码均节选自我的 [Go 语言 Bird Looking Glass](/article/modify-website/go-bird-looking-glass.lantian)，完整的代码可以在以下地址看到：

- 最新版本：[https://github.com/xddxdd/bird-lg-go/blob/master/frontend/telegram_bot.go](https://github.com/xddxdd/bird-lg-go/blob/master/frontend/telegram_bot.go)
- 写本文时的版本：[https://github.com/xddxdd/bird-lg-go/blob/c262ee3bdf26b963d6320483cae856f186a1f59b/frontend/telegram_bot.go](https://github.com/xddxdd/bird-lg-go/blob/c262ee3bdf26b963d6320483cae856f186a1f59b/frontend/telegram_bot.go)
