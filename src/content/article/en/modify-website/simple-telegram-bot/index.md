---
title: 'Writing a Simple Telegram Bot'
categories: 'Website and Servers'
tags: [Telegram]
date: 2020-04-23 16:02:50
---

Based on the requests of [DN42 Telegram Group](https://t.me/Dn42Chat) members, I plan to add Telegram Bot support to my [Bird Looking Glass](/en/article/modify-website/go-bird-looking-glass.lantian), so it is easier for them to look up whois information, testing networks and finding sources of route leaks. The bot is supposed to recognize commands starting with `/`, and respond to the message.

My Looking Glass is written in Go, so at the beginning, I looked for Telegram Bot APIs in the Go language. However, those popular API libraries all use the same scheme for handling requests:

- Telegram server sends a callback to my own server;
- My program handles the request and may send multiple requests actively to the Telegram server, authenticated with a locally configured Token;
- Finally, the program actively sends a request to the Telegram server to send the response.

While powerful, this scheme is a bit too complicated, and I don't need the extra functionalities anyway. I rather prefer to use [the other way provided by Telegram](https://core.telegram.org/bots/faq#how-can-i-make-requests-in-response-to-updates), by directly responding to the callback HTTP request:

- Telegram server sends a callback to my own server;
- My program handles the request and replies to the callback request directly to send the response message.

Although this has the limitation of one reply (or action) per request (or message), this is enough for me, considering that my bot only needs to reply once anyway. In addition, this scheme has the following benefits:

1. Extremely easy to program, and no dependency on third-party libraries.
2. The server no longer needs the token, which reduces needed configuration efforts and improved security. It's also much easier to configure multiple bots which perform different tasks based on callback URLs.
3. No CPU cycle, network bandwidth, and latency spent on the extra HTTP requests.

Parsing Callback Requests
-------------------------

Telegram's callback requests are sent as JSON attached to the body of HTTP POST requests. Telegram's official document provided an example:

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

As a bot that only cares about the command itself, we only need to extract the following information from the request:

- `message/message_id`: ID of the message, needed to reply/quote the original message.
- `message/chat/id`: ID of the chat window.
- `message/text`: Command from the user.

Compared to Python, which parses JSON directly and formats it into a `dict`, Go's approach is more complicated, where we have to set up data structures to store the needed messages. Therefore the following structure is needed:

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

And this function is used to handle requests from the `net/http` server:

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

Extracting Command Arguments
----------------------------

When a Telegram user calls a bot, based on user input differences, the command may contain extra parameters or the Telegram ID of the bot itself. Suppose we're calling the `/traceroute` command, the input may be any of:

| User command (`message/text`)            | Command      | Argument      |
| ---------------------------------------- | ------------ | ------------- |
| `/traceroute`                            | `traceroute` | None          |
| `/traceroute lantian.pub`                | `traceroute` | `lantian.pub` |
| `/traceroute@lantian_lg_bot`             | `traceroute` | None          |
| `/traceroute@lantian_lg_bot lantian.pub` | `traceroute` | `lantian.pub` |

So while parsing we need to consider all possibilities:

```go
// Used to check if a command is the intended one
func telegramIsCommand(message string, command string) bool {
  b := false
  b = b || strings.HasPrefix(message, "/"+command+"@")
  b = b || strings.HasPrefix(message, "/"+command+" ")
  b = b || message == "/"+command
  return b
}

// Used to extract parameters
target := ""
if strings.Contains(request.Message.Text, " ") {
  target = strings.Join(strings.Split(request.Message.Text, " ")[1:], " ")
}
```

Construct Reply
---------------

The response message to Telegram's callback is also a JSON, containing the following contents:

- `method`: Type of response, hardcoded to `sendMessage` in my case.
- `chat_id`: ID of the chat window, same as the request.
- `text`: Content of the message, set in the processing logic as needed.
- `reply_to_message_id`: ID of the message to be replied, set to `message_id` in request.
- `parse_mode`: Set to `Markdown` so Telegram parses your message as Markdown. Or remove if you don't want this.

The structure in Go is:

```go
type tgWebhookResponse struct {
  Method           string `json:"method"`
  ChatID           int64  `json:"chat_id"`
  Text             string `json:"text"`
  ReplyToMessageID int64  `json:"reply_to_message_id"`
  ParseMode        string `json:"parse_mode"`
}
```

Then serialize JSON and output it as an HTTP request. Note that you should set `Content-Type: application/json`, or Telegram won't parse this JSON, nor would it perform any operation.

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

Full example
------------

All code above are taken from by [Bird Looking Glass Written in Go](/en/article/modify-website/go-bird-looking-glass.lantian), with the full code available at:

- Latest version: [https://github.com/xddxdd/bird-lg-go/blob/master/frontend/telegram_bot.go](https://github.com/xddxdd/bird-lg-go/blob/master/frontend/telegram_bot.go)
- Version when writing this post: [https://github.com/xddxdd/bird-lg-go/blob/c262ee3bdf26b963d6320483cae856f186a1f59b/frontend/telegram_bot.go](https://github.com/xddxdd/bird-lg-go/blob/c262ee3bdf26b963d6320483cae856f186a1f59b/frontend/telegram_bot.go)
