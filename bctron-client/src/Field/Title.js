import * as _ from 'lodash';
import React, {Component} from 'react';
import PropTypes from 'prop-types';

import './Title.css';

export class Title extends Component {

    render() {
        return (
            <div className="title-component">
                <h1>{this.props.text}</h1>
            </div>
        )
    }
}

Title.propTypes = {
    text: PropTypes.string
}
