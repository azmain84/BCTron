import * as _ from 'lodash';
import React, {Component} from 'react';
import PropTypes from 'prop-types';

import './ContractLink.css';

const renderLink = (address) => {
    if(_.isUndefined(address)) {
        return(<span>unknown address</span>)
    }

    return (
        <a target="_blank" href={"https://rinkeby.etherscan.io/address/" + address}>Contract on Etherscan</a>
    )
}

export class ContractLink extends Component {

    render() {
        return (
            <div className="contract-link">
                {renderLink(this.props.address)}
            </div>
        )
    }
}

ContractLink.propTypes = {
    address: PropTypes.string
}
