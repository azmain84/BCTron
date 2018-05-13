const WebSocketServer = require('./WebSocketServer');
const eventsUtil = require('./web3/eventsUtil');
const contracts = require('./contracts/contracts');
const eventUtil = require('./util/eventUtil');

const start = () => {
    const webSocketServer = new WebSocketServer();

    const eventsToListenTo = contracts.getEventNames(contracts.SlowSnakes);

    const newEvent = (event) => {
        eventUtil.saveEvent(event);
        webSocketServer.sendObjectToAllSockets(event);
    }

    const newBlockNumber = (blockNumberObj) => {
        webSocketServer.sendObjectToAllSockets(blockNumberObj);
    }

    const eventComparator = (e1, e2) => {
        if(e1.blockNumber !== e2.blockNumber) {
            return e1.blockNumber > e2.blockNumber ? 1 : -1;
        }
        else if(e1.transactionIndex !== e2.transactionIndex) {
            return  e1.transactionIndex > e2.transactionIndex ? 1 : -1;
        }
        else if(e1.logIndex !== e2.logIndex) {
            return e1.logIndex > e2.logIndex ? 1 : -1;
        }

        return 0;
    }

    const getPastEventsRecursive = (eventNames, index, resolve, allEvents) => {
        if(index < eventNames.length) {
            const eventName = eventNames[index];
            eventsUtil.pastEvents(contracts.SlowSnakes, eventName).on('event', (events) => {
                Array.prototype.push.apply(allEvents, events);
                getPastEventsRecursive(eventNames, index+1, resolve, allEvents);
            });
        }
        else {
            resolve(allEvents);
        }
    }

    new Promise((resolve) => {
        getPastEventsRecursive(eventsToListenTo, 0, resolve, []);
    }).then((allEvents) => {
        allEvents.sort(eventComparator).forEach((event) => {
            newEvent(event);
        });

        eventsToListenTo.forEach((eventName) => {
            eventsUtil.subscribe(contracts.SlowSnakes, eventName).on('event', (event) => {
                newEvent(event);
            });
        });

        eventsUtil.subscribeNewBlockNumber().on('newBlockNumber', (blockNumberObj) => {
            newBlockNumber(blockNumberObj);
        })
    })

    webSocketServer.onConnectCallback = (socketId) => {
        eventUtil.getAllEvents().forEach((event) => {
            webSocketServer.sendObject(socketId, event);
        })
    }

    webSocketServer.connect(1337);
}

module.exports = {start}