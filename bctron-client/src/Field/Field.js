import * as _ from 'lodash';
import React, {Component} from 'react';
import {addListenerForPositions, addListenerForHeads, addListenerForNewBlockNumber} from '../blockChain/blockChainEvents';
import * as $ from "jquery";
import 'tooltipster';
import {SvgField} from './SvgField';
import {History} from './History';
import {TotalRewards} from './TotalRewards';
import {Counter} from "../flipcounter/Counter";

const width = $(window).width() * (8/12);
const height = $(window).height();

export class Field extends Component {

    constructor(props) {
        super(props);

        this.state = {
            x: undefined,
            y: undefined,
            history: [],
            lastPositions: {},
            currentBlockNumber: undefined
        }
    }

    newHistory(x, y, history) {
        this.setState({x, y, history});
    }

    updateLastPositions(position) {
        const id = position.id;
        const lastPositions = {...this.state.lastPositions, [id]: position};
        this.setState({lastPositions});
    }

    newPosition(position) {
        this.updateLastPositions(position);
        this.svgField.newPosition(position);
    }

    newBlockNumber(blockNumber) {
        this.setState({currentBlockNumber: blockNumber});
    }

    componentDidMount() {
        this.svgField = new SvgField("div.field", width, height, (x, y, history) => this.newHistory(x, y, history));
        this.svgField.drawMatrix();
        addListenerForPositions((newPosition) => this.newPosition(newPosition));
        addListenerForHeads((heads) => this.svgField.newHeads(heads));
        addListenerForNewBlockNumber((blockNumber) => this.newBlockNumber(blockNumber));
    }

    highlight(id) {
        console.log("highlight: " + id);
        this.svgField.highlight(id, true);
    }

    lowlight(id) {
        console.log("lowlight: " + id);
        this.svgField.highlight(id, false);
    }

    render() {
        return (
            <div className="row">
                <div className="field col s9">
                </div>
                <div className="lists col s3">
                    <Counter value={this.state.currentBlockNumber}/>
                    <br/>
                    <TotalRewards
                        idToPosition={this.state.lastPositions}
                        currentBlockNumber={this.state.currentBlockNumber}
                        onSelectRow={(id) => {this.highlight(id)}}
                        onDeselectRow={(id) => {this.lowlight(id)}}
                    />
                    <br/>
                    <History x={Number(this.state.x)} y={Number(this.state.y)} positions={this.state.history}/>
                </div>
            </div>
        )
    }
}