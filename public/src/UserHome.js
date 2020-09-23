import React, {createRef} from 'react';
import { withStyles, styled } from '@material-ui/styles';
import {BrowserRouter as Router,Switch,Route, Link} from "react-router-dom";

import Paper from '@material-ui/core/Paper';
import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItem from '@material-ui/core/ListItem';
import List from '@material-ui/core/List';
import { ArrowBack, PlaylistAddCheck, History as HistoryBtn, AddComment} from '@material-ui/icons';

import Toolbar from './MusicToolbar';
import Notifications from "./Notifications";
import Library from "./Library";
import Playlist from "./Playlist"; 
import History from "./History"; 
import Suggestions, {Suggest} from "./Suggestions";

import {notificationHandler, getPlayerData} from './ApiConnection';

const BackBtn = styled(IconButton)({
    position:"absolute",
    left: 0,
    top: 0,
    marginTop: 5
  });
const useStyles = theme => ({
    homeMenu:{
        width: 300,
        maxWidth: "90vw"
    },
    normalText:{
        textDecoration: "none",
        color: "BLACK"
    },
    backText:{
        textDecoration: "none",
        color: "WHITE"
    }
});
const TabBar = styled(AppBar)({
  position:"absolute",
  top:0,
  fontSize: "large",
  zIndex: 'auto'
});

class UserHome extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            userData: this.props.userData,
            notifications: [],
            notificationsTimeout: 5000,
            playerData: {song:{}},
            actSite: "Home",
            actWindow: "",
            libUpdater: false,
            playlistRef: createRef(),
            librarySelectCallback: ()=>{},
            width: window.innerWidth,
        };
    }

    componentDidMount(){
        notificationHandler((data)=>{
            var tmp = this.state.notifications;
            tmp.push(data);
            this.setState({notifications:tmp});
            setTimeout(()=>{
                var tmp = this.state.notifications;
                tmp.shift();
                this.setState({});
            }, this.state.notificationsTimeout)
        }, (data)=>{
            this.setState({playerData:data});
        }, (data, data2)=>{
            if(this.state.playlistRef.current)
                this.state.playlistRef.current.updateData();
        }, (song)=>{
            this.setState({libUpdater:!this.state.libUpdater})
        });
        getPlayerData((res)=>{
            this.setState({playerData: res});
        });
    }
    libraryWindowSwitch(cb){
        this.setState({actWindow: "libraryMenu", librarySelectCallback: cb});
    }
    suggestWindowSwitch(cb){
        this.setState({actWindow: "suggestMenu", librarySelectCallback: cb});
    }
    closeWindows(){
        this.setState({actWindow: ""});
    }
    render(){
        const {classes} = this.props;

        let window = "";
        if(this.state.actWindow === "libraryMenu")
            window = (<Library libUpdater={this.state.libUpdater} isWindowed={true} selectCallback={this.state.librarySelectCallback} close={()=>{this.closeWindows()}}/>);
        if(this.state.actWindow === "suggestMenu")
            window = (<Suggest close={()=>this.closeWindows()} userId={this.state.userData.id} />)

        return (
            <Router>
                <Paper className="window" elevation={2} square={true}>
                    <TabBar>
                        <p>
                        <Switch>
                            <Route path="/playlist">Playlista</Route>
                            <Route path="/history">Historia</Route>
                            <Route path="/suggestions">Sugestie</Route>
                            <Route path="/">Strona Główna</Route>
                        </Switch>
                        </p>
                        
                        <Switch>
                            <Route path="/playlist">
                                <Link to="/" className={classes.backText}>
                                <BackBtn color="inherit">
                                    <ArrowBack/>
                                </BackBtn>
                                </Link>
                            </Route>
                            <Route path="/history">
                                <Link to="/" className={classes.backText}>
                                <BackBtn color="inherit">
                                    <ArrowBack/>
                                </BackBtn>
                                </Link>
                            </Route>
                            <Route path="/suggestions">
                                <Link to="/" className={classes.backText}>
                                <BackBtn color="inherit">
                                    <ArrowBack/>
                                </BackBtn>
                                </Link>
                            </Route>
                        </Switch>
                    </TabBar>
                    <div className="window-content">
                    <Switch>
                        <Route path="/playlist">
                            <Playlist isAdmin={this.state.userData.isAdmin} libraryShow={(cb)=>this.libraryWindowSwitch(cb)} ref={this.state.playlistRef}/>
                        </Route>
                        <Route path="/history">
                            <History />
                        </Route>
                        <Route path="/suggestions">
                            <Suggestions suggestWindowSwitch={()=>this.suggestWindowSwitch()} userId={this.state.userData.id}/>
                        </Route>
                        <Route path="/">
                            <List>
                                <Link to="/playlist" className={classes.normalText}>
                                    <ListItem button>
                                        <ListItemIcon><PlaylistAddCheck/></ListItemIcon>
                                        <ListItemText primary="Playlista" />
                                    </ListItem>
                                </Link>
                                <Link to="/history" className={classes.normalText}>
                                    <ListItem button>
                                        <ListItemIcon><HistoryBtn/></ListItemIcon>
                                        <ListItemText primary="Historia" />
                                    </ListItem>
                                </Link>
                                <Link to="/suggestions" className={classes.normalText}>
                                    <ListItem button>
                                        <ListItemIcon><AddComment/></ListItemIcon>
                                        <ListItemText primary="Sugerowane" />
                                    </ListItem>
                                </Link>
                            </List>
                        </Route>
                    </Switch>
                    </div>
                </Paper>
                {window}
                <Notifications notifications={this.state.notifications}/>
                <Toolbar isAdmin={this.state.userData.isAdmin} playerData={this.state.playerData}/>
            </Router>
        );
    }
}


export default withStyles(useStyles)(UserHome);