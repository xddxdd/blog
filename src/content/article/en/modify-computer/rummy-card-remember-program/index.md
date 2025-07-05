---
title: 'Rummy Card Counting Program'
categories: Computers and Clients
tags: [JS, Rummy]
date: 2016-09-18 16:49:00
image: /usr/uploads/2016/09/2768273810.png
autoTranslated: true
---


In English class, our foreign teacher introduced us to the card game Rummy. This game has no official rules, so there are many variations among players.

The rules our teacher taught us are as follows:

The game requires at least one deck of playing cards, depending on the number of players, with all jokers removed.

At the start, each player is dealt 7 cards. After dealing, flip the top card from the deck and place it aside.

During each player's turn, they must perform the following actions:

1. Choose to take the top card from the face-down deck or take any number of cards from the face-up discard pile.

When taking cards from the discard pile, you must use the bottommost card you picked up during this turn according to condition 2 below. (Cannot keep it in hand or discard it)

2. When the cards in your hand meet the following conditions, you can place them on your table:

2.1. At least 3 cards of the same suit forming a sequence, e.g., ♣A23, ♠10JQ, ♥QKA. (KA2 doesn't count)

2.2. 3 or 4 cards with the same rank but different suits.

For example, ♠3, ♥3, ♣3 is valid, but ♠3, ♠3, ♥3 is invalid. The latter case can only occur when using multiple decks.

2.3. Having a card that can extend sequences or same-rank groups as described in 2.1 and 2.2.

3. When you play a card that makes a sequence or same-rank group impossible to extend further, all players turn face-down (Closed) the cards on their table belonging to that sequence or group.

For example, when using one deck, if there's a sequence ♣A2345 and a same-rank group ♠6, ♥6, ♣6 on the table. The sequence cannot be extended in either direction and should be closed. If a player later plays ♦6, that same-rank group should also be closed.

4. Discard one card from your hand by placing it on top of the discard pile. Ensure all cards in the discard pile remain visible to all players.

5. All players may now check your discarded card. If it can extend sequences or same-rank groups as described in 2.1 and 2.2, other players can call "Rummy" to claim the card and play it immediately.

6. The game ends when a player discards their last card, or when the draw pile is exhausted and no player can use cards from the discard pile according to the rules.

7. Scoring: Each card on the table: 2-9 = 5 points, 10-K = 10 points, A = 15 points.

Each card remaining in hand: 2-9 = -5 points, 10-K = -10 points, A = -15 points.

<hr />

A not so obvious dividing line

<hr />

In actual gameplay, with many players, it's impossible to ensure everyone sees the discard pile and cards on the table, leading to frequent "Rummy" situations. I've been caught several times. Thus, I created a card counting program to track the game state.

Since it needs to work on both computers and phones, this program is web-based using Javascript. There are two versions.

The first version is for single-deck games, offering card tracking, separate display of sequences/same-rank groups, and Rummy alerts. [Access this version here.](https://lab.xuyh0120.win/rummy.htm)

<img src="/usr/uploads/2016/09/2768273810.png" alt="Screenshot 2016-09-18 4.55.44 PM.png" />

The second version supports multi-deck games, tracks cards, and allows adding multiple same-suit sequences, but lacks Rummy alerts. [Access this version here.](https://lab.xuyh0120.win/rummy-log.htm)

(Classmates considered Rummy alerts cheating, so I removed it. I only need program assistance for multi-deck games with many players, so I kept the Rummy alert in the first version since I don't use it there.)

<img src="/usr/uploads/2016/09/878500381.png" alt="Screenshot 2016-09-18 4.56.46 PM.png" />

As usual, view the source code via right-click. Note that PageSpeed compresses the code significantly. You may need Javascript formatting tools for readability.
```
