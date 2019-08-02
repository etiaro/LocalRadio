import React from 'react';
import './Login.css';
import {apiLogin} from './ApiConnection';

import Container from '@material-ui/core/Container';
import Paper from '@material-ui/core/Paper';
import CircularProgress from '@material-ui/core/CircularProgress';
import FacebookLogin from 'react-facebook-login';
  
export default class Login extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            waiting: false
        };
    }
    loginClicked(){
        this.setState({waiting:true});
    }
    responseFacebook(response){
        if(response.status === "unknown")
            this.setState({waiting: false});
        else{
            this.setState({waiting: true});
            if(apiLogin(response)) return;
            this.setState({waiting: false});
        }
    }
    render(){
        var content = (<div>
                    <p>Hi, you have to login by facebook to use this page</p>
                    <FacebookLogin
                        appId="344604559768445"
                        autoLoad={true}
                        fields="name,email,picture"
                        onClick={()=>this.loginClicked()}
                        callback={(r)=>this.responseFacebook(r)} />
                </div>);
        if(this.state.waiting)
            content = (<CircularProgress/>);
        return (
            <Container id="Cont">
                <Paper id="Paper" elevation={2} square={true}>{content}</Paper>
                
            </Container>
        );
    }
}