# Lotto (Solidity EVM contracts)

These contracts have not been audited, use in production at your own risk.


# How does it work?
### Allows the running of lottery games with `startGame()`, where players acquire tickets with `gameToken` (ERC20), at `gameTicketPrice`, with a total of `gameMaxPlayers`, playing up to `gameMaxTicketsPlayer` each. Players can `buyTicket()` at `_numberOfTickets`.

### Player's `gameToken` are transfered to the contract, the winner receives the total `_pot` of all player `gameToken` on contract, and any additional game pots defined with `addGamePotERC20Asset()` or `addGamePotERC721Asset()`, in `endGame()`. Minus `gameFeePercent` (hundredth) fee to `gameFeeAddress`.


## Requirements
### Tools
`npm install -g solc truffle`

### Configuration
Truffle `optimizer` **MUST** be `true`, in order to compile these contracts. Use a low `run` value, to compile faster in testing scenarios.


## Local development
`npm install`

## Testing
`truffle test`

## Front-end
https://github.com/caedmo/lotto-nextjs