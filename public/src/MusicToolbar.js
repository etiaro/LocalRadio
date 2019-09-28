import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import {startShuffle,stopSong} from './ApiConnection';
import { Menu as MenuIcon, PlayCircleOutline as PlayIcon, PauseCircleOutline as PauseIcon, LibraryAdd as AddIcon} from '@material-ui/icons';

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
        right: "0"
    },
    playBtn: {
        width: "min-content",
        position: "absolute",
        left: "0",
        right: "0",
        margin: "auto"
    },
    addBtn: {
        position:"absolute",
        left: "0"
    }
  }));

export default function MusicToolbar(props) {
    const classes = useStyles();
    
    function stopPlayCall(){
        props.changePlaying();
        if(!props.isPlaying){
            startShuffle();
        }else{
            stopSong();
        }
    }

    var playIco;
    if(props.isPlaying) 
        playIco = (<PauseIcon/>);
    else
        playIco = (<PlayIcon />);

    return (
        <React.Fragment>
            <AppBar position="fixed" color="primary" className={classes.bar}>
                    <Toolbar className={classes.cont}>
                    <IconButton edge="start" color="inherit" aria-label="Open drawer" className={classes.drawerBtn} >
                        <MenuIcon />
                    </IconButton>
                    <IconButton color="inherit" onClick={()=>stopPlayCall()} className={classes.playBtn} >
                    { playIco }
                    </IconButton>
                    <IconButton color="inherit" onClick={()=>props.addWindowSwitch()}  className={classes.addBtn} >
                        <AddIcon />
                    </IconButton>
                    </Toolbar>
            </AppBar>
        </React.Fragment>
    );
}