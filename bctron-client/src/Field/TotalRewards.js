import * as _ from 'lodash';
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {MIN_REWARD} from '../blockChain/info';
import './TotalRewards.css';

export class TotalRewards extends Component {

    constructor(props) {
        super(props);
        this.state = {selectedId: undefined}
    }

    select(id) {
        this.setState({selectedId: id})
        this.props.onSelectRow(id)
    }

    deselect(id) {
        this.setState({selectedId: undefined})
        this.props.onDeselectRow(id)
    }

    positiveOrNegativeClass(nextReward) {
        if(this.props.currentBlockNumber > 0) {
            if(nextReward > 0) {
                return "positive";
            }
            else if(nextReward < 0) {
                return "negative";
            }
            return "";
        }

        return "";
    }

    renderRow(position) {
        const ageOfLastMove = this.props.currentBlockNumber - position.blockNumber;
        const nextReward = ageOfLastMove - MIN_REWARD;
        return (
            <tr key={position.id}
                onMouseOver={() => this.select(position.id)}
                onMouseOut={() => this.deselect(position.id)}
                className={position.id === this.state.selectedId ? "selected" : ""}
            >
                <td>{position.id}</td>
                <td>{position.totalReward}</td>
                <td className={this.positiveOrNegativeClass(nextReward)}>{this.props.currentBlockNumber > 0 ? nextReward : '-'}</td>
                <td>{this.props.currentBlockNumber > 0 ? this.props.currentBlockNumber - position.blockNumberOfBirth : '-'}</td>
            </tr>
        )
    }

    sortedPositionArray() {
        const positionArray = _.values(this.props.idToPosition);
        positionArray.sort((a, b) => {
            return Number(a.totalReward) < Number(b.totalReward);
        });

        return positionArray;
    }

    render() {
        return (
            <div className="chaintable">
                <table>
                    <thead>
                        <tr>
                            <th>id</th>
                            <th>total rewards</th>
                            <th>next reward</th>
                            <th>age</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.sortedPositionArray()
                            .filter(position => !_.isEmpty(position.id))
                            .map((position) => this.renderRow(position))}
                    </tbody>
                </table>
            </div>
        );
    }
}

TotalRewards.propTypes = {
    idToPosition: PropTypes.object,
    currentBlockNumber: PropTypes.number,
    onSelectRow: PropTypes.func,
    onDeselectRow: PropTypes.func,
}
