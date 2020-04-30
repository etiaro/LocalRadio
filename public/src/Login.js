import React from 'react';
import './Login.css';
import {apiLogin} from './ApiConnection';

import Container from '@material-ui/core/Container';
import Paper from '@material-ui/core/Paper';
import CircularProgress from '@material-ui/core/CircularProgress';
import FacebookLogin from 'react-facebook-login';
  

let vh = window.innerHeight * 0.01;
// Then we set the value in the --vh custom property to the root of the document
document.documentElement.style.setProperty('--vh', `${vh}px`);

export default class Login extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            waiting: false,
            noConnection: false
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
            apiLogin(response, (resp)=>{
                if(resp === true) return;
                else if(resp === -1) this.setState({noConnection: true});
    
                this.setState({waiting: false});
            });
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
        else if(this.state.noConnection)
            content = "Sorry, there is a problem with connecting to server, try again later or contact with administrator";
        return (
            <Container id="Cont">
                <Paper id="Paper" elevation={2} square={true}>{content}</Paper>
            </Container>
        );
    }
}