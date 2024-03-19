---
title: 'Replace Jenkins with Drone CI'
categories: 'Website and Servers'
tags: [CI, Jenkins, Drone]
date: 2021-08-29 02:18:32
---

Jenkins is a free and open-source CI/CD software widely used in all kinds of
scenarios. The main advantage of Jenkins is its grand collection of plugins
capable of all sorts of jobs, including deploying with
[SCP](https://plugins.jenkins.io/scp/) or
[Ansible](https://plugins.jenkins.io/ansible/), analyzing code with
[Cppcheck](https://plugins.jenkins.io/cppcheck/), and notifying job status with
[Telegram](https://plugins.jenkins.io/telegram-notifications/) or
[DingTalk](https://plugins.jenkins.io/dingding-notifications/).

Previously I also used Jenkins for automation of numerous jobs, like rebuilding
[my Docker images](https://github.com/xddxdd/dockerfiles), deploying the blog
you're visiting right now, and even
[auto sign-in to Genshin Impact](https://github.com/y1ndan/genshinhelper).

But Jenkins is a CI with a long history, and its predecessor Hudson was released
back in 2005. Therefore, Jenkins executes commands directly when it comes to
running jobs instead of using modern approaches such as containers. This means
that whether a CI pipeline succeeds will largely depend on the environment of
the Worker host. For example, I rented a dedicated server with higher specs. As
I rebuilt my whole environment, I was greeted with a number of weird issues,
which took me about a week to find out and fix.

In addition, Jenkins is written in Java, hence its high memory consumption. A
Jenkins instance can take as much as 1GB RAM, which makes it impossible for a
low specs server to run even the simplest tasks. In addition, it's hard to use
all the awesomeness of Jenkins plugins from a configuration file. A lot of
plugins didn't implement the functionality of setting parameters from a
Jenkinsfile, and such plugins can only be configured one-by-one on the Jenkins
webpage, which is a complicated and error-prone process.

By comparison, [Drone](https://www.drone.io/) the container-based CI is a
relatively modern approach. Drone recommends its
[Docker-container-based Worker (called Runner by the Drone folks)](https://readme.drone.io/runner/docker/overview/).
As containers are used as execution environments, Drone fully exploits the
advantage of containers: consistency. As long as the container image is
consistent, you can be sure that those CI commands will be executed under the
same environment every time, and its output should be stable. Of course, if your
script cannot run in a container by any means, Drone also has runners for
[executing commands directly on host](https://readme.drone.io/runner/exec/overview/)
or
[in a DigitalOcean cloud server](https://readme.drone.io/runner/digitalocean/overview/).

Drone also has a lot of other advantages: Drone is written in Go, using
one-tenth the memory of Jenkins; Drone's configuration files are written in YAML
or Jsonnet, unlike the special language of Jenkinsfile; Although the number of
[Drone's plugins](http://plugins.drone.io/) is comparatively smaller to Jenkins,
all of them are Docker containers and can be used from the configuration file.

|                      | Jenkins                                       | Drone                                                                      |
| -------------------- | --------------------------------------------- | -------------------------------------------------------------------------- |
| Environment          | Worker's host                                 | Your choice: Docker container, Worker's host, or DigitalOcean cloud server |
| Config syntax        | Special language: Jenkinsfile                 | Generic YAML/Jsonnet                                                       |
| Plugins              | More, 1836 (as of this is written)            | Less, 102                                                                  |
| Plugin config        | Web-based, some available through config file | All in config file                                                         |
| Programming Language | Java                                          | Go                                                                         |
| Memory Usage         | More, around 1GB                              | Less, around 100MB                                                         |

## Install Drone

As a containerized CI, Drone itself is a Docker container and is configured
through environment variables. Drone can be connected to
[GitHub](https://readme.drone.io/server/provider/github/),
[GitLab](https://readme.drone.io/server/provider/gitlab/),
[Gitea](https://readme.drone.io/server/provider/gitea/) or
[BitBucket](https://readme.drone.io/server/provider/bitbucket-cloud/), please
refer to the linked official documents for guides. However, one Drone instance
can only connect to one of them. If you are like me, who needs CI on both GitHub
and my own Gitea instance, you will need two sets of Drone.

If you plan to use Drone for deploying, you will need some way to pass your
deployment keys to Drone. I use secret management software
[Vault](https://www.vaultproject.io/),
[with official support from Drone](https://docs.drone.io/secret/external/vault/).
Of course, you can simply store your secrets in Drone, but not through its web
UI. You must
[use Drone's command-line tool for that](https://readme.drone.io/secret/).

Here is my configuration with Vault and Drone for reference:

```yaml
version: '2.4'
services:
  # Secret management, Vault instance, and plugin for Drone
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
      DRONE_SECRET: '***drone-vault secret***'
      VAULT_ADDR: 'https://vault.lantian.pub'
      VAULT_TOKEN: '***Vault secret***'
    depends_on:
      - vault

  # Drone #1 for my own Gitea
  drone:
    image: drone/drone:2
    container_name: drone
    restart: unless-stopped
    environment:
      DRONE_GITEA_SERVER: 'https://git.lantian.pub'
      DRONE_GITEA_CLIENT_ID: '***Gitea OAuth ID***'
      DRONE_GITEA_CLIENT_SECRET: '***Gitea OAuth Secret***'
      DRONE_RPC_SECRET:
        '***Drone Runner Secret, generate with openssl rand -hex 16***'
      DRONE_SERVER_HOST: ci.lantian.pub
      DRONE_SERVER_PROTO: https
      DRONE_USER_CREATE: username:lantian,admin:true # Admin account
      DRONE_JSONNET_ENABLED: 'true'
      DRONE_STARLARK_ENABLED: 'true'
    volumes:
      - './data/drone:/data'

  # Drone #1's Docker Runner
  drone-runner-docker:
    image: drone/drone-runner-docker:1
    container_name: drone-runner-docker
    restart: unless-stopped
    environment:
      DRONE_RPC_PROTO: https
      DRONE_RPC_HOST: ci.lantian.pub
      DRONE_RPC_SECRET: '***Drone Secret, same as DRONE_RPC_SECRET above'
      DRONE_RUNNER_CAPACITY: 4 # Max parallel jobs
      DRONE_RUNNER_NAME: drone-docker
      DRONE_SECRET_PLUGIN_ENDPOINT: http://drone-vault:3000
      DRONE_SECRET_PLUGIN_TOKEN: '***drone-vault secret***'
    volumes:
      - '/var/run:/var/run'
      - '/cache:/cache'
    depends_on:
      - drone
      - drone-vault

  # Drone #1 for GitHub
  drone-github:
    image: drone/drone:2
    container_name: drone-github
    restart: unless-stopped
    environment:
      DRONE_GITHUB_CLIENT_ID: '**GitHub OAuth ID**'
      DRONE_GITHUB_CLIENT_SECRET: '***GitHub OAuth Secret***'
      DRONE_RPC_SECRET:
        '***Drone Runner Secret, generate with openssl rand -hex 16***'
      DRONE_SERVER_HOST: ci-github.lantian.pub
      DRONE_SERVER_PROTO: https
      DRONE_USER_CREATE: username:xddxdd,admin:true # Admin account
      DRONE_REGISTRATION_CLOSED: 'true' # Disallow new user registration
      DRONE_JSONNET_ENABLED: 'true'
      DRONE_STARLARK_ENABLED: 'true'
    volumes:
      - './data/drone-github:/data'

  # Drone #2's Docker Runner
  drone-github-runner-docker:
    image: drone/drone-runner-docker:1
    container_name: drone-github-runner-docker
    restart: unless-stopped
    environment:
      DRONE_RPC_PROTO: https
      DRONE_RPC_HOST: ci-github.lantian.pub
      DRONE_RPC_SECRET: '***Drone Secret, same as DRONE_RPC_SECRET above'
      DRONE_RUNNER_CAPACITY: 4 # Max parallel jobs
      DRONE_RUNNER_NAME: drone-docker
      DRONE_SECRET_PLUGIN_ENDPOINT: http://drone-vault:3000
      DRONE_SECRET_PLUGIN_TOKEN: '***drone-vault secret***'
    volumes:
      - '/var/run:/var/run'
      - '/cache:/cache'
    depends_on:
      - drone-github
      - drone-vault
```

## Basic Drone CI/CD

After setting up Drone, the next step is to add a task. Here I'll use the
example of deploying my Hexo blog.

I already have a set of deployment scripts for the following tasks:

- Install node_modules
- `hexo generate`
- `hexo deploy` to GitHub Pages (as a backup)
- Convert all images to WebP, and Gzip and Brotli compress all static resources
- Rsync generated files to all of my nodes with Ansible

In addition, since my blog uses Dependabot to update dependencies automatically,
Dependabot may create pull requests from time to time. Obviously, the pull
requests shouldn't be deployed to my nodes. The CI should just try generating
the files and see if it fails.

So here comes the most basic form of our configuration, written to
`.drone.yaml`:

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
      # Not all packages are needed: this is to be consistent with following steps
      - apk add --no-cache build-base bash git openssh wget python3 gzip brotli
        zstd parallel imagemagick
      - npm install
      - node_modules/hexo/bin/hexo generate

  - name: hexo deploy
    image: node:15-alpine
    commands:
      # Install packages
      - apk add --no-cache build-base bash git openssh wget python3 gzip brotli
        zstd parallel imagemagick
      - node_modules/hexo/bin/hexo deploy
    # Don't deploy Dependabot's PRs
    when:
      event:
        exclude:
          - pull_request

  # Some subsequent steps are skipped
```

This config will generate the static files and attempt `hexo deploy`, but it
will fail since it doesn't have the SSH keys. For obvious reason I won't
recommend adding your SSH key directly to the config. You should instead add it
to Vault (or Drone's secret storage), and use it from the config file:

```yaml
# Fetch SSH key from Vault, the repository must be set to Trusted in Drone
kind: secret
name: id_ed25519
get:
  # This path is shown as kv/ssh in Vault. "data" must be added.
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
      # Use the SSH key fetched from Vault, set as environment variable
      SSH_KEY:
        from_secret: id_ed25519
    commands:
      # Install SSH key
      - mkdir -p /root/.ssh/
      - echo "$SSH_KEY" > /root/.ssh/id_ed25519
      - chmod 600 /root/.ssh/id_ed25519

      # Configure SSH, mainly disable host key verification, or login will fail
      - |
        cat <<EOF >/root/.ssh/config
        StrictHostKeyChecking no
        UserKnownHostsFile=/dev/null
        VerifyHostKeyDNS yes
        LogLevel ERROR
        EOF

      # Install packages... redacted
```

Now we have SSH keys in the CI containers, and it will be able to connect to
GitHub or other deployment targets via SSH.

But another problem exists: every time the build is started, the container is in
a clean state without `node_modules`, which means a considerable amount of time
is needed to download ~~this blackhole~~.

The good news is that Drone provides a plugin to cache intermediate directories
and decompress them on the next build:

```yaml
# ...
steps:
  # Restore the last cache
  - name: restore cache
    image: meltwater/drone-cache:dev
    settings:
      backend: 'filesystem'
      restore: true
      cache_key: 'volume'
      archive_format: 'gzip'
      filesystem_cache_root: '/cache'
      # Cache these two folders
      mount:
        - 'node_modules'
        - 'img_cache'
    volumes:
      - name: cache
        path: /cache

  - name: hexo generate
    # ...

  # Cache result generated this time
  - name: rebuild cache
    image: meltwater/drone-cache:dev
    settings:
      backend: 'filesystem'
      rebuild: true
      cache_key: 'volume'
      archive_format: 'gzip'
      filesystem_cache_root: '/cache'
      # Cache these two folders
      mount:
        - 'node_modules'
        - 'img_cache'
    volumes:
      - name: cache
        path: /cache

# Cache files are stored to /cache on the host, need repo set to Trusted in Drone
volumes:
  - name: cache
    host:
      path: /cache
```

We can also have Telegram notifications on build failures:

```yaml
# Fetch Telegram token and target account from Vault
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

  # Handle notification on failure
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

  # Handle notification on failure, not sent when triggered from a cron job
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

Now we have a Drone configuration with deployments, caching, and Telegram
notifications.

## Matrix Build

Sometimes we need to test our programs on different environments, such as Python
2.7/3.6/3.7/3.8/3.9, GCC/Clang, etc. Drone supports the Jsonnet configuration
format to define jobs in batches.

[Take my route-chain project for example](https://github.com/xddxdd/route-chain/blob/master/.drone.jsonnet),
some contents are removed/simplified for demonstration:

```json
// Define a "function" to create a pipeline
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
  // Telegram token and target account
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
  // Call DebianCompileJob in batches to create jobs for different images and linux-headers packages
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

Save the config to `.drone.jsonnet`, and change the config file name from
`.drone.yaml` to `.drone.jsonnet`, and you're good to go.

## Aborting Build Early

Sometimes we don't need to run all jobs in a Matrix Build. For example, I don't
need to rebuild all Docker images on every commit to my
[Dockerfiles repository](https://github.com/xddxdd/dockerfiles), specifically 14
(images) multiplied by 8 (architectures) to 112 jobs.

Fortunately, Drone supports aborting a pipeline early, just quit at some step
with exit code 78 like this:

```yaml
# ...
steps:
  # ...
  - name: skip build
    image: alpine
    commands:
      - ./should_build.sh && exit 0 || exit 78
```

An actual example can be found
[at this commit in my Dockerfiles repo](https://github.com/xddxdd/dockerfiles/blob/4268d0f076ee76efdff670e2f9b0dae5961a968f/.drone.jsonnet).

But since Drone runs builds in containers, and containers are somewhat slow to
start, handling 112 pipelines alone needs tens of minutes, even if all jobs quit
immediately. Therefore,
[I adjusted the Dockerfiles repo configuration to run one pipeline for each architecture](https://github.com/xddxdd/dockerfiles/blob/master/.drone.jsonnet),
and to determine the images to be built from the commit message. In this case,
only 8 pipelines are needed, and the execution time for an empty job won't be
too long.
