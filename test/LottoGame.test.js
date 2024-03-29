const { expect, assert } = require('chai');

// Import utilities from Test Helpers
const { BN, expectEvent, expectRevert, constants } = require('@openzeppelin/test-helpers');

// Load compiled artifacts
const Oracle = artifacts.require('Oracle');
const LottoGame = artifacts.require('LottoGame');
const LottoToken = artifacts.require('LottoToken');

// Start test block
contract('LottoGame', function ([ creator, other ]) {
  let accounts;
  let oracle;
  let token;
  let contract;

  before(async function () {
    accounts = await web3.eth.getAccounts();
    oracle = await Oracle.new({ from: creator });
    contract = await LottoGame.new(oracle.address, { from: creator });
    token = await LottoToken.new(creator, { from: creator });
    decimals = web3.utils.toBN(18);
  });

  it('should allow accounts to buy tickets', async function () {
    let expected, actual;

    let maxPlayers = web3.utils.toBN('3');
    let maxTicketsPlayer = web3.utils.toBN('10');
    let gameFeePercent = web3.utils.toBN('0');
    let ticketPrice = web3.utils.toBN('1').mul(web3.utils.toBN(10).pow(decimals));
    let numberOfTickets = web3.utils.toBN('10');
    let gameFeeAddress = accounts[8];

    // Start game for LottoToken, exactly one token per entry,
    // max three players, max one ticket per player.
    let game0 = await contract.startGame(

      // Token address
      token.address,

      // Game fee address
      gameFeeAddress,

      // Game fee percent
      gameFeePercent,

      // Ticket price
      ticketPrice,

      // Max players
      maxPlayers,

      // Max player tickets
      maxTicketsPlayer,

      {from: accounts[0]}
    )

    // console.log(game0.logs[0].args.gameNumber);
    let game0Log = game0.logs[0].args;
    expect(game0Log.tokenAddress).to.eql(token.address);
    expect(game0Log.feeAddress).to.eql(gameFeeAddress);
    expect(game0Log.gameNumber).to.be.bignumber.equal('0');
    expect(game0Log.feePercent).to.be.bignumber.equal(gameFeePercent);
    expect(game0Log.ticketPrice).to.be.bignumber.equal(ticketPrice);
    expect(game0Log.maxPlayers).to.be.bignumber.equal(maxPlayers);
    expect(game0Log.maxTicketsPlayer).to.be.bignumber.equal(maxTicketsPlayer);

    // Seed accounts for testing
    await token.approve(
      accounts[0],
      web3.utils.toBN(1000000).mul(web3.utils.toBN(10).pow(decimals)),
      {from: accounts[0]}
    )

    let approveAmount = web3.utils.toBN(10000).mul(web3.utils.toBN(10).pow(decimals));
    // await token.transferFrom(accounts[0], accounts[1], approveAmount, { from: accounts[0] })
    await token.transferFrom(accounts[0], accounts[1], approveAmount, { from: accounts[0] })
    await token.transferFrom(accounts[0], accounts[2], approveAmount, { from: accounts[0] })
    await token.transferFrom(accounts[0], accounts[3], approveAmount, { from: accounts[0] })
    await token.transferFrom(accounts[0], accounts[4], approveAmount, { from: accounts[0] })

    let approveAmount100K = web3.utils.toBN(100000).mul(web3.utils.toBN(10).pow(decimals));
    await token.approve(contract.address, approveAmount100K, {from: accounts[0]});
    await token.approve(contract.address, approveAmount100K, {from: accounts[1]});
    await token.approve(contract.address, approveAmount100K, {from: accounts[2]});
    await token.approve(contract.address, approveAmount100K, {from: accounts[3]});
    await token.approve(contract.address, approveAmount100K, {from: accounts[4]});

    // Approve and buy 1 ticket for A1
    let game0A1Ticket = await contract.buyTicket(
      
      // Game number
      game0Log.gameNumber,
      
      // Number of tickets
      numberOfTickets,
      
      {from: accounts[1]}
    )

    let game0A1TicketLog = game0A1Ticket.logs[0].args;
    expect(game0A1TicketLog.playerAddress).to.be.bignumber.equal(accounts[1]);
    expect(game0A1TicketLog.gameNumber).to.be.bignumber.equal('0');
    expect(game0A1TicketLog.playerCount).to.be.bignumber.equal('1');
    expect(game0A1TicketLog.ticketCount).to.be.bignumber.equal(numberOfTickets);

    // Check contract balance (pot)
    let contractBalance = await token.balanceOf.call(contract.address, {from: accounts[1]});
    // console.log(contractBalance.toString());

    expect(contractBalance).to.eql(web3.utils.toBN('10').mul(web3.utils.toBN(10).pow(decimals)));

    // Number of game players increases by one
    expected = web3.utils.toBN('1');
    actual = await contract.totalGames({from: accounts[1]});
    expect(actual).to.be.bignumber.equal(expected);

    // Buy second ticket for A1 (should fail)
    try {
      await contract.buyTicket(
      
        // Game number
        game0Log.gameNumber,
        
        // Number of tickets
        numberOfTickets,
        
        {from: accounts[1]}
      );
      assert.fail('The transaction should have thrown an error');
    } catch (err) {
      assert.include(
        err.message,
        "Exceeds max player tickets, try lower value",
        "The error message should contain 'Exceeds max player tickets, try lower value'"
      );
    }
    
    // Approve and buy 1 ticket for A2
    await contract.buyTicket(
      
      // Game number
      game0Log.gameNumber,
      
      // Number of tickets
      numberOfTickets,
      
      {from: accounts[2]}
    )

    // Approve and buy 1 ticket for A3
    await contract.buyTicket(
      
      // Game number
      game0Log.gameNumber,
      
      // Number of tickets
      numberOfTickets,
      
      {from: accounts[3]}
    )
    
    // Buy 1 ticket for A4 (should fail)
    try {
      await contract.buyTicket(
      
        // Game number
        game0Log.gameNumber,
        
        // Number of tickets
        numberOfTickets,
        
        {from: accounts[4]}
      );
      assert.fail('The transaction should have thrown an error');
    } catch (err) {
      assert.include(
        err.message,
        "Too many players in game",
        "The error message should contain 'Too many players in game'"
      );
    }



    // Choose a random winner
    let game0EndGame = await contract.endGame(
      
      game0Log.gameNumber,
      
      {from: accounts[0]}
    );

    let game0EndGameLog = game0EndGame.logs[0].args;
    expect(game0EndGameLog.tokenAddress).to.be.bignumber.equal(token.address);
    // expect(game0EndGameLog.winnerAddress).to.eql(accounts[1]);
    expect(game0EndGameLog.gameNumber).to.be.bignumber.equal('0');
    expect(game0EndGameLog.pot).to.be.bignumber.equal(web3.utils.toBN((ticketPrice * numberOfTickets) * 3));



    // Check game zero states
    game0State = await contract.getGameState.call(
      game0EndGameLog.gameNumber,
      {from: accounts[1]}
    );

    expect(game0State.status).to.eql(false);
    // Needs fee offset calc
    // expect(game0State.pot).to.be.bignumber.equal(game0EndGameLog.pot);
    expect(game0State.playerCount).to.be.bignumber.equal(web3.utils.toBN('3'));
    // Each player bought one ticket each
    expect(game0State.ticketCount).to.be.bignumber.equal(web3.utils.toBN('30'));
    expect(game0State.maxPlayers).to.be.bignumber.equal(maxPlayers);
    expect(game0State.maxTicketsPlayer).to.be.bignumber.equal(maxTicketsPlayer);
    expect(game0State.ticketPrice).to.be.bignumber.equal(ticketPrice);
    expect(game0State.feeAddress).to.be.bignumber.equal(gameFeeAddress);
    expect(game0State.tokenAddress).to.be.bignumber.equal(token.address);


    maxPlayers = web3.utils.toBN('3');
    maxTicketsPlayer = web3.utils.toBN('2');
    gameFeePercent = web3.utils.toBN('3'); // 1%
    ticketPrice = web3.utils.toBN('1').mul(web3.utils.toBN(10).pow(decimals));
    numberOfTickets = web3.utils.toBN('1');
    gameFeeAddress = accounts[5];

    // Start game for LottoToken, exactly two token per entry,
    // max three players, max two tickets per player.
    let game1StartGame = await contract.startGame(

      // Token address
      token.address,

      // Game fee address
      gameFeeAddress,

      // Game fee percent
      gameFeePercent,

      // Ticket price
      ticketPrice,
      
      // Max players
      maxPlayers,

      // Max player tickets
      maxTicketsPlayer,

      {from: accounts[0]}
    );

    let game1StartGameLog = game1StartGame.logs[0].args;

    // Another game test run, buying two tickets each
    count = await contract.buyTicket(
      
      // Game number
      game1StartGameLog.gameNumber,
      
      // Number of tickets
      numberOfTickets,
      
      {from: accounts[1]}
    );
    count2 = await contract.buyTicket(
      
      // Game number
      game1StartGameLog.gameNumber,
      
      // Number of tickets
      numberOfTickets,
      
      {from: accounts[2]}
    );
    count3 = await contract.buyTicket(
      
      // Game number
      game1StartGameLog.gameNumber,
      
      // Number of tickets
      numberOfTickets,
      
      {from: accounts[3]}
    );

    contractBalance = await token.balanceOf.call(accounts[1], {from: accounts[1]});
    await contract.endGame(
      game1StartGameLog.gameNumber,
      {from: accounts[0]}
    );

    contractBalance = await token.balanceOf.call(accounts[1], {from: accounts[1]});


    contractBalance = await token.balanceOf.call(gameFeeAddress, {from: accounts[2]});
    expect(contractBalance).to.eql(web3.utils.toBN('90000000000000000'));
    
  });
});