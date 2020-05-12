import React, { Component } from 'react';
import LoginBox from './LoginBox';

class Login extends Component {

    constructor(props){
        super(props);
        this.state = {};
    }

    render() {

        return (
            <div className="root-container">

                <div className="box-controller">

                    <div className="controller">
                        GCTS Blockchain
                    </div>

                </div>

                <div className="box-container">
                    {
                        <LoginBox />
                    }
                </div>

            </div>
        );
        
    }

};

export default Login;