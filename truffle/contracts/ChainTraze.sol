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
    event IdNotValid(string id);
    
    function computeIndex(int x, int y) pure internal returns(uint index) {
        index = uint(y * X_DIM + x);
    }

    function addReward(string id, int reward) internal returns(int _totalReward) {
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
        return totalRewards[id];
    }

    function computeReward(string id) internal returns(int _reward, int _totalReward){
        int lastBlockNumber = lastBlockNumbers[id];
        int currentBlockNumber = int(block.number);
        int diff = currentBlockNumber - lastBlockNumber;
        int reward = lastBlockNumber > 0 ? (diff > 1 ? diff : 0) : 0;
        lastBlockNumbers[id] = currentBlockNumber;
        int totalReward = addReward(id, reward);
        return (reward, totalReward);
    }
    
    function getPositionContent(int x, int y) public view returns(string) {
        uint index = computeIndex(x, y);
        return field[index];
    }

    function checkIdIsValid(string id) internal returns(bool) {
        address existingAddress = idToAddress[id];
        if(existingAddress == address(0x0)) {
            emit IdNotValid(id);
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
                int totalReward = addReward(id, PENALTY);
                emit Position(id, currentx, currenty, PENALTY, totalReward, "PositionIsOutsideOfFieldError");
            }
            return false;
        }

        return true;
    }

    function sendReward(string fromId, string toId, int reward, int x, int y, string remarks) internal {
        int fromTotalReward = addReward(fromId, -reward);
        emit Position(fromId, x, y, -reward, fromTotalReward, remarks);
        int toTotalReward = addReward(toId, reward);
        emit Position(toId, x, y, reward, toTotalReward, remarks);
    }

    function processNotFree(string id, int x, int y) internal {
        uint index = computeIndex(x, y);
        string storage idInField = field[index];
        bool isHead = headFlags[index];
        if(isHead) {
            int totalRewardOfIdInField = totalRewards[idInField];
            if(totalRewardOfIdInField == 0) {
                sendReward(idInField, id, 100, x, y, "head");
            }
            else if(totalRewardOfIdInField > 0) {
                sendReward(idInField, id, totalRewardOfIdInField + 100, x, y, "head");
            }
            else {
                sendReward(idInField, id, -totalRewardOfIdInField, x, y, "head");
            }
        }
        else {
            int totalReward = totalRewards[idInField];
            if(totalReward == 0) {
                sendReward(id, idInField, 100, x, y, "tail");
            }
            else if(totalReward > 0) {
                sendReward(id, idInField, totalReward + 100, x, y, "tail");
            }
            else {
                sendReward(id, idInField, -totalReward, x, y, "tail");
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
        uint index = computeIndex(x, y);
        field[index] = id;
        setXposition(id, x);
        setYposition(id, y);
        int reward;
        int totalReward;
        (reward, totalReward) = computeReward(id);
        emit Position(id, x, y, reward, totalReward, "move");
    }

    function setHeadFlag(bool headFlag, int x, int y) internal {
        uint index = computeIndex(x, y);
        headFlags[index] = headFlag;
    }

    function move(int dx, int dy) internal {
        string storage id = addressToId[msg.sender];
        int currentx = getXPosition(id);
        int currenty = getYPosition(id);
        int nextx = currentx + dx;
        int nexty = currenty + dy;

        setHeadFlag(false, currentx, currenty);
        setHeadFlag(true, nextx, nexty);

        if(isInsideField(id, nextx, nexty, currentx, currenty)) {
            if(!isFree(nextx, nexty)) {
                processNotFree(id, nextx, nexty);
            }
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
