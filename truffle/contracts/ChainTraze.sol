pragma solidity ^0.4.19;

contract ChainTraze {
    
    int constant X_DIM = 100;
    int constant Y_DIM = 100;
    int constant FIELD_SIZE = X_DIM*Y_DIM;
    int constant PENALTY = -2;
    int constant BUMP = 10;
    
    mapping (address => int256) balances;
    
    string[FIELD_SIZE] field;
    bool[FIELD_SIZE] headFlags;

    mapping (address => string) addressToId;
    mapping (string => address) idToAddress;
    mapping (string => int) xpositions;
    mapping (string => int) ypositions;
    mapping (string => int) lastBlockNumbers;
    mapping (string => int) totalRewards;

    // The following 4 functions are a workaround to get around an unsolvded Ganache Bug:
    // https://github.com/trufflesuite/ganache-cli/issues/458
    // When setting an position from any value > 0 to zero an error occurs

    function setXposition(string id, int pos) internal {
        xpositions[id] = pos + 1;
    }

    function getXPosition(string id) view internal returns(int) {
        return xpositions[id] - 1;
    }
    
    function setYposition(string id, int pos) internal {
        ypositions[id] = pos + 1;
    }
    
    function getYPosition(string id) view internal returns(int) {
        return ypositions[id] - 1;
    }
    
    event Position(string id, int x, int y, int reward, int totalReward, string remarks);
    event Error(string message);
    event IdAlreadyExistsError(string id);
    event IdDoesNotExistError(string id);
    event IdDoesNotBelongToSender(string id);
    event PositionIsNotFreeError(string id, int x, int y);
    event PositionIsOutsideOfFieldError(string id, int x, int y);
    event IdDoesNotYetExist(string id);
    event NewHead(string id, int x, int y);

    event SetHeadFlag(bool flag, uint index);
    event GetHeadFlag(bool flag, uint index);

    function computeIndex(int x, int y) pure internal returns(uint index) {
        index = uint(y * X_DIM + x);
    }

    function addReward(string id, int reward, int x, int y, string remarks) internal {
        if(totalRewards[id] != 0 && totalRewards[id] == (reward * -1)) {
            if(totalRewards[id] > 0) {
                totalRewards[id] = -BUMP;
            }
            else {
                totalRewards[id] = BUMP;
            }
        }
        else {
            totalRewards[id] += reward;
        }
        emit Position(id, x, y, reward, totalRewards[id], remarks);
    }

    function computeReward(string id) internal returns(int _reward){
        int lastBlockNumber = lastBlockNumbers[id];
        int currentBlockNumber = int(block.number);
        int diff = currentBlockNumber - lastBlockNumber;
        int reward = lastBlockNumber > 0 ? (diff > 1 ? diff : 0) : 0;
        lastBlockNumbers[id] = currentBlockNumber;
        return reward;
    }
    
    function getPositionContent(int x, int y) public view returns(string) {
        uint index = computeIndex(x, y);
        return field[index];
    }

    function checkIdIsValid(string id) internal returns(bool) {
        address existingAddress = idToAddress[id];
        if(existingAddress == address(0x0)) {
            emit IdDoesNotYetExist(id);
            return false;
        }

        return true;
    }
    
    function checkIdIsFree(string id) internal returns(bool) {
        if(checkIdIsValid(id)) {
            emit IdAlreadyExistsError(id);
            return false;
        }
        
        return true;
    }

    function isInsideField(string id, int x, int y, int currentx, int currenty) internal returns(bool) {
        if(x < 0 || x >= X_DIM || y < 0 || y >= Y_DIM) {
            emit PositionIsOutsideOfFieldError(id, x, y);
            if(checkIdIsValid(id)) {
                addReward(id, PENALTY, currentx, currenty, "PositionIsOutsideOfFieldError");
            }
            return false;
        }

        return true;
    }

    function sendReward(string fromId, string toId, int reward, int x, int y, string remarks) internal {
        addReward(fromId, -reward, x, y, remarks);
        addReward(toId, reward, x, y, remarks);
    }

    function processHeadCollision(string id, string otherId, int x, int y) internal {
        int otherTotalReward = totalRewards[otherId];
        if(otherTotalReward >= 0) {
            sendReward(otherId, id, otherTotalReward + 100, x, y, "head");
        }
        else {
            sendReward(otherId, id, -otherTotalReward, x, y, "head");
        }
    }

    function processTailCollision(string id, string otherId, int x, int y) internal {
        int totalReward = totalRewards[id];
        if(totalReward >= 0) {
            sendReward(id, otherId, totalReward + 100, x, y, "tail");
        }
        else {
            sendReward(id, otherId, -totalReward, x, y, "tail");
        }
    }

    function processSelfCollision(string id, int x, int y) internal {
        int totalReward = totalRewards[id];
        if(totalReward >= 0) {
            addReward(id, -totalReward - 100, x, y, "self");
        }
        else {
            addReward(id, -totalReward, x, y, "self");
        }
    }

    function processCollision(string id, int x, int y) internal {
        uint index = computeIndex(x, y);
        string storage otherId = field[index];
        if(keccak256(id) == keccak256(otherId)) {
            processSelfCollision(id, x, y);
        }
        else {
            bool isHead = headFlags[index];
            emit GetHeadFlag(isHead, index);
            if(isHead) {
                processHeadCollision(id, otherId, x, y);
            }
            else {
                processTailCollision(id, otherId, x, y);
            }
        }
    }

    function isFree(int x, int y) internal view returns(bool) {
        uint index = computeIndex(x, y);
        string storage idInField = field[index];
        uint len = bytes(idInField).length;
        return (len == 0);
    }
    
    function goIntoField(string id, int x, int y) internal {
        emit NewHead(id, x, y);
        uint index = computeIndex(x, y);
        field[index] = id;
        setXposition(id, x);
        setYposition(id, y);
        int reward = computeReward(id);
        addReward(id, reward, x, y, "move");
    }

    function setHeadFlag(bool headFlag, int x, int y) internal {
        uint index = computeIndex(x, y);
        emit SetHeadFlag(headFlag, index);
        headFlags[index] = headFlag;
    }

    function move(int dx, int dy) internal {
        string storage id = addressToId[msg.sender];
        int currentx = getXPosition(id);
        int currenty = getYPosition(id);
        int nextx = currentx + dx;
        int nexty = currenty + dy;

        if(isInsideField(id, nextx, nexty, currentx, currenty)) {
            if(!isFree(nextx, nexty)) {
                processCollision(id, nextx, nexty);
            }
            setHeadFlag(false, currentx, currenty);
            setHeadFlag(true, nextx, nexty);
            goIntoField(id, nextx, nexty);
        }
    }
    
    function registerId(string id) internal {
        addressToId[msg.sender] = id;
        idToAddress[id] = msg.sender;
    }

    function north() public {
        move(0, -1);
    }

    function northwest() public {
        move(-1, -1);
    }

    function west() public {
        move(-1, 0);
    }

    function southwest() public {
        move(-1, 1);
    }

    function south() public {
        move(0, 1);
    }

    function southeast() public {
        move(1, 1);
    }

    function east() public {
        move(1, 0);
    }

    function northeast() public {
        move(1, -1);
    }
    
    function register(string id, int startx, int starty) public {
        if(checkIdIsValid(id)) {
            emit IdAlreadyExistsError(id);
        }
        else if(!isFree(startx, starty)) {
            emit PositionIsNotFreeError(id, startx, starty);
        }
        else {
            registerId(id);
            goIntoField(id, startx, starty);
        }
    }
}
