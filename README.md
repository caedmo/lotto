# Lotto (Solidity EVM contracts)

These contracts have not been audited, use in production at your own risk.

## How does it work?
Allows the running of single lottery games with `startGame()`, where players acquire tickets with defined `gameToken` (ERC20), at `gameTicketPrice`, with a total of `gameMaxPlayers`, playing up to `gameMaxTicketsPlayer` each. Players can `buyTicket()` at `_numberOfTickets`.

Player's `gameToken` are transfered to the contract, the winner receives the total `_pot` of all player `gameToken` on contract, in `endGame()` (minus optional `gameFeePercent` (hundredth) fee to `gameFeeAddress`).

## Development
```
npm install -g solc truffle
npm install
truffle test
```
