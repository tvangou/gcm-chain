import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import { isObject } from 'util';
import Transaction from './Transaction';

// Display of the Block
// Block component that inherited data from the Core Blocks component through props (short for properties)
class Block extends Component {
    state = {displayTransaction: false};

    //Toggle-able transation displays
    toggleTransaction = () => {
        this.setState({ displayTransaction: !this.state.displayTransaction });
    }

    get displayTransaction() {
        const { data } = this.props.block;

        const stringifiedData = JSON.stringify(data);

        // Displaying data criteria: greater than 15 to show elipsis
        const dataDisplay = stringifiedData.length > 35 ?
            `${stringifiedData.substring(0,35)}...` :
            stringifiedData;

        // displating transaction from Transaction.js
        if (this.state.displayTransaction) {
            return (
                <div>
                    {
                        data.map(transaction => (
                            <div key={transaction.id}>
                                <hr />
                                <Transaction transaction={transaction} />
                            </div>
                        ))
                    }
                    <br />
                    <Button
                        bsstyle="danger"
                        bssize="small"
                        onClick={this.toggleTransaction}
                    >
                        Show Less
                    </Button>
                </div>
            )
        }

        // Creating a button from React boostrap
        return (
            <div>
                <div>Data: {dataDisplay}</div>
                <Button
                    bsstyle="danger"
                    bssize="small"
                    onClick={this.toggleTransaction}
                >
                    Show More
                </Button>
            </div>
        );
    }

    render() {
        const { timestamp, hash } = this.props.block;

        // Hash diplays first 15 characters
        const hashDisplay = `${hash.substring(0,15)}...`;

        // Returning the hash, timestamp and data
        return (
            <div className='Block'>
                <div>Hash: {hashDisplay}</div>
                <div>Timestamp: {new Date(timestamp).toLocaleString()}</div>
                {this.displayTransaction}
            </div>
        );
    }
};

export default Block;