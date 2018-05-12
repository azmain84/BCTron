import * as _ from 'lodash';
import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {flipCounter} from './flipcounter';

import './flipcounter.css';

export class Counter extends Component {

    constructor(props) {
        super(props);
        this.divRef = React.createRef();
    }

    componentDidMount() {
        this.flipcounter = new flipCounter('myCounter', {value: _.isUndefined(this.props.value) ? 0 : this.props.value})
    }

    componentDidUpdate() {
        if(!_.isUndefined(this.flipcounter)) {
            this.flipcounter.setValue(this.props.value);
        }
    }

    render() {
        return (
            <div className="clearfix">
                <div className="counter-wrapper">
                    <ul className="flip-counter small" id="myCounter"></ul>
                </div>
            </div>
        )
    }
}

Counter.propTypes = {
    value: PropTypes.number
}
