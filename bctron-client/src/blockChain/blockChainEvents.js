import * as _ from 'lodash';
import {connect} from '../webSocket/webSocketHub';
import {guid} from '../util/random';
import {setAddress} from './info';

const allEvents = [];
const listenersForAllEvents = [];

const positionsArray = [];
const listenersForPositions = [];

const heads = {};
const listenersForHeads = [];

const listenersForNewBlockNumber = [];

/**
 *
 * @param manyThings array, send piece by piece to the oneListener
 * @param oneListener
 */
const sendManyThingsToOneListener = (manyThings, oneListener) => {
    manyThings.forEach((event) => {
        oneListener(event);
    })
}

/**
 *
 * @param oneThing could be anything, even an array, but send as one thing to all of the manyListeners
 * @param manyListeners array of listeners
 */
const sendOneThingToManyListeners = (oneThing, manyListeners) => {
    manyListeners.forEach((listener) => {
        listener(oneThing);
    })
}

export const addListenerForAllEvents = (listener) => {
    sendManyThingsToOneListener(allEvents, listener);
    listenersForAllEvents.push(listener);
}

export const addListenerForPositions = (listener) => {
    sendManyThingsToOneListener(positionsArray, listener);
    listenersForPositions.push(listener);
}

export const addListenerForHeads = (listener) => {
    listener(heads);
    listenersForHeads.push(listener);
}

export const addListenerForNewBlockNumber = (listener) => {
    listenersForNewBlockNumber.push(listener);
}

const newPositionEvent = (positionEvent) => {
    const uuid = guid();
    const hash = positionEvent.transactionHash;
    const blockNumber = positionEvent.blockNumber;
    const transactionIndex = positionEvent.transactionIndex;
    const logIndex = positionEvent.logIndex;
    const position = {...positionEvent.returnValues, hash, blockNumber, uuid, transactionIndex, logIndex};
    const id = position.id;

    positionsArray.push(position);
    sendOneThingToManyListeners(position, listenersForPositions);
}

const newHeadEvent = (headEvent) => {
    const head = headEvent.returnValues;
    const id = head.id;
    heads[id] = head;
    sendOneThingToManyListeners(heads, listenersForHeads);
}

const newBlockNumber = (blockNumberObj) => {
    sendOneThingToManyListeners(blockNumberObj.blockNumber, listenersForNewBlockNumber);
}

const newEvent = (event) => {
    if(!_.isUndefined(event.address)) {
        setAddress(event.address);
    }
    if(event.type === "blockNumber") {
        newBlockNumber(event)
    }
    else {
        allEvents.push(event);
        sendOneThingToManyListeners(event, listenersForAllEvents);

        switch (event.event) {
            case "Position":
                newPositionEvent(event);
                break;

            case "NewHead":
                newHeadEvent(event);
                break;
        }
    }
}

connect(1337, (event) => {
    newEvent(event);
});
