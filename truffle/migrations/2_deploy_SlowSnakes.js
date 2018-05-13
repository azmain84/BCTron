var SlowSnakes = artifacts.require("./SlowSnakes.sol");

module.exports = function(deployer) {
  deployer.deploy(SlowSnakes);
};
