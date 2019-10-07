import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import {switchShuffle,stopSong} from './ApiConnection';
import { Menu as MenuIcon, PlayCircleOutline as PlayIcon, PauseCircleOutline as PauseIcon, LibraryAdd as AddIcon, Shuffle} from '@material-ui/icons';

const useStyles = makeStyles(theme => ({
    bar:{
        position: 'fixed',
        bottom: 0,
        top: 'auto'
    },
    cont: {
        margin: 0,
        padding: 0,
        height: "100%",
        width: "100%",
        position: "relative"
    },
    drawerBtn: {
        position:"absolute",
        right: 0
    },
    addBtn: {
        position:"absolute",
        left: 0
    },
    playBtn: {
        position: "absolute",
        left: 40
    },
    shuffleBtn: {
        position: "absolute",
        left: 80,
        color: "gray"
    },
    title:{
        position: "absolute",
        left: 120,
        width: "fit-content",
        height: "100%",
        display: "flex",
        alignItems: "center",
        maxWidth: "calc(100vw - 160px)"
    },
    state:{
        position: "absolute",
        marginLeft: 500
    }
  }));

export default function MusicToolbar(props) {
    const classes = useStyles();
    
    function playClick(){
        if(!props.playerData.isPlaying){
            switchShuffle(true);
        }else{
            stopSong();
        }
    }

    var playIco;
    if(props.playerData.isPlaying) 
        playIco = (<PauseIcon/>);
    else
        playIco = (<PlayIcon />);
    
    var color = "gray";
    if(props.playerData.isShuffle)
        color = "white";

        console.log(props.playerData);
    
    return (
        <React.Fragment>
            <AppBar position="fixed" color="primary" className={classes.bar}>
                    <Toolbar className={classes.cont}>
                    <IconButton edge="start" color="inherit" aria-label="Open drawer" className={classes.drawerBtn} onClick={props.toggleSettings} >
                        <MenuIcon />
                    </IconButton>
                    <IconButton color="inherit" onClick={()=>props.addWindowSwitch()}  className={classes.addBtn} >
                        <AddIcon />
                    </IconButton>
                    <IconButton color="inherit" onClick={()=>playClick()} className={classes.playBtn} >
                    { playIco }
                    </IconButton>
                    <IconButton color="inherit" onClick={()=>switchShuffle()}  className={classes.shuffleBtn} >
                        <Shuffle style={{color: color}}/>
                    </IconButton>
                    </Toolbar>
                    <Container className={classes.title}>
                        <Typography component="h2">
                            {props.playerData.song.name}
                        </Typography>
                    </Container>
                    
            </AppBar>
        </React.Fragment>
    );
}