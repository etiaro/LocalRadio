import React, { useState, useEffect } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import LinearProgress from '@material-ui/core/LinearProgress';
import { switchShuffle, stopSong, syncSongs } from './ApiConnection';
import { Menu as MenuIcon, PlayCircleOutline as PlayIcon, PauseCircleOutline as PauseIcon, Sync, LibraryAdd as AddIcon, Shuffle } from '@material-ui/icons';

function isOverflowing(el) {
    return el.offsetWidth < el.scrollWidth;
}

const useStyles = makeStyles(theme => ({
    bar: {
        position: 'fixed',
        bottom: 0,
        top: 'auto'
    },
    progressBar: {
        width: "100vw",
        background: "none",
        position: "absolute"
    },
    cont: {
        margin: 0,
        padding: 0,
        height: "100%",
        width: "100%",
        position: "relative"
    },
    drawerBtn: {
        position: "absolute",
        right: 0
    },
    syncBtn: {
        position: "absolute",
        left: 0
    },
    addBtn: {
        position: "absolute",
        left: 40
    },
    playBtn: {
        position: "absolute",
        left: 80
    },
    stopBtn: {
        position: "absolute",
        left: 120
    },
    shuffleBtn: {
        position: "absolute",
        left: 160,
        color: "gray"
    },
    scrollable: {
        animation: `$scrollEffect 5000ms infinite linear`,
        width: "fit-content"
    },
    "@keyframes scrollEffect": {
        "0%": {
            transform: "translateX(100%)"
        },
        "100%": {
            transform: "translateX(-100%)"
        }
    },
    title: {
        position: "absolute",
        padding: 0,
        left: 200,
        width: "fit-content",
        height: "100%",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        whiteSpace: "nowrap",
        maxWidth: "calc(100vw - 160px)"
    },
    centeredTitle: {
        position: "absolute",
        padding: 0,
        width: "fit-content",
        height: "100%",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        whiteSpace: "nowrap",
        maxWidth: "100vw",
        left: 0,
        right: 0
    },
    state: {
        position: "absolute",
        marginLeft: 500
    }
}));

export default function MusicToolbar(props) {
    const classes = useStyles();

    function playClick() {
        switchShuffle(true);
    }

    function syncClick() {
        syncSongs();
    }

    var color = "gray";
    if (props.playerData.isShuffle)
        color = "white";

    var [completed, setCompleted] = useState(0);
    useEffect(() => {
        if (!props.playerData.isPlaying) setCompleted(0);
        else {
            var time = props.playerData.time
            setCompleted((time / props.playerData.song.length) * 100);
            var timer = setInterval(() => {
                time += 0.1;
                setCompleted((time / props.playerData.song.length) * 100);
            }, 100);
        }
        if (isOverflowing(document.getElementById("titleCont"))) {
            document.getElementById("title").classList.add(classes.scrollable);
        } else {
            document.getElementById("title").classList.remove(classes.scrollable);
        }
        return () => {
            clearInterval(timer);
        };
    }, [props.playerData, classes.scrollable]);

    var toolbarText = "Radio wyłączone";
    if (props.playerData.song.name)
        toolbarText = props.playerData.song.name;

    if (props.isAdmin)
        return (
            <React.Fragment>
                <AppBar position="fixed" color="primary" className={classes.bar}>
                    <LinearProgress color="secondary" variant="determinate" value={completed} className={classes.progressBar} />
                    <Toolbar className={classes.cont}>
                        <IconButton edge="start" color="inherit" aria-label="Open drawer" className={classes.drawerBtn} onClick={props.toggleSettings}>
                            <MenuIcon />
                        </IconButton>
                        <IconButton color="inherit" onClick={() => props.addWindowSwitch()} className={classes.addBtn} >
                            <AddIcon />
                        </IconButton>
                        <IconButton color="inherit" onClick={() => syncClick()} className={classes.syncBtn} >
                            <Sync />
                        </IconButton>
                        <IconButton color="inherit" onClick={() => playClick()} className={classes.playBtn} >
                            <PlayIcon />
                        </IconButton>
                        <IconButton color="inherit" onClick={stopSong} className={classes.stopBtn} >
                            <PauseIcon />
                        </IconButton>
                        <IconButton color="inherit" onClick={() => switchShuffle()} className={classes.shuffleBtn} >
                            <Shuffle style={{ color: color }} />
                        </IconButton>
                    </Toolbar>
                    <Container id="titleCont" className={classes.title}>
                        <Typography id="title" component="h2">
                            {toolbarText}
                        </Typography>
                    </Container>
                </AppBar>
            </React.Fragment>
        );
    else
        return (
            <React.Fragment>
                <AppBar position="fixed" color="primary" className={classes.bar}>
                    <LinearProgress color="secondary" variant="determinate" value={completed} className={classes.progressBar} />
                    <Toolbar className={classes.cont}>
                    </Toolbar>
                    <Container id="titleCont" className={classes.centeredTitle}>
                        <Typography id="title" component="h2">
                            {toolbarText}
                        </Typography>
                    </Container>
                </AppBar>
            </React.Fragment>
        )
}