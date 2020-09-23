import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import './Login.css';
import {apiLogin, changePage} from './ApiConnection';

import Container from '@material-ui/core/Container';
import Paper from '@material-ui/core/Paper';
import CircularProgress from '@material-ui/core/CircularProgress';
import FacebookLogin from 'react-facebook-login';
import Button from '@material-ui/core/Button';
import ListItemText from '@material-ui/core/ListItemText';
import ListItem from '@material-ui/core/ListItem';
import List from '@material-ui/core/List';
import TextField from '@material-ui/core/TextField';
  

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
    passwordLogin(e){
        if(e.keyCode === 13){
            
            this.setState({waiting: true});
            apiLogin({password: e.target.value}, (resp)=>{
                if(resp === true) return;
                else if(resp === -1) this.setState({noConnection: true});
    
                this.setState({waiting: false});
            });
        }
    }
    render(){
        var content = (<div>
                    <h3>Witamy na stronie radiowęzła!</h3>
                    <p>Tutaj możesz sprawdzić, co było i jest aktualnie odtwarzane, zasugerować dodanie jakiejś piosenki oraz dodawać piosenki do playlisty. Wystarczy że zalogujesz się klikając w przycisk poniżej</p>
                    <FacebookLogin
                        appId="344604559768445"
                        autoLoad={true}
                        fields="name,email,picture"
                        onClick={()=>this.loginClicked()}
                        callback={(r)=>this.responseFacebook(r)} />
                </div>);

        if(!this.props.useFacebook)
        content = (<div>
                <h3>Witamy na stronie radiowęzła!</h3>
                <p>Tutaj możesz sprawdzić, co było i jest aktualnie odtwarzane, zasugerować dodanie jakiejś piosenki oraz dodawać piosenki do playlisty.</p>
                <p>Jeżeli widzisz tą stronę to prawdopodobnie serwer jest restartowany/zepsuty, spróbuj odświeżyć stronę :)</p>
            </div>);
        if(window.location.pathname.indexOf('password') !== -1)
            content = (<form>
                <input autoComplete="invisible login" label="username" type="text" style={{display: "none"}}></input>
                <h3>Podaj hasło</h3>
                <TextField
                    id="standard-password-input"
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    onKeyDown={(e)=>this.passwordLogin(e)}
                    />
                </form>);
                
        if(this.state.waiting)
            content = (<CircularProgress/>);
        else if(this.state.noConnection)
            content = (<span><h3>Coś poszło nie tak</h3>
            <p>Brak połączenia z serwerem. Odśwież stronę lub skontaktuj się z administratorem</p></span>);
        return (
            <Container id="Cont">
                <Paper id="Paper" elevation={2} square={true}>{content}
                </Paper>
            </Container>
        );
    }
}


const useStyles = makeStyles(theme => ({
    homeMenu:{
        width: 300,
        maxWidth: "90vw"
    }
}));
export function DemoLogin(props){
    const classes = useStyles();
    return (
        <Container id="Cont">
            <Paper className={classes.homeMenu} elevation={2} square={true}>
                <List>
                    <ListItem button onClick={()=>changePage(2)}>
                        <ListItemText primary="Panel Użytkownika" />
                    </ListItem>
                    <ListItem button onClick={()=>changePage(1)}>
                        <ListItemText primary="Panel Administratora" />
                    </ListItem>
                </List>
            </Paper>
        </Container>
    );
}

export function DemoAlert(props){
    return(
        <Container id="Cont">
            <Paper id="Paper" elevation={2} square={true}>
                <h3>Wersja demonstracyjna</h3>
                <p>
                    Witamy w wersji demonstracyjnej LocalRadio, publicznego systemu do zarządzania muzyką w szkole lub firmie.
                    Tutaj możesz bez instalacji zapoznać się z interfejsem i jego funkcjami. Należy jednak pamiętać że:
                </p>
                <ul>
                    <li>System odtwarza muzykę na serwerze na którym jest zainstalowany, więc w wersji demostracyjnej <b>nie będziesz mógł jej usłyszeć</b></li>
                    <li>Ze względów administracyjnych w wersji demonstracyjnej pobieranie plików zostało wyłączone</li>
                    <li>Normalnie w miejscu wyboru panelu znajduje się logowanie, po którym użytkownik dostaje się do odpowiej wersji strony zależnie od uprawnień</li>
                </ul>
                <p>
                    Aby zainstalować i używać LocalRadio, odwiedź <a href="https://github.com/Etiaro/LocalRadio.git" target="_blank" rel="noopener noreferrer">https://github.com/Etiaro/LocalRadio.git</a>
                </p>
            <Button variant="contained" color="primary" onClick={()=>changePage()}>OK</Button>
            </Paper>
        </Container>
    )
}