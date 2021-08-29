---
title: '用 Drone CI 替换掉 Jenkins'
categories: 网站与服务端
tags: [CI, Jenkins, Drone]
date: 2021-08-29 02:18:32
---

Jenkins 是一款免费开源的 CI/CD（持续集成、部署）软件，被广泛应用在各种场景中。Jenkins 的主要优势在于其包罗万象的插件，可以完成各种任务，例如自动执行 [SCP](https://plugins.jenkins.io/scp/)、[Ansible](https://plugins.jenkins.io/ansible/) 等部署，[Cppcheck](https://plugins.jenkins.io/cppcheck/) 等代码分析，[Telegram](https://plugins.jenkins.io/telegram-notifications/)、[钉钉](https://plugins.jenkins.io/dingding-notifications/)等状态通知。

我之前也将 Jenkins 用于大量任务的自动化执行，例如[我的 Dockerfile 镜像](https://github.com/xddxdd/dockerfiles)的自动更新，你正在浏览的 Hexo 博客的部署，甚至还有[原神自动签到](https://github.com/y1ndan/genshinhelper)。

但是 Jenkins 是一款拥有悠久历史的 CI，其前身 Hudson 早在 2005 年就发布了。因此，Jenkins 执行任务时依然是传统的直接执行命令，而非使用 Docker 容器等现代化的方式。这意味着 CI 执行的成功与否很大程度上依赖 Worker 主机的系统环境。例如，前段时间我租了一台配置更高的服务器，由于重新搭建了环境，导致 CI 执行过程中出现一堆莫名其妙的问题，花了一个星期才全部发现解决。

此外，Jenkins 用 Java 写成，因此它的内存占用相当恐怖，一个 Jenkins 实例的内存占用可以达到 1GB 以上，导致它完全没法用在低配置的主机上，即使是最简单的任务也不行。而且，Jenkins 强大的插件功能却难以用配置文件的方式调用。有很多插件都没有实现通过 Jenkinsfile 配置参数的功能，遇到这种插件只能在 Jenkins 网页上逐个配置，麻烦、容易出错。

相比之下，[Drone](https://www.drone.io/) 这款基于容器的 CI 是一个更现代化的选择。Drone 推荐使用 [基于 Docker 容器的 Worker（官方称为 Runner）](https://readme.drone.io/runner/docker/overview/)。由于使用容器作为运行环境，Drone 可以发挥容器的最大优势：运行环境的一致性。只要容器镜像一致，就可以保证 CI 的命令每次都在相同环境下执行，输出的结果也将是稳定的。当然，如果你的脚本无论如何无法在容器中运行，Drone 也提供[直接执行命令](https://readme.drone.io/runner/exec/overview/)或是[在 DigitalOcean 云服务器中运行](https://readme.drone.io/runner/digitalocean/overview/)的 Runner。

Drone 还有很多其它的优势：Drone 使用 Go 语言写成，其内存占用仅是 Jenkins 的十分之一；Drone 的配置文件语言是 YAML 或者 Jsonnet，不需要像 Jenkins 一样学一种专用语言；[Drone 的插件](http://plugins.drone.io/)虽然相比 Jenkins 较少，但全部都是 Docker 容器，可以统一在配置文件中调用。

|          | Jenkins                              | Drone                                                    |
| -------- | ------------------------------------ | -------------------------------------------------------- |
| 运行环境 | Worker 系统环境                      | 可选 Docker 容器，Worker 系统环境，DigitalOcean 云服务器 |
| 配置文件 | 专用语言 Jenkinsfile                 | 通用语言 YAML/Jsonnet                                    |
| 插件数量 | 多，1836 个（本文写成日）            | 少，102 个                                               |
| 插件配置 | 主要在网页端，只有少量能通过配置文件 | 统一在配置文件中                                         |
| 开发语言 | Java                                 | Go                                                       |
| 内存占用 | 多，1GB 左右                         | 少，100MB 左右                                           |

## 安装 Drone

作为一款容器化的 CI，Drone 本体也是一个 Docker 容器，通过环境变量的方式进行配置。Drone 可以对接 [GitHub](https://readme.drone.io/server/provider/github/)、[GitLab](https://readme.drone.io/server/provider/gitlab/)、[Gitea](https://readme.drone.io/server/provider/gitea/) 和 [BitBucket](https://readme.drone.io/server/provider/bitbucket-cloud/)，请参照链接中的官方文档进行配置。但是一个 Drone 实例只能同时对接其中一个。如果你像我一样需要同时接 GitHub 和自己的 Gitea，就需要运行两套 Drone。

如果你准备将 Drone 用于部署，你需要一种方法把部署密钥传进 Drone。我用的是 [Vault](https://www.vaultproject.io/) 这款密钥管理软件，[Drone 官方提供了 Vault 的支持](https://docs.drone.io/secret/external/vault/)。当然，你也可以把密钥直接存在 Drone 中，但不能在网页端直接操作，而是必须[使用 Drone 的命令行工具](https://readme.drone.io/secret/)。

以下是我的配置供参考，部署了 Vault、Drone：

```yaml
version: '2.4'
services:
    # 密钥管理，Vault 实例，和 Drone 的插件
    vault:
        image: vault
        container_name: vault
        restart: unless-stopped
        command: 'server'
        labels:
            - com.centurylinklabs.watchtower.enable=false
        volumes:
            - './conf/vault:/vault/config:ro'
            - './data/vault:/vault/file'

    drone-vault:
        image: drone/vault
        container_name: drone-vault
        restart: unless-stopped
        environment:
            DRONE_DEBUG: 'true'
            DRONE_SECRET: '***drone-vault 的密钥***'
            VAULT_ADDR: 'https://vault.lantian.pub'
            VAULT_TOKEN: '***Vault 的密钥***'
        depends_on:
            - vault

    # 第一套 Drone，用于我自己的 Gitea
    drone:
        image: drone/drone:2
        container_name: drone
        restart: unless-stopped
        environment:
            DRONE_GITEA_SERVER: 'https://git.lantian.pub'
            DRONE_GITEA_CLIENT_ID: '***Gitea 的 OAuth ID***'
            DRONE_GITEA_CLIENT_SECRET: '***Gitea 的 OAuth 密钥***'
            DRONE_RPC_SECRET: '***Drone Runner 的密钥，用 openssl rand -hex 16 生成***'
            DRONE_SERVER_HOST: ci.lantian.pub
            DRONE_SERVER_PROTO: https
            DRONE_USER_CREATE: username:lantian,admin:true # 配置管理员账号
            DRONE_JSONNET_ENABLED: 'true'
            DRONE_STARLARK_ENABLED: 'true'
        volumes:
            - './data/drone:/data'

    # 第一套 Drone 的 Docker Runner
    drone-runner-docker:
        image: drone/drone-runner-docker:1
        container_name: drone-runner-docker
        restart: unless-stopped
        environment:
            DRONE_RPC_PROTO: https
            DRONE_RPC_HOST: ci.lantian.pub
            DRONE_RPC_SECRET: '***Drone 的密钥，与上面的 DRONE_RPC_SECRET 一致'
            DRONE_RUNNER_CAPACITY: 4 # 并行任务数
            DRONE_RUNNER_NAME: drone-docker
            DRONE_SECRET_PLUGIN_ENDPOINT: http://drone-vault:3000
            DRONE_SECRET_PLUGIN_TOKEN: '***drone-vault 的密钥***'
        volumes:
            - '/var/run:/var/run'
            - '/cache:/cache'
        depends_on:
            - drone
            - drone-vault

    # 第二套 Drone，用于 GitHub
    drone-github:
        image: drone/drone:2
        container_name: drone-github
        restart: unless-stopped
        environment:
            DRONE_GITHUB_CLIENT_ID: '**GitHub 的 OAuth ID**'
            DRONE_GITHUB_CLIENT_SECRET: '***GitHub 的 OAuth 密钥***'
            DRONE_RPC_SECRET: '***Drone Runner 的密钥，用 openssl rand -hex 16 生成***'
            DRONE_SERVER_HOST: ci-github.lantian.pub
            DRONE_SERVER_PROTO: https
            DRONE_USER_CREATE: username:xddxdd,admin:true # 配置管理员账号
            DRONE_REGISTRATION_CLOSED: 'true' # 禁止新用户注册
            DRONE_JSONNET_ENABLED: 'true'
            DRONE_STARLARK_ENABLED: 'true'
        volumes:
            - './data/drone-github:/data'

    # 第二套 Drone 的 Docker Runner
    drone-github-runner-docker:
        image: drone/drone-runner-docker:1
        container_name: drone-github-runner-docker
        restart: unless-stopped
        environment:
            DRONE_RPC_PROTO: https
            DRONE_RPC_HOST: ci-github.lantian.pub
            DRONE_RPC_SECRET: '***Drone 的密钥，与上面的 DRONE_RPC_SECRET 一致'
            DRONE_RUNNER_CAPACITY: 4 # 并行任务数
            DRONE_RUNNER_NAME: drone-docker
            DRONE_SECRET_PLUGIN_ENDPOINT: http://drone-vault:3000
            DRONE_SECRET_PLUGIN_TOKEN: '***drone-vault 的密钥***'
        volumes:
            - '/var/run:/var/run'
            - '/cache:/cache'
        depends_on:
            - drone-github
            - drone-vault
```

## 基本的 Drone 自动构建与部署

搭建完 Drone 后，下一步是添加构建任务。这里我以部署我的 Hexo 博客为例。

我的博客本身有一套部署脚本，执行以下任务：

-   安装 node_modules
-   `hexo generate`
-   `hexo deploy` 到 GitHub Pages 上（作为备用）
-   把所有图片都转一遍 WebP，所有静态资源都提前用 Gzip、Brotli 压缩好
-   把生成的文件用 Ansible 批量 Rsync 到所有服务器上

此外，由于我的博客用了 Dependabot 来更新依赖包，Dependabot 时不时会发起 Pull Request。显然，处理 Pull Request 时不能执行部署的步骤，只能尝试 generate 一下看会不会失败。

于是我们可以先写一个最基本的配置，保存为 `.drone.yaml`：

```yaml
kind: pipeline
type: docker
name: default

trigger:
    branch:
        - master

steps:
    - name: hexo generate
      image: node:15-alpine
      commands:
          # 其实没必要装这么多包，只是为了与 deploy 一步统一
          - apk add --no-cache build-base bash git openssh wget python3 gzip brotli zstd parallel imagemagick
          - npm install
          - node_modules/hexo/bin/hexo generate

    - name: hexo deploy
      image: node:15-alpine
      commands:
          # 装包
          - apk add --no-cache build-base bash git openssh wget python3 gzip brotli zstd parallel imagemagick
          - node_modules/hexo/bin/hexo deploy
      # 收到 Dependabot 的 PR 时不要部署
      when:
          event:
              exclude:
                  - pull_request

    # 略过一些后续步骤
```

这一段配置可以生成出静态网页文件，可以尝试运行 `hexo deploy`，但是由于缺少 SSH 密钥不会部署成功。由于显而易见的原因，我不会推荐你把 SSH 密钥直接写死在配置文件中。你应该将密钥添加到 Vault（或者 Drone 的密钥存储中），然后在配置文件中调用：

```yaml
# 从 Vault 获取 SSH 密钥，当前仓库在 Drone 中必须设置为 Trusted 状态
kind: secret
name: id_ed25519
get:
    # 注意这里对应的 Vault 显示的路径是 kv/ssh，data 一项是必须加的
    path: kv/data/ssh
    name: id_ed25519

---
kind: pipeline
type: docker
name: default

# ...

steps:
    # ...
    - name: hexo deploy
      image: node:15-alpine
      environment:
          # 调用上面从 Vault 获取到的 SSH 密钥，设置为环境变量
          SSH_KEY:
              from_secret: id_ed25519
      commands:
          # 安装 SSH 密钥
          - mkdir -p /root/.ssh/
          - echo "$SSH_KEY" > /root/.ssh/id_ed25519
          - chmod 600 /root/.ssh/id_ed25519

          # 配置 SSH，主要是禁用验证 SSH 主机密钥，如果不禁用会登录失败
          - |
              cat <<EOF >/root/.ssh/config
              StrictHostKeyChecking no
              UserKnownHostsFile=/dev/null
              VerifyHostKeyDNS yes
              LogLevel ERROR
              EOF

          # 装包...略
```

这样 CI 容器中就有 SSH 密钥文件，可以通过 SSH 连接 GitHub 或者其它部署目标了。

但是这里还有一个问题：每次构建启动时，容器里都是一个干净的环境，也就是没有 `node_modules`，也就意味着每次构建时都要花大量时间下载~~这个黑洞~~。

好消息是 Drone 提供了一个插件，可以把过程中的文件夹打包缓存，下次部署时解压使用：

```yaml
# ...
steps:
    # 恢复上次缓存的文件：
    - name: restore cache
      image: meltwater/drone-cache:dev
      settings:
          backend: 'filesystem'
          restore: true
          cache_key: 'volume'
          archive_format: 'gzip'
          filesystem_cache_root: '/cache'
          # 缓存这两个文件夹
          mount:
              - 'node_modules'
              - 'img_cache'
      volumes:
          - name: cache
            path: /cache

    - name: hexo generate
      # ...

    # 把这次的文件缓存：
    - name: rebuild cache
      image: meltwater/drone-cache:dev
      settings:
          backend: 'filesystem'
          rebuild: true
          cache_key: 'volume'
          archive_format: 'gzip'
          filesystem_cache_root: '/cache'
          # 缓存这两个文件夹
          mount:
              - 'node_modules'
              - 'img_cache'
      volumes:
          - name: cache
            path: /cache

# 缓存文件会保存到宿主机的 /cache 文件夹，需要仓库在 Drone 中设置为 Trusted 状态
volumes:
    - name: cache
      host:
          path: /cache
```

此外，部署失败时，可以通过 Telegram 插件发送通知：

```yaml
# 从 Vault 获取 Telegram 的 token 和目标账号
kind: secret
name: tg_token
get:
    path: kv/data/telegram
    name: token

---
kind: secret
name: tg_target
get:
    path: kv/data/telegram
    name: target

---
# ...
steps:
    # ...

    # 失败时通过这个任务通知
    - name: telegram notification for failure
      image: appleboy/drone-telegram
      settings:
          token:
              from_secret: tg_token
          to:
              from_secret: tg_target
      when:
          status:
              - failure

    # 成功时通过这个任务通知，注意如果是定时任务触发则不会发送成功通知
    - name: telegram notification for success
      image: appleboy/drone-telegram
      settings:
          token:
              from_secret: tg_token
          to:
              from_secret: tg_target
      when:
          branch:
              - master
          status:
              - success
          event:
              exclude:
                  - cron
```

这样我们就有了一个带部署、带缓存、带 Telegram 通知的 Drone 配置。

## 矩阵构建（Matrix Build）

有的时候我们需要在多种不同的环境下测试程序，例如 Python 2.7/3.6/3.7/3.8/3.9，GCC/Clang 等等。Drone 支持 Jsonnet 配置文件格式，可以批量定义任务。

[以我的 route-chain 项目为例](https://github.com/xddxdd/route-chain/blob/master/.drone.jsonnet)，此处作为例子简化了部分内容：

```json
// 定义一个“函数”，用于创建一条流水线
local DebianCompileJob(image, kernel_headers) = {
  "kind": "pipeline",
  "type": "docker",
  "name": image,
  "steps": [
    {
      "name": "build",
      "image": image,
      "commands": [
        "apt-get update",
        "DEBIAN_FRONTEND=noninteractive apt-get -y --no-install-recommends install build-essential " + kernel_headers,
        "make"
      ]
    },
    {
      "name": "telegram notification",
      "image": "appleboy/drone-telegram",
      "settings": {
        "token": {
          "from_secret": "tg_token"
        },
        "to": {
          "from_secret": "tg_target"
        }
      }
    }
  ]
};

[
  // Telegram 的 token 和目标账号
  {
    "kind": "secret",
    "name": "tg_token",
    "get": {
      "path": "kv/data/telegram",
      "name": "token"
    }
  },
  {
    "kind": "secret",
    "name": "tg_target",
    "get": {
      "path": "kv/data/telegram",
      "name": "target"
    }
  },
  // 批量调用 DebianCompileJob 创建任务，对于不同镜像和头文件包名
  DebianCompileJob('debian:jessie', 'linux-headers-amd64'),
  DebianCompileJob('debian:stretch', 'linux-headers-amd64'),
  DebianCompileJob('debian:buster', 'linux-headers-amd64'),
  DebianCompileJob('debian:bullseye', 'linux-headers-amd64'),
  DebianCompileJob('debian:unstable', 'linux-headers-amd64'),
  DebianCompileJob('ubuntu:xenial', 'linux-headers-generic'),
  DebianCompileJob('ubuntu:bionic', 'linux-headers-generic'),
  DebianCompileJob('ubuntu:focal', 'linux-headers-generic'),
]
```

保存为 `.drone.jsonnet`，然后在 Drone 中将配置文件名从 `.drone.yaml` 改为 `.drone.jsonnet` 即可。

## 提前退出构建

在矩阵构建中，有的时候我们不需要运行所有的任务。例如[我的 Dockerfiles 仓库](https://github.com/xddxdd/dockerfiles)，我不需要每次提交都重新构建所有的 14（个镜像）乘以 8（种架构）共 112 种情况。

好在 Drone 支持提前终止构建流水线，只要在某个步骤退出时将返回码设置成 78，类似这样：

```yaml
# ...
steps:
    # ...
    - name: skip build
      image: alpine
      commands:
          - ./should_build.sh && exit 0 || exit 78
```

实际例子可以[在 Dockerfiles 仓库的这个 commit 看到](https://github.com/xddxdd/dockerfiles/blob/4268d0f076ee76efdff670e2f9b0dae5961a968f/.drone.jsonnet)。

不过由于 Drone 使用容器构建，容器本身启动的速度就有点慢，启动 112 条流水线本身就要消耗十几分钟的时间，即使任务立即退出。因此，[我后来将 Dockerfiles 仓库调整成了一个架构一条流水线](https://github.com/xddxdd/dockerfiles/blob/master/.drone.jsonnet)，每条流水线根据 commit 消息判断要构建哪些镜像，这样只需要启动 8 条流水线，空跑耗时不会太长。
