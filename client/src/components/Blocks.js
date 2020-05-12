import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Block from './Block'; 

// Using the fetch API to request backend data and serve it to the frontend
class Blocks extends Component {
    state = { blocks: [], paginatedId: 1, blocksLength: 0 };

    // Blocks request
    componentDidMount() {
        fetch(`${document.location.origin}/api/blocks/length`)
        .then(response => response.json())
        .then(json => this.setState({ blocksLength: json }));

        this.fetchPaginatedBlocks(this.state.paginatedId)();
    }

    // Paginated amount request
    fetchPaginatedBlocks = paginatedId => () => {
        fetch(`${document.location.origin}/api/blocks/${paginatedId}`)
        .then(response => response.json())
        .then(json => this.setState({ blocks: json}));
    }

    // Visualized the blocks from the backend (The Blocks page)
    render() {
        console.log('this.state', this.state);

        return (
            <div>
                <div><Link to='/'>Home</Link></div>
                <h3>Blocks</h3>
                <div>
                    {
                        [...Array(Math.ceil(this.state.blocksLength/5)).keys()].map(key => {
                            const paginatedId = key+1;

                            return (
                                <span key={key} onClick={this.fetchPaginatedBlocks(paginatedId)}>
                                    <Button bssize="small" bsstyle="danger">
                                        {paginatedId}
                                    </Button>{' '}
                                </span>
                            )
                        })
                    }
                </div>
                {
                    this.state.blocks.map(block => {
                        return (
                            <Block key={block.hash} block={block}/>
                        );
                    })
                }
            </div>
        );
    }
}

export default Blocks;