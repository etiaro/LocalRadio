import React, {createRef} from 'react';
import { withStyles, styled } from '@material-ui/styles';

import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItem from '@material-ui/core/ListItem';
import List from '@material-ui/core/List';
import { ArrowBack, PlaylistAddCheck, History as HistoryBtn} from '@material-ui/icons';

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
    }
});
const TabBar = styled(AppBar)({
  position:"absolute",
  top:0,
  fontSize: "large"
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
            this.state.playlistRef.current.updateData();
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
    openSite(name){
        this.setState({actSite:name});
    }
    back(){
        this.setState({actSite:"Home"});
    }

    render(){
        const {classes} = this.props;
        let site = "";
        let siteName = "";
        switch(this.state.actSite){
            case "Home": 
                site = (<List className={classes.homeMenu}>
                            <ListItem button onClick={()=>this.openSite("Playlist")}>
                                <ListItemIcon><PlaylistAddCheck/></ListItemIcon>
                                <ListItemText primary="Playlista" />
                            </ListItem>
                            <ListItem button onClick={()=>this.openSite("History")}>
                                <ListItemIcon><HistoryBtn/></ListItemIcon>
                                <ListItemText primary="Historia" />
                            </ListItem>
                            <ListItem button onClick={()=>this.openSite("Suggestions")}>
                                <ListItemIcon><HistoryBtn/></ListItemIcon>
                                <ListItemText primary="Sugerowane" />
                            </ListItem>
                        </List>);
                siteName = "Strona Główna";
                break;
            case "Playlist":
                site = (<Playlist isAdmin={this.state.userData.isAdmin} libraryShow={(cb)=>this.libraryWindowSwitch(cb)} ref={this.state.playlistRef}/>);
                siteName="Playlista";
                break;
            case "History":
                site = (<History/>);
                siteName="Historia";
                break;
            case "Suggestions":
                site = (<Suggestions suggestWindowSwitch={()=>this.suggestWindowSwitch()} userId={this.state.userData.id}/>);
                siteName = "Sugestie";
                break;
        }

        let window = "";
        if(this.state.actWindow === "libraryMenu")
            window = (<Library isWindowed={true} selectCallback={this.state.librarySelectCallback} close={()=>{this.closeWindows()}}/>);
        if(this.state.actWindow === "suggestMenu")
            window = (<Suggest close={()=>this.closeWindows()} userId={this.state.userData.id} />)
        return (
            <React.Fragment>
                <Paper className="window" elevation={2} square={true}>
                    <TabBar>
                        <p>
                            {siteName}
                        </p>
                        <BackBtn color="inherit" onClick={() => this.back()}>
                            <ArrowBack/>
                        </BackBtn>
                    </TabBar>
                    <div className="window-content">
                        {site}
                    </div>
                </Paper>
                {window}
                <Notifications notifications={this.state.notifications}/>
                <Toolbar isAdmin={this.state.userData.isAdmin} playerData={this.state.playerData}/>
            </React.Fragment>
        );
    }
}


export default withStyles(useStyles)(UserHome);